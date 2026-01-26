import { ITransport, RobotCommand, TransportType } from "./types";
import { WebSerialTransport } from "./WebSerialTransport";
import { BluetoothTransport } from "./BluetoothTransport";
import { MockTransport } from "./MockTransport";
import { WifiTransport } from "./WifiTransport";

export class RobotController {
    private static instance: RobotController;
    private transport: ITransport | null = null;
    public isConnected: boolean = false;
    private ipAddress: string = "192.168.4.1";

    // KuongShun Protocol Constants
    private readonly DEVICE_MOTOR = 0x0C; // 12
    private readonly DEVICE_SPEED = 0x0D; // 13
    private readonly DEVICE_SERVO = 0x02; // 2
    private readonly DEVICE_LED = 0x05;   // 5
    private readonly ACTION_SET = 0x01; // Model1_Ctrl
    
    // Movement Values
    private readonly MOVE_STOP = 0x00;
    private readonly MOVE_FORWARD = 0x01;
    private readonly MOVE_BACK = 0x02;
    private readonly MOVE_LEFT = 0x03;
    private readonly MOVE_RIGHT = 0x04;
    private readonly MOVE_TOP_LEFT = 0x05;
    private readonly MOVE_TOP_RIGHT = 0x07;
    private readonly MOVE_BOTTOM_LEFT = 0x06;
    private readonly MOVE_BOTTOM_RIGHT = 0x08;

    private constructor() { }

    public static getInstance(): RobotController {
        if (!RobotController.instance) {
            RobotController.instance = new RobotController();
        }
        return RobotController.instance;
    }

    public setIpAddress(ip: string) {
        this.ipAddress = ip;
    }

    public async connect(type: TransportType): Promise<boolean> {
        if (type === TransportType.SERIAL) {
            this.transport = new WebSerialTransport();
        } else if (type === TransportType.BLUETOOTH) {
            this.transport = new BluetoothTransport();
        } else if (type === TransportType.MOCK) {
            this.transport = new MockTransport();
        } else if (type === TransportType.WIFI) {
            this.transport = new WifiTransport(this.ipAddress);
        } else {
            console.warn("Transport type not supported yet:", type);
            return false;
        }

        const success = await this.transport.connect();
        this.isConnected = success;

        if (success && this.transport) {
            this.transport.onReceive((data) => {
                // console.log("Hardware:", data);
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

    private async sendPacket(device: number, val: number) {
        if (!this.isConnected || !this.transport) return;

        // Packet Structure: FF 55 LEN 00 00 00 00 00 00 ACTION DEVICE 00 VAL 00 00 00 00 (Total 17)
        // Based on firmware parseData index reading:
        // action = readBuffer(9)
        // device = readBuffer(10)
        // val = readBuffer(12)
        
        const packet = new Uint8Array(17);
        packet[0] = 0xFF; // Header
        packet[1] = 0x55; // Header
        packet[2] = 0x0E; // Length (arbitrary non-zero to pass dataLen check if any, though loop logic varies)
        
        packet[9] = this.ACTION_SET; // Action
        packet[10] = device; // Device
        packet[12] = val; // Value

        // Check transport capability
        if (this.transport instanceof WifiTransport) {
             await (this.transport as WifiTransport).sendBinary(packet);
        } else {
             // For Bluetooth/Serial, we might need to send binary too if supported, 
             // but current interface is string. Sending as hex string or specialized handling needed.
             // For now, assume this protocol is primarily for the WiFi/ESP32 context.
             // If legacy text mode is needed, we can add fallback here.
             console.warn("Binary protocol not fully implemented for non-WiFi transport");
        }
    }

    public async sendCommand(cmd: RobotCommand) {
        if (!this.isConnected || !this.transport) return;

        const DEFAULT_SPEED = 200; // 0-255

        if (cmd.type === "motion") {
            // First, ensure speed is set (optional, usually stateful on robot)
            await this.sendPacket(this.DEVICE_SPEED, DEFAULT_SPEED);

            if (cmd.action === "move") {
                let val = 0;
                let duration = 0;

                if (typeof cmd.value === "object" && cmd.value !== null) {
                    const obj = cmd.value as import("./types").MotionValue;
                    val = Number(obj.val);
                    duration = Number(obj.dur) * 1000;
                } else {
                    val = Number(cmd.value);
                    duration = Math.abs(val) * 20; // Rough step to ms estimation
                }

                // Determine direction
                const direction = val >= 0 ? this.MOVE_FORWARD : this.MOVE_BACK;
                
                // Send Move Command
                await this.sendPacket(this.DEVICE_MOTOR, direction);

                // Stop after duration (if duration > 0)
                if (duration > 0) {
                    setTimeout(() => {
                        this.sendPacket(this.DEVICE_MOTOR, this.MOVE_STOP);
                    }, duration);
                }

            } else if (cmd.action === "turn") {
                const val = Number(cmd.value);
                const duration = Math.abs(val) * 10; // Rough degree to ms estimation
                const direction = val >= 0 ? this.MOVE_RIGHT : this.MOVE_LEFT;

                await this.sendPacket(this.DEVICE_MOTOR, direction);

                if (duration > 0) {
                    setTimeout(() => {
                        this.sendPacket(this.DEVICE_MOTOR, this.MOVE_STOP);
                    }, duration);
                }
            }
        } else if (cmd.type === "look") {
            // LED Control
            if (cmd.action === "on") {
                 await this.sendPacket(this.DEVICE_LED, 255); // Max brightness
            } else if (cmd.action === "off") {
                 await this.sendPacket(this.DEVICE_LED, 0);
            }
        } else if (cmd.type === "servo") {
            // Servo Control
             const angle = Number(cmd.value);
             // Constrain angle 0-180
             const safeAngle = Math.max(0, Math.min(180, angle));
             await this.sendPacket(this.DEVICE_SERVO, safeAngle);
        }
    }
}
