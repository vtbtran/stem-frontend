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

    async connect(): Promise<boolean> {
        if (!navigator.serial) {
            alert("Web Serial is not supported in this browser.");
            return false;
        }

        try {
            this.port = await navigator.serial.requestPort();
            await this.port.open({ baudRate: 115200 });
            this.isConnected = true;

            if (!this.port.writable) throw new Error("Port not writable");

            // Direct binary writer
            this.writer = this.port.writable.getWriter();

            this.readLoop();
            console.log("✅ Serial Port Connected successfully");
            return true;
        } catch (err) {
            console.error("Serial Connection Failed:", err);
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
            this.port = null;
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
