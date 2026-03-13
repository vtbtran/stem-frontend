import { ITransport } from "./types";

export class WebSerialTransport implements ITransport {
    private port: SerialPort | null = null;
    private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
    private readableStreamClosed: Promise<void> | null = null;
    private readerCanceled = false;
    private reader: ReadableStreamDefaultReader<string> | null = null;
    private keepReading = false;
    private onReceiveCallback: ((data: string) => void) | null = null;

    public isConnected: boolean = false;

    async connect(autoConnect: boolean = false): Promise<boolean> {
        if (!navigator.serial) {
            alert("Web Serial is not supported in this browser.");
            return false;
        }

        try {
            // If we're auto-connecting (e.g., after upload), try to use the cached port
            if (autoConnect) {
                if (!this.port) {
                    const ports = await navigator.serial.getPorts();
                    if (ports.length > 0) {
                        this.port = ports[0];
                    }
                }
            } else {
                // Not auto-connecting (user explicitly clicked Connect) -> always ask for a port
                this.port = null;
            }

            // Try opening the port if we have one (from cache)
            if (this.port) {
                try {
                    await this.port.open({ baudRate: 115200 });
                } catch (e: any) {
                    if (e.name !== 'InvalidStateError') {
                        // Port might be disconnected physically or error, discard it
                        this.port = null;
                        console.warn("Cached port failed to open, asking user to select again.", e);
                    }
                }
            }

            // If port is still null (no cached port, cached port failed, or user clicked Connect explicitly), request a new one
            if (!this.port) {
                this.port = await navigator.serial.requestPort();
                await this.port.open({ baudRate: 115200 });
            }

            this.isConnected = true;

            if (!this.port.writable) throw new Error("Port not writable");

            this.writer = this.port.writable.getWriter();
            this.readLoop();
            console.log("✅ Serial Port Connected successfully");
            return true;
        } catch (err: any) {
            if (err.name === 'NotFoundError') {
                console.warn("⚠️ Người dùng đã đóng bảng chọn cổng Serial.");
            } else {
                console.error("Serial Connection Failed:", err);
            }
            return false;
        }
    }

    public getPort(): SerialPort | null {
        return this.port;
    }

    async disconnect(): Promise<void> {
        this.keepReading = false;

        if (this.reader) {
            this.readerCanceled = true;
            await this.reader.cancel();
            if (this.readableStreamClosed) {
                await this.readableStreamClosed.catch(() => { });
            }
            this.reader = null;
        }

        if (this.writer) {
            await this.writer.close();
            this.writer = null;
        }

        if (this.port) {
            await this.port.close();
            // DO NOT set this.port = null here, so we can reconnect to it later
            // without needing a user gesture (requestPort)
        }
        this.isConnected = false;
    }

    async send(data: string): Promise<void> {
        if (!this.writer) return;
        const encoder = new TextEncoder();
        await this.writer.write(encoder.encode(data + "\n"));
    }

    async sendBinary(data: Uint8Array): Promise<void> {
        if (!this.writer) return;
        await this.writer.write(data);
    }

    onReceive(callback: (data: string) => void): void {
        this.onReceiveCallback = callback;
    }

    private async readLoop() {
        if (!this.port || !this.port.readable) return;

        this.keepReading = true;
        const textDecoder = new TextDecoderStream();
        this.readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
        this.reader = textDecoder.readable.getReader();

        try {
            while (this.keepReading) {
                const { value, done } = await this.reader.read();
                if (done) break;
                if (value && this.onReceiveCallback) {
                    this.onReceiveCallback(value);
                }
            }
        } catch (e) {
            console.error("Read Error:", e);
        } finally {
            this.reader.releaseLock();
        }
    }
}
