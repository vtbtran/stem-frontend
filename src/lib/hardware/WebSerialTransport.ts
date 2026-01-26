import { ITransport } from "./types";

export class WebSerialTransport implements ITransport {
    private port: SerialPort | null = null;
    private writer: WritableStreamDefaultWriter<string> | null = null;
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

            const textEncoder = new TextEncoderStream();
            if (!this.port.writable) throw new Error("Port not writable");
            const writableStreamClosed = textEncoder.readable.pipeTo(this.port.writable);
            this.writer = textEncoder.writable.getWriter();

            this.readLoop();
            return true;
        } catch (err) {
            console.error("Serial Connection Failed:", err);
            return false;
        }
    }

    async disconnect(): Promise<void> {
        if (this.writer) {
            await this.writer.close();
            this.writer = null;
        }
        if (this.port) {
            await this.port.close();
            this.port = null;
        }
        this.isConnected = false;
        this.keepReading = false;
    }

    async send(data: string): Promise<void> {
        if (!this.writer) return;
        await this.writer.write(data + "\n");
    }

    onReceive(callback: (data: string) => void): void {
        this.onReceiveCallback = callback;
    }

    private async readLoop() {
        if (!this.port || !this.port.readable) return;

        this.keepReading = true;
        const textDecoder = new TextDecoderStream();
        const readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
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
