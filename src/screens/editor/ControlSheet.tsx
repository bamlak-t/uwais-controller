import { ReactNode, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ChipGroup } from '../../components/Chip';
import { Sheet } from '../../components/Sheet';
import { GamepadButton } from '../../hid/gamepad';
import { BINDABLE_KEYS, keyLabel } from '../../hid/keyboard';
import { MouseButton } from '../../hid/mouse';
import {
  ButtonBinding,
  ButtonControl,
  ButtonShape,
  Control,
  DirectionalOutput,
} from '../../layouts/types';
import { gamepadButtonLabel } from '../../themes/glyphs';
import { useTheme } from '../../themes/ThemeProvider';

const GAMEPAD_BUTTONS: GamepadButton[] = [
  'south',
  'east',
  'west',
  'north',
  'l1',
  'r1',
  'l2',
  'r2',
  'select',
  'start',
  'home',
  'l3',
  'r3',
  'dpadUp',
  'dpadDown',
  'dpadLeft',
  'dpadRight',
  'c',
  'z',
];

const MOUSE_BUTTONS: { value: MouseButton; label: string }[] = [
  { value: 'left', label: 'Left click' },
  { value: 'right', label: 'Right click' },
  { value: 'middle', label: 'Middle click' },
];

const BINDING_TYPES: { value: ButtonBinding['type']; label: string }[] = [
  { value: 'gamepad', label: 'Gamepad' },
  { value: 'key', label: 'Keyboard' },
  { value: 'mouse', label: 'Mouse' },
];

const SHAPES: { value: ButtonShape; label: string }[] = [
  { value: 'circle', label: 'Circle' },
  { value: 'pill', label: 'Pill' },
  { value: 'square', label: 'Square' },
];

const OUTPUTS: { value: DirectionalOutput; label: string }[] = [
  { value: 'leftStick', label: 'Left stick' },
  { value: 'rightStick', label: 'Right stick' },
  { value: 'hat', label: 'D-pad' },
  { value: 'wasd', label: 'WASD keys' },
  { value: 'arrows', label: 'Arrow keys' },
];

const SIDES: { value: 'left' | 'right'; label: string }[] = [
  { value: 'left', label: 'Left trigger' },
  { value: 'right', label: 'Right trigger' },
];

const TITLES: Record<Control['kind'], string> = {
  button: 'Button',
  stick: 'Stick',
  dpad: 'D-pad',
  trigger: 'Analog trigger',
  touchpad: 'Trackpad',
};

/** The binding a button gets when its type is switched. */
const DEFAULT_BINDINGS: Record<ButtonBinding['type'], ButtonBinding> = {
  gamepad: { type: 'gamepad', button: 'south' },
  key: { type: 'key', usage: BINDABLE_KEYS[0] },
  mouse: { type: 'mouse', button: 'left' },
};

interface Props {
  control: Control;
  onChange(control: Control): void;
  onClose(): void;
}

/** Edits what a control does: its binding, output, shape and label. */
export function ControlSheet({ control, onChange, onClose }: Props) {
  const { colors } = useTheme().theme;

  return (
    <Sheet
      title={TITLES[control.kind]}
      onClose={onClose}
      widthPercent={80}
      alignTop={control.kind === 'button'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {control.kind === 'button' && (
          <ButtonFields control={control} onChange={onChange} />
        )}
        {(control.kind === 'stick' || control.kind === 'dpad') && (
          <Field label="Controls">
            <ChipGroup
              options={OUTPUTS}
              value={control.output}
              onChange={output => onChange({ ...control, output })}
            />
          </Field>
        )}
        {control.kind === 'trigger' && (
          <Field label="Acts as">
            <ChipGroup
              options={SIDES}
              value={control.side}
              onChange={side => onChange({ ...control, side })}
            />
          </Field>
        )}
        {control.kind === 'touchpad' && (
          <Text style={[styles.note, { color: colors.textMuted }]}>
            Drag with one finger to move the pointer and tap to click. Use two
            fingers to scroll, or tap with two fingers to right-click.
          </Text>
        )}
      </ScrollView>
    </Sheet>
  );
}

function ButtonFields({
  control,
  onChange,
}: {
  control: ButtonControl;
  onChange(control: Control): void;
}) {
  const { theme } = useTheme();
  const { colors } = theme;
  const { binding } = control;
  const [label, setLabel] = useState(control.label ?? '');

  const bind = (next: ButtonBinding) => onChange({ ...control, binding: next });
  const changeLabel = (text: string) => {
    setLabel(text);
    onChange({ ...control, label: text.trim() || undefined });
  };

  return (
    <>
      <Field label="Custom label">
        <TextInput
          value={label}
          onChangeText={changeLabel}
          placeholder="Leave empty to use the default"
          placeholderTextColor={colors.textMuted}
          maxLength={8}
          disableFullscreenUI
          style={[
            styles.input,
            { color: colors.text, borderColor: colors.border },
          ]}
        />
      </Field>

      <Field label="Shape">
        <ChipGroup
          options={SHAPES}
          value={control.shape}
          onChange={shape =>
            onChange({
              ...control,
              shape,
              // A circle that becomes a pill should actually look like one.
              aspect:
                shape === 'pill' && control.aspect <= 1 ? 2 : control.aspect,
            })
          }
        />
      </Field>

      <Field label="Sends">
        <ChipGroup
          options={BINDING_TYPES}
          value={binding.type}
          onChange={type => bind(DEFAULT_BINDINGS[type])}
        />
      </Field>

      {binding.type === 'gamepad' && (
        <ChipGroup
          options={GAMEPAD_BUTTONS.map(button => ({
            value: button,
            label: gamepadButtonLabel(button, theme.glyphs),
          }))}
          value={binding.button}
          onChange={button => bind({ type: 'gamepad', button })}
        />
      )}
      {binding.type === 'key' && (
        <ChipGroup
          options={BINDABLE_KEYS.map(usage => ({
            value: usage,
            label: keyLabel(usage),
          }))}
          value={binding.usage}
          onChange={usage => bind({ type: 'key', usage })}
        />
      )}
      {binding.type === 'mouse' && (
        <ChipGroup
          options={MOUSE_BUTTONS}
          value={binding.button}
          onChange={button => bind({ type: 'mouse', button })}
        />
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  const { colors } = useTheme().theme;
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
        {label}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 10,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  note: {
    fontSize: 13,
    lineHeight: 19,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
  },
});
