import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../themes/ThemeProvider';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress(): void;
}

export function Chip({ label, selected, onPress }: ChipProps) {
  const { colors } = useTheme().theme;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.accent : 'transparent',
          borderColor: selected ? colors.accent : colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: selected ? colors.onAccent : colors.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

interface ChipGroupProps<T> {
  options: { value: T; label: string }[];
  value: T;
  onChange(value: T): void;
}

/** A row of chips where exactly one is selected. */
export function ChipGroup<T extends string | number>({
  options,
  value,
  onChange,
}: ChipGroupProps<T>) {
  return (
    <View style={styles.group}>
      {options.map(option => (
        <Chip
          key={option.value}
          label={option.label}
          selected={option.value === value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 40,
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  group: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
});
