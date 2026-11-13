/**
 * Gamepad button bit positions inside the HID report.
 *
 * The order follows the Linux/Android `BTN_GAMEPAD` range so hosts that have
 * no mapping for this device (Android TV, Steam Deck, SDL fallbacks) still see
 * A/B/X/Y, shoulders and thumb clicks in the right place.
 */
export const GAMEPAD_BUTTON_BITS = {
  south: 0,
  east: 1,
  c: 2,
  west: 3,
  north: 4,
  z: 5,
  l1: 6,
  r1: 7,
  l2: 8,
  r2: 9,
  select: 10,
  start: 11,
  home: 12,
  l3: 13,
  r3: 14,
} as const;

export type GamepadBitButton = keyof typeof GAMEPAD_BUTTON_BITS;

/** D-pad directions are reported through the hat switch, not button bits. */
export type DpadButton = 'dpadUp' | 'dpadDown' | 'dpadLeft' | 'dpadRight';

export type GamepadButton = GamepadBitButton | DpadButton;

/** Hat switch values: clockwise from north, 8 = released. */
export const HAT_NEUTRAL = 8;

export interface GamepadState {
  /** Bitmask built from GAMEPAD_BUTTON_BITS. */
  buttons: number;
  /** 0-7 clockwise from north, HAT_NEUTRAL when released. */
  hat: number;
  /** Stick axes, -1..1. Positive Y is down, matching HID convention. */
  lx: number;
  ly: number;
  rx: number;
  ry: number;
  /** Trigger axes, 0..1. */
  lt: number;
  rt: number;
}

export const NEUTRAL_GAMEPAD: GamepadState = {
  buttons: 0,
  hat: HAT_NEUTRAL,
  lx: 0,
  ly: 0,
  rx: 0,
  ry: 0,
  lt: 0,
  rt: 0,
};

/**
 * Converts pressed directions into a hat value. Opposing directions are
 * cleaned the way fight sticks do it: left+right cancels, up+down gives up.
 */
export function hatFromDirections(
  up: boolean,
  down: boolean,
  left: boolean,
  right: boolean,
): number {
  const vertical = up ? -1 : down ? 1 : 0;
  const horizontal = left === right ? 0 : left ? -1 : 1;

  if (vertical === -1) {
    return horizontal === 1 ? 1 : horizontal === -1 ? 7 : 0;
  }
  if (vertical === 1) {
    return horizontal === 1 ? 3 : horizontal === -1 ? 5 : 4;
  }
  return horizontal === 1 ? 2 : horizontal === -1 ? 6 : HAT_NEUTRAL;
}
