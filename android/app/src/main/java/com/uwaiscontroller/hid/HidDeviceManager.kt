package com.uwaiscontroller.hid

import android.Manifest
import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothClass
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothHidDevice
import android.bluetooth.BluetoothHidDeviceAppSdpSettings
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothProfile
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.ContextCompat

data class HidStatus(
    val supported: Boolean,
    val bluetoothEnabled: Boolean,
    val registered: Boolean,
    val connection: String,
    val hostAddress: String,
    val hostName: String,
)

data class HidHost(val address: String, val name: String, val kind: String)

class HidException(val code: String, message: String) : Exception(message)

/**
 * Owns the Bluetooth HID device profile: registers this phone as a HID peripheral, tracks the
 * connected host and pushes input reports to it.
 */
@SuppressLint("MissingPermission") // Guarded by requireConnectPermission().
class HidDeviceManager(
    private val context: Context,
    private val onStatusChanged: (HidStatus) -> Unit,
) {
  private val adapter: BluetoothAdapter? =
      context.getSystemService(BluetoothManager::class.java)?.adapter

  @Volatile private var hidDevice: BluetoothHidDevice? = null
  @Volatile private var host: BluetoothDevice? = null
  @Volatile private var connectionState = BluetoothProfile.STATE_DISCONNECTED
  @Volatile private var registered = false
  @Volatile private var profileSupported = adapter != null
  private var proxyRequested = false
  private val lastReports = HashMap<Int, ByteArray>()

  private val sdpSettings =
      BluetoothHidDeviceAppSdpSettings(
          "Uwais Controller",
          "Gamepad, keyboard and mouse",
          "Uwais",
          (BluetoothHidDevice.SUBCLASS1_COMBO.toInt() or BluetoothHidDevice.SUBCLASS2_GAMEPAD.toInt())
              .toByte(),
          HidDescriptor.BYTES,
      )

  private val serviceListener =
      object : BluetoothProfile.ServiceListener {
        override fun onServiceConnected(profile: Int, proxy: BluetoothProfile) {
          hidDevice = proxy as BluetoothHidDevice
          registerApp()
        }

        override fun onServiceDisconnected(profile: Int) {
          hidDevice = null
          proxyRequested = false
          resetConnection()
        }
      }

  private val hidCallback =
      object : BluetoothHidDevice.Callback() {
        override fun onAppStatusChanged(pluggedDevice: BluetoothDevice?, isRegistered: Boolean) {
          registered = isRegistered
          if (!isRegistered) {
            host = null
            connectionState = BluetoothProfile.STATE_DISCONNECTED
          }
          notifyStatus()
        }

        override fun onConnectionStateChanged(device: BluetoothDevice, state: Int) {
          connectionState = state
          host = if (state == BluetoothProfile.STATE_DISCONNECTED) null else device
          notifyStatus()
        }

        override fun onGetReport(device: BluetoothDevice, type: Byte, id: Byte, bufferSize: Int) {
          val reportId = id.toInt()
          val size = HidDescriptor.REPORT_SIZES[reportId]
          if (type != BluetoothHidDevice.REPORT_TYPE_INPUT || size == null) {
            hidDevice?.reportError(device, BluetoothHidDevice.ERROR_RSP_INVALID_RPT_ID)
            return
          }
          val report = synchronized(lastReports) { lastReports[reportId] } ?: ByteArray(size)
          hidDevice?.replyReport(device, type, id, report)
        }

        override fun onSetReport(device: BluetoothDevice, type: Byte, id: Byte, data: ByteArray) {
          hidDevice?.reportError(device, BluetoothHidDevice.ERROR_RSP_SUCCESS)
        }
      }

  private val adapterStateReceiver =
      object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
          val state = intent.getIntExtra(BluetoothAdapter.EXTRA_STATE, BluetoothAdapter.ERROR)
          if (state == BluetoothAdapter.STATE_OFF) {
            resetConnection()
          } else if (state == BluetoothAdapter.STATE_ON) {
            notifyStatus()
          }
        }
      }

  init {
    ContextCompat.registerReceiver(
        context,
        adapterStateReceiver,
        IntentFilter(BluetoothAdapter.ACTION_STATE_CHANGED),
        ContextCompat.RECEIVER_NOT_EXPORTED,
    )
  }

  val status: HidStatus
    get() {
      val device = host
      val canReadName = hasConnectPermission()
      return HidStatus(
          supported = profileSupported,
          bluetoothEnabled = adapter?.isEnabled == true,
          registered = registered,
          connection = connectionName(connectionState),
          hostAddress = device?.address ?: "",
          hostName = if (device != null && canReadName) device.name ?: device.address else "",
      )
    }

  /** Binds to the HID device profile and registers the app. Safe to call repeatedly. */
  fun start() {
    val adapter = requireAdapter()
    requireConnectPermission()
    if (!adapter.isEnabled) {
      throw HidException("BLUETOOTH_OFF", "Bluetooth is turned off")
    }
    if (hidDevice != null) {
      if (!registered) registerApp()
      return
    }
    if (proxyRequested) return

    proxyRequested =
        adapter.getProfileProxy(context, serviceListener, BluetoothProfile.HID_DEVICE)
    if (!proxyRequested) {
      profileSupported = false
      notifyStatus()
      throw HidException("UNSUPPORTED", "This phone does not support the Bluetooth HID device profile")
    }
  }

  fun stop() {
    val proxy = hidDevice ?: return
    if (hasConnectPermission()) {
      host?.let { proxy.disconnect(it) }
      proxy.unregisterApp()
    }
  }

  /** Releases every system resource. The manager cannot be used afterwards. */
  fun release() {
    context.unregisterReceiver(adapterStateReceiver)
    stop()
    hidDevice?.let { adapter?.closeProfileProxy(BluetoothProfile.HID_DEVICE, it) }
    hidDevice = null
  }

  fun pairedHosts(): List<HidHost> {
    val adapter = requireAdapter()
    requireConnectPermission()
    return adapter.bondedDevices.map { HidHost(it.address, it.name ?: it.address, deviceKind(it)) }
  }

  fun connect(address: String) {
    val adapter = requireAdapter()
    requireConnectPermission()
    val proxy = hidDevice
    if (proxy == null || !registered) {
      throw HidException("NOT_REGISTERED", "The controller is not ready yet")
    }
    if (!BluetoothAdapter.checkBluetoothAddress(address)) {
      throw HidException("INVALID_ADDRESS", "Invalid Bluetooth address: $address")
    }
    if (!proxy.connect(adapter.getRemoteDevice(address))) {
      throw HidException("CONNECT_FAILED", "Could not start connecting to the host")
    }
  }

  fun disconnect() {
    requireConnectPermission()
    val device = host ?: return
    hidDevice?.disconnect(device)
  }

  /** Sends an input report to the connected host. Silently dropped while disconnected. */
  fun sendReport(reportId: Int, data: ByteArray) {
    synchronized(lastReports) { lastReports[reportId] = data }
    if (connectionState != BluetoothProfile.STATE_CONNECTED) return
    val device = host ?: return
    try {
      hidDevice?.sendReport(device, reportId, data)
    } catch (_: SecurityException) {
      // Permission was revoked while connected; the next status refresh surfaces it.
    }
  }

  private fun registerApp() {
    if (!hasConnectPermission()) return
    hidDevice?.registerApp(sdpSettings, null, null, context.mainExecutor, hidCallback)
  }

  private fun resetConnection() {
    registered = false
    host = null
    connectionState = BluetoothProfile.STATE_DISCONNECTED
    notifyStatus()
  }

  private fun notifyStatus() = onStatusChanged(status)

  private fun requireAdapter(): BluetoothAdapter =
      adapter ?: throw HidException("UNSUPPORTED", "This device has no Bluetooth adapter")

  private fun requireConnectPermission() {
    if (!hasConnectPermission()) {
      throw HidException("PERMISSION", "Bluetooth permission has not been granted")
    }
  }

  private fun hasConnectPermission(): Boolean =
      Build.VERSION.SDK_INT < Build.VERSION_CODES.S ||
          ContextCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_CONNECT) ==
              PackageManager.PERMISSION_GRANTED

  private fun connectionName(state: Int): String =
      when (state) {
        BluetoothProfile.STATE_CONNECTED -> "connected"
        BluetoothProfile.STATE_CONNECTING -> "connecting"
        BluetoothProfile.STATE_DISCONNECTING -> "disconnecting"
        else -> "disconnected"
      }

  private fun deviceKind(device: BluetoothDevice): String =
      when (device.bluetoothClass?.majorDeviceClass) {
        BluetoothClass.Device.Major.COMPUTER -> "computer"
        BluetoothClass.Device.Major.PHONE -> "phone"
        BluetoothClass.Device.Major.AUDIO_VIDEO -> "tv"
        else -> "other"
      }
}
