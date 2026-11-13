import { GamepadButton } from '../../hid/gamepad';
import { MouseButton } from '../../hid/mouse';
import {
  ButtonControl,
  ButtonShape,
  ControlPosition,
  DirectionalOutput,
  DpadControl,
  StickControl,
  TouchpadControl,
  TriggerControl,
} from '../types';

type Anchor = ControlPosition['anchor'];

interface Placement {
  anchor: Anchor;
  x: number;
  y: number;
  size: number;
}

interface ButtonLook {
  shape?: ButtonShape;
  aspect?: number;
}

const place = (
  anchor: Anchor,
  x: number,
  y: number,
  size: number,
): Placement => ({
  anchor,
  x,
  y,
  size,
});

export const left = (x: number, y: number, size: number) =>
  place('left', x, y, size);
export const right = (x: number, y: number, size: number) =>
  place('right', x, y, size);
export const center = (x: number, y: number, size: number) =>
  place('center', x, y, size);

export function pad(
  button: GamepadButton,
  at: Placement,
  look: ButtonLook = {},
): ButtonControl {
  return {
    id: button,
    kind: 'button',
    binding: { type: 'gamepad', button },
    shape: look.shape ?? 'circle',
    aspect: look.aspect ?? 1,
    ...at,
  };
}

export function key(
  usage: number,
  at: Placement,
  look: ButtonLook = {},
): ButtonControl {
  return {
    id: `key-${usage}`,
    kind: 'button',
    binding: { type: 'key', usage },
    shape: look.shape ?? 'square',
    aspect: look.aspect ?? 1,
    ...at,
  };
}

export function mouse(
  button: MouseButton,
  at: Placement,
  look: ButtonLook = {},
): ButtonControl {
  return {
    id: `mouse-${button}`,
    kind: 'button',
    binding: { type: 'mouse', button },
    shape: look.shape ?? 'pill',
    aspect: look.aspect ?? 2,
    ...at,
  };
}

export function stick(output: DirectionalOutput, at: Placement): StickControl {
  return { id: `stick-${output}`, kind: 'stick', output, ...at };
}

export function dpad(output: DirectionalOutput, at: Placement): DpadControl {
  return { id: `dpad-${output}`, kind: 'dpad', output, ...at };
}

export function trigger(
  side: 'left' | 'right',
  at: Placement,
  aspect: number,
): TriggerControl {
  return { id: `trigger-${side}`, kind: 'trigger', side, aspect, ...at };
}

export function touchpad(at: Placement, aspect: number): TouchpadControl {
  return { id: 'touchpad', kind: 'touchpad', aspect, ...at };
}

/** The four face buttons in the classic diamond, on the right-hand side. */
export function faceDiamond(
  x: number,
  y: number,
  spread: number,
  size: number,
): ButtonControl[] {
  return [
    pad('south', right(x, y + spread, size)),
    pad('east', right(x - spread, y, size)),
    pad('west', right(x + spread, y, size)),
    pad('north', right(x, y - spread, size)),
  ];
}

const SHOULDER = { shape: 'pill', aspect: 2.2 } as const;

/** L2 L1 … R1 R2 along the top edge, within reach of the thumbs. */
export function shoulderRow(): ButtonControl[] {
  return [
    pad('l2', left(0.17, 0.1, 0.11), SHOULDER),
    pad('l1', left(0.45, 0.1, 0.11), SHOULDER),
    pad('r1', right(0.45, 0.1, 0.11), SHOULDER),
    pad('r2', right(0.17, 0.1, 0.11), SHOULDER),
  ];
}

const MENU = { shape: 'pill', aspect: 1.9 } as const;

/** Select and start flank the app's own menu button at the top centre. */
export function menuRow(withHome = true): ButtonControl[] {
  const buttons = [
    pad('select', center(-0.24, 0.09, 0.085), MENU),
    pad('start', center(0.24, 0.09, 0.085), MENU),
  ];
  if (withHome) {
    buttons.push(pad('home', center(0, 0.24, 0.085), MENU));
  }
  return buttons;
}

/** Thumb-click buttons, since a touch stick cannot be pressed in. */
export function stickClicks(y: number, size = 0.11): ButtonControl[] {
  return [pad('l3', center(-0.1, y, size)), pad('r3', center(0.1, y, size))];
}

/**
 * Eight buttons in two rows with the first column dropped, after the Vewlix
 * arcade cabinet panel that most modern fight sticks copy.
 */
export function vewlixButtons(): ButtonControl[] {
  const columns = [0.97, 0.73, 0.49, 0.25];
  const top: GamepadButton[] = ['west', 'north', 'r1', 'l1'];
  const bottom: GamepadButton[] = ['south', 'east', 'r2', 'l2'];
  const size = 0.2;
  const drop = (column: number) => (column === 0 ? 0.08 : 0);

  return columns.flatMap((x, column) => [
    pad(top[column], right(x, 0.36 + drop(column), size)),
    pad(bottom[column], right(x, 0.64 + drop(column), size)),
  ]);
}
