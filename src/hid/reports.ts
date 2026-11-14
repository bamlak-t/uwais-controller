import { GAMEPAD_BUTTON_BITS, GamepadState } from './gamepad';
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
const XBOX_AXIS_MAX = 65535;
const XBOX_TRIGGER_MAX = 1023;

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

/**
 * Encodes a 16-byte Xbox Series X|S input report for BLE HOGP.
 *
 * Wire layout (16 bytes):
 * - Bytes 0..1: Left Stick X (uint16 LE: 0..65535, center = 32768)
 * - Bytes 2..3: Left Stick Y (uint16 LE: 0..65535, center = 32768)
 * - Bytes 4..5: Right Stick X (uint16 LE: 0..65535, center = 32768)
 * - Bytes 6..7: Right Stick Y (uint16 LE: 0..65535, center = 32768)
 * - Bytes 8..9: Left Trigger LT (uint16 LE: 0..1023, 10-bit value + 6 bits padding)
 * - Bytes 10..11: Right Trigger RT (uint16 LE: 0..1023, 10-bit value + 6 bits padding)
 * - Byte 12: D-pad / Hat switch:
 *     0 = neutral/released
 *     1 = N, 2 = NE, 3 = E, 4 = SE, 5 = S, 6 = SW, 7 = W, 8 = NW
 * - Bytes 13..14: 16-bit button bitmask:
 *     Bit 0: A
 *     Bit 1: B
 *     Bit 3: X
 *     Bit 4: Y
 *     Bit 6: LB
 *     Bit 7: RB
 *     Bit 10: View (Select)
 *     Bit 11: Menu (Start)
 *     Bit 12: Xbox Guide (Home)
 *     Bit 13: L3 (ThumbL)
 *     Bit 14: R3 (ThumbR)
 * - Byte 15: Share / Record button (bit 0: 0x01)
 */
export function encodeXboxBleReport(state: GamepadState): number[] {
  const xboxButtons = state.buttons & 0x7cdb;
  const share = (state.buttons >> GAMEPAD_BUTTON_BITS.share) & 0x01;

  return [
    ...uint16LE(xboxAxis(state.lx)),
    ...uint16LE(xboxAxis(state.ly)),
    ...uint16LE(xboxAxis(state.rx)),
    ...uint16LE(xboxAxis(state.ry)),
    ...uint16LE(xboxTrigger(state.lt)),
    ...uint16LE(xboxTrigger(state.rt)),
    xboxHat(state.hat),
    xboxButtons & 0xff,
    (xboxButtons >> 8) & 0xff,
    share,
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

function xboxAxis(value: number): number {
  return Math.round(clamp((value + 1) / 2, 0, 1) * XBOX_AXIS_MAX);
}

function xboxTrigger(value: number): number {
  return Math.round(clamp(value, 0, 1) * XBOX_TRIGGER_MAX);
}

function xboxHat(hat: number): number {
  if (hat >= 0 && hat <= 7) {
    return hat + 1;
  }
  return 0;
}

function uint16LE(value: number): [number, number] {
  return [value & 0xff, (value >> 8) & 0xff];
}
