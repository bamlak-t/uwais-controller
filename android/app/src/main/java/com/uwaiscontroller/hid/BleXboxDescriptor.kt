package com.uwaiscontroller.hid

import java.util.UUID

/**
 * Constants and HID report descriptor for emulating a genuine
 * Microsoft Xbox Series X|S Wireless Controller (Model 1914) over BLE.
 *
 * Windows binds xinputhid.sys natively when VID=0x045E and PID=0x0B13
 * are reported over HOGP (HID over GATT Profile).
 */
object BleXboxDescriptor {
  const val DEVICE_NAME = "Xbox Wireless Controller"
  const val MANUFACTURER = "Microsoft Corporation"
  const val MODEL_NUMBER = "Xbox Wireless Controller"
  const val SERIAL_NUMBER = "000000000001"
  const val FIRMWARE_REVISION = "5.17.3202.0"

  const val VENDOR_ID_MICROSOFT = 0x045E
  const val PRODUCT_ID_XBOX_SERIES_X = 0x0B13

  const val REPORT_ID_GAMEPAD = 1
  const val REPORT_ID_RUMBLE = 3
  const val REPORT_SIZE_GAMEPAD = 16

  // GAP Service (0x1800)
  val UUID_SERVICE_GAP: UUID = UUID.fromString("00001800-0000-1000-8000-00805f9b34fb")
  val UUID_CHAR_DEVICE_NAME: UUID = UUID.fromString("00002A00-0000-1000-8000-00805f9b34fb")
  val UUID_CHAR_APPEARANCE: UUID = UUID.fromString("00002A01-0000-1000-8000-00805f9b34fb")

  // Device Information Service (0x180A)
  val UUID_SERVICE_DIS: UUID = UUID.fromString("0000180A-0000-1000-8000-00805f9b34fb")
  val UUID_CHAR_MANUFACTURER: UUID = UUID.fromString("00002A29-0000-1000-8000-00805f9b34fb")
  val UUID_CHAR_MODEL: UUID = UUID.fromString("00002A24-0000-1000-8000-00805f9b34fb")
  val UUID_CHAR_SERIAL: UUID = UUID.fromString("00002A25-0000-1000-8000-00805f9b34fb")
  val UUID_CHAR_FIRMWARE: UUID = UUID.fromString("00002A26-0000-1000-8000-00805f9b34fb")
  val UUID_CHAR_PNP_ID: UUID = UUID.fromString("00002A50-0000-1000-8000-00805f9b34fb")

  // Battery Service (0x180F)
  val UUID_SERVICE_BAS: UUID = UUID.fromString("0000180F-0000-1000-8000-00805f9b34fb")
  val UUID_CHAR_BATTERY_LEVEL: UUID = UUID.fromString("00002A19-0000-1000-8000-00805f9b34fb")

  // Human Interface Device Service (0x1812)
  val UUID_SERVICE_HIDS: UUID = UUID.fromString("00001812-0000-1000-8000-00805f9b34fb")
  val UUID_CHAR_HID_INFO: UUID = UUID.fromString("00002A4A-0000-1000-8000-00805f9b34fb")
  val UUID_CHAR_REPORT_MAP: UUID = UUID.fromString("00002A4B-0000-1000-8000-00805f9b34fb")
  val UUID_CHAR_HID_CONTROL_POINT: UUID = UUID.fromString("00002A4C-0000-1000-8000-00805f9b34fb")
  val UUID_CHAR_REPORT: UUID = UUID.fromString("00002A4D-0000-1000-8000-00805f9b34fb")
  val UUID_CHAR_PROTOCOL_MODE: UUID = UUID.fromString("00002A4E-0000-1000-8000-00805f9b34fb")

  // Descriptors
  val UUID_DESC_CCCD: UUID = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb")
  val UUID_DESC_REPORT_REFERENCE: UUID = UUID.fromString("00002908-0000-1000-8000-00805f9b34fb")

  /** Appearance: Gamepad (0x03C4, little-endian: 0xC4, 0x03) */
  val APPEARANCE = byteArrayOf(0xC4.toByte(), 0x03.toByte())

  /**
   * PnP ID (0x2A50): 7 bytes
   * [0] Vendor ID Source: 0x02 (USB Implementers Forum)
   * [1..2] Vendor ID: 0x045E (Microsoft) -> 0x5E, 0x04
   * [3..4] Product ID: 0x0B13 (Xbox Series X|S) -> 0x13, 0x0B
   * [5..6] Product Version: 0x0517 -> 0x17, 0x05
   */
  val PNP_ID = byteArrayOf(0x02, 0x5E.toByte(), 0x04, 0x13, 0x0B, 0x17, 0x05)

  /** Battery Level: 100% */
  val BATTERY_LEVEL = byteArrayOf(100.toByte())

