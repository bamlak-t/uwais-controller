import { Linking, StyleSheet, Text, View } from 'react-native';
import { useHid } from '../../bluetooth/HidProvider';
import { AppButton } from '../../components/AppButton';
import { Card } from '../../components/Card';
import { useTheme } from '../../themes/ThemeProvider';

const CONNECTED_COLOR = '#3CCB7F';
const BUSY_COLOR = '#F5B83D';

interface Summary {
  headline: string;
  detail: string;
  dot: string;
  action?: { label: string; run(): void };
  secondary?: { label: string; run(): void };
}

/** Explains the connection state and offers the one action that moves it forward. */
export function ConnectionCard() {
  const { colors } = useTheme().theme;
  const hid = useHid();
  const summary = summarise(hid, colors.textMuted);

  return (
    <Card title={hid.isDemo ? 'Connection · demo mode' : 'Connection'}>
      <View style={styles.status}>
        <View style={[styles.dot, { backgroundColor: summary.dot }]} />
        <View style={styles.text}>
          <Text style={[styles.headline, { color: colors.text }]}>
            {summary.headline}
          </Text>
          <Text style={[styles.detail, { color: colors.textMuted }]}>
            {summary.detail}
          </Text>
        </View>
      </View>
      {hid.error && (
        <Text style={[styles.detail, { color: colors.danger }]}>
          {hid.error}
        </Text>
      )}
      {(summary.action || summary.secondary) && (
        <View style={styles.actions}>
          {summary.action && (
            <AppButton
              label={summary.action.label}
              variant="primary"
              onPress={summary.action.run}
            />
          )}
          {summary.secondary && (
            <AppButton
              label={summary.secondary.label}
              onPress={summary.secondary.run}
            />
          )}
        </View>
      )}
    </Card>
  );
}

function summarise(hid: ReturnType<typeof useHid>, idleDot: string): Summary {
  const { status } = hid;

  if (!hid.permissionGranted) {
    return {
      headline: 'Bluetooth permission needed',
      detail: 'Allow "Nearby devices" so this phone can act as a controller.',
      dot: idleDot,
      action: { label: 'Grant permission', run: hid.prepare },
      secondary: { label: 'Open settings', run: () => Linking.openSettings() },
    };
  }
  if (!status.supported) {
    return {
      headline: 'Not supported on this phone',
      detail:
        'Its Bluetooth cannot act as a controller. Turn on demo mode in Settings to explore the app.',
      dot: idleDot,
    };
  }
  if (!status.bluetoothEnabled) {
    return {
      headline: 'Bluetooth is off',
      detail: 'Turn it on to connect to a computer, handheld or TV.',
      dot: idleDot,
      action: { label: 'Turn on Bluetooth', run: hid.enableBluetooth },
    };
  }
  if (!status.registered) {
    return {
      headline: 'Starting controller…',
      detail: 'Registering with Bluetooth.',
      dot: BUSY_COLOR,
    };
  }

  const hostName = status.host?.name ?? 'host';
  switch (status.connection) {
    case 'connected':
      return {
        headline: `Connected to ${hostName}`,
        detail: 'Inputs are live. Press Play to open the controller.',
        dot: CONNECTED_COLOR,
        secondary: { label: 'Disconnect', run: hid.disconnect },
      };
    case 'connecting':
      return {
        headline: `Connecting to ${hostName}…`,
        detail: 'Make sure the device is on and in range.',
        dot: BUSY_COLOR,
      };
    case 'disconnecting':
      return {
        headline: `Disconnecting from ${hostName}…`,
        detail: 'One moment.',
        dot: BUSY_COLOR,
      };
    default:
      return {
        headline: 'Ready to connect',
        detail:
          'Pick a paired device, or pair a new one and then add this phone from its Bluetooth settings.',
        dot: idleDot,
        action: { label: 'Pair new device', run: hid.makeDiscoverable },
      };
  }
}

const styles = StyleSheet.create({
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  text: {
    flex: 1,
  },
  headline: {
    fontSize: 15,
    fontWeight: '700',
  },
  detail: {
    fontSize: 12,
    marginTop: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
});
