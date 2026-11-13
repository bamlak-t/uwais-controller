import { Animated, StyleSheet, Text } from 'react-native';
import { DirectionalOutput, StickControl } from '../layouts/types';
import { contrastOn, withAlpha } from '../themes/color';
import { controlAppearance } from './appearance';
import { ControlViewProps } from './types';

/** Knob diameter relative to the base. */
const KNOB_SIZE = 0.46;
/**
 * How far the knob travels relative to the base radius. Matches STICK_TRAVEL
 * in input/TouchRouter.ts so the knob stays under the thumb.
 */
const KNOB_TRAVEL = 0.7;

const KNOB_LABELS: Partial<Record<DirectionalOutput, string>> = {
  leftStick: 'L',
  rightStick: 'R',
};

export function StickView({
  control,
  rect,
  theme,
  activity,
}: ControlViewProps<StickControl>) {
  const look = controlAppearance(theme, rect.height);
  const knob = rect.width * KNOB_SIZE;
  const travel = (rect.width / 2) * KNOB_TRAVEL;
  const label = KNOB_LABELS[control.output];

  const knobStyle = {
    width: knob,
    height: knob,
    borderRadius: knob / 2,
    transform: [
      { translateX: Animated.multiply(activity.x, travel) },
      { translateY: Animated.multiply(activity.y, travel) },
    ],
  };

  return (
    <Animated.View
      style={[
        styles.base,
        {
          borderRadius: rect.width / 2,
          backgroundColor: look.fill,
          borderColor: look.border,
          borderWidth: look.borderWidth,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.knob,
          knobStyle,
          { backgroundColor: withAlpha(look.ink, 0.88) },
        ]}
      >
        <Animated.View
          style={[
            styles.knobOverlay,
            {
              borderRadius: knob / 2,
              backgroundColor: look.pressedFill,
              opacity: activity.pressed,
            },
          ]}
        />
        {label && (
          <Text
            style={[
              styles.label,
              { color: contrastOn(look.ink), fontSize: knob * 0.36 },
            ]}
          >
            {label}
          </Text>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  knob: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  knobOverlay: {
    ...StyleSheet.absoluteFill,
  },
  label: {
    fontWeight: '700',
    includeFontPadding: false,
    opacity: 0.7,
  },
});
