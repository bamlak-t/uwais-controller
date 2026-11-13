import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useHid } from '../../bluetooth/HidProvider';
import { AppButton } from '../../components/AppButton';
import { Chip } from '../../components/Chip';
import { Sheet } from '../../components/Sheet';
import { useLayouts } from '../../layouts/LayoutsProvider';
import { useTheme } from '../../themes/ThemeProvider';

interface Props {
  onResume(): void;
  onEdit(): void;
  onExit(): void;
}

/** Pause menu: switch layout on the fly, jump to the editor or leave. */
export function ControllerMenu({ onResume, onEdit, onExit }: Props) {
  const { colors } = useTheme().theme;
  const { layouts, activeLayout, setActiveLayout } = useLayouts();
  const { status, isDemo } = useHid();

  const connection =
    status.connection === 'connected'
      ? `Connected to ${status.host?.name ?? 'host'}`
      : 'Not connected — inputs are not being sent';

  return (
    <Sheet title={activeLayout.name} onClose={onResume}>
      <Text style={[styles.status, { color: colors.textMuted }]}>
        {isDemo ? `Demo mode · ${connection}` : connection}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.layouts}
      >
        {layouts.map(layout => (
          <Chip
            key={layout.id}
            label={layout.name}
            selected={layout.id === activeLayout.id}
            onPress={() => setActiveLayout(layout.id)}
          />
        ))}
      </ScrollView>
      <View style={styles.actions}>
        <AppButton label="Exit" variant="danger" onPress={onExit} />
        <View style={styles.spacer} />
        <AppButton label="Edit layout" onPress={onEdit} />
        <AppButton label="Resume" variant="primary" onPress={onResume} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  status: {
    fontSize: 12,
  },
  layouts: {
    gap: 6,
    paddingVertical: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  spacer: {
    flex: 1,
  },
});
