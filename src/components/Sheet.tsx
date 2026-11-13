import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../themes/ThemeProvider';

interface Props {
  title: string;
  onClose(): void;
  children: ReactNode;
  /** Fraction of the screen width the sheet may take. */
  widthPercent?: number;
  /** Pin to the top when the sheet holds a text field the keyboard would cover. */
  alignTop?: boolean;
}

/**
 * A dialog drawn inside the current screen. A native Modal would open a new
 * window and bring the system bars back over the immersive controller.
 */
export function Sheet({
  title,
  onClose,
  children,
  widthPercent = 70,
  alignTop = false,
}: Props) {
  const { colors } = useTheme().theme;

  return (
    <View style={[styles.overlay, alignTop && styles.top]}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View
        style={[
          styles.sheet,
          {
            width: `${widthPercent}%`,
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={[styles.close, { color: colors.textMuted }]}>✕</Text>
          </Pressable>
        </View>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  top: {
    justifyContent: 'flex-start',
    paddingTop: 10,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheet: {
    maxHeight: '92%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  close: {
    fontSize: 16,
    fontWeight: '700',
  },
});
