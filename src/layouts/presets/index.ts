import { Layout } from '../types';
import {
  arcadeStick,
  leverless,
  offsetSticks,
  racing,
  retroPad,
  shooter,
  symmetricSticks,
} from './gamepads';
import { fullKeyboard, keyboardAndMouse } from './keyboards';

export const PRESET_LAYOUTS: Layout[] = [
  offsetSticks,
  symmetricSticks,
  retroPad,
  shooter,
  racing,
  arcadeStick,
  leverless,
  keyboardAndMouse,
  fullKeyboard,
];

export const DEFAULT_LAYOUT_ID = offsetSticks.id;
