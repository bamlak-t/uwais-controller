export const MOUSE_BUTTON_BITS = {
  left: 0,
  right: 1,
  middle: 2,
} as const;

export type MouseButton = keyof typeof MOUSE_BUTTON_BITS;

export interface MouseState {
  /** Bitmask built from MOUSE_BUTTON_BITS. */
  buttons: number;
}

export const NEUTRAL_MOUSE: MouseState = { buttons: 0 };

/** Relative movement that rides along with a single mouse report. */
export interface MouseMotion {
  dx: number;
  dy: number;
  wheel: number;
}
