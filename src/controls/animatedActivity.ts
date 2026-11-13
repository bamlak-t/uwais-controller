import { useCallback, useRef } from 'react';
import { Animated } from 'react-native';
import { ControlActivity } from '../input/types';

/**
 * A control's live state as animated values. Touch input writes to these
 * directly, so pressing a button or moving a stick never re-renders React.
 */
export interface AnimatedActivity {
  /** 0 or 1. */
  pressed: Animated.Value;
  x: Animated.Value;
  y: Animated.Value;
  value: Animated.Value;
}

function createAnimatedActivity(): AnimatedActivity {
  return {
    pressed: new Animated.Value(0),
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    value: new Animated.Value(0),
  };
}

/** Shared resting state for controls that are only being displayed. */
export const IDLE_ANIMATED_ACTIVITY = createAnimatedActivity();

export interface ActivityRegistry {
  /** The animated state for a control, created on first use. */
  get(controlId: string): AnimatedActivity;
  apply(controlId: string, activity: ControlActivity): void;
}

export function useActivityRegistry(): ActivityRegistry {
  const entries = useRef(new Map<string, AnimatedActivity>()).current;

  const get = useCallback(
    (controlId: string) => {
      let entry = entries.get(controlId);
      if (!entry) {
        entry = createAnimatedActivity();
        entries.set(controlId, entry);
      }
      return entry;
    },
    [entries],
  );

  const apply = useCallback(
    (controlId: string, activity: ControlActivity) => {
      const entry = get(controlId);
      entry.pressed.setValue(activity.pressed ? 1 : 0);
      entry.x.setValue(activity.x);
      entry.y.setValue(activity.y);
      entry.value.setValue(activity.value);
    },
    [get],
  );

  return useRef({ get, apply }).current;
}
