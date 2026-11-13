import { ReportSink } from '../bluetooth/types';
import { MOUSE_BUTTON_BITS, MouseButton } from '../hid/mouse';
import { Control } from '../layouts/types';
import { Size } from './geometry';
import { ReportDispatcher } from './ReportDispatcher';
import { resolveState } from './resolveState';
import { TouchRouter } from './TouchRouter';
import { ControlActivity, ControllerState } from './types';

/** How long a tap on a touchpad holds the mouse button down. */
const CLICK_DURATION_MS = 40;

export interface SessionOptions {
  deadzone: number;
  mouseSensitivity: number;
}

export interface SessionListeners {
  /** A control changed and should be redrawn. */
  onActivity(controlId: string, activity: ControlActivity): void;
  /** A control was newly pressed or changed direction; cue for haptics. */
  onFeedback?(): void;
  /** The state sent to the host changed; used by the input monitor. */
  onState?(state: ControllerState): void;
}

/**
 * One play session on one layout: routes touches to controls, resolves the
 * combined state and keeps the host in sync through the report sink.
 */
export class ControllerSession {
  private readonly router: TouchRouter;
  private readonly dispatcher: ReportDispatcher;
  /** Mouse buttons held by touchpad taps rather than by on-screen buttons. */
  private clickMask = 0;
  private clickTimers = new Set<ReturnType<typeof setTimeout>>();
  /** Sub-pixel pointer movement carried over to the next report. */
  private remainderX = 0;
  private remainderY = 0;
  /** Batches the many activity changes of one touch event into one resolve. */
  private dirty = false;

  constructor(
    private readonly controls: Control[],
    screen: Size,
    sink: ReportSink,
    private readonly options: SessionOptions,
    private readonly listeners: SessionListeners,
  ) {
    this.dispatcher = new ReportDispatcher(sink);
    this.router = new TouchRouter(
      controls,
      screen,
      { mouseSensitivity: options.mouseSensitivity },
      {
        onMouseMove: (dx, dy) => this.moveMouse(dx, dy),
        onScroll: steps =>
          this.dispatcher.moveMouse({ dx: 0, dy: 0, wheel: steps }),
        onClick: button => this.click(button),
      },
      (control, activity, previous) =>
        this.handleActivity(control, activity, previous),
    );
    this.dispatcher.reset();
  }

  touchStart(id: number, x: number, y: number, time: number): void {
    this.router.touchStart(id, x, y, time);
    this.flush();
  }

  touchMove(id: number, x: number, y: number): void {
    this.router.touchMove(id, x, y);
    this.flush();
  }

  touchEnd(id: number, time: number): void {
    this.router.touchEnd(id, time);
    this.flush();
  }

  cancel(): void {
    this.router.cancelAll();
    this.flush();
  }

  /** Releases everything on the host and stops pending timers. */
  dispose(): void {
    this.clickTimers.forEach(clearTimeout);
    this.clickTimers.clear();
    this.clickMask = 0;
    this.router.cancelAll();
    this.dispatcher.reset();
  }

  private handleActivity(
    control: Control,
    activity: ControlActivity,
    previous: ControlActivity,
  ): void {
    this.dirty = true;
    this.listeners.onActivity(control.id, activity);

    // D-pads click on every new direction, like the real thing.
    const newDirection =
      control.kind === 'dpad' &&
      (activity.x !== 0 || activity.y !== 0) &&
      (activity.x !== previous.x || activity.y !== previous.y);
    if (activity.pressed && (!previous.pressed || newDirection)) {
      this.listeners.onFeedback?.();
    }
  }

  private flush(): void {
    if (!this.dirty) {
      return;
    }
    this.dirty = false;

    const state = resolveState(this.controls, this.router.activities, {
      deadzone: this.options.deadzone,
    });
    state.mouse.buttons |= this.clickMask;
    this.dispatcher.update(state);
    this.listeners.onState?.(state);
  }

  private moveMouse(dx: number, dy: number): void {
    const totalX = dx + this.remainderX;
    const totalY = dy + this.remainderY;
    const wholeX = Math.trunc(totalX);
    const wholeY = Math.trunc(totalY);
    this.remainderX = totalX - wholeX;
    this.remainderY = totalY - wholeY;

    if (wholeX !== 0 || wholeY !== 0) {
      this.dispatcher.moveMouse({ dx: wholeX, dy: wholeY, wheel: 0 });
    }
  }

  private click(button: MouseButton): void {
    const bit = 1 << MOUSE_BUTTON_BITS[button];
    this.clickMask |= bit;
    this.dirty = true;
    this.flush();
    this.listeners.onFeedback?.();

    const timer = setTimeout(() => {
      this.clickTimers.delete(timer);
      this.clickMask &= ~bit;
      this.dirty = true;
      this.flush();
    }, CLICK_DURATION_MS);
    this.clickTimers.add(timer);
  }
}
