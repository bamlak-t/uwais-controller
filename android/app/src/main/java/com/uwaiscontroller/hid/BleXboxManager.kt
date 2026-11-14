package com.uwaiscontroller.hid

import android.Manifest
import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothClass
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattDescriptor
import android.bluetooth.BluetoothGattServer
import android.bluetooth.BluetoothGattServerCallback
import android.bluetooth.BluetoothGattService
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothProfile
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.bluetooth.le.BluetoothLeAdvertiser
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.os.ParcelUuid
import androidx.core.content.ContextCompat
import java.util.concurrent.ConcurrentHashMap

/**
 * Emulates a genuine Microsoft Xbox Series X|S Wireless Controller (Model 1914) over BLE
 * using BluetoothLeAdvertiser and BluetoothGattServer (HOGP - HID over GATT Profile).
 *
 * Windows 10/11 natively binds xinputhid.sys to this device via VID 0x045E and PID 0x0B13,
 * providing native XInput support across all games with zero extra software required.
 */
@SuppressLint("MissingPermission") // Guarded by permission helper methods.
class BleXboxManager(
    private val context: Context,
    private val onStatusChanged: (HidStatus) -> Unit,
) : ControllerManager {

  private val bluetoothManager: BluetoothManager? =
      context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
  private val adapter: BluetoothAdapter? = bluetoothManager?.adapter

  @Volatile private var gattServer: BluetoothGattServer? = null
  @Volatile private var advertiser: BluetoothLeAdvertiser? = null
  @Volatile private var host: BluetoothDevice? = null
  @Volatile private var connectionState = BluetoothProfile.STATE_DISCONNECTED
  @Volatile private var registered = false
  @Volatile private var started = false

  private var inputReportCharacteristic: BluetoothGattCharacteristic? = null
  private val clientNotificationsEnabled = ConcurrentHashMap<String, Boolean>()
  private var lastReport: ByteArray = BleXboxDescriptor.NEUTRAL_REPORT.copyOf()
  private var originalAdapterName: String? = null

  private val advertiseCallback =
      object : AdvertiseCallback() {
        override fun onStartSuccess(settingsInEffect: AdvertiseSettings) {
          registered = true
          notifyStatus()
        }

        override fun onStartFailure(errorCode: Int) {
          registered = false
          notifyStatus()
        }
      }

  private val gattServerCallback =
      object : BluetoothGattServerCallback() {
        override fun onConnectionStateChange(device: BluetoothDevice, status: Int, newState: Int) {
          if (newState == BluetoothProfile.STATE_CONNECTED) {
            host = device
            connectionState = BluetoothProfile.STATE_CONNECTED
            notifyStatus()
          } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
            if (host?.address == device.address) {
              host = null
              connectionState = BluetoothProfile.STATE_DISCONNECTED
              clientNotificationsEnabled.remove(device.address)
              notifyStatus()
              // Resume advertising so hosts can reconnect or other hosts can discover the controller
              if (started) {
                startAdvertising()
              }
            }
          }
        }

        override fun onCharacteristicReadRequest(
            device: BluetoothDevice,
            requestId: Int,
            offset: Int,
            characteristic: BluetoothGattCharacteristic,
        ) {
          val value =
              when (characteristic.uuid) {
                BleXboxDescriptor.UUID_CHAR_DEVICE_NAME ->
                    BleXboxDescriptor.DEVICE_NAME.toByteArray(Charsets.UTF_8)
                BleXboxDescriptor.UUID_CHAR_APPEARANCE -> BleXboxDescriptor.APPEARANCE
                BleXboxDescriptor.UUID_CHAR_MANUFACTURER ->
                    BleXboxDescriptor.MANUFACTURER.toByteArray(Charsets.UTF_8)
                BleXboxDescriptor.UUID_CHAR_MODEL ->
                    BleXboxDescriptor.MODEL_NUMBER.toByteArray(Charsets.UTF_8)
                BleXboxDescriptor.UUID_CHAR_SERIAL ->
                    BleXboxDescriptor.SERIAL_NUMBER.toByteArray(Charsets.UTF_8)
                BleXboxDescriptor.UUID_CHAR_FIRMWARE ->
                    BleXboxDescriptor.FIRMWARE_REVISION.toByteArray(Charsets.UTF_8)
                BleXboxDescriptor.UUID_CHAR_PNP_ID -> BleXboxDescriptor.PNP_ID
                BleXboxDescriptor.UUID_CHAR_BATTERY_LEVEL -> BleXboxDescriptor.BATTERY_LEVEL
                BleXboxDescriptor.UUID_CHAR_HID_INFO -> BleXboxDescriptor.HID_INFO
                BleXboxDescriptor.UUID_CHAR_PROTOCOL_MODE -> BleXboxDescriptor.PROTOCOL_MODE
                BleXboxDescriptor.UUID_CHAR_REPORT_MAP -> BleXboxDescriptor.REPORT_MAP
                BleXboxDescriptor.UUID_CHAR_REPORT -> {
                  if (characteristic == inputReportCharacteristic) {
                    synchronized(lastReport) { lastReport.copyOf() }
                  } else {
                    ByteArray(8)
                  }
                }
                else -> characteristic.value ?: ByteArray(0)
              }

          if (offset > value.size) {
            gattServer?.sendResponse(
                device, requestId, BluetoothGatt.GATT_INVALID_OFFSET, offset, null)
            return
          }
          val sliced = if (offset == 0) value else value.copyOfRange(offset, value.size)
          gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, sliced)
        }

        override fun onCharacteristicWriteRequest(
            device: BluetoothDevice,
            requestId: Int,
            characteristic: BluetoothGattCharacteristic,
            preparedWrite: Boolean,
            responseNeeded: Boolean,
            offset: Int,
            value: ByteArray,
        ) {
          when (characteristic.uuid) {
            BleXboxDescriptor.UUID_CHAR_PROTOCOL_MODE -> {
              // Write to protocol mode acknowledged
            }
            BleXboxDescriptor.UUID_CHAR_HID_CONTROL_POINT -> {
              // Control point command acknowledged
            }
            BleXboxDescriptor.UUID_CHAR_REPORT -> {
              // Output report 3 (Rumble/Haptics data from host)
            }
          }
          if (responseNeeded) {
            gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, value)
          }
        }

        override fun onDescriptorReadRequest(
            device: BluetoothDevice,
            requestId: Int,
            offset: Int,
            descriptor: BluetoothGattDescriptor,
        ) {
          val value =
              when (descriptor.uuid) {
                BleXboxDescriptor.UUID_DESC_CCCD -> {
                  val enabled = clientNotificationsEnabled[device.address] == true
                  if (enabled) BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE
                  else BluetoothGattDescriptor.DISABLE_NOTIFICATION_VALUE
                }
                BleXboxDescriptor.UUID_DESC_REPORT_REFERENCE -> {
                  descriptor.value ?: BleXboxDescriptor.REPORT_REF_INPUT
                }
                else -> descriptor.value ?: ByteArray(0)
              }

          if (offset > value.size) {
            gattServer?.sendResponse(
                device, requestId, BluetoothGatt.GATT_INVALID_OFFSET, offset, null)
            return
          }
          val sliced = if (offset == 0) value else value.copyOfRange(offset, value.size)
          gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, sliced)
        }

        override fun onDescriptorWriteRequest(
            device: BluetoothDevice,
            requestId: Int,
            descriptor: BluetoothGattDescriptor,
            preparedWrite: Boolean,
            responseNeeded: Boolean,
            offset: Int,
            value: ByteArray,
        ) {
          if (descriptor.uuid == BleXboxDescriptor.UUID_DESC_CCCD) {
            val enabled = value.contentEquals(BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE)
            clientNotificationsEnabled[device.address] = enabled
          }
          if (responseNeeded) {
            gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, value)
          }
        }
      }

  private val adapterStateReceiver =
      object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
          val state = intent.getIntExtra(BluetoothAdapter.EXTRA_STATE, BluetoothAdapter.ERROR)
          if (state == BluetoothAdapter.STATE_OFF) {
            resetConnection()
          } else if (state == BluetoothAdapter.STATE_ON) {
            if (started) {
              start()
            } else {
              notifyStatus()
            }
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

  override val status: HidStatus
    get() {
      val device = host
      val canReadName = hasConnectPermission()
      val isSupported = adapter != null && (adapter.bluetoothLeAdvertiser != null || adapter.isMultipleAdvertisementSupported)
      return HidStatus(
          supported = isSupported,
          bluetoothEnabled = adapter?.isEnabled == true,
          registered = registered,
          connection = connectionName(connectionState),
          hostAddress = device?.address ?: "",
          hostName = if (device != null && canReadName) device.name ?: device.address else "",
      )
    }

  override fun start() {
    val bAdapter = requireAdapter()
    requirePermissions()
    if (!bAdapter.isEnabled) {
      throw HidException("BLUETOOTH_OFF", "Bluetooth is turned off")
    }

    started = true
    setupGattServer()
    renameAdapterIfNeeded()
    startAdvertising()
  }

  override fun stop() {
    started = false
    stopAdvertising()
    restoreAdapterName()

    if (hasConnectPermission()) {
      host?.let { gattServer?.cancelConnection(it) }
    }

    registered = false
    host = null
    connectionState = BluetoothProfile.STATE_DISCONNECTED
    clientNotificationsEnabled.clear()
    notifyStatus()
  }

  override fun release() {
    context.unregisterReceiver(adapterStateReceiver)
    stop()
    gattServer?.close()
    gattServer = null
  }

  override fun pairedHosts(): List<HidHost> {
    val bAdapter = requireAdapter()
    requirePermissions()
    return bAdapter.bondedDevices.map { HidHost(it.address, it.name ?: it.address, deviceKind(it)) }
  }

  override fun connect(address: String) {
    val bAdapter = requireAdapter()
    requirePermissions()
    if (!BluetoothAdapter.checkBluetoothAddress(address)) {
      throw HidException("INVALID_ADDRESS", "Invalid Bluetooth address: $address")
    }
    val device = bAdapter.getRemoteDevice(address)
    val server = gattServer ?: throw HidException("NOT_REGISTERED", "The BLE controller is not ready yet")
    if (!server.connect(device, false)) {
      throw HidException("CONNECT_FAILED", "Could not start connecting to the host")
    }
    connectionState = BluetoothProfile.STATE_CONNECTING
    host = device
    notifyStatus()
  }

  override fun disconnect() {
    requirePermissions()
    val device = host ?: return
    gattServer?.cancelConnection(device)
  }

  override fun sendReport(reportId: Int, data: ByteArray) {
    if (reportId != BleXboxDescriptor.REPORT_ID_GAMEPAD) return
    if (data.size != BleXboxDescriptor.REPORT_SIZE_GAMEPAD) return

    synchronized(lastReport) {
      data.copyInto(lastReport)
    }

    if (connectionState != BluetoothProfile.STATE_CONNECTED) return
    val device = host ?: return
    val characteristic = inputReportCharacteristic ?: return
    if (clientNotificationsEnabled[device.address] != true) return

    try {
      val server = gattServer ?: return
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        server.notifyCharacteristicChanged(device, characteristic, false, data)
      } else {
        @Suppress("DEPRECATION")
        characteristic.value = data
        @Suppress("DEPRECATION")
        server.notifyCharacteristicChanged(device, characteristic, false)
      }
    } catch (_: SecurityException) {
      // Permission revoked while connected
    }
  }

  private fun setupGattServer() {
    if (gattServer != null) return
    val bManager = bluetoothManager ?: throw HidException("UNSUPPORTED", "BluetoothManager is not available")
    val server = bManager.openGattServer(context, gattServerCallback)
        ?: throw HidException("UNSUPPORTED", "Failed to open BluetoothGattServer")

    buildGattServices().forEach { service ->
      server.addService(service)
    }

    gattServer = server
  }

  private fun buildGattServices(): List<BluetoothGattService> {
    val services = mutableListOf<BluetoothGattService>()

    // 1. Generic Access Service (0x1800)
    val gapService =
        BluetoothGattService(
            BleXboxDescriptor.UUID_SERVICE_GAP,
            BluetoothGattService.SERVICE_TYPE_PRIMARY,
        )
    val nameChar =
        BluetoothGattCharacteristic(
            BleXboxDescriptor.UUID_CHAR_DEVICE_NAME,
            BluetoothGattCharacteristic.PROPERTY_READ,
            BluetoothGattCharacteristic.PERMISSION_READ,
        )
    val appearanceChar =
        BluetoothGattCharacteristic(
            BleXboxDescriptor.UUID_CHAR_APPEARANCE,
            BluetoothGattCharacteristic.PROPERTY_READ,
            BluetoothGattCharacteristic.PERMISSION_READ,
        )
    gapService.addCharacteristic(nameChar)
    gapService.addCharacteristic(appearanceChar)
    services.add(gapService)

    // 2. Device Information Service (0x180A)
    val disService =
        BluetoothGattService(
            BleXboxDescriptor.UUID_SERVICE_DIS,
            BluetoothGattService.SERVICE_TYPE_PRIMARY,
        )
    val mfrChar =
        BluetoothGattCharacteristic(
            BleXboxDescriptor.UUID_CHAR_MANUFACTURER,
            BluetoothGattCharacteristic.PROPERTY_READ,
            BluetoothGattCharacteristic.PERMISSION_READ,
        )
    val modelChar =
        BluetoothGattCharacteristic(
            BleXboxDescriptor.UUID_CHAR_MODEL,
            BluetoothGattCharacteristic.PROPERTY_READ,
            BluetoothGattCharacteristic.PERMISSION_READ,
        )
    val serialChar =
        BluetoothGattCharacteristic(
            BleXboxDescriptor.UUID_CHAR_SERIAL,
            BluetoothGattCharacteristic.PROPERTY_READ,
            BluetoothGattCharacteristic.PERMISSION_READ,
        )
    val firmwareChar =
        BluetoothGattCharacteristic(
            BleXboxDescriptor.UUID_CHAR_FIRMWARE,
            BluetoothGattCharacteristic.PROPERTY_READ,
            BluetoothGattCharacteristic.PERMISSION_READ,
        )
    val pnpChar =
        BluetoothGattCharacteristic(
            BleXboxDescriptor.UUID_CHAR_PNP_ID,
            BluetoothGattCharacteristic.PROPERTY_READ,
            BluetoothGattCharacteristic.PERMISSION_READ,
        )
    disService.addCharacteristic(mfrChar)
    disService.addCharacteristic(modelChar)
    disService.addCharacteristic(serialChar)
    disService.addCharacteristic(firmwareChar)
    disService.addCharacteristic(pnpChar)
    services.add(disService)

    // 3. Battery Service (0x180F)
    val basService =
        BluetoothGattService(
            BleXboxDescriptor.UUID_SERVICE_BAS,
            BluetoothGattService.SERVICE_TYPE_PRIMARY,
        )
    val batteryChar =
        BluetoothGattCharacteristic(
            BleXboxDescriptor.UUID_CHAR_BATTERY_LEVEL,
            BluetoothGattCharacteristic.PROPERTY_READ or BluetoothGattCharacteristic.PROPERTY_NOTIFY,
            BluetoothGattCharacteristic.PERMISSION_READ,
        )
    val batteryCccd =
        BluetoothGattDescriptor(
            BleXboxDescriptor.UUID_DESC_CCCD,
            BluetoothGattDescriptor.PERMISSION_READ or BluetoothGattDescriptor.PERMISSION_WRITE,
        )
    batteryChar.addDescriptor(batteryCccd)
    basService.addCharacteristic(batteryChar)
    services.add(basService)

    // 4. Human Interface Device Service (0x1812)
    val hidService =
        BluetoothGattService(
            BleXboxDescriptor.UUID_SERVICE_HIDS,
            BluetoothGattService.SERVICE_TYPE_PRIMARY,
        )
    val hidInfoChar =
        BluetoothGattCharacteristic(
            BleXboxDescriptor.UUID_CHAR_HID_INFO,
            BluetoothGattCharacteristic.PROPERTY_READ,
            BluetoothGattCharacteristic.PERMISSION_READ,
        )
    val protocolModeChar =
        BluetoothGattCharacteristic(
            BleXboxDescriptor.UUID_CHAR_PROTOCOL_MODE,
            BluetoothGattCharacteristic.PROPERTY_READ or
                BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE,
            BluetoothGattCharacteristic.PERMISSION_READ or
                BluetoothGattCharacteristic.PERMISSION_WRITE,
        )
    val controlPointChar =
        BluetoothGattCharacteristic(
            BleXboxDescriptor.UUID_CHAR_HID_CONTROL_POINT,
            BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE,
            BluetoothGattCharacteristic.PERMISSION_WRITE,
        )
    val reportMapChar =
        BluetoothGattCharacteristic(
            BleXboxDescriptor.UUID_CHAR_REPORT_MAP,
            BluetoothGattCharacteristic.PROPERTY_READ,
            BluetoothGattCharacteristic.PERMISSION_READ,
        )

    // Input Report (Report ID 1)
    val inputReportChar =
        BluetoothGattCharacteristic(
            BleXboxDescriptor.UUID_CHAR_REPORT,
            BluetoothGattCharacteristic.PROPERTY_READ or
                BluetoothGattCharacteristic.PROPERTY_NOTIFY,
            BluetoothGattCharacteristic.PERMISSION_READ,
        )
    val inputCccd =
        BluetoothGattDescriptor(
            BleXboxDescriptor.UUID_DESC_CCCD,
            BluetoothGattDescriptor.PERMISSION_READ or BluetoothGattDescriptor.PERMISSION_WRITE,
        )
    val inputRefDesc =
        BluetoothGattDescriptor(
            BleXboxDescriptor.UUID_DESC_REPORT_REFERENCE,
            BluetoothGattDescriptor.PERMISSION_READ,
        ).apply {
          @Suppress("DEPRECATION")
          value = BleXboxDescriptor.REPORT_REF_INPUT
        }
    inputReportChar.addDescriptor(inputCccd)
    inputReportChar.addDescriptor(inputRefDesc)
    inputReportCharacteristic = inputReportChar

    // Output Report (Report ID 3 - Rumble)
    val outputReportChar =
        BluetoothGattCharacteristic(
            BleXboxDescriptor.UUID_CHAR_REPORT,
            BluetoothGattCharacteristic.PROPERTY_READ or
                BluetoothGattCharacteristic.PROPERTY_WRITE or
                BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE,
            BluetoothGattCharacteristic.PERMISSION_READ or
                BluetoothGattCharacteristic.PERMISSION_WRITE,
        )
    val outputRefDesc =
        BluetoothGattDescriptor(
            BleXboxDescriptor.UUID_DESC_REPORT_REFERENCE,
            BluetoothGattDescriptor.PERMISSION_READ,
        ).apply {
          @Suppress("DEPRECATION")
          value = BleXboxDescriptor.REPORT_REF_OUTPUT
        }
    outputReportChar.addDescriptor(outputRefDesc)

    hidService.addCharacteristic(hidInfoChar)
    hidService.addCharacteristic(protocolModeChar)
    hidService.addCharacteristic(controlPointChar)
    hidService.addCharacteristic(reportMapChar)
    hidService.addCharacteristic(inputReportChar)
    hidService.addCharacteristic(outputReportChar)
    services.add(hidService)

    return services
  }

  private fun startAdvertising() {
    val bAdapter = requireAdapter()
    val leAdvertiser = bAdapter.bluetoothLeAdvertiser
        ?: throw HidException("UNSUPPORTED", "BLE advertising is not supported on this phone")
    advertiser = leAdvertiser

    val settings =
        AdvertiseSettings.Builder()
            .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
            .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
            .setConnectable(true)
            .setTimeout(0)
            .build()

    // Primary advertisement packet: Service UUID 0x1812
    val advertiseData =
        AdvertiseData.Builder()
            .setIncludeDeviceName(false)
            .setIncludeTxPowerLevel(false)
            .addServiceUuid(ParcelUuid(BleXboxDescriptor.UUID_SERVICE_HIDS))
            .build()

    // Scan response packet: Device name "Xbox Wireless Controller"
    val scanResponse =
        AdvertiseData.Builder()
            .setIncludeDeviceName(true)
            .build()

    try {
      leAdvertiser.startAdvertising(settings, advertiseData, scanResponse, advertiseCallback)
    } catch (e: Exception) {
      throw HidException("ADVERTISE_FAILED", "Failed to start BLE advertising: ${e.message}")
    }
  }

  private fun stopAdvertising() {
    try {
      advertiser?.stopAdvertising(advertiseCallback)
    } catch (_: Exception) {
      // Stack already stopped or inactive
    }
    advertiser = null
  }

  private fun renameAdapterIfNeeded() {
    val bAdapter = adapter ?: return
    try {
      if (hasConnectPermission()) {
        if (originalAdapterName == null) {
          originalAdapterName = bAdapter.name
        }
        bAdapter.name = BleXboxDescriptor.DEVICE_NAME
      }
    } catch (_: Exception) {
      // Ignored if device doesn't allow programmatic renaming
    }
  }

  private fun restoreAdapterName() {
    val name = originalAdapterName ?: return
    val bAdapter = adapter ?: return
    try {
      if (hasConnectPermission()) {
        bAdapter.name = name
      }
    } catch (_: Exception) {
      // Ignored
    }
    originalAdapterName = null
  }

  private fun resetConnection() {
    registered = false
    host = null
    connectionState = BluetoothProfile.STATE_DISCONNECTED
    clientNotificationsEnabled.clear()
    notifyStatus()
  }

  private fun notifyStatus() = onStatusChanged(status)

  private fun requireAdapter(): BluetoothAdapter =
      adapter ?: throw HidException("UNSUPPORTED", "This device has no Bluetooth adapter")

  private fun requirePermissions() {
    if (!hasConnectPermission() || !hasAdvertisePermission()) {
      throw HidException("PERMISSION", "Bluetooth permission has not been granted")
    }
  }

  private fun hasAdvertisePermission(): Boolean =
      Build.VERSION.SDK_INT < Build.VERSION_CODES.S ||
          ContextCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_ADVERTISE) ==
              PackageManager.PERMISSION_GRANTED

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
