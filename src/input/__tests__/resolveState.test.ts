import { GAMEPAD_BUTTON_BITS, HAT_NEUTRAL } from '../../hid/gamepad';
import { Key } from '../../hid/keyboard';
import {
  dpad,
  key,
  left,
  mouse,
  pad,
  right,
  stick,
  trigger,
} from '../../layouts/presets/builders';
import { Control } from '../../layouts/types';
import { applyDeadzone, resolveState } from '../resolveState';
import { ControlActivity, IDLE_ACTIVITY } from '../types';

const OPTIONS = { deadzone: 0 };
const at = left(0.5, 0.5, 0.2);
const pressed: ControlActivity = { ...IDLE_ACTIVITY, pressed: true };

function resolve(controls: Control[], active: Record<string, ControlActivity>) {
  return resolveState(controls, new Map(Object.entries(active)), OPTIONS);
}

describe('resolveState', () => {
  it('is neutral when nothing is touched', () => {
    const state = resolve([pad('south', at)], {});
    expect(state.gamepad.buttons).toBe(0);
    expect(state.gamepad.hat).toBe(HAT_NEUTRAL);
    expect(state.keys).toEqual([]);
    expect(state.mouse.buttons).toBe(0);
  });

  it('sets button bits for pressed gamepad buttons', () => {
    const state = resolve([pad('south', at), pad('start', at)], {
      south: pressed,
      start: pressed,
    });
    expect(state.gamepad.buttons).toBe(
      (1 << GAMEPAD_BUTTON_BITS.south) | (1 << GAMEPAD_BUTTON_BITS.start),
    );
  });

  it('drives the trigger axis from a digital L2 button', () => {
    const state = resolve([pad('l2', at)], { l2: pressed });
    expect(state.gamepad.lt).toBe(1);
    expect(state.gamepad.buttons).toBe(1 << GAMEPAD_BUTTON_BITS.l2);
  });

  it('reports analog trigger travel', () => {
    const state = resolve([trigger('right', at, 0.4)], {
      'trigger-right': { ...pressed, value: 0.5 },
    });
    expect(state.gamepad.rt).toBe(0.5);
    expect(state.gamepad.buttons).toBe(1 << GAMEPAD_BUTTON_BITS.r2);
  });

  it('routes sticks to their axes', () => {
    const state = resolve([stick('leftStick', at), stick('rightStick', right(0.5, 0.5, 0.2))], {
      'stick-leftStick': { ...pressed, x: 0.6, y: -0.8 },
      'stick-rightStick': { ...pressed, x: -0.25, y: 0 },
    });
    expect(state.gamepad.lx).toBeCloseTo(0.6);
    expect(state.gamepad.ly).toBeCloseTo(-0.8);
    expect(state.gamepad.rx).toBeCloseTo(-0.25);
    expect(state.gamepad.ry).toBeCloseTo(0);
  });

  it('turns a d-pad into hat directions', () => {
    const state = resolve([dpad('hat', at)], {
      'dpad-hat': { ...pressed, x: 1, y: -1 },
    });
    expect(state.gamepad.hat).toBe(1);
  });

  it('combines leverless direction buttons with SOCD cleaning', () => {
    const controls = [pad('dpadLeft', at), pad('dpadRight', at), pad('dpadUp', at)];
    const state = resolve(controls, {
      dpadLeft: pressed,
      dpadRight: pressed,
      dpadUp: pressed,
    });
    expect(state.gamepad.hat).toBe(0);
  });

  it('maps a WASD d-pad, keys and mouse buttons', () => {
    const controls = [dpad('wasd', at), key(Key.Space, at), mouse('left', at)];
    const state = resolve(controls, {
      'dpad-wasd': { ...pressed, x: -1, y: -1 },
      [`key-${Key.Space}`]: pressed,
      'mouse-left': pressed,
    });
    expect(state.keys.sort()).toEqual([Key.A, Key.W, Key.Space].sort());
    expect(state.mouse.buttons).toBe(1);
  });
});

describe('applyDeadzone', () => {
  it('zeroes small deflections', () => {
    expect(applyDeadzone(0.05, 0.05, 0.1)).toEqual([0, 0]);
  });

  it('rescales so full deflection is preserved', () => {
    const [x, y] = applyDeadzone(1, 0, 0.2);
    expect(x).toBeCloseTo(1);
    expect(y).toBeCloseTo(0);
    expect(applyDeadzone(0.6, 0, 0.2)[0]).toBeCloseTo(0.5);
  });
});
