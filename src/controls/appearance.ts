import { contrastOn, withAlpha } from '../themes/color';
import { Theme } from '../themes/types';

/** Resolved colours for drawing one control in the current theme. */
export interface Appearance {
  fill: string;
  border: string;
  borderWidth: number;
  /** Labels, arrows and other marks drawn on the control. */
  ink: string;
  pressedFill: string;
  pressedInk: string;
}

/**
 * @param tint optional signature colour, e.g. a face button's console colour
 * @param height control height in pixels, used to keep strokes proportional
 */
export function controlAppearance(
  theme: Theme,
  height: number,
  tint?: string,
): Appearance {
  const { colors } = theme;
  const ink = tint ?? colors.controlLabel;
  const pressedFill = tint ?? colors.accent;
  const stroke = Math.min(2, Math.max(0.75, height * 0.025));
  const pressed = { pressedFill, pressedInk: contrastOn(pressedFill) };

  switch (theme.controlStyle) {
    case 'filled':
      return {
        fill: colors.control,
        border: colors.controlBorder,
        borderWidth: stroke,
        ink,
        ...pressed,
      };
    case 'outline':
      return {
        fill: 'transparent',
        border: ink,
        borderWidth: stroke * 1.25,
        ink,
        ...pressed,
      };
    case 'glass':
      return {
        fill: withAlpha(ink, 0.14),
        border: withAlpha(ink, 0.4),
        borderWidth: stroke,
        ink,
        ...pressed,
      };
  }
}

/** Largest font size that keeps a label inside its control. */
export function labelFontSize(label: string, width: number, height: number): number {
  if (label.length <= 1) {
    return height * 0.46;
  }
  const widthPerEm = 0.64;
  const fitWidth = (width * 0.78) / (label.length * widthPerEm);
  return Math.min(height * 0.36, fitWidth);
}
