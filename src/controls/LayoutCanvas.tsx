import { memo, useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Rect, Size, controlRect } from '../input/geometry';
import { Control } from '../layouts/types';
import { Theme } from '../themes/types';
import {
  ActivityRegistry,
  IDLE_ANIMATED_ACTIVITY,
} from './animatedActivity';
import { ControlView } from './ControlView';

interface Props {
  controls: Control[];
  /** The area the layout is drawn into; controls scale with it. */
  size: Size;
  theme: Theme;
  /** Live control state. Omit to draw the layout at rest, e.g. in previews. */
  activities?: ActivityRegistry;
}

export function frameStyle(rect: Rect): ViewStyle {
  return {
    position: 'absolute',
    left: rect.cx - rect.width / 2,
    top: rect.cy - rect.height / 2,
    width: rect.width,
    height: rect.height,
  };
}

/** Draws every control of a layout. Purely visual: it never handles touches. */
export const LayoutCanvas = memo(function LayoutCanvas({
  controls,
  size,
  theme,
  activities,
}: Props) {
  const frames = useMemo(
    () => controls.map(control => ({ control, rect: controlRect(control, size) })),
    [controls, size],
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {frames.map(({ control, rect }) => (
        <View
          key={control.id}
          style={[frameStyle(rect), { opacity: theme.controlOpacity }]}
        >
          <ControlView
            control={control}
            rect={rect}
            theme={theme}
            activity={activities?.get(control.id) ?? IDLE_ANIMATED_ACTIVITY}
          />
        </View>
      ))}
    </View>
  );
});
