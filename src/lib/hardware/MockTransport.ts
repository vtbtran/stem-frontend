import { ITransport } from "./types";

export class MockTransport implements ITransport {
    public isConnected: boolean = false;
    private onReceiveCallback: ((data: string) => void) | null = null;
    private simulationInterval: NodeJS.Timeout | null = null;

    async connect(): Promise<boolean> {
        // console.log("MockTransport: Simulating connection...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.isConnected = true;

        // Simulate receiving data periodically
        this.simulationInterval = setInterval(() => {
            if (this.onReceiveCallback) {
                const mockData = `MOCK_DATA_${Date.now()}`;
                this.onReceiveCallback(mockData);
            }
        }, 3000);

        return true;
    }

    async disconnect(): Promise<void> {
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
            this.simulationInterval = null;
        }
        this.isConnected = false;
        // console.log("MockTransport: Disconnected");
    }

    async send(data: string): Promise<void> {
        // console.log("MockTransport: Sending ->", data);

        // Simulate echo response after delay
        setTimeout(() => {
            if (this.onReceiveCallback) {
                this.onReceiveCallback(`ECHO: ${data}`);
            }
        }, 500);
    }

    async sendBinary(data: Uint8Array): Promise<void> {
        console.log("Mock Send Binary:", data);
    }

    onReceive(callback: (data: string) => void): void {
        this.onReceiveCallback = callback;
    }
}
