import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LayoutCanvas } from '../controls/LayoutCanvas';
import { Layout } from '../layouts/types';
import { Theme } from '../themes/types';

/** Width-to-height ratio of a typical phone held sideways. */
const PREVIEW_ASPECT = 2.1;

interface Props {
  layout: Layout;
  theme: Theme;
  width: number;
}

/** A miniature, non-interactive rendering of a layout in a given theme. */
export function LayoutPreview({ layout, theme, width }: Props) {
  const size = useMemo(
    () => ({ width, height: width / PREVIEW_ASPECT }),
    [width],
  );

  return (
    <View
      style={[
        styles.frame,
        size,
        {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <LayoutCanvas controls={layout.controls} size={size} theme={theme} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
