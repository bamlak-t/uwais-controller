import { HidStatus, HidTransport, HostDevice } from './types';

const MOCK_HOSTS: HostDevice[] = [
  { address: '00:00:00:00:00:01', name: 'Demo Gaming PC', kind: 'computer' },
  { address: '00:00:00:00:00:02', name: 'Demo Steam Deck', kind: 'computer' },
  { address: '00:00:00:00:00:03', name: 'Demo Android TV', kind: 'tv' },
];

const MAX_RECORDED_REPORTS = 500;

export interface SentReport {
  reportId: number;
  data: number[];
}

export interface MockTransport extends HidTransport {
  /** The most recent reports sent while connected, oldest first. */
  readonly reports: SentReport[];
}

/**
 * In-memory stand-in for the Bluetooth link. It mimics the timing of a real
 * connection so the whole app can be exercised without a phone that supports
 * the HID device profile, and records reports for tests.
 */
export function createMockTransport(delayMs = 400): MockTransport {
  const listeners = new Set<(status: HidStatus) => void>();
  const reports: SentReport[] = [];
  let status: HidStatus = {
    supported: true,
    bluetoothEnabled: true,
    registered: false,
    connection: 'disconnected',
    host: null,
  };

  const update = (patch: Partial<HidStatus>) => {
    status = { ...status, ...patch };
    listeners.forEach(listener => listener(status));
  };
  const wait = () => new Promise<void>(resolve => setTimeout(resolve, delayMs));

  return {
    reports,
    getStatus: async () => status,
    setMode: async () => {},
    start: async () => update({ registered: true }),
    stop: async () =>
      update({ registered: false, connection: 'disconnected', host: null }),
    getPairedHosts: async () => MOCK_HOSTS,
    connect: async address => {
      const host = MOCK_HOSTS.find(candidate => candidate.address === address);
      if (!host) {
        throw new Error(`Unknown host ${address}`);
      }
      update({ connection: 'connecting', host });
      await wait();
      update({ connection: 'connected' });
    },
    disconnect: async () => update({ connection: 'disconnected', host: null }),
    requestEnable: async () => true,
    requestDiscoverable: async () => true,
    sendReport: (reportId, data) => {
      if (status.connection !== 'connected') {
        return;
      }
      reports.push({ reportId, data });
      if (reports.length > MAX_RECORDED_REPORTS) {
        reports.shift();
      }
    },
    subscribe: listener => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
