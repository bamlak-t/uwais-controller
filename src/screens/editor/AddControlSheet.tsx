import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Sheet } from '../../components/Sheet';
import { ControlKind } from '../../layouts/types';
import { useTheme } from '../../themes/ThemeProvider';

const OPTIONS: { kind: ControlKind; name: string; description: string }[] = [
  {
    kind: 'button',
    name: 'Button',
    description: 'A gamepad button, keyboard key or mouse click',
  },
  {
    kind: 'stick',
    name: 'Stick',
    description: 'Analog stick, or eight-way keys',
  },
  {
    kind: 'dpad',
    name: 'D-pad',
    description: 'Four arms with diagonals',
  },
  {
    kind: 'trigger',
    name: 'Analog trigger',
    description: 'Slide up for more, like a pedal',
  },
  {
    kind: 'touchpad',
    name: 'Trackpad',
    description: 'Moves the mouse pointer',
  },
];

interface Props {
  onAdd(kind: ControlKind): void;
  onClose(): void;
}

export function AddControlSheet({ onAdd, onClose }: Props) {
  const { colors } = useTheme().theme;

  return (
    <Sheet title="Add a control" onClose={onClose}>
      <View style={styles.grid}>
        {OPTIONS.map(option => (
          <Pressable
            key={option.kind}
            onPress={() => onAdd(option.kind)}
            style={[styles.option, { borderColor: colors.border }]}
          >
            <Text style={[styles.name, { color: colors.text }]}>
              {option.name}
            </Text>
            <Text style={[styles.description, { color: colors.textMuted }]}>
              {option.description}
            </Text>
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    width: '31.5%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 2,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
  },
  description: {
    fontSize: 11,
    lineHeight: 15,
  },
});
