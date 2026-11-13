import {
  dpad,
  left,
  pad,
  right,
  stick,
  touchpad,
  trigger,
} from '../../layouts/presets/builders';
import { Control } from '../../layouts/types';
import { TouchRouter } from '../TouchRouter';
import { PointerEvents } from '../types';

// One layout unit is 100px, so positions below read as percentages.
const SCREEN = { width: 220, height: 100 };

function createRouter(controls: Control[]) {
  const pointer: jest.Mocked<PointerEvents> = {
    onMouseMove: jest.fn(),
    onScroll: jest.fn(),
    onClick: jest.fn(),
  };
  const onChange = jest.fn();
  const router = new TouchRouter(
    controls,
    SCREEN,
    { mouseSensitivity: 1 },
    pointer,
    onChange,
  );
  const activity = (id: string) => router.activities.get(id);
  return { router, pointer, onChange, activity };
}

describe('buttons', () => {
  const south = pad('south', left(0.3, 0.5, 0.2));
  const east = pad('east', left(0.6, 0.5, 0.2));

  it('presses and releases', () => {
    const { router, activity } = createRouter([south]);
    router.touchStart(1, 30, 50, 0);
    expect(activity('south')?.pressed).toBe(true);
    router.touchEnd(1, 100);
    expect(activity('south')?.pressed).toBe(false);
  });

  it('ignores touches that land on nothing', () => {
    const { router, onChange } = createRouter([south]);
    router.touchStart(1, 150, 50, 0);
    router.touchEnd(1, 100);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('holds several buttons at once', () => {
    const { router, activity } = createRouter([south, east]);
    router.touchStart(1, 30, 50, 0);
    router.touchStart(2, 60, 50, 0);
    expect(activity('south')?.pressed).toBe(true);
    expect(activity('east')?.pressed).toBe(true);
    router.touchEnd(1, 100);
    expect(activity('south')?.pressed).toBe(false);
    expect(activity('east')?.pressed).toBe(true);
  });

  it('rolls from one button to the next without lifting', () => {
    const { router, activity } = createRouter([south, east]);
    router.touchStart(1, 30, 50, 0);
    router.touchMove(1, 60, 50);
    expect(activity('south')?.pressed).toBe(false);
    expect(activity('east')?.pressed).toBe(true);
  });

  it('stays pressed when the finger drifts off into empty space', () => {
    const { router, activity } = createRouter([south]);
    router.touchStart(1, 30, 50, 0);
    router.touchMove(1, 30, 95);
    expect(activity('south')?.pressed).toBe(true);
  });
});

describe('sticks', () => {
  const leftStick = stick('leftStick', left(0.5, 0.5, 0.4));

  it('follows the finger and clamps to the unit circle', () => {
    const { router, activity } = createRouter([leftStick]);
    router.touchStart(1, 50, 50, 0);
    expect(activity('stick-leftStick')).toMatchObject({ x: 0, y: 0 });

    // Radius is 20px and full travel is 70% of it: 7px is half deflection.
    router.touchMove(1, 57, 50);
    expect(activity('stick-leftStick')?.x).toBeCloseTo(0.5);

    router.touchMove(1, 50, 500);
    expect(activity('stick-leftStick')).toMatchObject({ x: 0, y: 1 });
  });

  it('recentres on release', () => {
    const { router, activity } = createRouter([leftStick]);
    router.touchStart(1, 60, 50, 0);
    router.touchEnd(1, 100);
    expect(activity('stick-leftStick')).toMatchObject({ pressed: false, x: 0 });
  });

  it('is owned by the first finger only', () => {
    const { router, activity } = createRouter([leftStick]);
    router.touchStart(1, 50, 50, 0);
    router.touchStart(2, 60, 50, 0);
    expect(activity('stick-leftStick')?.x).toBe(0);
  });
});

describe('d-pad', () => {
  const hat = dpad('hat', left(0.5, 0.5, 0.4));

  it('snaps to eight directions', () => {
    const { router, activity } = createRouter([hat]);
    router.touchStart(1, 50, 35, 0);
    expect(activity('dpad-hat')).toMatchObject({ x: 0, y: -1 });
    router.touchMove(1, 62, 38);
    expect(activity('dpad-hat')).toMatchObject({ x: 1, y: -1 });
    router.touchMove(1, 65, 50);
    expect(activity('dpad-hat')).toMatchObject({ x: 1, y: 0 });
  });

  it('is neutral in the dead centre', () => {
    const { router, activity } = createRouter([hat]);
    router.touchStart(1, 51, 50, 0);
    expect(activity('dpad-hat')).toMatchObject({ pressed: true, x: 0, y: 0 });
  });
});

describe('triggers', () => {
  it('increases towards the top', () => {
    const gas = trigger('right', left(0.5, 0.5, 0.8), 0.4);
    const { router, activity } = createRouter([gas]);

    router.touchStart(1, 50, 88, 0);
    expect(activity('trigger-right')?.value).toBeCloseTo(0.1);
    router.touchMove(1, 50, 56);
    expect(activity('trigger-right')?.value).toBeCloseTo(0.5);
    router.touchMove(1, 50, 12);
    expect(activity('trigger-right')?.value).toBe(1);
  });
});

describe('touchpad', () => {
  const trackpad = touchpad(right(0.6, 0.5, 0.8), 1.2);

  it('moves the pointer with one finger', () => {
    const { router, pointer } = createRouter([trackpad]);
    router.touchStart(1, 160, 50, 0);
    router.touchMove(1, 161, 52);
    const [dx, dy] = pointer.onMouseMove.mock.calls[0];
    expect(dx).toBeCloseTo(9);
    expect(dy).toBeCloseTo(18);
  });

  it('clicks on a quick tap', () => {
    const { router, pointer } = createRouter([trackpad]);
    router.touchStart(1, 160, 50, 0);
    router.touchEnd(1, 120);
    expect(pointer.onClick).toHaveBeenCalledWith('left');
  });

  it('right-clicks on a two finger tap', () => {
    const { router, pointer } = createRouter([trackpad]);
    router.touchStart(1, 160, 50, 0);
    router.touchStart(2, 170, 50, 20);
    router.touchEnd(1, 100);
    router.touchEnd(2, 110);
    expect(pointer.onClick).toHaveBeenCalledTimes(1);
    expect(pointer.onClick).toHaveBeenCalledWith('right');
  });

  it('does not click after a drag or a long press', () => {
    const { router, pointer } = createRouter([trackpad]);
    router.touchStart(1, 160, 50, 0);
    router.touchMove(1, 180, 50);
    router.touchEnd(1, 100);
    router.touchStart(2, 160, 50, 200);
    router.touchEnd(2, 900);
    expect(pointer.onClick).not.toHaveBeenCalled();
  });

  it('scrolls with two fingers', () => {
    const { router, pointer } = createRouter([trackpad]);
    router.touchStart(1, 150, 40, 0);
    router.touchStart(2, 170, 40, 0);
    router.touchMove(1, 150, 50);
    router.touchMove(2, 170, 50);
    expect(pointer.onMouseMove).not.toHaveBeenCalled();
    const steps = pointer.onScroll.mock.calls.reduce((sum, [n]) => sum + n, 0);
    expect(steps).toBe(2);
  });
});

describe('cancelAll', () => {
  it('releases every control', () => {
    const south = pad('south', left(0.3, 0.5, 0.2));
    const { router, activity } = createRouter([south]);
    router.touchStart(1, 30, 50, 0);
    router.cancelAll();
    expect(activity('south')?.pressed).toBe(false);
  });
});
