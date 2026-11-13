import { Key } from '../../hid/keyboard';
import { Control, Layout } from '../types';
import { center, dpad, key, left, mouse, right, touchpad } from './builders';

/** WASD and action keys on the left, a trackpad on the right. */
export const keyboardAndMouse: Layout = {
  id: 'preset-keyboard-mouse',
  name: 'Keyboard & mouse',
  description: 'WASD keys with a trackpad for PC games',
  preset: true,
  controls: [
    key(Key.Escape, left(0.12, 0.11, 0.13)),
    key(Key.Tab, left(0.3, 0.11, 0.13)),
    key(Key.R, left(0.48, 0.11, 0.13)),
    key(Key.F, left(0.66, 0.11, 0.13)),
    key(Key.Q, left(0.12, 0.33, 0.13)),
    key(Key.E, left(0.62, 0.33, 0.13)),
    dpad('wasd', left(0.37, 0.6, 0.36)),
    key(Key.ShiftLeft, left(0.17, 0.9, 0.12), { aspect: 2 }),
    key(Key.ControlLeft, left(0.45, 0.9, 0.12), { aspect: 2 }),
    key(Key.Space, left(0.76, 0.78, 0.14), { aspect: 1.7 }),
    touchpad(right(0.52, 0.46, 0.68), 1.4),
    mouse('left', right(0.76, 0.9, 0.14), { aspect: 3.2 }),
    mouse('right', right(0.28, 0.9, 0.14), { aspect: 3.2 }),
  ],
};

/** A key and its width in key units; every row adds up to ROW_UNITS. */
type KeySpec = [usage: number, width?: number];

const ROW_UNITS = 15;
const BOARD_WIDTH = 1.96;
const KEY_HEIGHT = 0.15;
const KEY_GAP = 0.012;
const FIRST_ROW_Y = 0.215;
const ROW_PITCH = 0.165;

const KEYBOARD_ROWS: KeySpec[][] = [
  [
    [Key.Escape],
    [Key.Digit1],
    [Key.Digit2],
    [Key.Digit3],
    [Key.Digit4],
    [Key.Digit5],
    [Key.Digit6],
    [Key.Digit7],
    [Key.Digit8],
    [Key.Digit9],
    [Key.Digit0],
    [Key.Minus],
    [Key.Equal],
    [Key.Backspace, 2],
  ],
  [
    [Key.Tab, 1.5],
    [Key.Q],
    [Key.W],
    [Key.E],
    [Key.R],
    [Key.T],
    [Key.Y],
    [Key.U],
    [Key.I],
    [Key.O],
    [Key.P],
    [Key.BracketLeft],
    [Key.BracketRight],
    [Key.Backslash, 1.5],
  ],
  [
    [Key.CapsLock, 1.75],
    [Key.A],
    [Key.S],
    [Key.D],
    [Key.F],
    [Key.G],
    [Key.H],
    [Key.J],
    [Key.K],
    [Key.L],
    [Key.Semicolon],
    [Key.Quote],
    [Key.Enter, 2.25],
  ],
  [
    [Key.ShiftLeft, 2.25],
    [Key.Z],
    [Key.X],
    [Key.C],
    [Key.V],
    [Key.B],
    [Key.N],
    [Key.M],
    [Key.Comma],
    [Key.Period],
    [Key.Slash],
    [Key.ShiftRight, 2.75],
  ],
  [
    [Key.ControlLeft, 1.5],
    [Key.MetaLeft, 1.25],
    [Key.AltLeft, 1.25],
    [Key.Space, 5.75],
    [Key.AltRight, 1.25],
    [Key.ArrowLeft],
    [Key.ArrowDown],
    [Key.ArrowUp],
    [Key.ArrowRight],
  ],
];

function buildKeyboard(): Control[] {
  const keyUnit = BOARD_WIDTH / ROW_UNITS;

  return KEYBOARD_ROWS.flatMap((row, rowIndex) => {
    let cursor = 0;
    return row.map(([usage, width = 1]) => {
      const x = -BOARD_WIDTH / 2 + (cursor + width / 2) * keyUnit;
      cursor += width;
      return key(
        usage,
        center(x, FIRST_ROW_Y + rowIndex * ROW_PITCH, KEY_HEIGHT),
        { aspect: (width * keyUnit - KEY_GAP) / KEY_HEIGHT },
      );
    });
  });
}

/** A compact QWERTY board for typing and shortcuts. */
export const fullKeyboard: Layout = {
  id: 'preset-full-keyboard',
  name: 'Full keyboard',
  description: 'QWERTY keys for typing and shortcuts',
  preset: true,
  controls: buildKeyboard(),
};
