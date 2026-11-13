import { GamepadButton } from '../hid/gamepad';
import { MouseButton } from '../hid/mouse';

/**
 * Where a control sits on screen.
 *
 * Offsets are measured in layout units (see `layoutUnit` in input/geometry.ts)
 * from a horizontal anchor, so clusters keep their shape on every aspect ratio:
 * thumb controls hug the edges and the gap in the middle absorbs extra width.
 */
export interface ControlPosition {
  anchor: 'left' | 'center' | 'right';
  /** Distance from the anchor edge, or signed offset from the centre line. */
  x: number;
  /** Distance from the top of the layout area. */
  y: number;
}

interface BaseControl extends ControlPosition {
  id: string;
  /** Height in layout units. */
  size: number;
}

export type ButtonBinding =
  | { type: 'gamepad'; button: GamepadButton }
  | { type: 'key'; usage: number }
  | { type: 'mouse'; button: MouseButton };

export type ButtonShape = 'circle' | 'pill' | 'square';

export interface ButtonControl extends BaseControl {
  kind: 'button';
  binding: ButtonBinding;
  shape: ButtonShape;
  /** Width divided by height. Ignored for circles. */
  aspect: number;
  /** Overrides the label derived from the binding and glyph style. */
  label?: string;
}

/** What a stick or d-pad drives on the host. */
export type DirectionalOutput =
  | 'leftStick'
  | 'rightStick'
  | 'hat'
  | 'wasd'
  | 'arrows';

export interface StickControl extends BaseControl {
  kind: 'stick';
  output: DirectionalOutput;
}

export interface DpadControl extends BaseControl {
  kind: 'dpad';
  output: DirectionalOutput;
}

/** Analog trigger: slide up for more travel, like easing onto a pedal. */
export interface TriggerControl extends BaseControl {
  kind: 'trigger';
  side: 'left' | 'right';
  aspect: number;
}

/** Laptop-style trackpad: drag to move, tap to click, two fingers to scroll. */
export interface TouchpadControl extends BaseControl {
  kind: 'touchpad';
  aspect: number;
}

export type Control =
  | ButtonControl
  | StickControl
  | DpadControl
  | TriggerControl
  | TouchpadControl;

export type ControlKind = Control['kind'];

export interface Layout {
  id: string;
  name: string;
  description: string;
  /** Presets are read-only; editing one creates a custom copy. */
  preset: boolean;
  controls: Control[];
}
