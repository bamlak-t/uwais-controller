import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../themes/ThemeProvider';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props {
  label: string;
  onPress(): void;
  variant?: Variant;
  /** Larger padding and text for the main action on a screen. */
  large?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function AppButton({
  label,
  onPress,
  variant = 'secondary',
  large = false,
  disabled = false,
  style,
}: Props) {
  const { colors } = useTheme().theme;

  const palette = {
    primary: {
      background: colors.accent,
      text: colors.onAccent,
      border: colors.accent,
    },
    secondary: {
      background: colors.surface,
      text: colors.text,
      border: colors.border,
    },
    ghost: {
      background: 'transparent',
      text: colors.textMuted,
      border: 'transparent',
    },
    danger: {
      background: 'transparent',
      text: colors.danger,
      border: colors.danger,
    },
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        large && styles.large,
        {
          backgroundColor: palette.background,
          borderColor: palette.border,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          large && styles.largeLabel,
          { color: palette.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  large: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  largeLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
});
