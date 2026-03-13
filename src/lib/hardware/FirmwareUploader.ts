import { ESPLoader, Transport } from "esptool-js";

interface Terminal {
    writeln: (msg: string) => void;
    write: (msg: string) => void;
    clean: () => void;
    writeLine: (msg: string) => void;
}

export class FirmwareUploader {
    private port: SerialPort | null = null;
    private term: Terminal; // For logging

    constructor(port: SerialPort, term?: Terminal) {
        this.port = port;
        this.term = term || {
            writeln: (msg: string) => console.log(msg),
            write: (msg: string) => console.log(msg),
            clean: () => { },
            writeLine: (msg: string) => console.log(msg)
        };
    }

    async compileCode(sketchCode: string): Promise<string | null> {
        try {
            this.term.writeln("🚀 Sending code to compiler...");
            const compilerUrl = process.env.NEXT_PUBLIC_COMPILER_URL || "http://localhost:3001";
            const response = await fetch(`${compilerUrl}/compile`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sketchCode }),
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Compilation failed: ${errText}`);
            }

            const data = await response.json();
            if (!data.success || !data.hex) {
                throw new Error(data.error || "Unknown compilation error");
            }

            this.term.writeln("✅ Compilation successful!");
            return data.hex;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            this.term.writeln(`❌ Error: ${message}`);
            return null;
        }
    }

    async flashFirmware(hexData: string) {
        if (!this.port) {
            this.term.writeln("❌ No serial port connected.");
            return;
        }

        let transport: Transport | null = null;
        let loader: ESPLoader | null = null;

        try {
            this.term.writeln("🔥Đang khởi tạo...");

            // Show instructions BEFORE attempting connection
            this.term.writeln("");
            this.term.writeln("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            this.term.writeln("ℹ️  Nếu kết nối thất bại, hãy đưa ESP vào chế độ BOOT:");
            this.term.writeln("   1. Nhấn và GIỮ nút BOOT (IO0)");
            this.term.writeln("   2. Nhấn nút RESET (EN) 1 lần rồi thả");
            this.term.writeln("   3. Thả nút BOOT");
            this.term.writeln("   4. Nhấn Upload lại");
            this.term.writeln("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            this.term.writeln("");

            // Create transport and loader
            transport = new Transport(this.port);
            try {
                // Kéo DTR và RTS để reset chip vào Bootloader
                await transport.setDTR(true);  // Nhấn nút BOOT (phần mềm)
                await transport.setRTS(true);  // Nhấn nút RESET (phần mềm)
                await this.delay(100);

                await transport.setRTS(false); // Thả nút RESET (Chip tỉnh dậy)
                await this.delay(200);         // Chờ chip nhận tín hiệu BOOT

                await transport.setDTR(false); // Thả nút BOOT
                await this.delay(100);
            } catch (e) {
                console.log("Auto-reset warning:", e);
            }
            loader = new ESPLoader({
                transport,
                baudrate: 115200,
                romBaudrate: 115200,
                terminal: this.term,
            });

            this.term.writeln("🔌 Đang kết nối với Bootloader...");

            try {
                await loader.main();
            } catch (connectErr: unknown) {
                const message = connectErr instanceof Error ? connectErr.message : String(connectErr);
                this.term.writeln(`❌ Kết nối thất bại: ${message}`);
                this.term.writeln("");
                this.term.writeln("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                this.term.writeln("🔧 HƯỚNG DẪN ĐƯA ESP VÀO CHẾ ĐỘ BOOT:");
                this.term.writeln("");
                this.term.writeln("   Bước 1: Tìm 2 nút trên board ESP32");
                this.term.writeln("           • BOOT (hoặc IO0) - thường nhỏ hơn");
                this.term.writeln("           • RESET (hoặc EN) - thường to hơn");
                this.term.writeln("");
                this.term.writeln("   Bước 2: Nhấn và GIỮ nút BOOT");
                this.term.writeln("           (Đừng thả ra!)");
                this.term.writeln("");
                this.term.writeln("   Bước 3: Trong khi GIỮ BOOT, nhấn RESET 1 lần");
                this.term.writeln("           (Nhấn rồi thả RESET ngay)");
                this.term.writeln("");
                this.term.writeln("   Bước 4: Thả nút BOOT");
                this.term.writeln("");
                this.term.writeln("   Bước 5: Nhấn nút Upload trên giao diện lại");
                this.term.writeln("");
                this.term.writeln("📋 LƯU Ý KHÁC:");
                this.term.writeln("   • Dùng cáp USB có truyền dữ liệu (không chỉ sạc)");
                this.term.writeln("   • Đóng Arduino IDE hoặc ứng dụng serial khác");
                this.term.writeln("   • Thử rút cáp và cắm lại");
                this.term.writeln("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                throw new Error("Kết nối thất bại. Hãy đưa ESP vào chế độ BOOT và thử lại.");
            }

            this.term.writeln("✅ Kết nối Bootloader thành công!");

            this.term.writeln("💾 Đang nạp firmware...");

            // Convert HEX string to binary
            const binaryData = new Uint8Array(
                hexData.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
            );

            const fileArray = [{ data: this.uint8ArrayToString(binaryData), address: 0x10000 }];

            await loader.writeFlash({
                fileArray,
                flashSize: "keep",
                eraseAll: false,
                compress: true,
                reportProgress: (fileIndex: number, written: number, total: number) => {
                    const pct = Math.round((written / total) * 100);
                    this.term.writeln(`Đang ghi... ${pct}%`);
                },
            } as Parameters<typeof loader.writeFlash>[0]);

            this.term.writeln("✨ Đang khởi động lại board...");
            await transport.setDTR(false);
            await transport.setRTS(true);
            await this.delay(100);
            await transport.setRTS(false);

            this.term.writeln("✅ Nạp code thành công! Chương trình của bạn đang chạy.");

        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            this.term.writeln(`❌ Lỗi nạp firmware: ${message}`);
            console.error(e);
            throw e;
        } finally {
            // Cleanup transport
            try {
                if (transport) {
                    // 1. Lệnh này của esptool sẽ nhả lock và ĐÓNG cổng
                    await transport.disconnect();
                }
            } catch (e) {
                console.error("Error during transport disconnect/reconnect:", e);
                this.term.writeln("⚠️ Vui lòng kết nối lại thủ công.");
            }
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private uint8ArrayToString(fileData: Uint8Array): string {
        let dataString = "";
        for (let i = 0; i < fileData.length; i++) {
            dataString += String.fromCharCode(fileData[i]);
        }
        return dataString;
    }

    /**
     * Flash Base Firmware (.bin) trực tiếp từ Web.
     * Người dùng không cần cài Arduino IDE.
     * 
     * @param binUrl - URL tới file .bin (mặc định: /firmware/onyx_base.bin)
     * @param onProgress - Callback cho tiến trình (0-100)
     * @param onLog - Callback cho log messages
     */
    static isFlashing: boolean = false;

    static async flashBaseFirmware(
        binUrl: string = "/firmware/",
        onProgress?: (pct: number) => void,
        onLog?: (msg: string) => void
    ): Promise<void> {
        if (this.isFlashing) {
            console.log("⚠️ Tiến trình đang chạy...");
            return;
        }

        const log = onLog || console.log;
        let port: SerialPort | null = null;
        let transport: Transport | null = null;

        try {
            log("🔌 Chọn cổng USB của Robot...");
            port = await navigator.serial.requestPort();
        } catch (e) {
            throw new Error("Người dùng đã hủy chọn cổng USB.");
        }

        this.isFlashing = true;
        const term = {
            writeln: (msg: string) => log(msg),
            write: (msg: string) => log(msg),
            clean: () => { },
            writeLine: (msg: string) => log(msg),
        };

        const uploader = new FirmwareUploader(port, term);

        try {
            log("📥 Đang tải các file hệ thống từ server...");
            onProgress?.(5);

            const loadFile = async (fileName: string) => {
                const url = `/firmware/${fileName}?t=${Date.now()}`;
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Không tìm thấy file ${fileName}`);
                const buffer = await response.arrayBuffer();
                log(`📦 Đã tải ${fileName}`);
                return uploader.uint8ArrayToString(new Uint8Array(buffer));
            };

            const bootloaderData = await loadFile("bootloader.bin");
            const partitionsData = await loadFile("partitions.bin");
            const bootAppData = await loadFile("boot_app0.bin");
            const appData = await loadFile("onyx_base.bin");

            log("✅ Đã tải xong. Bắt đầu giao tiếp với ESP32...");
            onProgress?.(10);

            // GIAO TOÀN QUYỀN CHO ESPTOOL, KHÔNG TỰ Ý CAN THIỆP CỔNG
            transport = new Transport(port);

            const loader = new ESPLoader({
                transport,
                baudrate: 115200,
                romBaudrate: 115200,
                terminal: term,
            });

            // Lệnh này sẽ tự động lo việc reset mạch và mở cổng chuẩn xác nhất
            await loader.main();

            const fileArray = [
                { data: bootloaderData, address: 0x1000 },
                { data: partitionsData, address: 0x8000 },
                { data: bootAppData, address: 0xe000 },
                { data: appData, address: 0x10000 }
            ];

            log("🔥 Đang nạp hệ điều hành (Có thể mất 40-60 giây)...");

            await loader.writeFlash({
                fileArray: fileArray,
                flashSize: "4MB",
                flashMode: "dio",
                flashFreq: "40m",
                eraseAll: true, // Xóa trắng để gọi mạng Onyx_Setup
                compress: true,
                reportProgress: (fileIndex: number, written: number, total: number) => {
                    const fileProgress = (written / total) * 100;
                    const overallProgress = 10 + ((fileIndex + (fileProgress / 100)) / fileArray.length) * 90;
                    onProgress?.(Math.round(overallProgress));
                }
            });

            log("✨ Khởi động lại Robot...");
            await transport.setDTR(false);
            await transport.setRTS(true);
            await new Promise((r) => setTimeout(r, 100));
            await transport.setRTS(false);

            onProgress?.(100);
            log("🎉 Nạp Base Firmware thành công! Hãy kết nối WiFi 'Onyx_Setup'.");

        } catch (error) {
            log(`❌ Lỗi nạp firmware: ${error}`);
            throw error;
        } finally {
            this.isFlashing = false;
            // CHỈ dùng hàm disconnect của thư viện để nó nhả khóa stream một cách an toàn
            if (transport) {
                try {
                    await transport.disconnect();
                } catch (e) {
                    console.log("Lỗi ngắt kết nối an toàn:", e);
                }
            }
        }
    }
}

