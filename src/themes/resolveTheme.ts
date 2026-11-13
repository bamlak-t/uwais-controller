import { contrastOn, ensureReadable, isDark, mix } from './color';
import { DEFAULT_THEME_ID, THEMES } from './presets';
import { Theme, ThemeColors, ThemeSelection } from './types';

export function findTheme(themeId: string): Theme {
  return (
    THEMES.find(theme => theme.id === themeId) ??
    THEMES.find(theme => theme.id === DEFAULT_THEME_ID)!
  );
}

/**
 * Applies the user's overrides to a preset and repairs any colour pairing the
 * overrides made unreadable, so every combination stays usable.
 */
export function resolveTheme(selection: ThemeSelection): Theme {
  const preset = findTheme(selection.themeId);
  const { overrides } = selection;

  const controlStyle = overrides.controlStyle ?? preset.controlStyle;
  let colors: ThemeColors = { ...preset.colors };

  if (overrides.background && overrides.background !== colors.background) {
    colors = rebaseOnBackground(colors, overrides.background);
  }
  if (overrides.accent) {
    colors.accent = overrides.accent;
    colors.onAccent = contrastOn(overrides.accent);
  }

  if (controlStyle === 'filled') {
    // Presets built for outlines use the same colour for fill and label.
    colors.controlLabel = ensureReadable(colors.controlLabel, colors.control);
  } else {
    // Outline and glass controls are drawn straight onto the background.
    colors.controlLabel = ensureReadable(colors.controlLabel, colors.background);
  }

  return {
    ...preset,
    colors,
    controlStyle,
    glyphs: overrides.glyphs ?? preset.glyphs,
    coloredFaceButtons:
      overrides.coloredFaceButtons ?? preset.coloredFaceButtons,
    controlOpacity: overrides.controlOpacity ?? preset.controlOpacity,
  };
}

/** Rebuilds the app chrome around a new background colour. */
function rebaseOnBackground(colors: ThemeColors, background: string): ThemeColors {
  const ink = contrastOn(background);
  const next: ThemeColors = {
    ...colors,
    background,
    surface: mix(background, ink, 0.07),
    border: mix(background, ink, 0.18),
    text: mix(ink, background, 0.05),
    textMuted: mix(ink, background, 0.42),
  };

  // Going from dark to light (or back) also invalidates the control palette.
  if (isDark(background) !== isDark(colors.background)) {
    next.control = mix(background, ink, 0.12);
    next.controlBorder = mix(background, ink, 0.26);
    next.controlLabel = mix(ink, background, 0.08);
  }
  return next;
}
