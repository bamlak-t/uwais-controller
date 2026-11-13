import { useEffect, useLayoutEffect, useRef } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';
import { IDLE_ANIMATED_ACTIVITY } from '../../controls/animatedActivity';
import { ControlView } from '../../controls/ControlView';
import { frameStyle } from '../../controls/LayoutCanvas';
import { Rect } from '../../input/geometry';
import { Control } from '../../layouts/types';
import { Theme } from '../../themes/types';

/** Finger travel below this is a tap to select, not a drag. */
const DRAG_THRESHOLD = 3;
const SELECTION_MARGIN = 5;

interface Props {
  control: Control;
  rect: Rect;
  theme: Theme;
  selected: boolean;
  onSelect(): void;
  /** Called with the control's new centre when a drag ends. */
  onMove(cx: number, cy: number): void;
}

/** A control in the editor: tap to select it, drag to reposition it. */
export function DraggableControl({
  control,
  rect,
  theme,
  selected,
  onSelect,
  onMove,
}: Props) {
  const offset = useRef(new Animated.ValueXY()).current;
  // The responder is created once, so it reads the latest props from here.
  const latest = useRef({ rect, onSelect, onMove });
  useEffect(() => {
    latest.current = { rect, onSelect, onMove };
  });

  // Once the layout holds the new position the drag offset is redundant.
  useLayoutEffect(() => {
    offset.setValue({ x: 0, y: 0 });
  }, [control, offset]);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => latest.current.onSelect(),
      onPanResponderMove: (_, gesture) =>
        offset.setValue({ x: gesture.dx, y: gesture.dy }),
      onPanResponderRelease: (_, gesture) => {
        if (Math.hypot(gesture.dx, gesture.dy) < DRAG_THRESHOLD) {
          offset.setValue({ x: 0, y: 0 });
          return;
        }
        const { cx, cy } = latest.current.rect;
        latest.current.onMove(cx + gesture.dx, cy + gesture.dy);
      },
      onPanResponderTerminate: () => offset.setValue({ x: 0, y: 0 }),
    }),
  ).current;

  return (
    <Animated.View
      {...responder.panHandlers}
      style={[
        frameStyle(rect),
        { transform: offset.getTranslateTransform() },
        selected && styles.raised,
      ]}
    >
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <ControlView
          control={control}
          rect={rect}
          theme={theme}
          activity={IDLE_ANIMATED_ACTIVITY}
        />
      </View>
      {selected && (
        <View
          pointerEvents="none"
          style={[styles.selection, { borderColor: theme.colors.accent }]}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  raised: {
    zIndex: 1,
  },
  selection: {
    position: 'absolute',
    top: -SELECTION_MARGIN,
    left: -SELECTION_MARGIN,
    right: -SELECTION_MARGIN,
    bottom: -SELECTION_MARGIN,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
});
