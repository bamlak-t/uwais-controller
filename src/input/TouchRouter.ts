import { Control } from '../layouts/types';
import { Rect, Size, controlRect, hitDistance, layoutUnit } from './geometry';
import {
  ActivityMap,
  ControlActivity,
  IDLE_ACTIVITY,
  PointerEvents,
} from './types';

/** Extra reach around every control, in layout units, to forgive near misses. */
const HIT_SLOP = 0.025;
/** Fraction of a stick's radius the thumb travels for full deflection. */
const STICK_TRAVEL = 0.7;
/** Fraction of a d-pad's radius around the centre that registers nothing. */
const DPAD_DEAD_CENTRE = 0.18;
/** A trigger never reports less than this while touched. */
const TRIGGER_MIN = 0.1;
/** The top slice of a trigger that already counts as fully pressed. */
const TRIGGER_FULL_ZONE = 0.15;

const TAP_MAX_DURATION_MS = 280;
/** Finger travel, in layout units, beyond which a touch is a drag, not a tap. */
const TAP_MAX_TRAVEL = 0.03;
/** Two-finger travel, in layout units, per wheel step. */
const SCROLL_STEP = 0.05;
/** Pointer pixels per layout unit of finger travel at sensitivity 1. */
const POINTER_GAIN = 900;

interface ActiveTouch {
  controlId: string;
  lastX: number;
  lastY: number;
}

/** Tracks one trackpad gesture from first finger down to last finger up. */
interface TouchpadGesture {
  startedAt: number;
  maxFingers: number;
  travel: number;
  scrollRemainder: number;
}

export interface TouchRouterOptions {
  /** Pointer speed multiplier for touchpads. */
  mouseSensitivity: number;
}

/**
 * Turns raw multi-touch input into per-control activity.
 *
 * All touches arrive through one surface and are hit-tested here, which is
 * what lets several controls be held at once and lets a thumb roll from one
 * button to the next without lifting.
 */
export class TouchRouter {
  private readonly rects = new Map<string, Rect>();
  private readonly byId = new Map<string, Control>();
  private readonly touches = new Map<number, ActiveTouch>();
  private readonly gestures = new Map<string, TouchpadGesture>();
  private readonly state = new Map<string, ControlActivity>();
  private readonly unit: number;

  constructor(
    private readonly controls: Control[],
    screen: Size,
    private readonly options: TouchRouterOptions,
    private readonly pointer: PointerEvents,
    /** Called whenever a control's activity changes. */
    private readonly onChange: (
      control: Control,
      activity: ControlActivity,
      previous: ControlActivity,
    ) => void,
  ) {
    this.unit = layoutUnit(screen);
    for (const control of controls) {
      this.rects.set(control.id, controlRect(control, screen));
      this.byId.set(control.id, control);
    }
  }

  get activities(): ActivityMap {
    return this.state;
  }

  touchStart(id: number, x: number, y: number, time: number): void {
    const control = this.pick(x, y);
    if (!control) {
      return;
    }
    // Sticks, d-pads and triggers follow a single finger.
    if (control.kind !== 'button' && control.kind !== 'touchpad') {
      if (this.holders(control.id) > 0) {
        return;
      }
    }

    this.touches.set(id, { controlId: control.id, lastX: x, lastY: y });

    if (control.kind === 'touchpad') {
      const gesture = this.gestures.get(control.id);
      if (gesture) {
        gesture.maxFingers = Math.max(gesture.maxFingers, this.holders(control.id));
      } else {
        this.gestures.set(control.id, {
          startedAt: time,
          maxFingers: 1,
          travel: 0,
          scrollRemainder: 0,
        });
      }
    }
    this.track(control, x, y);
  }

  touchMove(id: number, x: number, y: number): void {
    const touch = this.touches.get(id);
    if (!touch) {
      return;
    }
    const control = this.byId.get(touch.controlId)!;

    if (control.kind === 'button') {
      this.rollOver(touch, control, x, y);
    } else if (control.kind === 'touchpad') {
      this.moveOnTouchpad(touch, control, x, y);
    } else {
      this.track(control, x, y);
    }
    touch.lastX = x;
    touch.lastY = y;
  }

  touchEnd(id: number, time: number): void {
    const touch = this.touches.get(id);
    if (!touch) {
      return;
    }
    this.touches.delete(id);
    const control = this.byId.get(touch.controlId)!;

    if (this.holders(control.id) > 0) {
      return;
    }
    if (control.kind === 'touchpad') {
      this.finishGesture(control.id, time);
    }
    this.set(control.id, IDLE_ACTIVITY);
  }

  /** Releases everything, e.g. when the OS cancels the gesture. */
  cancelAll(): void {
    this.touches.clear();
    this.gestures.clear();
    for (const id of this.state.keys()) {
      this.set(id, IDLE_ACTIVITY);
    }
  }

