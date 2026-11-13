import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../themes/ThemeProvider';
import { AppButton } from './AppButton';

interface Props {
  title: string;
  /** Shows a back button when provided. */
  onBack?(): void;
  /** Actions shown at the right of the header. */
  actions?: ReactNode;
  children: ReactNode;
}

/** Page chrome shared by every screen except the controller itself. */
export function Screen({ title, onBack, actions, children }: Props) {
  const { colors } = useTheme().theme;
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.background,
          paddingLeft: Math.max(insets.left, 16),
          paddingRight: Math.max(insets.right, 16),
          paddingTop: Math.max(insets.top, 10),
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      <View style={styles.header}>
        {onBack && (
          <AppButton label="‹ Back" variant="ghost" onPress={onBack} />
        )}
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.actions}>{actions}</View>
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  body: {
    flex: 1,
  },
});
