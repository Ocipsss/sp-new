// src/services/receiptService.js
import { jsPDF } from 'jspdf'
import EscPosEncoder from 'esc-pos-encoder'
import { settingsRepo } from '../db/repositories/settingsRepository.js'
import { usePrinter } from '../composables/usePrinter.js'
import dayjs from 'dayjs'

export const receiptService = {
  // 1. Cetak Struk via Bluetooth Thermal Printer
  async printThermal(transaction) {
    if (!navigator.bluetooth) {
      throw new Error('Browser ini belum mendukung Web Bluetooth. Gunakan Chrome di Android.')
    }

    const { printerCharacteristic, isConnected, connectPrinter } = usePrinter()

    let targetChar = printerCharacteristic.value

    if (!isConnected.value || !targetChar) {
      targetChar = await connectPrinter()
    }

    if (!targetChar) {
      throw new Error('Printer Bluetooth tidak terhubung.')
    }

    const settings = await settingsRepo.getSettings()
    const is58mm = settings.printerPaperSize !== '80mm'
    const width = is58mm ? 32 : 48
    const line = '-'.repeat(width)

    // Alokasi lebar kolom (20 karakter detail + 12 karakter subtotal untuk 58mm)
    const detailWidth = is58mm ? 20 : 32
    const subtotalWidth = 12

    const EncoderClass = typeof EscPosEncoder === 'function' ? EscPosEncoder : (EscPosEncoder.default || EscPosEncoder)
    const encoder = new EncoderClass()

    const storeName = (settings.storeName || 'SINAR PAGI').toUpperCase()
    const address = settings.storeAddress || settings.address || ''
    const phone = settings.storePhone || settings.phone || ''

    // Formatter Tanggal & Waktu
    const dateObj = transaction.date ? new Date(transaction.date) : new Date()
    const validDate = isNaN(dateObj.getTime()) ? new Date() : dateObj
    const tglStr = dayjs(validDate).format('DD/MM/YYYY')
    const jamStr = dayjs(validDate).format('HH:mm')

    let encoded = encoder
      .initialize()
      .align('center')
      .line(storeName)

    if (address) {
      encoded = encoded.line(address)
    }
    if (phone) {
      encoded = encoded.line(phone)
    }

    encoded = encoded
      .line(line)
      .align('left')
      .line(`Nota  : #${String(transaction.id || '').slice(-5)}`)
      .line(`Tgl   : ${tglStr} ${jamStr}`)

    // Member ditaruh di bagian header metadata
    if (transaction.memberName) {
      encoded = encoded.line(`Member: ${transaction.memberName}`)
    }

    encoded = encoded.line(line)

    // Rincian Items
    const items = transaction.items || []
    items.forEach(item => {
      const name = String(item.name || item.productName || 'BARANG').toUpperCase()
      const qty = item.qty || item.cartQty || 1
      const price = (Number(item.price || item.price_sell || 0) + Number(item.extraCharge || 0))
      const subtotalVal = item.subtotal || (price * qty)

      const detail = `${qty}x${price.toLocaleString('id-ID')}`
      const subtotal = subtotalVal.toLocaleString('id-ID')

      encoded = encoded.line(name)
      encoded = encoded.line(detail.padEnd(detailWidth) + subtotal.padStart(subtotalWidth))
    })

    // Block Total & Pembayaran Rata Kanan
    encoded = encoded
      .line(line)
      .align('right')
      .line(`TOTAL:   ${(transaction.total || 0).toLocaleString('id-ID').padStart(subtotalWidth)}`)

    const paymentMethod = String(transaction.paymentMethod || '').toLowerCase()
    if (paymentMethod === 'cash' || paymentMethod === 'tunai') {
      const bayar = transaction.amountPaid || transaction.paidAmount || transaction.total || 0
      const kembali = transaction.change !== undefined ? transaction.change : Math.max(0, bayar - (transaction.total || 0))

      encoded = encoded
        .line(`BAYAR:   ${bayar.toLocaleString('id-ID').padStart(subtotalWidth)}`)
        .line(`KEMBALI: ${kembali.toLocaleString('id-ID').padStart(subtotalWidth)}`)
    } else {
      encoded = encoded.line(`METODE:  ${paymentMethod.toUpperCase().padStart(subtotalWidth)}`)
    }

    // Footer Nota Rata Tengah
    encoded = encoded
      .align('center')
      .newline()

    const footerText = settings.receiptFooter || settings.footerNote || 'Terima kasih telah berbelanja!'
    footerText.split('\n').forEach(fLine => {
      if (fLine.trim()) encoded = encoded.line(fLine.trim())
    })

    // Nama Kasir ditaruh paling bawah (di bawah ucapan terima kasih)
    const operator = transaction.operatorName || transaction.kasir || 'Admin'
    encoded = encoded.line(`Kasir: ${operator}`)

    const fullData = encoded
      .newline()
      .newline()
      .cut()
      .encode()

    // Kirim chunk data via Bluetooth
    const chunkSize = 20
    for (let i = 0; i < fullData.length; i += chunkSize) {
      const chunk = fullData.slice(i, i + chunkSize)
      if (targetChar.properties?.writeWithoutResponse) {
        await targetChar.writeValueWithoutResponse(chunk)
      } else if (targetChar.properties?.write) {
        await targetChar.writeValue(chunk)
      }
      await new Promise(resolve => setTimeout(resolve, 30))
    }
  },

  // 2. Unduh Nota PDF
  async downloadPdf(transaction) {
    const settings = await settingsRepo.getSettings()
    const is58mm = settings.printerPaperSize !== '80mm'
    const items = transaction.items || []
    
    const paperWidth = is58mm ? 58 : 80
    const estimatedHeight = 95 + (items.length * 12)

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [paperWidth, estimatedHeight]
    })

    let y = 7
    doc.setFont('courier', 'bold')
    doc.setFontSize(11)
    doc.text((settings.storeName || 'SINAR PAGI').toUpperCase(), paperWidth / 2, y, { align: 'center' })

    doc.setFont('courier', 'normal')
    doc.setFontSize(8)
    if (settings.storeAddress) {
      y += 4
      doc.text(settings.storeAddress, paperWidth / 2, y, { align: 'center' })
    }
    if (settings.storePhone) {
      y += 3.5
      doc.text(`Telp: ${settings.storePhone}`, paperWidth / 2, y, { align: 'center' })
    }

    y += 4
    doc.text('-'.repeat(is58mm ? 32 : 45), paperWidth / 2, y, { align: 'center' })

    y += 4
    doc.text(`Nota  : #${String(transaction.id || '').slice(-5)}`, 4, y)
    y += 3.5
    doc.text(`Tgl   : ${dayjs(transaction.date || new Date()).format('DD/MM/YYYY HH:mm')}`, 4, y)

    // Member ditaruh di header
    if (transaction.memberName) {
      y += 3.5
      doc.text(`Member: ${transaction.memberName}`, 4, y)
    }

    y += 4
    doc.text('-'.repeat(is58mm ? 32 : 45), paperWidth / 2, y, { align: 'center' })

    items.forEach(item => {
      y += 4
      const name = String(item.name || item.productName || 'BARANG').toUpperCase()
      doc.text(name, 4, y)
      
      y += 3.5
      const qty = item.qty || item.cartQty || 1
      const price = Number(item.price || item.price_sell || 0) + Number(item.extraCharge || 0)
      const subtotalVal = item.subtotal || (price * qty)

      const qtyPrice = `${qty}x${price.toLocaleString('id-ID')}`
      const subtotal = subtotalVal.toLocaleString('id-ID')
      doc.text(qtyPrice, 4, y)
      doc.text(subtotal, paperWidth - 4, y, { align: 'right' })
    })

    y += 4
    doc.text('-'.repeat(is58mm ? 32 : 45), paperWidth / 2, y, { align: 'center' })

    y += 4
    doc.setFont('courier', 'bold')
    doc.text('TOTAL :', 4, y)
    doc.text(`Rp ${(transaction.total || 0).toLocaleString('id-ID')}`, paperWidth - 4, y, { align: 'right' })

    const isCash = String(transaction.paymentMethod || '').toLowerCase() === 'cash' || String(transaction.paymentMethod || '').toLowerCase() === 'tunai'
    if (isCash) {
      const bayar = transaction.amountPaid || transaction.paidAmount || transaction.total || 0
      const kembali = transaction.change !== undefined ? transaction.change : Math.max(0, bayar - (transaction.total || 0))
      
      y += 3.5
      doc.setFont('courier', 'normal')
      doc.text('BAYAR :', 4, y)
      doc.text(`Rp ${bayar.toLocaleString('id-ID')}`, paperWidth - 4, y, { align: 'right' })
      
      y += 3.5
      doc.text('KEMBALI :', 4, y)
      doc.text(`Rp ${kembali.toLocaleString('id-ID')}`, paperWidth - 4, y, { align: 'right' })
    } else {
      y += 3.5
      doc.setFont('courier', 'normal')
      doc.text('METODE :', 4, y)
      doc.text(String(transaction.paymentMethod || 'NON-TUNAI').toUpperCase(), paperWidth - 4, y, { align: 'right' })
    }

    y += 6
    doc.setFont('courier', 'normal')
    doc.setFontSize(7)
    doc.text(settings.receiptFooter || settings.footerNote || 'Terima kasih telah berbelanja!', paperWidth / 2, y, { align: 'center' })

    // Nama Kasir ditaruh di paling bawah (di bawah ucapan terima kasih)
    y += 3.5
    const operator = transaction.operatorName || transaction.kasir || 'Admin'
    doc.text(`Kasir: ${operator}`, paperWidth / 2, y, { align: 'center' })

    doc.save(`Nota_${String(transaction.id || '').slice(-5)}_${dayjs().format('YYYYMMDD_HHmm')}.pdf`)
  }
}
