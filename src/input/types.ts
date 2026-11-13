import { GamepadState } from '../hid/gamepad';
import { MouseButton, MouseState } from '../hid/mouse';

/**
 * Live state of one on-screen control. Every kind shares the same shape so the
 * renderer and the resolver can treat controls uniformly:
 * - buttons use `pressed`
 * - sticks and d-pads use `pressed` plus the `x`/`y` vector (-1..1, +y down)
 * - triggers use `pressed` plus `value` (0..1)
 */
export interface ControlActivity {
  pressed: boolean;
  x: number;
  y: number;
  value: number;
}

export const IDLE_ACTIVITY: ControlActivity = {
  pressed: false,
  x: 0,
  y: 0,
  value: 0,
};

export type ActivityMap = ReadonlyMap<string, ControlActivity>;

/** Everything the host can observe, before it is encoded into reports. */
export interface ControllerState {
  gamepad: GamepadState;
  /** Pressed keyboard usages, modifiers included. */
  keys: number[];
  mouse: MouseState;
}

/** One-shot outputs that are not part of the held state. */
export interface PointerEvents {
  onMouseMove(dx: number, dy: number): void;
  onScroll(steps: number): void;
  onClick(button: MouseButton): void;
}
