import { ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '../themes/ThemeProvider';

interface Props {
  title?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Card({ title, children, style }: Props) {
  const { colors } = useTheme().theme;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}
    >
      {title && (
        <Text style={[styles.title, { color: colors.textMuted }]}>{title}</Text>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