  /**
   * HID Information (0x2A4A): 4 bytes
   * [0..1] bcdHID: 0x0101 (v1.01)
   * [2] bCountryCode: 0x00
   * [3] Flags: 0x02 (NormallyConnectable)
   */
  val HID_INFO = byteArrayOf(0x01, 0x01, 0x00, 0x02)

  /** Protocol Mode: 0x01 (Report Mode) */
  val PROTOCOL_MODE = byteArrayOf(0x01)

  /** Report Reference descriptor for Input Report (Report ID 1, Type 1 = Input) */
  val REPORT_REF_INPUT = byteArrayOf(REPORT_ID_GAMEPAD.toByte(), 0x01)

  /** Report Reference descriptor for Output Report (Report ID 3, Type 2 = Output) */
  val REPORT_REF_OUTPUT = byteArrayOf(REPORT_ID_RUMBLE.toByte(), 0x02)

  /**
   * Initial neutral 16-byte Xbox input report:
   * Sticks centered (0x8000 / 32768), triggers at 0, hat centered (0), buttons released.
   */
  val NEUTRAL_REPORT =
      byteArrayOf(
          0x00, 0x80.toByte(), // LX (32768)
          0x00, 0x80.toByte(), // LY (32768)
          0x00, 0x80.toByte(), // RX (32768)
          0x00, 0x80.toByte(), // RY (32768)
          0x00, 0x00,         // LT (0)
          0x00, 0x00,         // RT (0)
          0x00,               // Hat (0 = Centered)
          0x00, 0x00,         // Buttons (0)
          0x00                // Share (0)
      )

