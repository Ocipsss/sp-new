// src/composables/usePrinter.js - FIXED
import { ref } from 'vue'
import { toast } from 'vue-sonner'

// State global biar ke-share antar komponen
const isConnected = ref(false)
const isConnecting = ref(false)
const isPrinting = ref(false)
const printerDevice = ref(null)
const connectedDevice = ref(null)
const printerCharacteristic = ref(null)

export function usePrinter() {
  const checkBluetoothSupport = () => {
    if (!window.isSecureContext) {
      toast.error('Web Bluetooth butuh HTTPS.')
      return false
    }
    if (!navigator.bluetooth) {
      toast.error('Pakai Chrome Android/Desktop.')
      return false
    }
    return true
  }

  const connectPrinter = async () => {
    if (!checkBluetoothSupport()) return null
    try {
      isConnecting.value = true
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', '49535343-fe7d-4ae5-8fa9-9fafd205e455']
      })

      const server = await device.gatt.connect()
      const services = await server.getPrimaryServices()
      
      let writeChar = null
      for (const service of services) {
        const chars = await service.getCharacteristics()
        for (const c of chars) {
          if (c.properties.write || c.properties.writeWithoutResponse) {
            writeChar = c
            break
          }
        }
        if (writeChar) break
      }

      if (!writeChar) throw new Error('Characteristic write tidak ditemukan')

      printerDevice.value = device
      connectedDevice.value = device
      printerCharacteristic.value = writeChar
      isConnected.value = true
      
      toast.success(`Terhubung: ${device.name || 'Printer Thermal'}`)
      return writeChar
    } catch (err) {
      if (err.name !== 'NotFoundError') {
        toast.error(`Gagal connect: ${err.message}`)
      } else {
        toast.info('Pencarian dibatalkan')
      }
      isConnected.value = false
      return null
    } finally {
      isConnecting.value = false
      isPrinting.value = false
    }
  }

  const toggleConnection = async () => {
    if (isConnected.value) {
      try {
        printerDevice.value?.gatt?.disconnect()
      } catch {}
      isConnected.value = false
      printerDevice.value = null
      connectedDevice.value = null
      printerCharacteristic.value = null
      toast.info('Printer terputus')
    } else {
      await connectPrinter()
    }
  }

  const printReceipt = async (encoderBytes) => {
    if (!checkBluetoothSupport()) return false
    try {
      isPrinting.value = true
      let char = printerCharacteristic.value
      let device = connectedDevice.value

      if (!isConnected.value || !device?.gatt?.connected || !char) {
        char = await connectPrinter()
        if (!char) return false
      }

      const chunkSize = 20
      for (let i = 0; i < encoderBytes.length; i += chunkSize) {
        const chunk = encoderBytes.slice(i, i + chunkSize)
        if (char.properties?.writeWithoutResponse) {
          await char.writeValueWithoutResponse(chunk)
        } else {
          await char.writeValue(chunk)
        }
        await new Promise(r => setTimeout(r, 30))
      }
      toast.success('Struk terkirim!')
      return true
    } catch (err) {
      toast.error(`Gagal cetak: ${err.message}`)
      return false
    } finally {
      isPrinting.value = false
    }
  }

  return {
    // yang dipakai MainLayout.vue
    isConnected,
    isConnecting,
    printerDevice,
    printerCharacteristic,
    toggleConnection,
    // yang dipakai ReceiptModal & file lama
    isPrinting,
    connectedDevice,
    checkBluetoothSupport,
    connectPrinter,
    printReceipt
  }
}