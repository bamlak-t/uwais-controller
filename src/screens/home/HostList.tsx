import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useHid } from '../../bluetooth/HidProvider';
import { HostDevice, HostKind } from '../../bluetooth/types';
import { AppButton } from '../../components/AppButton';
import { Card } from '../../components/Card';
import { useTheme } from '../../themes/ThemeProvider';

const KIND_TAGS: Record<HostKind, string> = {
  computer: 'PC',
  phone: 'PHONE',
  tv: 'TV',
  other: 'BT',
};

/** Hosts are more likely targets than headphones, so list them first. */
const KIND_ORDER: HostKind[] = ['computer', 'tv', 'phone', 'other'];

/** Paired devices, with the likeliest hosts first. */
export function HostList() {
  const { colors } = useTheme().theme;
  const { hosts, status, connect, prepare } = useHid();
  const sorted = [...hosts].sort(
    (a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind),
  );
  const canConnect = status.registered && status.connection === 'disconnected';

  const renderHost = (host: HostDevice) => {
    const isCurrent = status.host?.address === host.address;
    return (
      <View key={host.address} style={styles.row}>
        <Text
          style={[
            styles.tag,
            { color: colors.textMuted, borderColor: colors.border },
          ]}
        >
          {KIND_TAGS[host.kind]}
        </Text>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {host.name}
        </Text>
        {isCurrent ? (
          <Text style={[styles.current, { color: colors.accent }]}>
            {status.connection === 'connected' ? 'Connected' : 'Connecting…'}
          </Text>
        ) : (
          <AppButton
            label="Connect"
            onPress={() => connect(host)}
            disabled={!canConnect}
          />
        )}
      </View>
    );
  };

  return (
    <Card title="Paired devices" style={styles.card}>
      <ScrollView contentContainerStyle={styles.list}>
        {sorted.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textMuted }]}>
            Nothing paired yet. Tap "Pair new device", then add a Bluetooth
            device on your computer and choose this phone.
          </Text>
        ) : (
          sorted.map(renderHost)
        )}
      </ScrollView>
      <AppButton label="Refresh" variant="ghost" onPress={prepare} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  list: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tag: {
    width: 48,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 2,
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  current: {
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 8,
  },
  empty: {
    fontSize: 12,
    lineHeight: 17,
  },
});
