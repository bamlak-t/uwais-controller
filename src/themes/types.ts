/** How controls are drawn on top of the background. */
export type ControlStyle = 'filled' | 'outline' | 'glass';

/** Which console family the button labels and face colours imitate. */
export type GlyphStyle = 'xbox' | 'playstation' | 'nintendo';

export interface ThemeColors {
  background: string;
  /** Cards, sheets and other raised app chrome. */
  surface: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  /** Text and icons drawn on top of the accent colour. */
  onAccent: string;
  /** Resting fill of on-screen controls. */
  control: string;
  controlBorder: string;
  controlLabel: string;
  danger: string;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
  controlStyle: ControlStyle;
  glyphs: GlyphStyle;
  /** Tints A/B/X/Y (or their equivalents) in their console colours. */
  coloredFaceButtons: boolean;
  /** Opacity of controls at rest, 0..1. */
  controlOpacity: number;
}

/** The parts of a theme the user can tweak without leaving the preset. */
export interface ThemeOverrides {
  accent?: string;
  background?: string;
  controlStyle?: ControlStyle;
  glyphs?: GlyphStyle;
  coloredFaceButtons?: boolean;
  controlOpacity?: number;
}

export interface ThemeSelection {
  themeId: string;
  overrides: ThemeOverrides;
}
