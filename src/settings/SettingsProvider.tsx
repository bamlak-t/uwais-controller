import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import { ControllerMode } from '../bluetooth/types';
import { usePersistentState } from '../storage/usePersistentState';

export interface Settings {
  /** Controller emulation mode: Classic HID or Native BLE Xbox Series X|S. */
  controllerMode: ControllerMode;
  /** Vibrate briefly when a control is pressed. */
  haptics: boolean;
  /** Radial stick deadzone, 0..1. */
  stickDeadzone: number;
  /** Touchpad pointer speed multiplier. */
  mouseSensitivity: number;
  /** Use the simulated transport instead of Bluetooth. */
  demoMode: boolean;
  /** Overlay the live controller state while playing. */
  showInputMonitor: boolean;
  /** Reconnect to the last host when the app opens. */
  autoReconnect: boolean;
  lastHostAddress: string | null;
}

export const DEFAULT_SETTINGS: Settings = {
  controllerMode: 'classic',
  haptics: true,
  stickDeadzone: 0.08,
  mouseSensitivity: 1,
  demoMode: false,
  showInputMonitor: false,
  autoReconnect: true,
  lastHostAddress: null,
};

interface SettingsContextValue {
  settings: Settings;
  updateSettings(patch: Partial<Settings>): void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

const reviveSettings = (stored: unknown): Settings => ({
  ...DEFAULT_SETTINGS,
  ...(stored as Partial<Settings>),
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings, loaded] = usePersistentState(
    'settings',
    DEFAULT_SETTINGS,
    reviveSettings,
  );

  const updateSettings = useCallback(
    (patch: Partial<Settings>) =>
      setSettings(previous => ({ ...previous, ...patch })),
    [setSettings],
  );

  const value = useMemo(
    () => ({ settings, updateSettings }),
    [settings, updateSettings],
  );

  if (!loaded) {
    return null;
  }
  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used inside SettingsProvider');
  }
  return context;
}
