package com.uwaiscontroller.hid

/**
 * Composite HID report descriptor: gamepad, keyboard and mouse, each behind its own report ID.
 *
 * The byte layouts must stay in sync with src/hid/reports.ts.
 */
object HidDescriptor {
  const val REPORT_ID_GAMEPAD = 1
  const val REPORT_ID_KEYBOARD = 2
  const val REPORT_ID_MOUSE = 3

  /** Payload sizes without the report ID, used to answer GET_REPORT before anything was sent. */
  val REPORT_SIZES = mapOf(REPORT_ID_GAMEPAD to 13, REPORT_ID_KEYBOARD to 8, REPORT_ID_MOUSE to 6)

  private val GAMEPAD =
      intArrayOf(
          0x05, 0x01, // Usage Page (Generic Desktop)
          0x09, 0x05, // Usage (Game Pad)
          0xA1, 0x01, // Collection (Application)
          0x85, REPORT_ID_GAMEPAD, //   Report ID
          // 16 buttons
          0x05, 0x09, //   Usage Page (Button)
          0x19, 0x01, //   Usage Minimum (1)
          0x29, 0x10, //   Usage Maximum (16)
          0x15, 0x00, //   Logical Minimum (0)
          0x25, 0x01, //   Logical Maximum (1)
          0x75, 0x01, //   Report Size (1)
          0x95, 0x10, //   Report Count (16)
          0x81, 0x02, //   Input (Data, Variable, Absolute)
          // Hat switch, 4 bits + 4 bits padding
          0x05, 0x01, //   Usage Page (Generic Desktop)
          0x09, 0x39, //   Usage (Hat Switch)
          0x15, 0x00, //   Logical Minimum (0)
          0x25, 0x07, //   Logical Maximum (7)
          0x35, 0x00, //   Physical Minimum (0)
          0x46, 0x3B, 0x01, //   Physical Maximum (315)
          0x65, 0x14, //   Unit (Degrees)
          0x75, 0x04, //   Report Size (4)
          0x95, 0x01, //   Report Count (1)
          0x81, 0x42, //   Input (Data, Variable, Absolute, Null State)
          0x65, 0x00, //   Unit (None)
          0x35, 0x00, //   Physical Minimum (0)
          0x45, 0x00, //   Physical Maximum (0)
          0x75, 0x04, //   Report Size (4)
          0x95, 0x01, //   Report Count (1)
          0x81, 0x03, //   Input (Constant)
          // Left stick (X, Y) and right stick (Z, Rz), signed 16 bit
          0x09, 0x30, //   Usage (X)
          0x09, 0x31, //   Usage (Y)
          0x09, 0x32, //   Usage (Z)
          0x09, 0x35, //   Usage (Rz)
          0x16, 0x01, 0x80, //   Logical Minimum (-32767)
          0x26, 0xFF, 0x7F, //   Logical Maximum (32767)
          0x75, 0x10, //   Report Size (16)
          0x95, 0x04, //   Report Count (4)
          0x81, 0x02, //   Input (Data, Variable, Absolute)
          // Triggers (Rx, Ry), unsigned 8 bit
          0x09, 0x33, //   Usage (Rx)
          0x09, 0x34, //   Usage (Ry)
          0x15, 0x00, //   Logical Minimum (0)
          0x26, 0xFF, 0x00, //   Logical Maximum (255)
          0x75, 0x08, //   Report Size (8)
          0x95, 0x02, //   Report Count (2)
          0x81, 0x02, //   Input (Data, Variable, Absolute)
          0xC0, // End Collection
      )

  private val KEYBOARD =
      intArrayOf(
          0x05, 0x01, // Usage Page (Generic Desktop)
          0x09, 0x06, // Usage (Keyboard)
          0xA1, 0x01, // Collection (Application)
          0x85, REPORT_ID_KEYBOARD, //   Report ID
          // Modifier bitmask
          0x05, 0x07, //   Usage Page (Keyboard)
          0x19, 0xE0, //   Usage Minimum (Left Control)
          0x29, 0xE7, //   Usage Maximum (Right GUI)
          0x15, 0x00, //   Logical Minimum (0)
          0x25, 0x01, //   Logical Maximum (1)
          0x75, 0x01, //   Report Size (1)
          0x95, 0x08, //   Report Count (8)
          0x81, 0x02, //   Input (Data, Variable, Absolute)
          // Reserved byte
          0x75, 0x08, //   Report Size (8)
          0x95, 0x01, //   Report Count (1)
          0x81, 0x01, //   Input (Constant)
          // Six key rollover
          0x19, 0x00, //   Usage Minimum (0)
          0x2A, 0xFF, 0x00, //   Usage Maximum (255)
          0x15, 0x00, //   Logical Minimum (0)
          0x26, 0xFF, 0x00, //   Logical Maximum (255)
          0x75, 0x08, //   Report Size (8)
          0x95, 0x06, //   Report Count (6)
          0x81, 0x00, //   Input (Data, Array)
          0xC0, // End Collection
      )

  private val MOUSE =
      intArrayOf(
          0x05, 0x01, // Usage Page (Generic Desktop)
          0x09, 0x02, // Usage (Mouse)
          0xA1, 0x01, // Collection (Application)
          0x85, REPORT_ID_MOUSE, //   Report ID
          0x09, 0x01, //   Usage (Pointer)
          0xA1, 0x00, //   Collection (Physical)
          // 5 buttons + 3 bits padding
          0x05, 0x09, //     Usage Page (Button)
          0x19, 0x01, //     Usage Minimum (1)
          0x29, 0x05, //     Usage Maximum (5)
          0x15, 0x00, //     Logical Minimum (0)
          0x25, 0x01, //     Logical Maximum (1)
          0x75, 0x01, //     Report Size (1)
          0x95, 0x05, //     Report Count (5)
          0x81, 0x02, //     Input (Data, Variable, Absolute)
          0x75, 0x03, //     Report Size (3)
          0x95, 0x01, //     Report Count (1)
          0x81, 0x01, //     Input (Constant)
          // Relative X and Y, signed 16 bit
          0x05, 0x01, //     Usage Page (Generic Desktop)
          0x09, 0x30, //     Usage (X)
          0x09, 0x31, //     Usage (Y)
          0x16, 0x01, 0x80, //     Logical Minimum (-32767)
          0x26, 0xFF, 0x7F, //     Logical Maximum (32767)
          0x75, 0x10, //     Report Size (16)
          0x95, 0x02, //     Report Count (2)
          0x81, 0x06, //     Input (Data, Variable, Relative)
          // Wheel, signed 8 bit
          0x09, 0x38, //     Usage (Wheel)
          0x15, 0x81, //     Logical Minimum (-127)
          0x25, 0x7F, //     Logical Maximum (127)
          0x75, 0x08, //     Report Size (8)
          0x95, 0x01, //     Report Count (1)
          0x81, 0x06, //     Input (Data, Variable, Relative)
          0xC0, //   End Collection
          0xC0, // End Collection
      )

  val BYTES: ByteArray = (GAMEPAD + KEYBOARD + MOUSE).map { it.toByte() }.toByteArray()
}
