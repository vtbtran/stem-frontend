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

    public async connect(type: TransportType, autoConnect: boolean = false): Promise<boolean> {
        if (type === TransportType.SERIAL) {
            // Keep the same transport instance if it already exists, so it can reuse the saved port
            if (!(this.transport instanceof WebSerialTransport)) {
                this.transport = new WebSerialTransport();
            }
        } else if (type === TransportType.MOCK) {
            if (!(this.transport instanceof MockTransport)) {
                this.transport = new MockTransport();
            }
        } else if (type === TransportType.WIFI) {
            if (!(this.transport instanceof WifiTransport)) {
                this.transport = new WifiTransport(this.ipAddress);
            }
        } else {
            console.warn("Transport type not supported yet:", type);
            return false;
        }

        try {
            const success = await this.transport.connect(autoConnect);
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

    // ===== Kiểm tra chế độ WiFi =====
    private isWifiMode(): boolean {
        return this.transport instanceof WifiTransport;
    }

    // ===== Gửi JSON qua WiFi =====
    private async sendJson(data: Record<string, unknown>) {
        if (!this.isConnected || !this.transport) return;
        await this.transport.send(JSON.stringify(data));
    }

    public async sendCommand(cmd: RobotCommand) {
        if (!this.isConnected || !this.transport) return;

        // ==========================================
        // CHẾ ĐỘ WIFI: Gửi JSON trực tiếp
        // ==========================================
        if (this.isWifiMode()) {
            if (cmd.type === "motion") {
                if (cmd.action === "move") {
                    let speed = 100, duration = 0, dir = 1;
                    if (typeof cmd.value === "object" && cmd.value !== null) {
                        const obj = cmd.value as import("./types").MotionValue;
                        speed = Math.abs(Number(obj.val));
                        duration = Number(obj.dur) * 1000;
                        dir = Number(obj.val) >= 0 ? 1 : -1;
                    } else {
                        const val = Number(cmd.value);
                        speed = 100;
                        duration = Math.abs(val) * 20;
                        dir = val >= 0 ? 1 : -1;
                    }
                    await this.sendJson({ type: "motion", action: "move", speed, dir, duration });
                } else if (cmd.action === "turn") {
                    let speed = 100, duration = 0, dir = 1;
                    if (typeof cmd.value === "object" && cmd.value !== null) {
                        const obj = cmd.value as import("./types").MotionValue;
                        speed = Math.abs(Number(obj.val));
                        duration = Number(obj.dur) * 1000;
                        dir = Number(obj.val) >= 0 ? 1 : -1;
                    } else {
                        const val = Number(cmd.value);
                        speed = 100;
                        duration = Math.abs(val) * 10;
                        dir = val >= 0 ? 1 : -1;
                    }
                    await this.sendJson({ type: "motion", action: "turn", speed, dir, duration });
                } else if (cmd.action === "stop") {
                    await this.sendJson({ type: "motion", action: "stop" });
                }
            } else if (cmd.type === "look") {
                if (cmd.action === "on") {
                    await this.sendJson({ type: "look", action: "on" });
                } else if (cmd.action === "off") {
                    await this.sendJson({ type: "look", action: "off" });
                } else if (cmd.action === "brightness") {
                    const val = typeof cmd.value === "number" ? cmd.value : 0;
                    await this.sendJson({ type: "look", action: "brightness", value: val, pin: (cmd as any).pin || 2 });
                }
            } else if (cmd.type === "servo") {
                const angle = Number(cmd.value);
                const safeAngle = Math.max(0, Math.min(180, angle));
                await this.sendJson({ type: "servo", action: "set", angle: safeAngle });
            } else if (cmd.type === "sound") {
                if (cmd.action === "beep") {
                    await this.sendJson({ type: "sound", action: "beep" });
                } else if (cmd.action === "tone" && cmd.value) {
                    const v = cmd.value as Record<string, unknown>;
                    await this.sendJson({ type: "sound", action: "tone", freq: v.freq, duration: Number(v.dur) * 1000 });
                }
            }
            return; // Đã xử lý xong cho WiFi, thoát ngay
        }

        // ==========================================
        // CHẾ ĐỘ SERIAL/MOCK: Gửi Binary Packet (Logic cũ)
        // ==========================================
        const DEFAULT_SPEED = 100;

        if (cmd.type === "motion") {
            if (cmd.action === "move") {
                let speed = DEFAULT_SPEED;
                let duration = 0;
                let direction = this.MOVE_FORWARD;

                if (typeof cmd.value === "object" && cmd.value !== null) {
                    const obj = cmd.value as import("./types").MotionValue;
                    speed = Math.abs(Number(obj.val));
                    duration = Number(obj.dur) * 1000;
                    direction = Number(obj.val) >= 0 ? this.MOVE_FORWARD : this.MOVE_BACK;
                } else {
                    const val = Number(cmd.value);
                    speed = DEFAULT_SPEED;
                    duration = Math.abs(val) * 20;
                    direction = val >= 0 ? this.MOVE_FORWARD : this.MOVE_BACK;
                }

                await this.sendPacket(this.DEVICE_SPEED, speed);
                await this.sendPacket(this.DEVICE_MOTOR, direction);

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
                    direction = Number(obj.val) >= 0 ? this.ROTATE_RIGHT : this.ROTATE_LEFT;
                } else {
                    const val = Number(cmd.value);
                    speed = DEFAULT_SPEED;
                    duration = Math.abs(val) * 10;
                    direction = val >= 0 ? this.ROTATE_RIGHT : this.ROTATE_LEFT;
                }

                await this.sendPacket(this.DEVICE_SPEED, speed);
                await this.sendPacket(this.DEVICE_MOTOR, direction);

                if (duration > 0) {
                    setTimeout(() => {
                        this.sendPacket(this.DEVICE_MOTOR, this.MOVE_STOP);
                    }, duration);
                }
            }
        } else if (cmd.type === "look") {
            if (cmd.action === "on") {
                await this.sendPacket(this.DEVICE_LED, 255);
            } else if (cmd.action === "off") {
                await this.sendPacket(this.DEVICE_LED, 0);
            }
        } else if (cmd.type === "servo") {
            const angle = Number(cmd.value);
            const safeAngle = Math.max(0, Math.min(180, angle));
            await this.sendPacket(this.DEVICE_SERVO, safeAngle);
        }
    }
}
