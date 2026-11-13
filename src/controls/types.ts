import { Rect } from '../input/geometry';
import { Control } from '../layouts/types';
import { Theme } from '../themes/types';
import { AnimatedActivity } from './animatedActivity';

/** Props shared by every control renderer. Each fills its parent frame. */
export interface ControlViewProps<T extends Control = Control> {
  control: T;
  /** The frame the control is drawn in, for sizing strokes and text. */
  rect: Rect;
  theme: Theme;
  activity: AnimatedActivity;
}
