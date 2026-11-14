import { ComponentRef, useCallback, useEffect, useMemo, useRef } from 'react';
import { GestureResponderEvent, Vibration, View } from 'react-native';
import { useHid } from '../../bluetooth/HidProvider';
import { ActivityRegistry } from '../../controls/animatedActivity';
import { ControllerSession } from '../../input/ControllerSession';
import { Size } from '../../input/geometry';
import { ControllerState } from '../../input/types';
import { Control } from '../../layouts/types';
import { useSettings } from '../../settings/SettingsProvider';

const HAPTIC_MS = 8;

interface Options {
  controls: Control[];
  /** The touch surface's size, or null until it has been measured. */
  size: Size | null;
  activities: ActivityRegistry;
  onState?(state: ControllerState): void;
}

/**
 * Runs a controller session for a layout and returns the touch handlers that
 * feed it. Spread them onto the full-screen surface the layout is drawn in.
 */
export function useControllerSession({
  controls,
  size,
  activities,
  onState,
}: Options) {
  const { transport } = useHid();
  const {
    haptics,
    stickDeadzone,
    mouseSensitivity,
    controllerMode,
  } = useSettings().settings;
  const session = useRef<ControllerSession | null>(null);
  const surface = useRef<ComponentRef<typeof View>>(null);
  /** Window position of the surface; touches arrive in window coordinates. */
  const origin = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!size) {
      return;
    }
    const created = new ControllerSession(
      controls,
      size,
      transport,
      { deadzone: stickDeadzone, mouseSensitivity, controllerMode },
      {
        onActivity: activities.apply,
        onFeedback: haptics ? () => Vibration.vibrate(HAPTIC_MS) : undefined,
        onState,
      },
    );
    session.current = created;
    return () => {
      created.dispose();
      session.current = null;
    };
  }, [
    controls,
    size,
    transport,
    stickDeadzone,
    mouseSensitivity,
    controllerMode,
    haptics,
    activities,
    onState,
  ]);

  const measure = useCallback(() => {
    surface.current?.measureInWindow((x, y) => {
      origin.current = { x, y };
    });
  }, []);

  /** Lets go of every control, e.g. when a menu opens over the surface. */
  const releaseAll = useCallback(() => session.current?.cancel(), []);

  const touchHandlers = useMemo(() => {
    const forEachTouch = (
      event: GestureResponderEvent,
      handle: (id: number, x: number, y: number) => void,
    ) => {
      for (const touch of event.nativeEvent.changedTouches) {
        handle(
          Number(touch.identifier),
          touch.pageX - origin.current.x,
          touch.pageY - origin.current.y,
        );
      }
    };

    return {
      onTouchStart: (event: GestureResponderEvent) =>
        forEachTouch(event, (id, x, y) =>
          session.current?.touchStart(id, x, y, event.nativeEvent.timestamp),
        ),
      onTouchMove: (event: GestureResponderEvent) =>
        forEachTouch(event, (id, x, y) => session.current?.touchMove(id, x, y)),
      onTouchEnd: (event: GestureResponderEvent) =>
        forEachTouch(event, id =>
          session.current?.touchEnd(id, event.nativeEvent.timestamp),
        ),
      onTouchCancel: () => session.current?.cancel(),
    };
  }, []);

  return { surface, measure, touchHandlers, releaseAll };
}
