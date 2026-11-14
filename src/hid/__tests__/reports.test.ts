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
  encodeXboxBleReport,
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

describe('encodeXboxBleReport', () => {
  it('encodes the 16-byte neutral state matching Xbox BLE specification', () => {
    const report = encodeXboxBleReport(NEUTRAL_GAMEPAD);
    expect(report).toHaveLength(16);
    expect(report).toEqual([
      0x00, 0x80, // LX (32768)
      0x00, 0x80, // LY (32768)
      0x00, 0x80, // RX (32768)
      0x00, 0x80, // RY (32768)
      0x00, 0x00, // LT (0)
      0x00, 0x00, // RT (0)
      0x00,       // Hat (0 = Centered)
      0x00, 0x00, // Buttons (0)
      0x00,       // Share (0)
    ]);
  });

  it('encodes stick axes full range as little-endian uint16 (0..65535)', () => {
    const report = encodeXboxBleReport({
      ...NEUTRAL_GAMEPAD,
      lx: -1,
      ly: 1,
      rx: 0,
      ry: 5, // Clamped to 1
    });
    expect(report.slice(0, 2)).toEqual([0x00, 0x00]); // -1 -> 0
    expect(report.slice(2, 4)).toEqual([0xff, 0xff]); // 1 -> 65535
    expect(report.slice(4, 6)).toEqual([0x00, 0x80]); // 0 -> 32768
    expect(report.slice(6, 8)).toEqual([0xff, 0xff]); // 5 clamped to 1 -> 65535
  });

  it('encodes triggers as 10-bit little-endian (0..1023)', () => {
    const report = encodeXboxBleReport({
      ...NEUTRAL_GAMEPAD,
      lt: 1,
      rt: 0.5,
    });
    expect(report.slice(8, 10)).toEqual([0xff, 0x03]); // 1023 = 0x03FF
    expect(report.slice(10, 12)).toEqual([0x00, 0x02]); // round(0.5 * 1023) = 512 = 0x0200
  });

  it('encodes D-pad hat switch (1..8, 0 = neutral)', () => {
    expect(encodeXboxBleReport({ ...NEUTRAL_GAMEPAD, hat: 0 })[12]).toBe(1); // N
    expect(encodeXboxBleReport({ ...NEUTRAL_GAMEPAD, hat: 1 })[12]).toBe(2); // NE
    expect(encodeXboxBleReport({ ...NEUTRAL_GAMEPAD, hat: 2 })[12]).toBe(3); // E
    expect(encodeXboxBleReport({ ...NEUTRAL_GAMEPAD, hat: 4 })[12]).toBe(5); // S
    expect(encodeXboxBleReport({ ...NEUTRAL_GAMEPAD, hat: 6 })[12]).toBe(7); // W
    expect(encodeXboxBleReport({ ...NEUTRAL_GAMEPAD, hat: 7 })[12]).toBe(8); // NW
    expect(encodeXboxBleReport({ ...NEUTRAL_GAMEPAD, hat: HAT_NEUTRAL })[12]).toBe(0); // Neutral
  });

  it('encodes buttons and share button into the right bit positions', () => {
    const buttons =
      (1 << GAMEPAD_BUTTON_BITS.south) | // A (bit 0)
      (1 << GAMEPAD_BUTTON_BITS.east) |  // B (bit 1)
      (1 << GAMEPAD_BUTTON_BITS.west) |  // X (bit 3)
      (1 << GAMEPAD_BUTTON_BITS.north) | // Y (bit 4)
      (1 << GAMEPAD_BUTTON_BITS.l1) |    // LB (bit 6)
      (1 << GAMEPAD_BUTTON_BITS.r1) |    // RB (bit 7)
      (1 << GAMEPAD_BUTTON_BITS.select) |// View (bit 10 -> high byte bit 2)
      (1 << GAMEPAD_BUTTON_BITS.start) | // Menu (bit 11 -> high byte bit 3)
      (1 << GAMEPAD_BUTTON_BITS.home) |  // Guide (bit 12 -> high byte bit 4)
      (1 << GAMEPAD_BUTTON_BITS.l3) |    // L3 (bit 13 -> high byte bit 5)
      (1 << GAMEPAD_BUTTON_BITS.r3) |    // R3 (bit 14 -> high byte bit 6)
      (1 << GAMEPAD_BUTTON_BITS.share);  // Share (bit 15 -> byte 15)

    const report = encodeXboxBleReport({ ...NEUTRAL_GAMEPAD, buttons });
    // low byte: bit 0 + bit 1 + bit 3 + bit 4 + bit 6 + bit 7 = 1 + 2 + 8 + 16 + 64 + 128 = 219 (0xDB)
    expect(report[13]).toBe(0xdb);
    // high byte: bit 10 + bit 11 + bit 12 + bit 13 + bit 14 = (4 + 8 + 16 + 32 + 64) = 124 (0x7C)
    expect(report[14]).toBe(0x7c);
    // share byte: bit 0 = 1
    expect(report[15]).toBe(0x01);
  });
});
