import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { LayoutPreview } from '../../components/LayoutPreview';
import { Layout } from '../../layouts/types';
import { useTheme } from '../../themes/ThemeProvider';

const PADDING = 8;

interface Props {
  layout: Layout;
  width: number;
  active: boolean;
  onUse(): void;
  onEdit(): void;
  onDuplicate(): void;
  /** Only custom layouts can be deleted. */
  onDelete?(): void;
}

export function LayoutCard({
  layout,
  width,
  active,
  onUse,
  onEdit,
  onDuplicate,
  onDelete,
}: Props) {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <Pressable
      onPress={onUse}
      style={[
        styles.card,
        {
          width,
          backgroundColor: colors.surface,
          borderColor: active ? colors.accent : colors.border,
        },
      ]}
    >
      <LayoutPreview
        layout={layout}
        theme={theme}
        width={width - PADDING * 2 - 2}
      />
      <View style={styles.heading}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {layout.name}
        </Text>
        <Text
          style={[
            styles.badge,
            { color: active ? colors.accent : colors.textMuted },
          ]}
        >
          {active ? 'IN USE' : layout.preset ? 'PRESET' : 'CUSTOM'}
        </Text>
      </View>
      <Text
        style={[styles.description, { color: colors.textMuted }]}
        numberOfLines={1}
      >
        {layout.description}
      </Text>
      <View style={styles.actions}>
        <AppButton
          label={layout.preset ? 'Customise' : 'Edit'}
          style={styles.action}
          onPress={onEdit}
        />
        <AppButton label="Copy" style={styles.action} onPress={onDuplicate} />
        {onDelete && (
          <AppButton label="Delete" variant="danger" onPress={onDelete} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: PADDING,
    gap: 4,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  badge: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  description: {
    fontSize: 11,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  action: {
    flex: 1,
  },
});
