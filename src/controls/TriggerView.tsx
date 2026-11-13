import { Animated, StyleSheet, Text, View } from 'react-native';
import { TriggerControl } from '../layouts/types';
import { gamepadButtonLabel } from '../themes/glyphs';
import { controlAppearance, labelFontSize } from './appearance';
import { ControlViewProps } from './types';

/** An analog trigger that fills from the bottom as it is squeezed. */
export function TriggerView({
  control,
  rect,
  theme,
  activity,
}: ControlViewProps<TriggerControl>) {
  const look = controlAppearance(theme, rect.width);
  const label = gamepadButtonLabel(
    control.side === 'left' ? 'l2' : 'r2',
    theme.glyphs,
  );
  const side = Math.min(rect.width, rect.height);
  const fontSize = labelFontSize(label, side, side);
  const borderRadius = side * 0.22;

  const level = activity.value.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View
      style={[
        styles.fill,
        {
          borderRadius,
          backgroundColor: look.fill,
          borderColor: look.border,
          borderWidth: look.borderWidth,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.level,
          { height: level, backgroundColor: look.pressedFill },
        ]}
      />
      <Text style={[styles.label, { color: look.ink, fontSize }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  level: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.85,
  },
  label: {
    fontWeight: '700',
    includeFontPadding: false,
  },
});
