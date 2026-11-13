import { GamepadButton } from '../hid/gamepad';
import { keyLabel } from '../hid/keyboard';
import { MouseButton } from '../hid/mouse';
import { ButtonBinding } from '../layouts/types';
import { GlyphStyle } from './types';

type FaceButton = 'south' | 'east' | 'west' | 'north';

const SHARED_LABELS: Partial<Record<GamepadButton, string>> = {
  c: 'C',
  z: 'Z',
  dpadUp: '↑',
  dpadDown: '↓',
  dpadLeft: '←',
  dpadRight: '→',
};

const GAMEPAD_LABELS: Record<GlyphStyle, Partial<Record<GamepadButton, string>>> = {
  xbox: {
    south: 'A',
    east: 'B',
    west: 'X',
    north: 'Y',
    l1: 'LB',
    r1: 'RB',
    l2: 'LT',
    r2: 'RT',
    select: 'VIEW',
    start: 'MENU',
    home: 'HOME',
    l3: 'LS',
    r3: 'RS',
  },
  playstation: {
    south: '✕',
    east: '○',
    west: '□',
    north: '△',
    l1: 'L1',
    r1: 'R1',
    l2: 'L2',
    r2: 'R2',
    select: 'SHARE',
    start: 'OPT',
    home: 'PS',
    l3: 'L3',
    r3: 'R3',
  },
  nintendo: {
    south: 'B',
    east: 'A',
    west: 'Y',
    north: 'X',
    l1: 'L',
    r1: 'R',
    l2: 'ZL',
    r2: 'ZR',
    select: '−',
    start: '+',
    home: 'HOME',
    l3: 'LS',
    r3: 'RS',
  },
};

const FACE_COLORS: Record<GlyphStyle, Record<FaceButton, string>> = {
  xbox: {
    south: '#6DD66D',
    east: '#FF5B5B',
    west: '#5AA9FF',
    north: '#FFD23F',
  },
  playstation: {
    south: '#7FB2FF',
    east: '#FF6B6B',
    west: '#F291D3',
    north: '#4FD6B0',
  },
  nintendo: {
    south: '#F5C518',
    east: '#E0483E',
    west: '#3FAE5A',
    north: '#3D7DD8',
  },
};

const MOUSE_LABELS: Record<MouseButton, string> = {
  left: 'LMB',
  right: 'RMB',
  middle: 'MMB',
};

export function gamepadButtonLabel(button: GamepadButton, glyphs: GlyphStyle): string {
  return GAMEPAD_LABELS[glyphs][button] ?? SHARED_LABELS[button] ?? '?';
}

/** The text drawn on a button for whatever it is bound to. */
export function bindingLabel(binding: ButtonBinding, glyphs: GlyphStyle): string {
  switch (binding.type) {
    case 'gamepad':
      return gamepadButtonLabel(binding.button, glyphs);
    case 'key':
      return keyLabel(binding.usage);
    case 'mouse':
      return MOUSE_LABELS[binding.button];
  }
}

/** Console colour of a face button, or undefined for every other binding. */
export function faceButtonColor(
  binding: ButtonBinding,
  glyphs: GlyphStyle,
): string | undefined {
  if (binding.type !== 'gamepad') {
    return undefined;
  }
  return (FACE_COLORS[glyphs] as Partial<Record<GamepadButton, string>>)[
    binding.button
  ];
}
