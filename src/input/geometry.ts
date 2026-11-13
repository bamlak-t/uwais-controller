import { Control, ControlPosition } from '../layouts/types';

export interface Size {
  width: number;
  height: number;
}

/** A control's on-screen box in pixels, described by its centre. */
export interface Rect {
  cx: number;
  cy: number;
  width: number;
  height: number;
}

/**
 * Pixels per layout unit. Layouts are designed for a canvas at least two units
 * wide and one unit tall, so narrow screens (tablets, split screen) shrink the
 * unit instead of letting the left and right clusters collide.
 */
export function layoutUnit(screen: Size): number {
  return Math.min(screen.height, screen.width / 2);
}

/** Top of the one-unit-tall band the layout is vertically centred in. */
function layoutTop(screen: Size): number {
  return (screen.height - layoutUnit(screen)) / 2;
}

export function controlAspect(control: Control): number {
  switch (control.kind) {
    case 'button':
      return control.shape === 'circle' ? 1 : control.aspect;
    case 'trigger':
    case 'touchpad':
      return control.aspect;
    default:
      return 1;
  }
}

export function isRound(control: Control): boolean {
  return (
    control.kind === 'stick' ||
    control.kind === 'dpad' ||
    (control.kind === 'button' && control.shape === 'circle')
  );
}

export function controlRect(control: Control, screen: Size): Rect {
  const unit = layoutUnit(screen);
  const height = control.size * unit;
  const offset = control.x * unit;

  let cx: number;
  if (control.anchor === 'left') {
    cx = offset;
  } else if (control.anchor === 'right') {
    cx = screen.width - offset;
  } else {
    cx = screen.width / 2 + offset;
  }

  return {
    cx,
    cy: layoutTop(screen) + control.y * unit,
    width: height * controlAspect(control),
    height,
  };
}

/** Inverse of `controlRect`: anchors a pixel position to the nearest third. */
export function positionFromPoint(
  px: number,
  py: number,
  screen: Size,
): ControlPosition {
  const unit = layoutUnit(screen);
  const y = (py - layoutTop(screen)) / unit;

  if (px < screen.width / 3) {
    return { anchor: 'left', x: px / unit, y };
  }
  if (px > (screen.width * 2) / 3) {
    return { anchor: 'right', x: (screen.width - px) / unit, y };
  }
  return { anchor: 'center', x: (px - screen.width / 2) / unit, y };
}

/**
 * How far a point is from a control, normalised so 0 is the centre and 1 is
 * the edge. Values above 1 are outside the control.
 */
export function hitDistance(
  control: Control,
  rect: Rect,
  px: number,
  py: number,
  slop: number,
): number {
  const dx = Math.abs(px - rect.cx);
  const dy = Math.abs(py - rect.cy);

  if (isRound(control)) {
    return Math.hypot(dx, dy) / (rect.width / 2 + slop);
  }
  return Math.max(dx / (rect.width / 2 + slop), dy / (rect.height / 2 + slop));
}
