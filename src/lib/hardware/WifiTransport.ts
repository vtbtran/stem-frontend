import { ITransport } from "./types";

export class WifiTransport implements ITransport {
    private socket: WebSocket | null = null;
    private onReceiveCallback: ((data: string) => void) | null = null;
    public isConnected: boolean = false;
    private ipAddress: string;

    constructor(ipAddress: string) {
        this.ipAddress = ipAddress;
    }

    async connect(): Promise<boolean> {
        return new Promise((resolve) => {
            try {
                // Defaulting to port 81 (often used for control if 80 is web) or just 81 as per user context
                // Adjust scheme if needed (ws://)
                const url = `ws://${this.ipAddress}:81`;
                console.log(`Connecting to WebSocket: ${url}`);

                this.socket = new WebSocket(url);

                this.socket.onopen = () => {
                    console.log("WebSocket Connected");
                    this.isConnected = true;
                    resolve(true);
                };

                this.socket.onmessage = (event) => {
                    if (this.onReceiveCallback) {
                        this.onReceiveCallback(event.data);
                    }
                };

                this.socket.onerror = (error) => {
                    console.error("WebSocket Error:", error);
                    if (!this.isConnected) {
                        resolve(false);
                    }
                };

                this.socket.onclose = () => {
                    console.log("WebSocket Closed");
                    this.isConnected = false;
                    this.socket = null;
                };

            } catch (e) {
                console.error("WebSocket Connection Failed:", e);
                resolve(false);
            }
        });
    }

    async disconnect(): Promise<void> {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.isConnected = false;
    }

    async sendBinary(data: Uint8Array): Promise<void> {
        if (this.socket && this.isConnected) {
            this.socket.send(data);
        }
    }

    async send(data: string): Promise<void> {
        if (this.socket && this.isConnected) {
            this.socket.send(data);
        }
    }

    onReceive(callback: (data: string) => void): void {
        this.onReceiveCallback = callback;
    }
}
