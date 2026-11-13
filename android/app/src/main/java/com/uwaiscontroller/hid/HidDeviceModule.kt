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

/** Exposes [HidDeviceManager] to JavaScript. The spec lives in src/specs/NativeHidDevice.ts. */
class HidDeviceModule(reactContext: ReactApplicationContext) : NativeHidDeviceSpec(reactContext) {

  private val manager = HidDeviceManager(reactContext) { status -> emitOnStatusChanged(status.toMap()) }
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
    manager.release()
    super.invalidate()
  }

  override fun getStatus(promise: Promise) = settle(promise) { manager.status.toMap() }

  override fun start(promise: Promise) = settle(promise) { manager.start() }

  override fun stop(promise: Promise) = settle(promise) { manager.stop() }

  override fun getPairedHosts(promise: Promise) =
      settle(promise) {
        Arguments.createArray().apply {
          manager.pairedHosts().forEach { host ->
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
      settle(promise) { manager.connect(address) }

  override fun disconnect(promise: Promise) = settle(promise) { manager.disconnect() }

  override fun requestEnable(promise: Promise) =
      launchForResult(REQUEST_ENABLE, Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE), promise)

  override fun requestDiscoverable(durationSeconds: Double, promise: Promise) {
    val intent =
        Intent(BluetoothAdapter.ACTION_REQUEST_DISCOVERABLE)
            .putExtra(BluetoothAdapter.EXTRA_DISCOVERABLE_DURATION, durationSeconds.toInt())
    launchForResult(REQUEST_DISCOVERABLE, intent, promise)
  }

  override fun sendReport(reportId: Double, data: ReadableArray) {
    val bytes = ByteArray(data.size()) { index -> data.getInt(index).toByte() }
    manager.sendReport(reportId.toInt(), bytes)
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
    private const val REQUEST_ENABLE = 7401
    private const val REQUEST_DISCOVERABLE = 7402
  }
}
