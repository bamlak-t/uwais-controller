import { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { Screen } from '../../components/Screen';
import { createBlankLayout, forkLayout } from '../../layouts/editing';
import { useLayouts } from '../../layouts/LayoutsProvider';
import { Layout } from '../../layouts/types';
import {
  uniqueLayoutName,
  useEditableLayout,
} from '../../layouts/useEditableLayout';
import { ScreenProps } from '../../navigation/types';
import { LayoutCard } from './LayoutCard';

const COLUMNS = 3;
const GAP = 10;

export function LayoutsScreen({ navigation }: ScreenProps<'Layouts'>) {
  const { layouts, activeLayout, setActiveLayout, saveLayout, deleteLayout } =
    useLayouts();
  const toEditable = useEditableLayout();
  const [gridWidth, setGridWidth] = useState(0);
  const cardWidth = Math.floor((gridWidth - GAP * (COLUMNS - 1)) / COLUMNS);

  const edit = (layout: Layout) =>
    navigation.navigate('LayoutEditor', { layoutId: toEditable(layout).id });

  const duplicate = (layout: Layout) =>
    saveLayout(
      forkLayout(layout, uniqueLayoutName(`${layout.name} copy`, layouts)),
    );

  const createBlank = () => {
    const blank = createBlankLayout(uniqueLayoutName('New layout', layouts));
    saveLayout(blank);
    navigation.navigate('LayoutEditor', { layoutId: blank.id });
  };

  const confirmDelete = (layout: Layout) =>
    Alert.alert('Delete layout?', `"${layout.name}" will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteLayout(layout.id),
      },
    ]);

  return (
    <Screen
      title="Layouts"
      onBack={navigation.goBack}
      actions={
        <AppButton
          label="+ New layout"
          variant="primary"
          onPress={createBlank}
        />
      }
    >
      <ScrollView
        onLayout={event => setGridWidth(event.nativeEvent.layout.width)}
        contentContainerStyle={styles.grid}
      >
        {gridWidth > 0 &&
          layouts.map(layout => (
            <LayoutCard
              key={layout.id}
              layout={layout}
              width={cardWidth}
              active={layout.id === activeLayout.id}
              onUse={() => setActiveLayout(layout.id)}
              onEdit={() => edit(layout)}
              onDuplicate={() => duplicate(layout)}
              onDelete={layout.preset ? undefined : () => confirmDelete(layout)}
            />
          ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    paddingBottom: 12,
  },
});
