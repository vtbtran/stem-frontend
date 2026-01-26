import { ITransport } from "./types";

// Standard UART Service UUID for serial communication over BLE
const UART_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const TX_CHARACTERISTIC_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
const RX_CHARACTERISTIC_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

export class BluetoothTransport implements ITransport {
    private device: BluetoothDevice | null = null;
    private txCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
    private rxCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
    private onReceiveCallback: ((data: string) => void) | null = null;

    public isConnected: boolean = false;

    async connect(): Promise<boolean> {
        if (!navigator.bluetooth) {
            alert("Web Bluetooth is not supported in this browser.");
            return false;
        }

        try {
            this.device = await navigator.bluetooth.requestDevice({
                filters: [{ services: [UART_SERVICE_UUID] }],
                optionalServices: [UART_SERVICE_UUID]
            });

            if (!this.device.gatt) {
                throw new Error("GATT not available");
            }

            const server = await this.device.gatt.connect();
            const service = await server.getPrimaryService(UART_SERVICE_UUID);

            this.txCharacteristic = await service.getCharacteristic(TX_CHARACTERISTIC_UUID);
            this.rxCharacteristic = await service.getCharacteristic(RX_CHARACTERISTIC_UUID);

            // Start listening for incoming data
            await this.rxCharacteristic.startNotifications();
            this.rxCharacteristic.addEventListener('characteristicvaluechanged', this.handleDataReceived.bind(this));

            this.isConnected = true;
            return true;
        } catch (err: unknown) {
            // User cancelled the dialog - not a real error
            if (typeof err === "object" && err !== null && "name" in err && (err as { name: string }).name === 'NotFoundError') {
                // console.log('Bluetooth: User cancelled device selection');
                return false;
            }

            console.error("Bluetooth Connection Failed:", err);
            return false;
        }
    }

    async disconnect(): Promise<void> {
        if (this.rxCharacteristic) {
            await this.rxCharacteristic.stopNotifications();
        }
        if (this.device?.gatt?.connected) {
            this.device.gatt.disconnect();
        }
        this.device = null;
        this.txCharacteristic = null;
        this.rxCharacteristic = null;
        this.isConnected = false;
    }

    async send(data: string): Promise<void> {
        if (!this.txCharacteristic) return;

        const encoder = new TextEncoder();
        const dataArray = encoder.encode(data + "\n");
        await this.txCharacteristic.writeValue(dataArray);
    }

    onReceive(callback: (data: string) => void): void {
        this.onReceiveCallback = callback;
    }

    private handleDataReceived(event: Event) {
        const target = event.target as BluetoothRemoteGATTCharacteristic;
        if (!target.value) return;

        const decoder = new TextDecoder();
        const data = decoder.decode(target.value);

        if (this.onReceiveCallback) {
            this.onReceiveCallback(data);
        }
    }
}
