import { ReportSink } from '../bluetooth/types';
import { NEUTRAL_GAMEPAD } from '../hid/gamepad';
import { keyboardStateFromUsages } from '../hid/keyboard';
import { MouseMotion } from '../hid/mouse';
import {
  ReportId,
  encodeGamepadReport,
  encodeKeyboardReport,
  encodeMouseReport,
} from '../hid/reports';
import { ControllerState } from './types';

const NEUTRAL_STATE: ControllerState = {
  gamepad: NEUTRAL_GAMEPAD,
  keys: [],
  mouse: { buttons: 0 },
};

/**
 * Encodes controller state into HID reports and sends only what changed, so
 * holding a stick still does not flood the Bluetooth link.
 */
export class ReportDispatcher {
  private readonly lastSent = new Map<number, string>();
  private mouseButtons = 0;

  constructor(private readonly sink: ReportSink) {}

  /** Sends whichever reports differ from what the host last received. */
  update(state: ControllerState): void {
    this.mouseButtons = state.mouse.buttons;
    this.sendIfChanged(ReportId.Gamepad, encodeGamepadReport(state.gamepad));
    this.sendIfChanged(
      ReportId.Keyboard,
      encodeKeyboardReport(keyboardStateFromUsages(state.keys)),
    );
    this.sendIfChanged(ReportId.Mouse, encodeMouseReport(state.mouse));
  }

  /** Relative motion is an event, not state, so it is always sent. */
  moveMouse(motion: MouseMotion): void {
    const data = encodeMouseReport({ buttons: this.mouseButtons }, motion);
    this.sink.sendReport(ReportId.Mouse, data);
  }

  /** Releases everything on the host. */
  reset(): void {
    this.update(NEUTRAL_STATE);
  }

  private sendIfChanged(reportId: number, data: number[]): void {
    const signature = data.join(',');
    if (this.lastSent.get(reportId) === signature) {
      return;
    }
    this.lastSent.set(reportId, signature);
    this.sink.sendReport(reportId, data);
  }
}
