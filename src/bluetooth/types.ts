export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'disconnecting';

export type HostKind = 'computer' | 'phone' | 'tv' | 'other';

/** A device this phone is paired with and can act as a controller for. */
export interface HostDevice {
  address: string;
  name: string;
  kind: HostKind;
}

export interface HidStatus {
  /** False when the phone's Bluetooth stack has no HID device profile. */
  supported: boolean;
  bluetoothEnabled: boolean;
  /** True once hosts can discover and connect to the controller. */
  registered: boolean;
  connection: ConnectionState;
  host: { address: string; name: string } | null;
}

export const INITIAL_STATUS: HidStatus = {
  supported: true,
  bluetoothEnabled: false,
  registered: false,
  connection: 'disconnected',
  host: null,
};

/** Anything that can accept encoded HID input reports. */
export interface ReportSink {
  sendReport(reportId: number, data: number[]): void;
}

/**
 * The link to the host. Implemented natively over Bluetooth and by an
 * in-memory mock so the rest of the app never touches the native module.
 */
export interface HidTransport extends ReportSink {
  getStatus(): Promise<HidStatus>;
  /** Registers the controller with the Bluetooth stack. Idempotent. */
  start(): Promise<void>;
  stop(): Promise<void>;
  getPairedHosts(): Promise<HostDevice[]>;
  connect(address: string): Promise<void>;
  disconnect(): Promise<void>;
  /** Asks the user to turn Bluetooth on. Resolves false if they decline. */
  requestEnable(): Promise<boolean>;
  /** Makes the phone visible to hosts searching for new devices. */
  requestDiscoverable(durationSeconds: number): Promise<boolean>;
  subscribe(listener: (status: HidStatus) => void): () => void;
}
