import { ITransport, RobotCommand, TransportType } from "./types";
import { WebSerialTransport } from "./WebSerialTransport";
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

    // Movement Values from Firmware
    private readonly MOVE_STOP = 0;
    private readonly MOVE_FORWARD = 163;
    private readonly MOVE_BACK = 92;
    private readonly MOVE_LEFT = 106;   // Strafe Left (Turn_Left in firmware)
    private readonly MOVE_RIGHT = 149;  // Strafe Right (Turn_Right in firmware)
    private readonly MOVE_TOP_LEFT = 34;
    private readonly MOVE_TOP_RIGHT = 129;
    private readonly MOVE_BOTTOM_LEFT = 72;
    private readonly MOVE_BOTTOM_RIGHT = 20;

    // Rotation Values
    private readonly ROTATE_LEFT = 83;  // Contrarotate
    private readonly ROTATE_RIGHT = 172; // Clockwise

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
        } else if (type === TransportType.MOCK) {
            this.transport = new MockTransport();
        } else if (type === TransportType.WIFI) {
            this.transport = new WifiTransport(this.ipAddress);
        } else {
            console.warn("Transport type not supported yet:", type);
            return false;
        }

        try {
            const success = await this.transport.connect();
            this.isConnected = success;
            if (success && this.transport) {
                this.transport.onReceive((data) => {
                });
            }

            return success;
        } catch (error) {
            console.warn("⚠️ RobotController: Kết nối thất bại hoặc bị hủy bởi người dùng.", error);
            this.isConnected = false;
            return false;
        }
    }

    public async disconnect() {
        if (this.transport) {
            await this.transport.disconnect();
        }
        this.isConnected = false;
    }

    public getTransport(): ITransport | null {
        return this.transport;
    }

    private async sendPacket(device: number, val: number) {
        if (!this.isConnected || !this.transport) return;

        // Packet Structure: FF 55 LEN 00 00 00 00 00 00 ACTION DEVICE 00 VAL 00 00 00 00 (Total 17)
        const packet = new Uint8Array(17);
        packet[0] = 0xFF; // Header
        packet[1] = 0x55; // Header
        packet[2] = 0x0E; // Length

        packet[9] = this.ACTION_SET; // Action
        packet[10] = device; // Device
        packet[12] = val; // Value

        // Send binary data directly via interface
        await this.transport.sendBinary(packet);
    }

    public async sendCommand(cmd: RobotCommand) {
        if (!this.isConnected || !this.transport) return;

        const DEFAULT_SPEED = 100; // 0-255

        if (cmd.type === "motion") {
            // Ensure speed is set
            // await this.sendPacket(this.DEVICE_SPEED, DEFAULT_SPEED); // This line is moved inside the move action

            if (cmd.action === "move") {
                let speed = DEFAULT_SPEED;
                let duration = 0;
                let direction = this.MOVE_FORWARD;

                if (typeof cmd.value === "object" && cmd.value !== null) {
                    const obj = cmd.value as import("./types").MotionValue;
                    speed = Math.abs(Number(obj.val)); // Speed from block
                    duration = Number(obj.dur) * 1000;
                    // Direction is implied by function name (Forward/Backward) passed as sign in common.ts? 
                    // No, common.ts sends {val: speed, dur: t}. We need to know direction.
                    // Let's assume val is signed? 
                    // Checking common.ts: moveBackwardTime sends val: -Number(s).
                    // So val sign determines direction.
                    direction = Number(obj.val) >= 0 ? this.MOVE_FORWARD : this.MOVE_BACK;
                } else {
                    // Legacy support
                    const val = Number(cmd.value);
                    speed = DEFAULT_SPEED;
                    duration = Math.abs(val) * 20;
                    direction = val >= 0 ? this.MOVE_FORWARD : this.MOVE_BACK;
                }

                // Set Speed
                await this.sendPacket(this.DEVICE_SPEED, speed);

                // Send Move Command
                await this.sendPacket(this.DEVICE_MOTOR, direction);

                // Stop after duration
                if (duration > 0) {
                    setTimeout(() => {
                        this.sendPacket(this.DEVICE_MOTOR, this.MOVE_STOP);
                    }, duration);
                }

            } else if (cmd.action === "turn") {
                let speed = DEFAULT_SPEED;
                let duration = 0;
                let direction = this.ROTATE_RIGHT;

                if (typeof cmd.value === "object" && cmd.value !== null) {
                    const obj = cmd.value as import("./types").MotionValue;
                    speed = Math.abs(Number(obj.val));
                    duration = Number(obj.dur) * 1000;
                    // Direction
                    direction = Number(obj.val) >= 0 ? this.ROTATE_RIGHT : this.ROTATE_LEFT;
                } else {
                    // Legacy support
                    const val = Number(cmd.value);
                    speed = DEFAULT_SPEED;
                    duration = Math.abs(val) * 10;
                    direction = val >= 0 ? this.ROTATE_RIGHT : this.ROTATE_LEFT;
                }

                // Set Speed
                await this.sendPacket(this.DEVICE_SPEED, speed);

                // Send Turn Command
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
