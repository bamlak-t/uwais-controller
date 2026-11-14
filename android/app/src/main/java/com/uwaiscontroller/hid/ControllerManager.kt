package com.uwaiscontroller.hid

/**
 * Common contract implemented by both classic Bluetooth HID ([HidDeviceManager])
 * and BLE Xbox HOGP ([BleXboxManager]).
 */
interface ControllerManager {
  val status: HidStatus

  fun start()

  fun stop()

  fun release()

  fun pairedHosts(): List<HidHost>

  fun connect(address: String)

  fun disconnect()

  fun sendReport(reportId: Int, data: ByteArray)
}