  /**
   * Standard 283-byte HID report descriptor of the Xbox Series X|S Wireless Controller over BLE.
   */
  val REPORT_MAP: ByteArray =
      intArrayOf(
          0x05, 0x01, // Usage Page (Generic Desktop)
          0x09, 0x05, // Usage (Game Pad)
          0xA1, 0x01, // Collection (Application)
          0x85, 0x01, //   Report ID (1)
          0x09, 0x01, //   Usage (Pointer)
          0xA1, 0x00, //   Collection (Physical)
          0x09, 0x30, //     Usage (X)
          0x09, 0x31, //     Usage (Y)
          0x15, 0x00, //     Logical Minimum (0)
          0x27, 0xFF, 0xFF, 0x00, 0x00, // Logical Maximum (65535)
          0x95, 0x02, //     Report Count (2)
          0x75, 0x10, //     Report Size (16)
          0x81, 0x02, //     Input (Data, Variable, Absolute)
          0xC0,       //   End Collection
          0x09, 0x01, //   Usage (Pointer)
          0xA1, 0x00, //   Collection (Physical)
          0x09, 0x33, //     Usage (Rx)
          0x09, 0x34, //     Usage (Ry)
          0x15, 0x00, //     Logical Minimum (0)
          0x27, 0xFF, 0xFF, 0x00, 0x00, // Logical Maximum (65535)
          0x95, 0x02, //     Report Count (2)
          0x75, 0x10, //     Report Size (16)
          0x81, 0x02, //     Input (Data, Variable, Absolute)
          0xC0,       //   End Collection
          0x05, 0x01, //   Usage Page (Generic Desktop)
          0x09, 0x32, //   Usage (Z) - Left Trigger
          0x15, 0x00, //   Logical Minimum (0)
          0x26, 0xFF, 0x03, // Logical Maximum (1023)
          0x95, 0x01, //   Report Count (1)
          0x75, 0x0A, //   Report Size (10)
          0x81, 0x02, //   Input (Data, Variable, Absolute)
          0x15, 0x00, //   Logical Minimum (0)
          0x25, 0x00, //   Logical Maximum (0)
          0x75, 0x06, //   Report Size (6)
          0x95, 0x01, //   Report Count (1)
          0x81, 0x03, //   Input (Constant) - Padding
          0x05, 0x01, //   Usage Page (Generic Desktop)
          0x09, 0x35, //   Usage (Rz) - Right Trigger
          0x15, 0x00, //   Logical Minimum (0)
          0x26, 0xFF, 0x03, // Logical Maximum (1023)
          0x95, 0x01, //   Report Count (1)
          0x75, 0x0A, //   Report Size (10)
          0x81, 0x02, //   Input (Data, Variable, Absolute)
          0x15, 0x00, //   Logical Minimum (0)
          0x25, 0x00, //   Logical Maximum (0)
          0x75, 0x06, //   Report Size (6)
          0x95, 0x01, //   Report Count (1)
          0x81, 0x03, //   Input (Constant) - Padding
          0x05, 0x01, //   Usage Page (Generic Desktop)
          0x09, 0x39, //   Usage (Hat switch) - D-pad
          0x15, 0x01, //   Logical Minimum (1)
          0x25, 0x08, //   Logical Maximum (8)
          0x35, 0x00, //   Physical Minimum (0)
          0x46, 0x3B, 0x01, // Physical Maximum (315)
          0x66, 0x14, 0x00, // Unit (English Rotation)
          0x75, 0x04, //   Report Size (4)
          0x95, 0x01, //   Report Count (1)
          0x81, 0x42, //   Input (Data, Variable, Absolute, Null State)
          0x75, 0x04, //   Report Size (4)
          0x95, 0x01, //   Report Count (1)
          0x15, 0x00, //   Logical Minimum (0)
          0x25, 0x00, //   Logical Maximum (0)
          0x35, 0x00, //   Physical Minimum (0)
          0x45, 0x00, //   Physical Maximum (0)
          0x65, 0x00, //   Unit (None)
          0x81, 0x03, //   Input (Constant) - Padding
          0x05, 0x09, //   Usage Page (Button)
          0x19, 0x01, //   Usage Minimum (1)
          0x29, 0x0C, //   Usage Maximum (12)
          0x15, 0x00, //   Logical Minimum (0)
          0x25, 0x01, //   Logical Maximum (1)
          0x75, 0x01, //   Report Size (1)
          0x95, 0x0C, //   Report Count (12)
          0x81, 0x02, //   Input (Data, Variable, Absolute)
          0x15, 0x00, //   Logical Minimum (0)
          0x25, 0x00, //   Logical Maximum (0)
          0x75, 0x01, //   Report Size (1)
          0x95, 0x04, //   Report Count (4)
          0x81, 0x03, //   Input (Constant) - Padding
          0x05, 0x0C, //   Usage Page (Consumer)
          0x0A, 0xB2, 0x00, // Usage (Record - Share button)
          0x15, 0x00, //   Logical Minimum (0)
          0x25, 0x01, //   Logical Maximum (1)
          0x95, 0x01, //   Report Count (1)
          0x75, 0x01, //   Report Size (1)
          0x81, 0x02, //   Input (Data, Variable, Absolute)
          0x15, 0x00, //   Logical Minimum (0)
          0x25, 0x00, //   Logical Maximum (0)
          0x75, 0x07, //   Report Size (7)
          0x95, 0x01, //   Report Count (1)
          0x81, 0x03, //   Input (Constant) - Padding
          0x05, 0x0F, //   Usage Page (Physical Interface Device)
          0x09, 0x21, //   Usage (Set Effect Report)
          0x85, 0x03, //   Report ID (3)
          0xA1, 0x02, //   Collection (Logical)
          0x09, 0x97, //     Usage (Duration)
          0x15, 0x00, //     Logical Minimum (0)
          0x25, 0x01, //     Logical Maximum (1)
          0x75, 0x04, //     Report Size (4)
          0x95, 0x01, //     Report Count (1)
          0x91, 0x02, //     Output (Data, Variable, Absolute)
          0x15, 0x00, //     Logical Minimum (0)
          0x25, 0x00, //     Logical Maximum (0)
          0x75, 0x04, //     Report Size (4)
          0x95, 0x01, //     Report Count (1)
          0x91, 0x03, //     Output (Constant)
          0x09, 0x70, //     Usage (Magnitude)
          0x15, 0x00, //     Logical Minimum (0)
          0x25, 0x64, //     Logical Maximum (100)
          0x75, 0x08, //     Report Size (8)
          0x95, 0x04, //     Report Count (4)
          0x91, 0x02, //     Output (Data, Variable, Absolute)
          0x09, 0x50, //     Usage (Duration)
          0x66, 0x01, 0x10, // Unit (Seconds)
          0x55, 0x0E, //     Unit Exponent (-2)
          0x15, 0x00, //     Logical Minimum (0)
          0x26, 0xFF, 0x00, // Logical Maximum (255)
          0x75, 0x08, //     Report Size (8)
          0x95, 0x01, //     Report Count (1)
          0x91, 0x02, //     Output (Data, Variable, Absolute)
          0x09, 0xA7, //     Usage (Start Delay)
          0x15, 0x00, //     Logical Minimum (0)
          0x26, 0xFF, 0x00, // Logical Maximum (255)
          0x75, 0x08, //     Report Size (8)
          0x95, 0x01, //     Report Count (1)
          0x91, 0x02, //     Output (Data, Variable, Absolute)
          0x65, 0x00, //     Unit (None)
          0x55, 0x00, //     Unit Exponent (0)
          0x09, 0x7C, //     Usage (Loop Count)
          0x15, 0x00, //     Logical Minimum (0)
          0x26, 0xFF, 0x00, // Logical Maximum (255)
          0x75, 0x08, //     Report Size (8)
          0x95, 0x01, //     Report Count (1)
          0x91, 0x02, //     Output (Data, Variable, Absolute)
          0xC0,       //   End Collection
          0xC0        // End Collection
      ).map { it.toByte() }.toByteArray()
}
