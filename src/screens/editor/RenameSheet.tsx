import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { Sheet } from '../../components/Sheet';
import { useTheme } from '../../themes/ThemeProvider';

interface Props {
  name: string;
  onRename(name: string): void;
  onClose(): void;
}

export function RenameSheet({ name, onRename, onClose }: Props) {
  const { colors } = useTheme().theme;
  const [draft, setDraft] = useState(name);
  const trimmed = draft.trim();

  const save = () => {
    if (trimmed) {
      onRename(trimmed);
    }
  };

  return (
    <Sheet title="Rename layout" onClose={onClose} widthPercent={55} alignTop>
      <View style={styles.row}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={save}
          autoFocus
          selectTextOnFocus
          maxLength={32}
          disableFullscreenUI
          style={[
            styles.input,
            { color: colors.text, borderColor: colors.border },
          ]}
        />
        <AppButton
          label="Save"
          variant="primary"
          onPress={save}
          disabled={!trimmed}
        />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 15,
  },
});
