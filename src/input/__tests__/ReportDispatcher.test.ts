import { ReportSink } from '../../bluetooth/types';
import { NEUTRAL_GAMEPAD } from '../../hid/gamepad';
import { ReportId } from '../../hid/reports';
import { ReportDispatcher } from '../ReportDispatcher';
import { ControllerState } from '../types';

describe('ReportDispatcher', () => {
  let reports: { reportId: number; data: number[] }[];
  let sink: ReportSink;

  beforeEach(() => {
    reports = [];
    sink = {
      sendReport: (reportId, data) => reports.push({ reportId, data }),
    };
  });

  const baseState: ControllerState = {
    gamepad: NEUTRAL_GAMEPAD,
    keys: [],
    mouse: { buttons: 0 },
  };

  it('dispatches gamepad, keyboard, and mouse reports in classic mode', () => {
    const dispatcher = new ReportDispatcher(sink, 'classic');
    dispatcher.update(baseState);

    expect(reports).toHaveLength(3);
    expect(reports[0].reportId).toBe(ReportId.Gamepad);
    expect(reports[0].data).toHaveLength(13); // Classic gamepad: 13 bytes
    expect(reports[1].reportId).toBe(ReportId.Keyboard);
    expect(reports[2].reportId).toBe(ReportId.Mouse);
  });

  it('deduplicates unchanged reports in classic mode', () => {
    const dispatcher = new ReportDispatcher(sink, 'classic');
    dispatcher.update(baseState);
    expect(reports).toHaveLength(3);

    // Same state again -> no new reports sent
    dispatcher.update(baseState);
    expect(reports).toHaveLength(3);
  });

  it('dispatches only 16-byte Xbox input report in xbox_ble mode', () => {
    const dispatcher = new ReportDispatcher(sink, 'xbox_ble');
    dispatcher.update(baseState);

    expect(reports).toHaveLength(1);
    expect(reports[0].reportId).toBe(ReportId.Gamepad);
    expect(reports[0].data).toHaveLength(16); // Xbox BLE: 16 bytes
    // Neutral sticks centered at 0x8000
    expect(reports[0].data.slice(0, 8)).toEqual([
      0x00, 0x80, 0x00, 0x80, 0x00, 0x80, 0x00, 0x80,
    ]);
  });

  it('ignores mouse motion in xbox_ble mode', () => {
    const dispatcher = new ReportDispatcher(sink, 'xbox_ble');
    dispatcher.moveMouse({ dx: 10, dy: -5, wheel: 0 });
    expect(reports).toHaveLength(0);
  });

  it('switches modes cleanly via setMode and clears deduplication cache', () => {
    const dispatcher = new ReportDispatcher(sink, 'classic');
    dispatcher.update(baseState);
    expect(reports).toHaveLength(3);

    dispatcher.setMode('xbox_ble');
    dispatcher.update(baseState);
    // Should now send the Xbox BLE 16-byte report even though gamepad state didn't change
    expect(reports).toHaveLength(4);
    expect(reports[3].reportId).toBe(ReportId.Gamepad);
    expect(reports[3].data).toHaveLength(16);
  });
});
