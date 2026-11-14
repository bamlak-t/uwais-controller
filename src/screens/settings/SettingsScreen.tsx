import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { Card } from '../../components/Card';
import { Screen } from '../../components/Screen';
import { SettingRow, StepperRow, ToggleRow } from '../../components/SettingRow';
import { ScreenProps } from '../../navigation/types';
import { useSettings } from '../../settings/SettingsProvider';
import { useTheme } from '../../themes/ThemeProvider';

const PAIRING_STEPS = [
  'Tap "Pair new device" on the home screen to make this phone visible.',
  'On the computer, add a Bluetooth device and choose this phone.',
  'Accept the pairing request on both sides. The computer now sees your controller.',
  'Next time, just tap the computer under "Paired devices".',
];

const TROUBLESHOOTING = [
  'In Xbox (BLE) mode, Windows natively recognizes an Xbox Wireless Controller via XInput, giving full analog support and Player 1-4 multiplayer in all PC games without third-party software.',
  'Classic mode provides a combo Gamepad + Keyboard + Mouse, best for custom desktop keybinds, media control, or non-XInput setups.',
  'Paired before switching modes? Unpair/remove the phone in your computer Bluetooth settings and pair again so the OS binds the new profile.',
  'Game consoles only accept their own controllers and will not connect.',
];

export function SettingsScreen({ navigation }: ScreenProps<'Settings'>) {
  const { settings, updateSettings } = useSettings();

  return (
    <Screen title="Settings" onBack={navigation.goBack}>
      <View style={styles.columns}>
        <ScrollView
          style={styles.column}
          contentContainerStyle={styles.content}
        >
          <Card title="Emulation Mode">
            <SettingRow
              label="Device Type"
              description={
                settings.controllerMode === 'xbox_ble'
                  ? 'Xbox Series X|S (BLE) · Native XInput on Windows with zero mapping'
                  : 'Classic HID · Gamepad + Keyboard + Mouse combo'
              }
            >
              <View style={styles.modeButtons}>
                <AppButton
                  label="Classic"
                  variant={
                    settings.controllerMode === 'classic'
                      ? 'primary'
                      : 'secondary'
                  }
                  onPress={() => updateSettings({ controllerMode: 'classic' })}
                />
                <AppButton
                  label="Xbox (BLE)"
                  variant={
                    settings.controllerMode === 'xbox_ble'
                      ? 'primary'
                      : 'secondary'
                  }
                  onPress={() => updateSettings({ controllerMode: 'xbox_ble' })}
                />
              </View>
            </SettingRow>
          </Card>

          <Card title="Feel">
            <ToggleRow
              label="Haptic feedback"
              description="Vibrate briefly on every press"
              value={settings.haptics}
              onChange={haptics => updateSettings({ haptics })}
            />
            <StepperRow
              label="Stick deadzone"
              description="Ignore tiny movements around the centre"
              value={settings.stickDeadzone}
              min={0}
              max={0.3}
              step={0.02}
              format={value => `${Math.round(value * 100)}%`}
              onChange={stickDeadzone => updateSettings({ stickDeadzone })}
            />
            <StepperRow
              label="Pointer speed"
              description="How far the mouse moves on a trackpad"
              value={settings.mouseSensitivity}
              min={0.4}
              max={3}
              step={0.2}
              format={value => `${value.toFixed(1)}×`}
              onChange={mouseSensitivity =>
                updateSettings({ mouseSensitivity })
              }
            />
          </Card>

          <Card title="Connection">
            <ToggleRow
              label="Reconnect automatically"
              description="Connect to the last device when the app opens"
              value={settings.autoReconnect}
              onChange={autoReconnect => updateSettings({ autoReconnect })}
            />
            <ToggleRow
              label="Demo mode"
              description="Simulate a connection without using Bluetooth"
              value={settings.demoMode}
              onChange={demoMode => updateSettings({ demoMode })}
            />
            <ToggleRow
              label="Input monitor"
              description="Show what is being sent while you play"
              value={settings.showInputMonitor}
              onChange={showInputMonitor =>
                updateSettings({ showInputMonitor })
              }
            />
          </Card>
        </ScrollView>

        <ScrollView
          style={styles.column}
          contentContainerStyle={styles.content}
        >
          <Card title="Pairing with a computer">
            <NumberedList items={PAIRING_STEPS} />
          </Card>
          <Card title="Good to know">
            <NumberedList items={TROUBLESHOOTING} bullet />
          </Card>
        </ScrollView>
      </View>
    </Screen>
  );
}

function NumberedList({
  items,
  bullet = false,
}: {
  items: string[];
  bullet?: boolean;
}) {
  const { colors } = useTheme().theme;
  return (
    <>
      {items.map((item, index) => (
        <View key={item} style={styles.item}>
          <Text style={[styles.marker, { color: colors.accent }]}>
            {bullet ? '•' : index + 1}
          </Text>
          <Text style={[styles.itemText, { color: colors.text }]}>{item}</Text>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  columns: {
    flex: 1,
    flexDirection: 'row',
    gap: 14,
  },
  column: {
    flex: 1,
  },
  content: {
    gap: 10,
    paddingBottom: 12,
  },
  item: {
    flexDirection: 'row',
    gap: 8,
  },
  marker: {
    width: 14,
    fontSize: 13,
    fontWeight: '700',
  },
  itemText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  modeButtons: {
    flexDirection: 'row',
    gap: 6,
  },
});
