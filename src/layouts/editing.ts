import {
  ButtonBinding,
  Control,
  ControlKind,
  ControlPosition,
  Layout,
} from './types';

export const MIN_CONTROL_SIZE = 0.07;
export const MAX_CONTROL_SIZE = 0.9;
const MIN_ASPECT = 0.3;
const MAX_ASPECT = 4;

let idCounter = 0;

/** Unique enough for ids that only need to differ within one device. */
export function createId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

/** Copies a layout into an editable custom layout. */
export function forkLayout(source: Layout, name: string): Layout {
  return {
    ...source,
    id: createId('custom'),
    name,
    description: source.preset ? `Based on ${source.name}` : source.description,
    preset: false,
    controls: source.controls.map(control => ({ ...control })),
  };
}

export function createBlankLayout(name: string): Layout {
  return {
    id: createId('custom'),
    name,
    description: 'Custom layout',
    preset: false,
    controls: [],
  };
}

function patchControl(
  layout: Layout,
  controlId: string,
  patch: (control: Control) => Control,
): Layout {
  return {
    ...layout,
    controls: layout.controls.map(control =>
      control.id === controlId ? patch(control) : control,
    ),
  };
}

export function moveControl(
  layout: Layout,
  controlId: string,
  position: ControlPosition,
): Layout {
  return patchControl(layout, controlId, control => ({ ...control, ...position }));
}

export function resizeControl(layout: Layout, controlId: string, delta: number): Layout {
  return patchControl(layout, controlId, control => ({
    ...control,
    size: clamp(control.size + delta, MIN_CONTROL_SIZE, MAX_CONTROL_SIZE),
  }));
}

/** Changes the width-to-height ratio of controls that are not round. */
export function stretchControl(layout: Layout, controlId: string, delta: number): Layout {
  return patchControl(layout, controlId, control =>
    'aspect' in control
      ? { ...control, aspect: clamp(control.aspect + delta, MIN_ASPECT, MAX_ASPECT) }
      : control,
  );
}

export function updateControl(layout: Layout, updated: Control): Layout {
  return patchControl(layout, updated.id, () => updated);
}

export function removeControl(layout: Layout, controlId: string): Layout {
  return {
    ...layout,
    controls: layout.controls.filter(control => control.id !== controlId),
  };
}

const DEFAULT_BINDING: ButtonBinding = { type: 'gamepad', button: 'south' };

/** A new control of the given kind, placed in the middle of the screen. */
export function createControl(kind: ControlKind): Control {
  const base = { id: createId(kind), anchor: 'center', x: 0, y: 0.5 } as const;

  switch (kind) {
    case 'button':
      return {
        ...base,
        kind,
        size: 0.15,
        binding: DEFAULT_BINDING,
        shape: 'circle',
        aspect: 1,
      };
    case 'stick':
      return { ...base, kind, size: 0.32, output: 'leftStick' };
    case 'dpad':
      return { ...base, kind, size: 0.32, output: 'hat' };
    case 'trigger':
      return { ...base, kind, size: 0.5, side: 'right', aspect: 0.4 };
    case 'touchpad':
      return { ...base, kind, size: 0.5, aspect: 1.4 };
  }
}

export function addControl(layout: Layout, control: Control): Layout {
  return { ...layout, controls: [...layout.controls, control] };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
