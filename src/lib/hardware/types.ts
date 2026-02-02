export interface RobotCommand {
    type: "motion" | "sound" | "look" | "servo";
    action: string;
    value?: number | string | MotionValue | Record<string, unknown>;
}

export interface MotionValue {
    val: number;
    dur: number;
}

export interface ITransport {
    isConnected: boolean;
    connect(): Promise<boolean>;
    disconnect(): Promise<void>;
    send(data: string): Promise<void>;
    sendBinary(data: Uint8Array): Promise<void>;
    onReceive(callback: (data: string) => void): void;
}

export enum TransportType {
    SERIAL = "SERIAL",
    WIFI = "WIFI",
    MOCK = "MOCK"
}
