import {
  GAMEPAD_BUTTON_BITS,
  GamepadButton,
  NEUTRAL_GAMEPAD,
  hatFromDirections,
} from '../hid/gamepad';
import { Key } from '../hid/keyboard';
import { MOUSE_BUTTON_BITS } from '../hid/mouse';
import { Control, DirectionalOutput } from '../layouts/types';
import { ActivityMap, ControllerState } from './types';

/** Stick deflection needed before it counts as a digital direction. */
const DIGITAL_THRESHOLD = 0.4;
/** Trigger travel at which the digital L2/R2 button also reports pressed. */
const TRIGGER_BUTTON_THRESHOLD = 0.12;

const DIRECTION_KEYS = {
  wasd: { up: Key.W, down: Key.S, left: Key.A, right: Key.D },
  arrows: {
    up: Key.ArrowUp,
    down: Key.ArrowDown,
    left: Key.ArrowLeft,
    right: Key.ArrowRight,
  },
};

interface Directions {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export interface ResolveOptions {
  /** Radial stick deadzone, 0..1. */
  deadzone: number;
}

/**
 * Folds the live activity of every control into the state the host should
 * see. Rebuilding from scratch on each change keeps keys and buttons from
 * getting stuck when touches end in unexpected orders.
 */
export function resolveState(
  controls: Control[],
  activities: ActivityMap,
  options: ResolveOptions,
): ControllerState {
  const gamepad = { ...NEUTRAL_GAMEPAD };
  const keys = new Set<number>();
  const hat: Directions = { up: false, down: false, left: false, right: false };
  let mouseButtons = 0;

  const pressGamepad = (button: GamepadButton) => {
    switch (button) {
      case 'dpadUp':
        hat.up = true;
        return;
      case 'dpadDown':
        hat.down = true;
        return;
      case 'dpadLeft':
        hat.left = true;
        return;
      case 'dpadRight':
        hat.right = true;
        return;
      case 'l2':
        gamepad.lt = 1;
        break;
      case 'r2':
        gamepad.rt = 1;
        break;
    }
    gamepad.buttons |= 1 << GAMEPAD_BUTTON_BITS[button];
  };

  const applyDirectional = (
    output: DirectionalOutput,
    x: number,
    y: number,
  ) => {
    if (output === 'leftStick' || output === 'rightStick') {
      const [ax, ay]: ['lx', 'ly'] | ['rx', 'ry'] =
        output === 'leftStick' ? ['lx', 'ly'] : ['rx', 'ry'];
      // When two controls drive the same stick the stronger deflection wins.
      if (Math.hypot(x, y) > Math.hypot(gamepad[ax], gamepad[ay])) {
        gamepad[ax] = x;
        gamepad[ay] = y;
      }
      return;
    }

    const directions = toDirections(x, y);
    if (output === 'hat') {
      hat.up ||= directions.up;
      hat.down ||= directions.down;
      hat.left ||= directions.left;
      hat.right ||= directions.right;
      return;
    }
    const map = DIRECTION_KEYS[output];
    (Object.keys(map) as (keyof Directions)[]).forEach(direction => {
      if (directions[direction]) {
        keys.add(map[direction]);
      }
    });
  };

  for (const control of controls) {
    const activity = activities.get(control.id);
    if (!activity || !activity.pressed) {
      continue;
    }

    switch (control.kind) {
      case 'button': {
        const { binding } = control;
        if (binding.type === 'gamepad') {
          pressGamepad(binding.button);
        } else if (binding.type === 'key') {
          keys.add(binding.usage);
        } else {
          mouseButtons |= 1 << MOUSE_BUTTON_BITS[binding.button];
        }
        break;
      }
      case 'stick': {
        const [x, y] = applyDeadzone(activity.x, activity.y, options.deadzone);
        applyDirectional(control.output, x, y);
        break;
      }
      case 'dpad':
        applyDirectional(control.output, activity.x, activity.y);
        break;
      case 'trigger': {
        const axis = control.side === 'left' ? 'lt' : 'rt';
        gamepad[axis] = Math.max(gamepad[axis], activity.value);
        if (activity.value > TRIGGER_BUTTON_THRESHOLD) {
          const button = control.side === 'left' ? 'l2' : 'r2';
          gamepad.buttons |= 1 << GAMEPAD_BUTTON_BITS[button];
        }
        break;
      }
      case 'touchpad':
        break;
    }
  }

  gamepad.hat = hatFromDirections(hat.up, hat.down, hat.left, hat.right);
  return { gamepad, keys: [...keys], mouse: { buttons: mouseButtons } };
}

/** Removes the dead centre and rescales so output still reaches full range. */
export function applyDeadzone(
  x: number,
  y: number,
  deadzone: number,
): [number, number] {
  const magnitude = Math.hypot(x, y);
  if (magnitude <= deadzone || magnitude === 0) {
    return [0, 0];
  }
  const scale =
    Math.min(1, (magnitude - deadzone) / (1 - deadzone)) / magnitude;
  return [x * scale, y * scale];
}

function toDirections(x: number, y: number): Directions {
  return {
    up: y < -DIGITAL_THRESHOLD,
    down: y > DIGITAL_THRESHOLD,
    left: x < -DIGITAL_THRESHOLD,
    right: x > DIGITAL_THRESHOLD,
  };
}
