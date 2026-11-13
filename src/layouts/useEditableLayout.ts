import { useCallback } from 'react';
import { forkLayout } from './editing';
import { useLayouts } from './LayoutsProvider';
import { Layout } from './types';

/** Picks a name that no existing layout uses, adding a counter if needed. */
export function uniqueLayoutName(base: string, layouts: Layout[]): string {
  const taken = new Set(layouts.map(layout => layout.name));
  if (!taken.has(base)) {
    return base;
  }
  let counter = 2;
  while (taken.has(`${base} ${counter}`)) {
    counter++;
  }
  return `${base} ${counter}`;
}

/**
 * Returns a function that resolves a layout to one that can be edited:
 * custom layouts are returned as they are, presets are copied first.
 */
export function useEditableLayout() {
  const { layouts, activeLayout, saveLayout, setActiveLayout } = useLayouts();

  return useCallback(
    (layout: Layout): Layout => {
      if (!layout.preset) {
        return layout;
      }
      const copy = forkLayout(
        layout,
        uniqueLayoutName(`My ${layout.name.toLowerCase()}`, layouts),
      );
      saveLayout(copy);
      // Keep playing on what is being edited when the preset was in use.
      if (activeLayout.id === layout.id) {
        setActiveLayout(copy.id);
      }
      return copy;
    },
    [layouts, activeLayout, saveLayout, setActiveLayout],
  );
}
