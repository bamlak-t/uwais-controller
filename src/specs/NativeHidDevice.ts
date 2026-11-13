import type { CodegenTypes, TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export type NativeHost = {
  address: string;
  name: string;
  /** 'computer' | 'phone' | 'tv' | 'other' */
  kind: string;
};

export type NativeHidStatus = {
  /** False when the phone's Bluetooth stack has no HID device profile. */
  supported: boolean;
  bluetoothEnabled: boolean;
  /** True once the HID app is registered and hosts can see the controller. */
  registered: boolean;
  /** 'disconnected' | 'connecting' | 'connected' | 'disconnecting' */
  connection: string;
  /** Empty when no host is connected. */
  hostAddress: string;
  hostName: string;
};

export interface Spec extends TurboModule {
  getStatus(): Promise<NativeHidStatus>;
  start(): Promise<void>;
  stop(): Promise<void>;
  getPairedHosts(): Promise<Array<NativeHost>>;
  connect(address: string): Promise<void>;
  disconnect(): Promise<void>;
  requestEnable(): Promise<boolean>;
  requestDiscoverable(durationSeconds: number): Promise<boolean>;
  sendReport(reportId: number, data: Array<number>): void;

  readonly onStatusChanged: CodegenTypes.EventEmitter<NativeHidStatus>;
}

export default TurboModuleRegistry.get<Spec>('HidDevice');
