import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import { useSettings } from '../settings/SettingsProvider';
import { createMockTransport } from './mockTransport';
import { nativeTransport } from './nativeTransport';
import { requestBluetoothPermissions } from './permissions';
import { HidStatus, HidTransport, HostDevice, INITIAL_STATUS } from './types';

interface HidContextValue {
  status: HidStatus;
  /** Paired devices the controller can connect to. */
  hosts: HostDevice[];
  /** True when the simulated transport is in use. */
  isDemo: boolean;
  /** False until the user grants the Bluetooth runtime permissions. */
  permissionGranted: boolean;
  /** The most recent problem, phrased for the user. */
  error: string | null;
  /** Where controller sessions send their reports. */
  transport: HidTransport;
  /** Requests permissions, registers the controller and loads paired hosts. */
  prepare(): Promise<void>;
  enableBluetooth(): Promise<void>;
  /** Makes the phone visible so a new host can pair with it. */
  makeDiscoverable(): Promise<void>;
  connect(host: HostDevice): Promise<void>;
  disconnect(): Promise<void>;
}

const ERROR_MESSAGES: Record<string, string> = {
  PERMISSION: 'Allow the Nearby devices permission to use Bluetooth.',
  BLUETOOTH_OFF: 'Turn on Bluetooth to continue.',
  UNSUPPORTED: 'This phone cannot act as a Bluetooth controller.',
  NOT_REGISTERED: 'The controller is still starting. Try again in a moment.',
  CONNECT_FAILED: 'Could not reach that device. Is its Bluetooth on?',
};

/** How long the phone stays visible to new hosts. */
const DISCOVERABLE_SECONDS = 120;

const HidContext = createContext<HidContextValue | null>(null);

function describeError(error: unknown): string {
  const code = (error as { code?: string })?.code;
  if (code && ERROR_MESSAGES[code]) {
    return ERROR_MESSAGES[code];
  }
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export function HidProvider({ children }: { children: ReactNode }) {
  const { settings, updateSettings } = useSettings();
  const isDemo = settings.demoMode || !nativeTransport;
  const transport = useMemo<HidTransport>(
    () =>
      isDemo || !nativeTransport ? createMockTransport() : nativeTransport,
    [isDemo],
  );

  const [status, setStatus] = useState(INITIAL_STATUS);
  const [hosts, setHosts] = useState<HostDevice[]>([]);
  const [permissionGranted, setPermissionGranted] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** Set when the user disconnects on purpose, to hold off auto reconnect. */
  const userDisconnected = useRef(false);
  const autoReconnectTried = useRef(false);
  const preparing = useRef(false);

  /** Runs a transport call and turns a failure into a user-facing message. */
  const attempt = useCallback(async (action: () => Promise<unknown>) => {
    try {
      await action();
      setError(null);
      return true;
    } catch (failure) {
      setError(describeError(failure));
      return false;
    }
  }, []);

  const prepare = useCallback(async () => {
    // Several triggers can fire together (launch, foreground, Bluetooth on).
    if (preparing.current) {
      return;
    }
    preparing.current = true;
    try {
      const granted = isDemo || (await requestBluetoothPermissions());
      setPermissionGranted(granted);
      if (!granted) {
        return;
      }
      const current = await transport.getStatus();
      setStatus(current);
      if (!current.bluetoothEnabled) {
        return;
      }
      if (await attempt(() => transport.start())) {
        await attempt(async () => setHosts(await transport.getPairedHosts()));
      }
    } finally {
      preparing.current = false;
    }
  }, [attempt, isDemo, transport]);

  // Follow the transport, and release it when switching between real and demo.
  useEffect(() => {
    setStatus(INITIAL_STATUS);
    setHosts([]);
    autoReconnectTried.current = false;
    preparing.current = false;
    const unsubscribe = transport.subscribe(setStatus);
    return () => {
      unsubscribe();
      transport.stop().catch(() => {});
    };
  }, [transport]);

  // Android unregisters HID apps in the background, so register again
  // whenever the app returns to the foreground.
  useEffect(() => {
    prepare();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        prepare();
      }
    });
    return () => subscription.remove();
  }, [prepare]);

  // Bluetooth was just switched on: finish the setup that was skipped.
  const { bluetoothEnabled, registered, connection, host } = status;
  useEffect(() => {
    if (bluetoothEnabled && !registered) {
      prepare();
    }
    if (!registered) {
      autoReconnectTried.current = false;
    }
  }, [bluetoothEnabled, registered, prepare]);

  useEffect(() => {
    if (connection === 'connected' && host) {
      updateSettings({ lastHostAddress: host.address });
    }
  }, [connection, host, updateSettings]);

  useEffect(() => {
    const target = settings.lastHostAddress;
    const shouldReconnect =
      registered &&
      connection === 'disconnected' &&
      settings.autoReconnect &&
      target != null &&
      !userDisconnected.current &&
      !autoReconnectTried.current;
    if (shouldReconnect) {
      autoReconnectTried.current = true;
      // A failed silent reconnect is not worth an error message.
      transport.connect(target).catch(() => {});
    }
  }, [
    registered,
    connection,
    settings.autoReconnect,
    settings.lastHostAddress,
    transport,
  ]);

  const enableBluetooth = useCallback(async () => {
    await attempt(() => transport.requestEnable());
  }, [attempt, transport]);

  const makeDiscoverable = useCallback(async () => {
    await attempt(() => transport.requestDiscoverable(DISCOVERABLE_SECONDS));
  }, [attempt, transport]);

  const connect = useCallback(
    async (target: HostDevice) => {
      userDisconnected.current = false;
      await attempt(() => transport.connect(target.address));
    },
    [attempt, transport],
  );

  const disconnect = useCallback(async () => {
    userDisconnected.current = true;
    await attempt(() => transport.disconnect());
  }, [attempt, transport]);

  const value = useMemo(
    () => ({
      status,
      hosts,
      isDemo,
      permissionGranted,
      error,
      transport,
      prepare,
      enableBluetooth,
      makeDiscoverable,
      connect,
      disconnect,
    }),
    [
      status,
      hosts,
      isDemo,
      permissionGranted,
      error,
      transport,
      prepare,
      enableBluetooth,
      makeDiscoverable,
      connect,
      disconnect,
    ],
  );

  return <HidContext.Provider value={value}>{children}</HidContext.Provider>;
}

export function useHid(): HidContextValue {
  const context = useContext(HidContext);
  if (!context) {
    throw new Error('useHid must be used inside HidProvider');
  }
  return context;
}
