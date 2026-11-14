import NativeHidDevice, {
  NativeHidStatus,
  Spec,
} from '../specs/NativeHidDevice';
import {
  ConnectionState,
  HidStatus,
  HidTransport,
  HostDevice,
  HostKind,
} from './types';

function toStatus(native: NativeHidStatus): HidStatus {
  return {
    supported: native.supported,
    bluetoothEnabled: native.bluetoothEnabled,
    registered: native.registered,
    connection: native.connection as ConnectionState,
    host: native.hostAddress
      ? { address: native.hostAddress, name: native.hostName }
      : null,
  };
}

function createNativeTransport(native: Spec): HidTransport {
  return {
    getStatus: async () => toStatus(await native.getStatus()),
    setMode: mode => native.setMode(mode),
    start: () => native.start(),
    stop: () => native.stop(),
    getPairedHosts: async (): Promise<HostDevice[]> =>
      (await native.getPairedHosts()).map(host => ({
        ...host,
        kind: host.kind as HostKind,
      })),
    connect: address => native.connect(address),
    disconnect: () => native.disconnect(),
    requestEnable: () => native.requestEnable(),
    requestDiscoverable: seconds => native.requestDiscoverable(seconds),
    sendReport: (reportId, data) => native.sendReport(reportId, data),
    subscribe: listener => {
      const subscription = native.onStatusChanged(status =>
        listener(toStatus(status)),
      );
      return () => subscription.remove();
    },
  };
}

/** Null when the native module is unavailable, e.g. under Jest. */
export const nativeTransport: HidTransport | null = NativeHidDevice
  ? createNativeTransport(NativeHidDevice)
  : null;
