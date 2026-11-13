import { GamepadState } from './gamepad';
import { KeyboardState, MAX_KEYS } from './keyboard';
import { MouseMotion, MouseState } from './mouse';

/**
 * Report IDs and byte layouts. These must stay in sync with the descriptor in
 * android/app/src/main/java/com/uwaiscontroller/hid/HidDescriptor.kt.
 */
export const ReportId = {
  Gamepad: 1,
  Keyboard: 2,
  Mouse: 3,
} as const;

const AXIS_MAX = 32767;
const TRIGGER_MAX = 255;
const WHEEL_MAX = 127;

/** [buttons lo, buttons hi, hat, lx, ly, rx, ry (int16 LE each), lt, rt] */
export function encodeGamepadReport(state: GamepadState): number[] {
  return [
    state.buttons & 0xff,
    (state.buttons >> 8) & 0xff,
    state.hat & 0x0f,
    ...int16(axis(state.lx)),
    ...int16(axis(state.ly)),
    ...int16(axis(state.rx)),
    ...int16(axis(state.ry)),
    trigger(state.lt),
    trigger(state.rt),
  ];
}

/** [modifiers, reserved, key1..key6] */
export function encodeKeyboardReport(state: KeyboardState): number[] {
  const keys = state.keys.slice(0, MAX_KEYS);
  while (keys.length < MAX_KEYS) {
    keys.push(0);
  }
  return [state.modifiers & 0xff, 0, ...keys];
}

/** [buttons, dx (int16 LE), dy (int16 LE), wheel (int8)] */
export function encodeMouseReport(
  state: MouseState,
  motion: MouseMotion = { dx: 0, dy: 0, wheel: 0 },
): number[] {
  return [
    state.buttons & 0x1f,
    ...int16(clamp(Math.round(motion.dx), -AXIS_MAX, AXIS_MAX)),
    ...int16(clamp(Math.round(motion.dy), -AXIS_MAX, AXIS_MAX)),
    clamp(Math.round(motion.wheel), -WHEEL_MAX, WHEEL_MAX) & 0xff,
  ];
}

function axis(value: number): number {
  return Math.round(clamp(value, -1, 1) * AXIS_MAX);
}

function trigger(value: number): number {
  return Math.round(clamp(value, 0, 1) * TRIGGER_MAX);
}

function int16(value: number): [number, number] {
  return [value & 0xff, (value >> 8) & 0xff];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
