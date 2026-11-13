import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { LayoutPreview } from '../../components/LayoutPreview';
import { Screen } from '../../components/Screen';
import { useLayouts } from '../../layouts/LayoutsProvider';
import { ScreenProps } from '../../navigation/types';
import { THEMES } from '../../themes/presets';
import { useTheme } from '../../themes/ThemeProvider';
import { ThemeCard } from './ThemeCard';
import { ThemeCustomiser } from './ThemeCustomiser';

const COLUMNS = 2;
const GAP = 8;
/** Share of the side column the live preview takes, leaving room for options. */
const PREVIEW_SCALE = 0.6;

/** Pick a preset on the left, fine-tune it on the right with a live preview. */
export function ThemesScreen({ navigation }: ScreenProps<'Themes'>) {
  const { theme, selection, selectTheme } = useTheme();
  const { activeLayout } = useLayouts();
  const [galleryWidth, setGalleryWidth] = useState(0);
  const [sideWidth, setSideWidth] = useState(0);
  const cardWidth = Math.floor((galleryWidth - GAP * (COLUMNS - 1)) / COLUMNS);

  return (
    <Screen title="Themes" onBack={navigation.goBack}>
      <View style={styles.columns}>
        <ScrollView
          style={styles.gallery}
          onLayout={event => setGalleryWidth(event.nativeEvent.layout.width)}
          contentContainerStyle={styles.grid}
        >
          {galleryWidth > 0 &&
            THEMES.map(preset => (
              <ThemeCard
                key={preset.id}
                theme={preset}
                layout={activeLayout}
                width={cardWidth}
                selected={preset.id === selection.themeId}
                onSelect={() => selectTheme(preset.id)}
              />
            ))}
        </ScrollView>

        <View
          style={styles.side}
          onLayout={event => setSideWidth(event.nativeEvent.layout.width)}
        >
          {sideWidth > 0 && (
            <View style={styles.preview}>
              <LayoutPreview
                layout={activeLayout}
                theme={theme}
                width={sideWidth * PREVIEW_SCALE}
              />
            </View>
          )}
          <ThemeCustomiser />
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
  gallery: {
    flex: 1.1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    paddingBottom: 12,
  },
  side: {
    flex: 1,
    gap: 8,
  },
  preview: {
    alignItems: 'center',
  },
});
