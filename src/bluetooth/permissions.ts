import { PermissionsAndroid, Platform } from 'react-native';

/** Android 12 replaced the install-time Bluetooth permissions with runtime ones. */
const ANDROID_12 = 31;

/**
 * Requests the runtime permissions needed to act as a Bluetooth peripheral.
 * Resolves true when everything required has been granted.
 */
export async function requestBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android' || Platform.Version < ANDROID_12) {
    return true;
  }
  const required = [
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
  ];
  const results = await PermissionsAndroid.requestMultiple(required);
  return required.every(
    permission => results[permission] === PermissionsAndroid.RESULTS.GRANTED,
  );
}
