import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../themes/ThemeProvider';

interface Props {
  colors: string[];
  value: string;
  onChange(color: string): void;
}

/** A row of colour dots with a ring around the selected one. */
export function SwatchPicker({ colors, value, onChange }: Props) {
  const theme = useTheme().theme.colors;

  return (
    <View style={styles.row}>
      {colors.map(color => {
        const selected = color.toUpperCase() === value.toUpperCase();
        return (
          <Pressable
            key={color}
            onPress={() => onChange(color)}
            hitSlop={4}
            style={[
              styles.ring,
              { borderColor: selected ? theme.text : 'transparent' },
            ]}
          >
            <View
              style={[
                styles.swatch,
                { backgroundColor: color, borderColor: theme.border },
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  ring: {
    padding: 2,
    borderRadius: 999,
    borderWidth: 2,
  },
  swatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
  },
});
