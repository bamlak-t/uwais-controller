import { ReactNode } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useTheme } from '../themes/ThemeProvider';
import { AppButton } from './AppButton';

interface RowProps {
  label: string;
  description?: string;
  children: ReactNode;
}

/** A labelled setting with its control on the right. */
export function SettingRow({ label, description, children }: RowProps) {
  const { colors } = useTheme().theme;

  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        {description && (
          <Text style={[styles.description, { color: colors.textMuted }]}>
            {description}
          </Text>
        )}
      </View>
      {children}
    </View>
  );
}

interface ToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onChange(value: boolean): void;
}

export function ToggleRow({
  label,
  description,
  value,
  onChange,
}: ToggleProps) {
  const { colors } = useTheme().theme;

  return (
    <SettingRow label={label} description={description}>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.accent, false: colors.border }}
        thumbColor={colors.text}
      />
    </SettingRow>
  );
}

interface StepperProps {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  /** Turns the number into what is shown between the buttons. */
  format(value: number): string;
  onChange(value: number): void;
}

export function StepperRow({
  label,
  description,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: StepperProps) {
  const { colors } = useTheme().theme;
  // Round away the float drift that repeated stepping accumulates.
  const move = (direction: 1 | -1) => {
    const next = Math.round((value + direction * step) / step) * step;
    onChange(Math.min(max, Math.max(min, Number(next.toFixed(4)))));
  };

  return (
    <SettingRow label={label} description={description}>
      <View style={styles.stepper}>
        <AppButton label="−" onPress={() => move(-1)} disabled={value <= min} />
        <Text style={[styles.value, { color: colors.text }]}>
          {format(value)}
        </Text>
        <AppButton label="+" onPress={() => move(1)} disabled={value >= max} />
      </View>
    </SettingRow>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 40,
  },
  text: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    fontSize: 12,
    marginTop: 1,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  value: {
    minWidth: 48,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
});
