import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import { usePersistentState } from '../storage/usePersistentState';
import { DEFAULT_LAYOUT_ID, PRESET_LAYOUTS } from './presets';
import { Layout } from './types';

interface StoredLayouts {
  custom: Layout[];
  activeLayoutId: string;
}

interface LayoutsContextValue {
  /** Presets first, then the user's own layouts. */
  layouts: Layout[];
  activeLayout: Layout;
  setActiveLayout(layoutId: string): void;
  /** Adds a custom layout or replaces the one with the same id. */
  saveLayout(layout: Layout): void;
  deleteLayout(layoutId: string): void;
}

const DEFAULT_STORED: StoredLayouts = {
  custom: [],
  activeLayoutId: DEFAULT_LAYOUT_ID,
};

const LayoutsContext = createContext<LayoutsContextValue | null>(null);

const reviveStored = (stored: unknown): StoredLayouts => ({
  ...DEFAULT_STORED,
  ...(stored as Partial<StoredLayouts>),
});

export function LayoutsProvider({ children }: { children: ReactNode }) {
  const [stored, setStored, loaded] = usePersistentState(
    'layouts',
    DEFAULT_STORED,
    reviveStored,
  );

  const setActiveLayout = useCallback(
    (activeLayoutId: string) =>
      setStored(previous => ({ ...previous, activeLayoutId })),
    [setStored],
  );

  const saveLayout = useCallback(
    (layout: Layout) =>
      setStored(previous => {
        const exists = previous.custom.some(item => item.id === layout.id);
        return {
          ...previous,
          custom: exists
            ? previous.custom.map(item => (item.id === layout.id ? layout : item))
            : [...previous.custom, layout],
        };
      }),
    [setStored],
  );

  const deleteLayout = useCallback(
    (layoutId: string) =>
      setStored(previous => ({
        custom: previous.custom.filter(item => item.id !== layoutId),
        activeLayoutId:
          previous.activeLayoutId === layoutId
            ? DEFAULT_LAYOUT_ID
            : previous.activeLayoutId,
      })),
    [setStored],
  );

  const value = useMemo(() => {
    const layouts = [...PRESET_LAYOUTS, ...stored.custom];
    const activeLayout =
      layouts.find(layout => layout.id === stored.activeLayoutId) ?? layouts[0];
    return { layouts, activeLayout, setActiveLayout, saveLayout, deleteLayout };
  }, [stored, setActiveLayout, saveLayout, deleteLayout]);

  if (!loaded) {
    return null;
  }
  return (
    <LayoutsContext.Provider value={value}>{children}</LayoutsContext.Provider>
  );
}

export function useLayouts(): LayoutsContextValue {
  const context = useContext(LayoutsContext);
  if (!context) {
    throw new Error('useLayouts must be used inside LayoutsProvider');
  }
  return context;
}
