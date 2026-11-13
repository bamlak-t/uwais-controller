import { Layout } from '../types';
import {
  center,
  dpad,
  faceDiamond,
  left,
  menuRow,
  pad,
  right,
  shoulderRow,
  stick,
  stickClicks,
  trigger,
  vewlixButtons,
} from './builders';

/** Xbox-style: the left stick takes the prime thumb position, d-pad below. */
export const offsetSticks: Layout = {
  id: 'preset-offset-sticks',
  name: 'Offset sticks',
  description: 'Xbox-style pad with the left stick up top',
  preset: true,
  controls: [
    ...shoulderRow(),
    ...menuRow(),
    stick('leftStick', left(0.38, 0.47, 0.36)),
    dpad('hat', left(0.8, 0.79, 0.3)),
    ...faceDiamond(0.38, 0.47, 0.15, 0.15),
    stick('rightStick', right(0.8, 0.79, 0.3)),
    ...stickClicks(0.5),
  ],
};

/** PlayStation-style: d-pad up top, both sticks side by side below. */
export const symmetricSticks: Layout = {
  id: 'preset-symmetric-sticks',
  name: 'Symmetric sticks',
  description: 'PlayStation-style pad with both sticks low',
  preset: true,
  controls: [
    ...shoulderRow(),
    ...menuRow(),
    dpad('hat', left(0.36, 0.47, 0.32)),
    stick('leftStick', left(0.8, 0.79, 0.3)),
    ...faceDiamond(0.36, 0.47, 0.15, 0.15),
    stick('rightStick', right(0.8, 0.79, 0.3)),
    ...stickClicks(0.5),
  ],
};

/** SNES-style: a big d-pad, four face buttons and two shoulders. */
export const retroPad: Layout = {
  id: 'preset-retro-pad',
  name: 'Retro pad',
  description: 'Big d-pad and four buttons for 2D classics',
  preset: true,
  controls: [
    pad('l1', left(0.3, 0.11, 0.12), { shape: 'pill', aspect: 2.6 }),
    pad('r1', right(0.3, 0.11, 0.12), { shape: 'pill', aspect: 2.6 }),
    dpad('hat', left(0.42, 0.58, 0.46)),
    ...faceDiamond(0.42, 0.58, 0.17, 0.17),
    pad('select', center(-0.13, 0.86, 0.08), { shape: 'pill', aspect: 2.2 }),
    pad('start', center(0.13, 0.86, 0.08), { shape: 'pill', aspect: 2.2 }),
  ],
};

/** Fight stick: a lever on the left and the eight-button Vewlix panel. */
export const arcadeStick: Layout = {
  id: 'preset-arcade-stick',
  name: 'Arcade stick',
  description: 'Lever and eight buttons for fighting games',
  preset: true,
  controls: [
    ...menuRow(),
    stick('hat', left(0.45, 0.58, 0.46)),
    ...vewlixButtons(),
  ],
};

/**
 * Hit Box-style: every direction is a button, with up under the thumb.
 * Opposing directions are cleaned in resolveState the way tournaments expect.
 */
export const leverless: Layout = {
  id: 'preset-leverless',
  name: 'Leverless',
  description: 'All-button fight pad with up under the thumb',
  preset: true,
  controls: [
    ...menuRow(),
    pad('dpadLeft', left(0.2, 0.4, 0.21)),
    pad('dpadDown', left(0.45, 0.38, 0.21)),
    pad('dpadRight', left(0.7, 0.44, 0.21)),
    pad('dpadUp', left(0.78, 0.8, 0.23)),
    ...vewlixButtons(),
  ],
};

/** Steering on the left, analog brake and throttle pedals on the right. */
export const racing: Layout = {
  id: 'preset-racing',
  name: 'Racing',
  description: 'Steering stick with analog brake and throttle',
  preset: true,
  controls: [
    ...menuRow(false),
    pad('l1', left(0.3, 0.11, 0.12), { shape: 'pill', aspect: 2.4 }),
    pad('r1', right(0.3, 0.11, 0.12), { shape: 'pill', aspect: 2.4 }),
    stick('leftStick', left(0.42, 0.6, 0.42)),
    pad('north', center(0, 0.36, 0.13)),
    pad('west', center(0, 0.52, 0.13)),
    pad('east', center(0, 0.68, 0.13)),
    pad('south', center(0, 0.84, 0.13)),
    trigger('left', right(0.74, 0.6, 0.62), 0.36),
    trigger('right', right(0.3, 0.6, 0.62), 0.36),
  ],
};

/** Twin sticks with fire, aim and jump clustered around the right thumb. */
export const shooter: Layout = {
  id: 'preset-shooter',
  name: 'Shooter',
  description: 'Twin sticks with fire and aim under the thumbs',
  preset: true,
  controls: [
    ...menuRow(false),
    pad('l2', left(0.24, 0.22, 0.17)),
    pad('l1', left(0.56, 0.16, 0.14)),
    dpad('hat', left(0.82, 0.3, 0.22)),
    stick('leftStick', left(0.42, 0.66, 0.38)),
    pad('r1', right(0.22, 0.24, 0.15)),
    pad('r2', right(0.22, 0.52, 0.2)),
    pad('south', right(0.24, 0.82, 0.16)),
    pad('north', right(0.46, 0.3, 0.14)),
    pad('west', right(0.72, 0.36, 0.14)),
    pad('east', right(0.98, 0.46, 0.14)),
    stick('rightStick', right(0.66, 0.7, 0.34)),
    ...stickClicks(0.88, 0.12),
  ],
};
