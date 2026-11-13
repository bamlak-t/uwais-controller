import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import { usePersistentState } from '../storage/usePersistentState';
import { DEFAULT_THEME_ID } from './presets';
import { resolveTheme } from './resolveTheme';
import { Theme, ThemeOverrides, ThemeSelection } from './types';

interface ThemeContextValue {
  /** The active preset with the user's overrides applied. */
  theme: Theme;
  selection: ThemeSelection;
  /** Switches preset and clears overrides made for the previous one. */
  selectTheme(themeId: string): void;
  setOverrides(patch: ThemeOverrides): void;
  resetOverrides(): void;
}

const DEFAULT_SELECTION: ThemeSelection = {
  themeId: DEFAULT_THEME_ID,
  overrides: {},
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const reviveSelection = (stored: unknown): ThemeSelection => ({
  ...DEFAULT_SELECTION,
  ...(stored as Partial<ThemeSelection>),
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection, loaded] = usePersistentState(
    'theme',
    DEFAULT_SELECTION,
    reviveSelection,
  );

  const selectTheme = useCallback(
    (themeId: string) => setSelection({ themeId, overrides: {} }),
    [setSelection],
  );
  const setOverrides = useCallback(
    (patch: ThemeOverrides) =>
      setSelection(previous => ({
        ...previous,
        overrides: { ...previous.overrides, ...patch },
      })),
    [setSelection],
  );
  const resetOverrides = useCallback(
    () => setSelection(previous => ({ ...previous, overrides: {} })),
    [setSelection],
  );

  const value = useMemo(
    () => ({
      theme: resolveTheme(selection),
      selection,
      selectTheme,
      setOverrides,
      resetOverrides,
    }),
    [selection, selectTheme, setOverrides, resetOverrides],
  );

  if (!loaded) {
    return null;
  }
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return context;
}
