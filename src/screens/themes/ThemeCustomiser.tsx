import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { Card } from '../../components/Card';
import { ChipGroup } from '../../components/Chip';
import { StepperRow, ToggleRow } from '../../components/SettingRow';
import { SwatchPicker } from '../../components/SwatchPicker';
import { ACCENT_SWATCHES, BACKGROUND_SWATCHES } from '../../themes/presets';
import { useTheme } from '../../themes/ThemeProvider';
import { ControlStyle, GlyphStyle } from '../../themes/types';

const CONTROL_STYLES: { value: ControlStyle; label: string }[] = [
  { value: 'filled', label: 'Filled' },
  { value: 'outline', label: 'Outline' },
  { value: 'glass', label: 'Glass' },
];

const GLYPH_STYLES: { value: GlyphStyle; label: string }[] = [
  { value: 'xbox', label: 'A B X Y' },
  { value: 'playstation', label: '✕ ○ □ △' },
  { value: 'nintendo', label: 'B A Y X' },
];

/** Tweaks layered on top of the selected theme preset. */
export function ThemeCustomiser() {
  const { theme, selection, setOverrides, resetOverrides } = useTheme();
  const { colors } = theme;
  const hasOverrides = Object.keys(selection.overrides).length > 0;

  return (
    <Card title={`Customise ${theme.name}`} style={styles.card}>
      <ScrollView contentContainerStyle={styles.content}>
        <Option label="Controls">
          <ChipGroup
            options={CONTROL_STYLES}
            value={theme.controlStyle}
            onChange={controlStyle => setOverrides({ controlStyle })}
          />
        </Option>
        <Option label="Button labels">
          <ChipGroup
            options={GLYPH_STYLES}
            value={theme.glyphs}
            onChange={glyphs => setOverrides({ glyphs })}
          />
        </Option>
        <Option label="Accent">
          <SwatchPicker
            colors={ACCENT_SWATCHES}
            value={colors.accent}
            onChange={accent => setOverrides({ accent })}
          />
        </Option>
        <Option label="Background">
          <SwatchPicker
            colors={BACKGROUND_SWATCHES}
            value={colors.background}
            onChange={background => setOverrides({ background })}
          />
        </Option>
        <ToggleRow
          label="Coloured face buttons"
          value={theme.coloredFaceButtons}
          onChange={coloredFaceButtons => setOverrides({ coloredFaceButtons })}
        />
        <StepperRow
          label="Control opacity"
          value={theme.controlOpacity}
          min={0.3}
          max={1}
          step={0.1}
          format={value => `${Math.round(value * 100)}%`}
          onChange={controlOpacity => setOverrides({ controlOpacity })}
        />
        <AppButton
          label="Reset to preset"
          variant="ghost"
          onPress={resetOverrides}
          disabled={!hasOverrides}
        />
      </ScrollView>
    </Card>
  );
}

function Option({ label, children }: { label: string; children: ReactNode }) {
  const { colors } = useTheme().theme;
  return (
    <View style={styles.option}>
      <Text style={[styles.optionLabel, { color: colors.text }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  content: {
    gap: 10,
  },
  option: {
    gap: 5,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});
