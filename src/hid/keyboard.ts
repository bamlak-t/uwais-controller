/** USB HID keyboard usages (Keyboard/Keypad page 0x07). */
export const Key = {
  A: 0x04,
  B: 0x05,
  C: 0x06,
  D: 0x07,
  E: 0x08,
  F: 0x09,
  G: 0x0a,
  H: 0x0b,
  I: 0x0c,
  J: 0x0d,
  K: 0x0e,
  L: 0x0f,
  M: 0x10,
  N: 0x11,
  O: 0x12,
  P: 0x13,
  Q: 0x14,
  R: 0x15,
  S: 0x16,
  T: 0x17,
  U: 0x18,
  V: 0x19,
  W: 0x1a,
  X: 0x1b,
  Y: 0x1c,
  Z: 0x1d,
  Digit1: 0x1e,
  Digit2: 0x1f,
  Digit3: 0x20,
  Digit4: 0x21,
  Digit5: 0x22,
  Digit6: 0x23,
  Digit7: 0x24,
  Digit8: 0x25,
  Digit9: 0x26,
  Digit0: 0x27,
  Enter: 0x28,
  Escape: 0x29,
  Backspace: 0x2a,
  Tab: 0x2b,
  Space: 0x2c,
  Minus: 0x2d,
  Equal: 0x2e,
  BracketLeft: 0x2f,
  BracketRight: 0x30,
  Backslash: 0x31,
  Semicolon: 0x33,
  Quote: 0x34,
  Backquote: 0x35,
  Comma: 0x36,
  Period: 0x37,
  Slash: 0x38,
  CapsLock: 0x39,
  F1: 0x3a,
  F2: 0x3b,
  F3: 0x3c,
  F4: 0x3d,
  F5: 0x3e,
  F6: 0x3f,
  F7: 0x40,
  F8: 0x41,
  F9: 0x42,
  F10: 0x43,
  F11: 0x44,
  F12: 0x45,
  Delete: 0x4c,
  ArrowRight: 0x4f,
  ArrowLeft: 0x50,
  ArrowDown: 0x51,
  ArrowUp: 0x52,
  ControlLeft: 0xe0,
  ShiftLeft: 0xe1,
  AltLeft: 0xe2,
  MetaLeft: 0xe3,
  ControlRight: 0xe4,
  ShiftRight: 0xe5,
  AltRight: 0xe6,
  MetaRight: 0xe7,
} as const;

/** Modifiers occupy 0xE0-0xE7 and travel as a bitmask instead of a key slot. */
const FIRST_MODIFIER = 0xe0;
const LAST_MODIFIER = 0xe7;

/** A boot-protocol keyboard report carries at most six simultaneous keys. */
export const MAX_KEYS = 6;

export interface KeyboardState {
  modifiers: number;
  keys: number[];
}

export const NEUTRAL_KEYBOARD: KeyboardState = { modifiers: 0, keys: [] };

/** Splits pressed usages into the modifier bitmask and the key slots. */
export function keyboardStateFromUsages(usages: number[]): KeyboardState {
  let modifiers = 0;
  const keys: number[] = [];

  for (const usage of usages) {
    if (usage >= FIRST_MODIFIER && usage <= LAST_MODIFIER) {
      modifiers |= 1 << (usage - FIRST_MODIFIER);
    } else if (keys.length < MAX_KEYS && !keys.includes(usage)) {
      keys.push(usage);
    }
  }
  return { modifiers, keys };
}

const KEY_LABELS: Record<number, string> = {
  [Key.Enter]: 'Enter',
  [Key.Escape]: 'Esc',
  [Key.Backspace]: '⌫',
  [Key.Tab]: 'Tab',
  [Key.Space]: 'Space',
  [Key.Minus]: '-',
  [Key.Equal]: '=',
  [Key.BracketLeft]: '[',
  [Key.BracketRight]: ']',
  [Key.Backslash]: '\\',
  [Key.Semicolon]: ';',
  [Key.Quote]: "'",
  [Key.Backquote]: '`',
  [Key.Comma]: ',',
  [Key.Period]: '.',
  [Key.Slash]: '/',
  [Key.CapsLock]: 'Caps',
  [Key.Delete]: 'Del',
  [Key.ArrowRight]: '→',
  [Key.ArrowLeft]: '←',
  [Key.ArrowDown]: '↓',
  [Key.ArrowUp]: '↑',
  [Key.ControlLeft]: 'Ctrl',
  [Key.ShiftLeft]: 'Shift',
  [Key.AltLeft]: 'Alt',
  [Key.MetaLeft]: 'Win',
  [Key.ControlRight]: 'Ctrl',
  [Key.ShiftRight]: 'Shift',
  [Key.AltRight]: 'Alt',
  [Key.MetaRight]: 'Win',
};

export function keyLabel(usage: number): string {
  if (usage >= Key.A && usage <= Key.Z) {
    return String.fromCharCode(65 + usage - Key.A);
  }
  if (usage >= Key.Digit1 && usage <= Key.Digit9) {
    return String(usage - Key.Digit1 + 1);
  }
  if (usage === Key.Digit0) {
    return '0';
  }
  if (usage >= Key.F1 && usage <= Key.F12) {
    return `F${usage - Key.F1 + 1}`;
  }
  return KEY_LABELS[usage] ?? '?';
}

/** Keys offered when binding a button in the layout editor. */
export const BINDABLE_KEYS: number[] = [
  ...range(Key.A, Key.Z),
  ...range(Key.Digit1, Key.Digit0),
  Key.Space,
  Key.Enter,
  Key.Escape,
  Key.Tab,
  Key.Backspace,
  Key.Delete,
  Key.ShiftLeft,
  Key.ControlLeft,
  Key.AltLeft,
  Key.MetaLeft,
  Key.ArrowUp,
  Key.ArrowDown,
  Key.ArrowLeft,
  Key.ArrowRight,
  Key.Minus,
  Key.Equal,
  Key.BracketLeft,
  Key.BracketRight,
  Key.Backslash,
  Key.Semicolon,
  Key.Quote,
  Key.Backquote,
  Key.Comma,
  Key.Period,
  Key.Slash,
  Key.CapsLock,
  ...range(Key.F1, Key.F12),
];

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}
