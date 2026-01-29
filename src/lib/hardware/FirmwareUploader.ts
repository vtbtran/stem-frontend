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
            clean: () => {},
            writeLine: (msg: string) => console.log(msg)
        };
    }

    async compileCode(sketchCode: string): Promise<string | null> {
        try {
            this.term.writeln("🚀 Sending code to compiler...");
            const response = await fetch("http://localhost:3001/compile", {
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
            this.term.writeln("🔥 Initializing Web Serial Transport...");

            // Show instructions BEFORE attempting connection
            this.term.writeln("");
            this.term.writeln("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            this.term.writeln("ℹ️  If connection fails, put ESP into BOOT mode:");
            this.term.writeln("   1. Press and HOLD the BOOT button");
            this.term.writeln("   2. Press RESET (EN) button once");
            this.term.writeln("   3. Release the BOOT button");
            this.term.writeln("   4. Click Upload again");
            this.term.writeln("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            this.term.writeln("");

            // Create transport and loader
            transport = new Transport(this.port);
            loader = new ESPLoader({
                transport,
                baudrate: 115200,
                romBaudrate: 115200,
                terminal: this.term,
            });

            this.term.writeln("🔌 Connecting to Bootloader...");

            try {
                await loader.main();
            } catch (connectErr: unknown) {
                const message = connectErr instanceof Error ? connectErr.message : String(connectErr);
                this.term.writeln(`❌ Connection failed: ${message}`);
                this.term.writeln("");
                this.term.writeln("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                this.term.writeln("🔧 To fix this issue:");
                this.term.writeln("");
                this.term.writeln("   1. Disconnect and reconnect the device");
                this.term.writeln("   2. Put ESP into BOOT mode:");
                this.term.writeln("      • Hold BOOT button");
                this.term.writeln("      • Press RESET once");
                this.term.writeln("      • Release BOOT");
                this.term.writeln("   3. Click Upload again");
                this.term.writeln("");
                this.term.writeln("📋 Other tips:");
                this.term.writeln("   • Use a data-capable USB cable");
                this.term.writeln("   • Close Arduino IDE/other serial apps");
                this.term.writeln("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                throw new Error("Failed to connect. Please put ESP in BOOT mode and try again.");
            }

            this.term.writeln("✅ Connected to Bootloader successfully!");

            this.term.writeln("💾 Flashing firmware...");

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
                    this.term.writeln(`Writing... ${pct}%`);
                },
            } as Parameters<typeof loader.writeFlash>[0]);

            this.term.writeln("✨ Resetting board...");
            await transport.setDTR(false);
            await transport.setRTS(true);
            await this.delay(100);
            await transport.setRTS(false);

            this.term.writeln("✅ Flash Complete! Your code is running.");

        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            this.term.writeln(`❌ Flash Error: ${message}`);
            console.error(e);
            throw e;
        } finally {
            // Cleanup transport
            try {
                if (transport) {
                    await transport.disconnect();
                }
            } catch (e) {
                console.error("Error during transport disconnect:", e);}
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
}
