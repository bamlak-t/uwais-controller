# Uwais Controller

Turns an Android phone into a Bluetooth gamepad, keyboard and mouse for PCs,
Steam Deck, Android TV and anything else that accepts standard Bluetooth input
devices. No software is needed on the host.

## Requirements

- An Android 9+ phone whose Bluetooth stack supports the HID device profile
  (most do; the app tells you if yours does not).
- Node 22+, JDK 17 and the Android SDK to build.

Game consoles only accept their own controllers and will not connect.

## Running

```sh
npm install
npm run android   # with the phone plugged in and USB debugging on
```

Emulators have no real Bluetooth. Turn on **Settings → Demo mode** to use the
app without a host.

## Pairing

1. Tap **Pair new device** on the home screen to make the phone visible.
2. On the computer, add a Bluetooth device and pick the phone.
3. Accept the request on both sides. The host now sees a gamepad, keyboard and
   mouse.
4. Next time, tap the host under **Paired devices**.

If the phone was paired with the computer before the app was installed, remove
it on the computer and pair again so the host learns about the controller.

The phone appears as a generic gamepad. Games that only accept Xbox controllers
need Steam Input or a similar remapper.

## Features

- **Layouts**: offset sticks (Xbox-style), symmetric sticks (PlayStation-style),
  retro pad, shooter, racing with analog pedals, arcade stick (Vewlix),
  leverless, keyboard & mouse with trackpad, and a full keyboard.
- **Editor**: drag controls, resize and stretch them, rebind any button to a
  gamepad button, key or mouse button, and add sticks, d-pads, triggers or
  trackpads. Presets are copied before they are changed.
- **Themes**: seven presets plus overrides for control style, button glyphs
  (Xbox, PlayStation, Nintendo), accent, background, coloured face buttons and
  opacity.
- Multi-touch with slide-between-buttons, haptics, stick deadzone, pointer
  speed, auto reconnect and an input monitor overlay.

## Project layout

```
android/app/src/main/java/com/uwaiscontroller/hid   Bluetooth HID native module
src/specs        TurboModule spec for the native module
src/hid          HID report formats and encoders
src/bluetooth    Transport (native and mock), permissions, connection state
src/input        Touch routing, state resolution, report dispatch
src/layouts      Layout model, presets and editing helpers
src/controls     Control renderers
src/themes       Theme presets, colour helpers, glyphs
src/settings     Persisted user settings
src/components   Shared UI pieces
src/screens      App screens
src/navigation   Navigation stack
```

The HID report descriptor in `HidDescriptor.kt` and the encoders in
`src/hid/reports.ts` must stay in sync.

## Checks

```sh
npm test
npx tsc --noEmit
npm run lint
```
