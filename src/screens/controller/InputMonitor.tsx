import { StyleSheet, Text, View } from 'react-native';
import { HAT_NEUTRAL } from '../../hid/gamepad';
import { keyLabel } from '../../hid/keyboard';
import { ControllerState } from '../../input/types';

const HAT_NAMES = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

const axis = (value: number) => value.toFixed(2).padStart(5);

/** Debug overlay showing exactly what is being sent to the host. */
export function InputMonitor({ state }: { state: ControllerState | null }) {
  if (!state) {
    return null;
  }
  const { gamepad, keys, mouse } = state;
  const hat = gamepad.hat === HAT_NEUTRAL ? '-' : HAT_NAMES[gamepad.hat];

  return (
    <View style={styles.panel} pointerEvents="none">
      <Text style={styles.line}>
        BTN {gamepad.buttons.toString(2).padStart(15, '0')} HAT {hat}
      </Text>
      <Text style={styles.line}>
        L {axis(gamepad.lx)} {axis(gamepad.ly)} R {axis(gamepad.rx)}{' '}
        {axis(gamepad.ry)} LT {axis(gamepad.lt)} RT {axis(gamepad.rt)}
      </Text>
      <Text style={styles.line}>
        KEYS {keys.map(keyLabel).join(' ') || '-'} MOUSE {mouse.buttons}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    bottom: 4,
    alignSelf: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  line: {
    color: '#9CFFB0',
    fontFamily: 'monospace',
    fontSize: 9,
  },
});
