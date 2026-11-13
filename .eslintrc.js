module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    // HID reports are bitfields, so bitwise operators are intentional here.
    'no-bitwise': 'off',
    // Most styles depend on the active theme and cannot live in a StyleSheet.
    'react-native/no-inline-styles': 'off',
  },
};