  /** Topmost-nearest control under a point; later controls win ties. */
  private pick(
    x: number,
    y: number,
    filter?: (control: Control) => boolean,
  ): Control | undefined {
    const slop = HIT_SLOP * this.unit;
    let best: Control | undefined;
    let bestDistance = 1;

    for (const control of this.controls) {
      if (filter && !filter(control)) {
        continue;
      }
      const distance = hitDistance(
        control,
        this.rects.get(control.id)!,
        x,
        y,
        slop,
      );
      if (distance <= bestDistance) {
        best = control;
        bestDistance = distance;
      }
    }
    return best;
  }

  private holders(controlId: string): number {
    let count = 0;
    for (const touch of this.touches.values()) {
      if (touch.controlId === controlId) {
        count++;
      }
    }
    return count;
  }

  /** Updates a control's activity from the position of the finger on it. */
  private track(control: Control, x: number, y: number): void {
    const rect = this.rects.get(control.id)!;

    switch (control.kind) {
      case 'button':
      case 'touchpad':
        this.set(control.id, { ...IDLE_ACTIVITY, pressed: true });
        break;
      case 'stick': {
        const travel = (rect.width / 2) * STICK_TRAVEL;
        let vx = (x - rect.cx) / travel;
        let vy = (y - rect.cy) / travel;
        const magnitude = Math.hypot(vx, vy);
        if (magnitude > 1) {
          vx /= magnitude;
          vy /= magnitude;
        }
        this.set(control.id, { pressed: true, x: vx, y: vy, value: 0 });
        break;
      }
      case 'dpad': {
        const [dx, dy] = dpadDirection(x - rect.cx, y - rect.cy, rect.width / 2);
        this.set(control.id, { pressed: true, x: dx, y: dy, value: 0 });
        break;
      }
      case 'trigger': {
        const fromBottom = (rect.cy + rect.height / 2 - y) / rect.height;
        const value = clamp(fromBottom / (1 - TRIGGER_FULL_ZONE), TRIGGER_MIN, 1);
        this.set(control.id, { pressed: true, x: 0, y: 0, value });
        break;
      }
    }
  }

  /** Lets a finger slide from one button onto a neighbouring button. */
  private rollOver(touch: ActiveTouch, from: Control, x: number, y: number): void {
    const target = this.pick(x, y, control => control.kind === 'button');
    if (!target || target.id === from.id) {
      return;
    }
    touch.controlId = target.id;
    if (this.holders(from.id) === 0) {
      this.set(from.id, IDLE_ACTIVITY);
    }
    this.track(target, x, y);
  }

  private moveOnTouchpad(
    touch: ActiveTouch,
    control: Control,
    x: number,
    y: number,
  ): void {
    const gesture = this.gestures.get(control.id);
    if (!gesture) {
      return;
    }
    const dx = (x - touch.lastX) / this.unit;
    const dy = (y - touch.lastY) / this.unit;
    gesture.travel += Math.hypot(dx, dy);

    const fingers = this.holders(control.id);
    if (fingers === 1) {
      const gain = POINTER_GAIN * this.options.mouseSensitivity;
      this.pointer.onMouseMove(dx * gain, dy * gain);
      return;
    }

    // Each finger reports its own movement, so average them. Dragging down
    // pulls the content down with it, like scrolling on a touchscreen.
    gesture.scrollRemainder += dy / fingers / SCROLL_STEP;
    const steps = Math.trunc(gesture.scrollRemainder);
    if (steps !== 0) {
      gesture.scrollRemainder -= steps;
      this.pointer.onScroll(steps);
    }
  }

  private finishGesture(controlId: string, time: number): void {
    const gesture = this.gestures.get(controlId);
    this.gestures.delete(controlId);
    if (!gesture) {
      return;
    }
    const isTap =
      time - gesture.startedAt <= TAP_MAX_DURATION_MS &&
      gesture.travel <= TAP_MAX_TRAVEL * gesture.maxFingers;
    if (isTap) {
      this.pointer.onClick(gesture.maxFingers >= 2 ? 'right' : 'left');
    }
  }

  private set(id: string, next: ControlActivity): void {
    const previous = this.state.get(id) ?? IDLE_ACTIVITY;
    if (
      previous.pressed === next.pressed &&
      previous.x === next.x &&
      previous.y === next.y &&
      previous.value === next.value
    ) {
      return;
    }
    this.state.set(id, next);
    this.onChange(this.byId.get(id)!, next, previous);
  }
}

/** Snaps an offset from a d-pad's centre to one of eight directions. */
function dpadDirection(dx: number, dy: number, radius: number): [number, number] {
  if (Math.hypot(dx, dy) < radius * DPAD_DEAD_CENTRE) {
    return [0, 0];
  }
  const sector = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
  const angle = sector * (Math.PI / 4);
  return [Math.round(Math.cos(angle)), Math.round(Math.sin(angle))];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
