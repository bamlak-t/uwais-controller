import { Animated, StyleSheet, Text } from 'react-native';
import { ButtonControl } from '../layouts/types';
import { bindingLabel, faceButtonColor } from '../themes/glyphs';
import { controlAppearance, labelFontSize } from './appearance';
import { ControlViewProps } from './types';

const SQUARE_RADIUS = 0.22;

export function ButtonView({
  control,
  rect,
  theme,
  activity,
}: ControlViewProps<ButtonControl>) {
  const tint = theme.coloredFaceButtons
    ? faceButtonColor(control.binding, theme.glyphs)
    : undefined;
  const look = controlAppearance(theme, rect.height, tint);
  const label = control.label ?? bindingLabel(control.binding, theme.glyphs);
  const fontSize = labelFontSize(label, rect.width, rect.height);
  const borderRadius =
    control.shape === 'square' ? rect.height * SQUARE_RADIUS : rect.height / 2;

  const scale = activity.pressed.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.94],
  });

  return (
    <Animated.View
      style={[
        styles.fill,
        {
          borderRadius,
          backgroundColor: look.fill,
          borderColor: look.border,
          borderWidth: look.borderWidth,
          transform: [{ scale }],
        },
      ]}
    >
      <Text style={[styles.label, { color: look.ink, fontSize }]}>{label}</Text>
      <Animated.View
        style={[
          styles.fill,
          {
            borderRadius,
            backgroundColor: look.pressedFill,
            opacity: activity.pressed,
          },
        ]}
      >
        <Text style={[styles.label, { color: look.pressedInk, fontSize }]}>
          {label}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '700',
    includeFontPadding: false,
    textAlign: 'center',
  },
});
