import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { LayoutPreview } from '../../components/LayoutPreview';
import { Screen } from '../../components/Screen';
import { useLayouts } from '../../layouts/LayoutsProvider';
import { ScreenProps } from '../../navigation/types';
import { useTheme } from '../../themes/ThemeProvider';
import { ConnectionCard } from './ConnectionCard';
import { HostList } from './HostList';

export function HomeScreen({ navigation }: ScreenProps<'Home'>) {
  const { theme } = useTheme();
  const { activeLayout } = useLayouts();
  const [previewWidth, setPreviewWidth] = useState(0);

  return (
    <Screen title="Uwais Controller">
      <View style={styles.columns}>
        <View style={styles.column}>
          <ConnectionCard />
          <HostList />
        </View>

        <View
          style={styles.column}
          onLayout={event => setPreviewWidth(event.nativeEvent.layout.width)}
        >
          <Pressable
            style={styles.preview}
            onPress={() => navigation.navigate('Controller')}
          >
            {previewWidth > 0 && (
              <LayoutPreview
                layout={activeLayout}
                theme={theme}
                width={previewWidth}
              />
            )}
          </Pressable>
          <View style={styles.layoutInfo}>
            <View style={styles.layoutText}>
              <Text style={[styles.layoutName, { color: theme.colors.text }]}>
                {activeLayout.name}
              </Text>
              <Text
                style={[
                  styles.layoutDescription,
                  { color: theme.colors.textMuted },
                ]}
                numberOfLines={1}
              >
                {activeLayout.description}
              </Text>
            </View>
            <AppButton
              label="Play"
              variant="primary"
              large
              onPress={() => navigation.navigate('Controller')}
            />
          </View>
          <View style={styles.links}>
            <AppButton
              label="Layouts"
              style={styles.link}
              onPress={() => navigation.navigate('Layouts')}
            />
            <AppButton
              label="Themes"
              style={styles.link}
              onPress={() => navigation.navigate('Themes')}
            />
            <AppButton
              label="Settings"
              style={styles.link}
              onPress={() => navigation.navigate('Settings')}
            />
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  columns: {
    flex: 1,
    flexDirection: 'row',
    gap: 14,
  },
  column: {
    flex: 1,
    gap: 10,
  },
  preview: {
    alignItems: 'center',
  },
  layoutInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  layoutText: {
    flex: 1,
  },
  layoutName: {
    fontSize: 16,
    fontWeight: '700',
  },
  layoutDescription: {
    fontSize: 12,
  },
  links: {
    flexDirection: 'row',
    gap: 8,
  },
  link: {
    flex: 1,
  },
});
