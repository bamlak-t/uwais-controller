import {
  GAMEPAD_BUTTON_BITS,
  HAT_NEUTRAL,
  NEUTRAL_GAMEPAD,
  hatFromDirections,
} from '../gamepad';
import { Key, keyboardStateFromUsages } from '../keyboard';
import {
  encodeGamepadReport,
  encodeKeyboardReport,
  encodeMouseReport,
} from '../reports';

describe('encodeGamepadReport', () => {
  it('encodes the neutral state', () => {
    expect(encodeGamepadReport(NEUTRAL_GAMEPAD)).toEqual([
      0,
      0,
      HAT_NEUTRAL,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
    ]);
  });

  it('packs buttons across both bytes', () => {
    const buttons =
      (1 << GAMEPAD_BUTTON_BITS.south) | (1 << GAMEPAD_BUTTON_BITS.r3);
    const report = encodeGamepadReport({ ...NEUTRAL_GAMEPAD, buttons });
    expect(report.slice(0, 2)).toEqual([0x01, 0x40]);
  });

  it('encodes sticks as little-endian int16 and clamps overflow', () => {
    const report = encodeGamepadReport({
      ...NEUTRAL_GAMEPAD,
      lx: 1,
      ly: -1,
      rx: 5,
      ry: 0.5,
    });
    expect(report.slice(3, 5)).toEqual([0xff, 0x7f]);
    expect(report.slice(5, 7)).toEqual([0x01, 0x80]);
    expect(report.slice(7, 9)).toEqual([0xff, 0x7f]);
    expect(report.slice(9, 11)).toEqual([0x00, 0x40]);
  });

  it('encodes triggers as a byte', () => {
    const report = encodeGamepadReport({ ...NEUTRAL_GAMEPAD, lt: 1, rt: 0.5 });
    expect(report.slice(11)).toEqual([255, 128]);
  });
});

describe('hatFromDirections', () => {
  it('maps the eight directions clockwise from north', () => {
    expect(hatFromDirections(true, false, false, false)).toBe(0);
    expect(hatFromDirections(true, false, false, true)).toBe(1);
    expect(hatFromDirections(false, false, false, true)).toBe(2);
    expect(hatFromDirections(false, true, false, true)).toBe(3);
    expect(hatFromDirections(false, true, false, false)).toBe(4);
    expect(hatFromDirections(false, true, true, false)).toBe(5);
    expect(hatFromDirections(false, false, true, false)).toBe(6);
    expect(hatFromDirections(true, false, true, false)).toBe(7);
    expect(hatFromDirections(false, false, false, false)).toBe(HAT_NEUTRAL);
  });

  it('cleans opposing directions', () => {
    expect(hatFromDirections(false, false, true, true)).toBe(HAT_NEUTRAL);
    expect(hatFromDirections(true, true, false, false)).toBe(0);
  });
});

describe('keyboard reports', () => {
  it('separates modifiers from keys', () => {
    const state = keyboardStateFromUsages([Key.ShiftLeft, Key.A, Key.W]);
    expect(encodeKeyboardReport(state)).toEqual([
      0x02,
      0,
      Key.A,
      Key.W,
      0,
      0,
      0,
      0,
    ]);
  });

  it('drops keys beyond the six key rollover', () => {
    const usages = [Key.A, Key.B, Key.C, Key.D, Key.E, Key.F, Key.G];
    expect(keyboardStateFromUsages(usages).keys).toHaveLength(6);
  });
});

describe('encodeMouseReport', () => {
  it('encodes negative movement as two-complement', () => {
    expect(
      encodeMouseReport({ buttons: 1 }, { dx: -1, dy: 300, wheel: -2 }),
    ).toEqual([1, 0xff, 0xff, 0x2c, 0x01, 0xfe]);
  });
});
