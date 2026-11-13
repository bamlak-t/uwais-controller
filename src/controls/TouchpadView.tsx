import { Animated, StyleSheet, Text, View } from 'react-native';
import { TouchpadControl } from '../layouts/types';
import { withAlpha } from '../themes/color';
import { controlAppearance } from './appearance';
import { ControlViewProps } from './types';

export function TouchpadView({
  rect,
  theme,
  activity,
}: ControlViewProps<TouchpadControl>) {
  const look = controlAppearance(theme, rect.height * 0.3);
  const borderRadius = rect.height * 0.06;

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
      <Text
        style={[
          styles.hint,
          { color: withAlpha(look.ink, 0.4), fontSize: rect.height * 0.055 },
        ]}
      >
        TRACKPAD
      </Text>
      <Animated.View
        style={[
          styles.fill,
          {
            borderRadius,
            borderColor: look.pressedFill,
            borderWidth: look.borderWidth * 1.5,
            opacity: activity.pressed,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontWeight: '600',
    letterSpacing: 2,
    includeFontPadding: false,
  },
});
