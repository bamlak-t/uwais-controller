import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LayoutPreview } from '../../components/LayoutPreview';
import { Layout } from '../../layouts/types';
import { Theme } from '../../themes/types';

const PADDING = 6;

interface Props {
  /** The theme this card shows, drawn in its own colours. */
  theme: Theme;
  layout: Layout;
  width: number;
  selected: boolean;
  onSelect(): void;
}

export function ThemeCard({ theme, layout, width, selected, onSelect }: Props) {
  const { colors } = theme;

  return (
    <Pressable
      onPress={onSelect}
      style={[
        styles.card,
        {
          width,
          backgroundColor: colors.surface,
          borderColor: selected ? colors.accent : colors.border,
        },
      ]}
    >
      <LayoutPreview
        layout={layout}
        theme={theme}
        width={width - PADDING * 2 - 4}
      />
      <View style={styles.heading}>
        <Text style={[styles.name, { color: colors.text }]}>{theme.name}</Text>
        {selected && (
          <Text style={[styles.badge, { color: colors.accent }]}>IN USE</Text>
        )}
      </View>
      <Text
        style={[styles.description, { color: colors.textMuted }]}
        numberOfLines={2}
      >
        {theme.description}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 2,
    padding: PADDING,
    gap: 3,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
  },
  badge: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  description: {
    fontSize: 10,
    lineHeight: 13,
  },
});
