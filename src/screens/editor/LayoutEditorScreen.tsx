import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Size,
  controlRect,
  layoutUnit,
  positionFromPoint,
} from '../../input/geometry';
import {
  addControl,
  createControl,
  moveControl,
  removeControl,
  resizeControl,
  stretchControl,
  updateControl,
} from '../../layouts/editing';
import { useLayouts } from '../../layouts/LayoutsProvider';
import { ControlKind, Layout } from '../../layouts/types';
import { ScreenProps } from '../../navigation/types';
import { useTheme } from '../../themes/ThemeProvider';
import { AddControlSheet } from './AddControlSheet';
import { ControlSheet } from './ControlSheet';
import { DraggableControl } from './DraggableControl';
import { EditorToolbar } from './EditorToolbar';
import { RenameSheet } from './RenameSheet';

const TOOLBAR_HEIGHT = 44;
const SIZE_STEP = 0.01;
const ASPECT_STEP = 0.1;
/** Positions snap to this fraction of a layout unit so controls line up. */
const GRID = 0.01;

type OpenSheet = 'add' | 'rename' | 'control' | null;

/**
 * Drag-and-drop layout editor. The canvas is a scaled-down copy of the real
 * screen so the toolbar never covers the controls being arranged. Every
 * change is saved straight away.
 */
export function LayoutEditorScreen({
  navigation,
  route,
}: ScreenProps<'LayoutEditor'>) {
  const { theme } = useTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();
  const { layouts, saveLayout } = useLayouts();
  const layout = layouts.find(item => item.id === route.params.layoutId);

  const [screen, setScreen] = useState<Size | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<OpenSheet>(null);

  // The layout was deleted from under us; there is nothing left to edit.
  useEffect(() => {
    if (!layout) {
      navigation.goBack();
    }
  }, [layout, navigation]);

  const canvas = useMemo(() => {
    if (!screen) {
      return null;
    }
    const available =
      screen.height - TOOLBAR_HEIGHT - insets.top - insets.bottom - 16;
    const scale = available / screen.height;
    return { width: screen.width * scale, height: screen.height * scale };
  }, [screen, insets.top, insets.bottom]);

  if (!layout) {
    return null;
  }

  const selected = layout.controls.find(control => control.id === selectedId);
  const change = (next: Layout) => saveLayout(next);

  const moveTo = (controlId: string, cx: number, cy: number) => {
    if (!canvas) {
      return;
    }
    const position = positionFromPoint(
      clamp(cx, 0, canvas.width),
      clamp(cy, 0, canvas.height),
      canvas,
    );
    change(
      moveControl(layout, controlId, {
        anchor: position.anchor,
        x: snap(position.x),
        y: snap(position.y),
      }),
    );
  };

  const add = (kind: ControlKind) => {
    const control = createControl(kind);
    change(addControl(layout, control));
    setSelectedId(control.id);
    setSheet(null);
  };

  const removeSelected = () => {
    if (selected) {
      change(removeControl(layout, selected.id));
      setSelectedId(null);
    }
  };

  return (
    <View
      style={[styles.screen, { backgroundColor: colors.surface }]}
      onLayout={event => {
        const { width, height } = event.nativeEvent.layout;
        setScreen({ width, height });
      }}
    >
      <View
        style={[
          styles.toolbar,
          {
            marginTop: insets.top + 4,
            paddingLeft: Math.max(insets.left, 12),
            paddingRight: Math.max(insets.right, 12),
          },
        ]}
      >
        <EditorToolbar
          layoutName={layout.name}
          selected={selected}
          onDone={navigation.goBack}
          onRename={() => setSheet('rename')}
          onAdd={() => setSheet('add')}
          onDeselect={() => setSelectedId(null)}
          onResize={direction =>
            selected &&
            change(resizeControl(layout, selected.id, direction * SIZE_STEP))
          }
          onStretch={direction =>
            selected &&
            change(stretchControl(layout, selected.id, direction * ASPECT_STEP))
          }
          onConfigure={() => setSheet('control')}
          onDelete={removeSelected}
        />
      </View>

      <View style={styles.stage}>
        {canvas && (
          <View
            style={[
              styles.canvas,
              canvas,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setSelectedId(null)}
            />
            {layout.controls.map(control => (
              <DraggableControl
                key={control.id}
                control={control}
                rect={controlRect(control, canvas)}
                theme={theme}
                selected={control.id === selectedId}
                onSelect={() => setSelectedId(control.id)}
                onMove={(cx, cy) => moveTo(control.id, cx, cy)}
              />
            ))}
            <View
              pointerEvents="none"
              style={[
                styles.menuMarker,
                {
                  width: layoutUnit(canvas) * 0.18,
                  height: layoutUnit(canvas) * 0.06,
                  borderColor: colors.textMuted,
                },
              ]}
            />
          </View>
        )}
      </View>

      {sheet === 'add' && (
        <AddControlSheet onAdd={add} onClose={() => setSheet(null)} />
      )}
      {sheet === 'rename' && (
        <RenameSheet
          name={layout.name}
          onRename={name => {
            change({ ...layout, name });
            setSheet(null);
          }}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'control' && selected && (
        <ControlSheet
          control={selected}
          onChange={control => change(updateControl(layout, control))}
          onClose={() => setSheet(null)}
        />
      )}
    </View>
  );
}

function snap(value: number): number {
  return Math.round(value / GRID) * GRID;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  toolbar: {
    height: TOOLBAR_HEIGHT,
    justifyContent: 'center',
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvas: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  // Shows where the in-game menu button sits so it can be kept clear.
  menuMarker: {
    position: 'absolute',
    top: 3,
    alignSelf: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 999,
  },
});
