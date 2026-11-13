import { Rect, Size, controlRect, isRound } from '../../input/geometry';
import { PRESET_LAYOUTS } from '../presets';
import { Control } from '../types';

/** The narrowest canvas layouts are designed for, a 21:9 phone and a tablet. */
const SCREENS: Size[] = [
  { width: 800, height: 400 },
  { width: 933, height: 400 },
  { width: 1024, height: 768 },
];

function overlaps(a: Control, ra: Rect, b: Control, rb: Rect): boolean {
  if (isRound(a) && isRound(b)) {
    const distance = Math.hypot(ra.cx - rb.cx, ra.cy - rb.cy);
    return distance < (ra.width + rb.width) / 2;
  }
  return (
    Math.abs(ra.cx - rb.cx) < (ra.width + rb.width) / 2 &&
    Math.abs(ra.cy - rb.cy) < (ra.height + rb.height) / 2
  );
}

describe.each(PRESET_LAYOUTS)('$name preset', layout => {
  it('has unique control ids', () => {
    const ids = layout.controls.map(control => control.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(SCREENS)('fits a $width x $height screen', screen => {
    for (const control of layout.controls) {
      const rect = controlRect(control, screen);
      expect(rect.cx - rect.width / 2).toBeGreaterThanOrEqual(0);
      expect(rect.cx + rect.width / 2).toBeLessThanOrEqual(screen.width);
      expect(rect.cy - rect.height / 2).toBeGreaterThanOrEqual(0);
      expect(rect.cy + rect.height / 2).toBeLessThanOrEqual(screen.height);
    }
  });

  it.each(SCREENS)('has no overlapping controls on $width x $height', screen => {
    const rects = layout.controls.map(control => controlRect(control, screen));
    const collisions: string[] = [];

    layout.controls.forEach((a, i) => {
      layout.controls.slice(i + 1).forEach((b, offset) => {
        if (overlaps(a, rects[i], b, rects[i + 1 + offset])) {
          collisions.push(`${a.id} / ${b.id}`);
        }
      });
    });
    expect(collisions).toEqual([]);
  });

  it('leaves the top centre free for the menu button', () => {
    const screen = SCREENS[0];
    const blocked = layout.controls.filter(control => {
      const rect = controlRect(control, screen);
      return (
        Math.abs(rect.cx - screen.width / 2) < rect.width / 2 + 20 &&
        rect.cy - rect.height / 2 < 48
      );
    });
    expect(blocked.map(control => control.id)).toEqual([]);
  });
});
