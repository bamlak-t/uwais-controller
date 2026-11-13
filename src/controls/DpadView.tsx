import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { DpadControl } from '../layouts/types';
import { Appearance, controlAppearance } from './appearance';
import { ControlViewProps } from './types';

/** Arm thickness relative to the whole d-pad. */
const ARM_WIDTH = 0.36;
/** Gap between each arm and the centre, relative to the whole d-pad. */
const ARM_GAP = 0.02;

/** Diameter of the centre hub relative to the arm thickness. */
const HUB_SIZE = 0.6;

type Direction = 'up' | 'down' | 'left' | 'right';

const ARROW_ROTATION: Record<Direction, string> = {
  up: '0deg',
  right: '90deg',
  down: '180deg',
  left: '270deg',
};

/** A segmented d-pad: four arms that light up individually. */
export function DpadView({
  rect,
  theme,
  activity,
}: ControlViewProps<DpadControl>) {
  const look = controlAppearance(theme, rect.height);
  const size = rect.width;
  const arm = size * ARM_WIDTH;
  const length = (size - arm) / 2 - size * ARM_GAP;
  const inset = (size - arm) / 2;

  // Each arm is lit while the vector points its way; diagonals light two.
  const towards = (axis: Animated.Value, sign: 1 | -1) =>
    axis.interpolate({
      inputRange: sign === 1 ? [0, 1] : [-1, 0],
      outputRange: sign === 1 ? [0, 1] : [1, 0],
      extrapolate: 'clamp',
    });

  const arms: {
    direction: Direction;
    frame: ViewStyle;
    lit: Animated.AnimatedNode;
  }[] = [
    {
      direction: 'up',
      frame: { left: inset, top: 0, width: arm, height: length },
      lit: towards(activity.y, -1),
    },
    {
      direction: 'down',
      frame: { left: inset, bottom: 0, width: arm, height: length },
      lit: towards(activity.y, 1),
    },
    {
      direction: 'left',
      frame: { top: inset, left: 0, width: length, height: arm },
      lit: towards(activity.x, -1),
    },
    {
      direction: 'right',
      frame: { top: inset, right: 0, width: length, height: arm },
      lit: towards(activity.x, 1),
    },
  ];

  return (
    <View style={StyleSheet.absoluteFill}>
      {arms.map(({ direction, frame, lit }) => (
        <View
          key={direction}
          style={[
            styles.arm,
            frame,
            {
              borderRadius: size * 0.07,
              backgroundColor: look.fill,
              borderColor: look.border,
              borderWidth: look.borderWidth,
            },
          ]}
        >
          <Arrow direction={direction} size={arm * 0.2} color={look.ink} />
          <Animated.View
            style={[
              styles.arm,
              styles.lit,
              {
                borderRadius: size * 0.07,
                backgroundColor: look.pressedFill,
                opacity: lit,
              },
            ]}
          >
            <Arrow
              direction={direction}
              size={arm * 0.2}
              color={look.pressedInk}
            />
          </Animated.View>
        </View>
      ))}
      <View
        style={[
          styles.hub,
          hubFrame(size, arm * HUB_SIZE),
          { backgroundColor: hubColor(look) },
        ]}
      />
    </View>
  );
}

/** A triangle drawn with borders, pointing up before rotation. */
function Arrow({
  direction,
  size,
  color,
}: {
  direction: Direction;
  size: number;
  color: string;
}) {
  return (
    <View
      style={{
        width: 0,
        height: 0,
        borderLeftWidth: size,
        borderRightWidth: size,
        borderBottomWidth: size * 1.3,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: color,
        transform: [{ rotate: ARROW_ROTATION[direction] }],
      }}
    />
  );
}

function hubFrame(size: number, hub: number): ViewStyle {
  const offset = (size - hub) / 2;
  return {
    left: offset,
    top: offset,
    width: hub,
    height: hub,
    borderRadius: hub / 2,
  };
}

function hubColor(look: Appearance): string {
  return look.fill === 'transparent' ? look.border : look.fill;
}

const styles = StyleSheet.create({
  arm: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lit: {
    ...StyleSheet.absoluteFill,
  },
  hub: {
    position: 'absolute',
  },
});
