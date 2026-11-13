import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { Control } from '../../layouts/types';
import { useTheme } from '../../themes/ThemeProvider';

const KIND_NAMES: Record<Control['kind'], string> = {
  button: 'Button',
  stick: 'Stick',
  dpad: 'D-pad',
  trigger: 'Trigger',
  touchpad: 'Trackpad',
};

interface Props {
  layoutName: string;
  /** The selected control, which switches the toolbar to its tools. */
  selected: Control | undefined;
  onDone(): void;
  onRename(): void;
  onAdd(): void;
  onDeselect(): void;
  onResize(direction: 1 | -1): void;
  onStretch(direction: 1 | -1): void;
  onConfigure(): void;
  onDelete(): void;
}

/**
 * The strip above the editor canvas. It shows layout-wide actions until a
 * control is selected, then the tools for that control.
 */
export function EditorToolbar(props: Props) {
  const { colors } = useTheme().theme;
  const { selected } = props;

  if (!selected) {
    return (
      <View style={styles.bar}>
        <AppButton label="‹ Done" variant="ghost" onPress={props.onDone} />
        <Pressable style={styles.name} onPress={props.onRename}>
          <Text
            style={[styles.nameText, { color: colors.text }]}
            numberOfLines={1}
          >
            {props.layoutName}
          </Text>
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            Tap to rename · drag controls to move them
          </Text>
        </Pressable>
        <AppButton
          label="+ Add control"
          variant="primary"
          onPress={props.onAdd}
        />
      </View>
    );
  }

  const canStretch = 'aspect' in selected && !isCircle(selected);

  return (
    <View style={styles.bar}>
      <AppButton label="✕" variant="ghost" onPress={props.onDeselect} />
      <Text style={[styles.kind, { color: colors.text }]}>
        {KIND_NAMES[selected.kind]}
      </Text>
      <Adjuster label="Size" onStep={props.onResize} />
      {canStretch && <Adjuster label="Width" onStep={props.onStretch} />}
      <View style={styles.spacer} />
      <AppButton label="Options" onPress={props.onConfigure} />
      <AppButton label="Delete" variant="danger" onPress={props.onDelete} />
    </View>
  );
}

function isCircle(control: Control): boolean {
  return control.kind === 'button' && control.shape === 'circle';
}

function Adjuster({
  label,
  onStep,
}: {
  label: string;
  onStep(direction: 1 | -1): void;
}) {
  const { colors } = useTheme().theme;
  return (
    <View style={styles.adjuster}>
      <Text style={[styles.adjusterLabel, { color: colors.textMuted }]}>
        {label}
      </Text>
      <AppButton label="−" onPress={() => onStep(-1)} />
      <AppButton label="+" onPress={() => onStep(1)} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    flex: 1,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '700',
  },
  hint: {
    fontSize: 11,
  },
  kind: {
    fontSize: 14,
    fontWeight: '700',
    marginRight: 6,
  },
  adjuster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  adjusterLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  spacer: {
    flex: 1,
  },
});
