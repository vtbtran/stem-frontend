import { ITransport, RobotCommand, TransportType } from "./types";
import { WebSerialTransport } from "./WebSerialTransport";
import { BluetoothTransport } from "./BluetoothTransport";
import { MockTransport } from "./MockTransport";

export class RobotController {
    private static instance: RobotController;
    private transport: ITransport | null = null;
    public isConnected: boolean = false;

    private constructor() { }

    public static getInstance(): RobotController {
        if (!RobotController.instance) {
            RobotController.instance = new RobotController();
        }
        return RobotController.instance;
    }

    public async connect(type: TransportType): Promise<boolean> {
        if (type === TransportType.SERIAL) {
            this.transport = new WebSerialTransport();
        } else if (type === TransportType.BLUETOOTH) {
            this.transport = new BluetoothTransport();
        } else if (type === TransportType.MOCK) {
            this.transport = new MockTransport();
        } else {
            console.warn("Transport type not supported yet:", type);
            return false;
        }

        const success = await this.transport.connect();
        this.isConnected = success;

        if (success && this.transport) {
            this.transport.onReceive((data) => {
                console.log("Hardware:", data);
            });
        }

        return success;
    }

    public async disconnect() {
        if (this.transport) {
            await this.transport.disconnect();
        }
        this.isConnected = false;
    }

    public async sendCommand(cmd: RobotCommand) {
        if (!this.isConnected || !this.transport) return;

        // Convert high-level command to protocol string (Example)
        // Motion: M100 (Forward 100), M-100 (Backward)
        // Turn: T90 (Right), T-90 (Left)
        // Beep: B

        let msg = "";
        if (cmd.type === "motion") {
            if (cmd.action === "move") {
                msg = `M${cmd.value}`;
            } else if (cmd.action === "turn") {
                msg = `T${cmd.value}`;
            }
        } else if (cmd.type === "sound") {
            if (cmd.action === "beep") msg = "B";
            if (cmd.action === "tone") {
                const val = cmd.value as { freq: number, dur: number };
                msg = `S${val.freq},${val.dur}`;
            }
        }

        if (msg) {
            console.log("Sending to Robot:", msg);
            await this.transport.send(msg);
        }
    }
}
