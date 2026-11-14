package com.uwaiscontroller.hid

import android.app.Activity
import android.bluetooth.BluetoothAdapter
import android.content.Intent
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableMap
import com.uwaiscontroller.specs.NativeHidDeviceSpec

/**
 * Exposes [ControllerManager] (Classic Bluetooth HID or BLE Xbox Series X|S) to JavaScript.
 * The spec lives in src/specs/NativeHidDevice.ts.
 */
class HidDeviceModule(reactContext: ReactApplicationContext) : NativeHidDeviceSpec(reactContext) {

  private val classicManager = HidDeviceManager(reactContext) { status -> onManagerStatusChanged(MODE_CLASSIC, status) }
  private val bleXboxManager = BleXboxManager(reactContext) { status -> onManagerStatusChanged(MODE_XBOX_BLE, status) }

  @Volatile private var currentMode = MODE_CLASSIC

  private val activeManager: ControllerManager
    get() = if (currentMode == MODE_XBOX_BLE) bleXboxManager else classicManager

  private var pendingRequest: PendingRequest? = null

  private val activityListener =
      object : BaseActivityEventListener() {
        override fun onActivityResult(
            activity: Activity,
            requestCode: Int,
            resultCode: Int,
            data: Intent?,
        ) {
          val request = pendingRequest ?: return
          if (request.code != requestCode) return
          pendingRequest = null
          request.promise.resolve(resultCode != Activity.RESULT_CANCELED)
        }
      }

  init {
    reactContext.addActivityEventListener(activityListener)
  }

  override fun getName(): String = NAME

  override fun invalidate() {
    reactApplicationContext.removeActivityEventListener(activityListener)
    classicManager.release()
    bleXboxManager.release()
    super.invalidate()
  }

  override fun getStatus(promise: Promise) = settle(promise) { activeManager.status.toMap() }

  override fun start(promise: Promise) = settle(promise) { activeManager.start() }

  override fun stop(promise: Promise) = settle(promise) { activeManager.stop() }

  override fun getPairedHosts(promise: Promise) =
      settle(promise) {
        Arguments.createArray().apply {
          activeManager.pairedHosts().forEach { host ->
            pushMap(
                Arguments.createMap().apply {
                  putString("address", host.address)
                  putString("name", host.name)
                  putString("kind", host.kind)
                })
          }
        }
      }

  override fun connect(address: String, promise: Promise) =
      settle(promise) { activeManager.connect(address) }

  override fun disconnect(promise: Promise) = settle(promise) { activeManager.disconnect() }

  override fun requestEnable(promise: Promise) =
      launchForResult(REQUEST_ENABLE, Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE), promise)

  override fun requestDiscoverable(durationSeconds: Double, promise: Promise) {
    if (currentMode == MODE_XBOX_BLE) {
      try {
        bleXboxManager.start()
      } catch (_: Exception) {
        // Let the discoverable prompt proceed
      }
    }
    val intent =
        Intent(BluetoothAdapter.ACTION_REQUEST_DISCOVERABLE)
            .putExtra(BluetoothAdapter.EXTRA_DISCOVERABLE_DURATION, durationSeconds.toInt())
    launchForResult(REQUEST_DISCOVERABLE, intent, promise)
  }

  override fun sendReport(reportId: Double, data: ReadableArray) {
    val bytes = ByteArray(data.size()) { index -> data.getInt(index).toByte() }
    activeManager.sendReport(reportId.toInt(), bytes)
  }

  override fun setMode(mode: String, promise: Promise) =
      settle(promise) {
        val targetMode = if (mode.equals(MODE_XBOX_BLE, ignoreCase = true)) MODE_XBOX_BLE else MODE_CLASSIC
        if (targetMode != currentMode) {
          val wasRunning = activeManager.status.registered
          if (wasRunning) {
            activeManager.stop()
          }
          currentMode = targetMode
          if (wasRunning) {
            activeManager.start()
          }
          emitOnStatusChanged(activeManager.status.toMap())
        }
        null
      }

  private fun onManagerStatusChanged(mode: String, status: HidStatus) {
    if (mode == currentMode) {
      emitOnStatusChanged(status.toMap())
    }
  }

  private fun launchForResult(requestCode: Int, intent: Intent, promise: Promise) {
    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.reject("NO_ACTIVITY", "The app is not in the foreground")
      return
    }
    pendingRequest?.promise?.resolve(false)
    pendingRequest = PendingRequest(requestCode, promise)
    try {
      activity.startActivityForResult(intent, requestCode)
    } catch (error: Exception) {
      pendingRequest = null
      promise.reject("REQUEST_FAILED", error.message, error)
    }
  }

  /** Resolves [promise] with the result of [block], mapping failures to coded rejections. */
  private inline fun settle(promise: Promise, block: () -> Any?) {
    try {
      val result = block()
      promise.resolve(if (result is Unit) null else result)
    } catch (error: HidException) {
      promise.reject(error.code, error.message, error)
    } catch (error: SecurityException) {
      promise.reject("PERMISSION", "Bluetooth permission has not been granted", error)
    }
  }

  private fun HidStatus.toMap(): WritableMap =
      Arguments.createMap().apply {
        putBoolean("supported", supported)
        putBoolean("bluetoothEnabled", bluetoothEnabled)
        putBoolean("registered", registered)
        putString("connection", connection)
        putString("hostAddress", hostAddress)
        putString("hostName", hostName)
      }

  private class PendingRequest(val code: Int, val promise: Promise)

  companion object {
    const val NAME = "HidDevice"
    const val MODE_CLASSIC = "classic"
    const val MODE_XBOX_BLE = "xbox_ble"
    private const val REQUEST_ENABLE = 7401
    private const val REQUEST_DISCOVERABLE = 7402
  }
}
