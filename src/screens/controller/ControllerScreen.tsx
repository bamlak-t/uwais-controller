import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  BackHandler,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useHid } from '../../bluetooth/HidProvider';
import { useActivityRegistry } from '../../controls/animatedActivity';
import { LayoutCanvas } from '../../controls/LayoutCanvas';
import { Size } from '../../input/geometry';
import { ControllerState } from '../../input/types';
import { useLayouts } from '../../layouts/LayoutsProvider';
import { useEditableLayout } from '../../layouts/useEditableLayout';
import { ScreenProps } from '../../navigation/types';
import { useSettings } from '../../settings/SettingsProvider';
import { withAlpha } from '../../themes/color';
import { useTheme } from '../../themes/ThemeProvider';
import { ControllerMenu } from './ControllerMenu';
import { InputMonitor } from './InputMonitor';
import { useControllerSession } from './useControllerSession';

const CONNECTED_COLOR = '#3CCB7F';

export function ControllerScreen({ navigation }: ScreenProps<'Controller'>) {
  const { theme } = useTheme();
  const { activeLayout } = useLayouts();
  const { status } = useHid();
  const { showInputMonitor } = useSettings().settings;
  const toEditable = useEditableLayout();

  const [size, setSize] = useState<Size | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [monitored, setMonitored] = useState<ControllerState | null>(null);
  const activities = useActivityRegistry();

  const { surface, measure, touchHandlers, releaseAll } = useControllerSession({
    controls: activeLayout.controls,
    size,
    activities,
    onState: showInputMonitor ? setMonitored : undefined,
  });

  const openMenu = useCallback(() => {
    releaseAll();
    setMenuOpen(true);
  }, [releaseAll]);

  // A stray back gesture mid-game should pause, not quit.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          openMenu();
          return true;
        },
      );
      return () => subscription.remove();
    }, [openMenu]),
  );

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize(previous =>
      previous?.width === width && previous.height === height
        ? previous
        : { width, height },
    );
    measure();
  };

  const editLayout = () => {
    setMenuOpen(false);
    navigation.navigate('LayoutEditor', {
      layoutId: toEditable(activeLayout).id,
    });
  };

  const connected = status.connection === 'connected';
  const { colors } = theme;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View
        ref={surface}
        style={StyleSheet.absoluteFill}
        collapsable={false}
        onLayout={onLayout}
        {...touchHandlers}
      >
        {size && (
          <LayoutCanvas
            controls={activeLayout.controls}
            size={size}
            theme={theme}
            activities={activities}
          />
        )}
      </View>

      <Pressable
        onPress={openMenu}
        hitSlop={6}
        style={[
          styles.menuButton,
          {
            backgroundColor: withAlpha(colors.text, 0.08),
            borderColor: withAlpha(colors.text, 0.25),
          },
        ]}
      >
        <View
          style={[
            styles.dot,
            { backgroundColor: connected ? CONNECTED_COLOR : colors.textMuted },
          ]}
        />
        <Text style={[styles.menuLabel, { color: colors.text }]}>PAUSE</Text>
      </Pressable>

      {showInputMonitor && <InputMonitor state={monitored} />}

      {menuOpen && (
        <ControllerMenu
          onResume={() => setMenuOpen(false)}
          onEdit={editLayout}
          onExit={() => navigation.goBack()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  menuButton: {
    position: 'absolute',
    top: 6,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  menuLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
