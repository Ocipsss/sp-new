// src/services/reportService.js
import { db } from '../db/index.js'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'

export const reportService = {
  async getReportData() {
    const [trxs, items, digitals, prods] = await Promise.all([
      db.transactions.toArray(),
      db.transaction_items.toArray(),
      db.digital_transactions.toArray(),
      db.products.toArray()
    ])

    return {
      rawTransactions: trxs,
      rawTransactionItems: items,
      rawDigitalTransactions: digitals,
      productsMap: new Map(prods.map(p => [p.id, p]))
    }
  },

  exportToExcel(filteredTransactions, filteredDigitalTransactions, selectedPeriod) {
    const dataToExport = []

    // Data Transaksi Kasir
    filteredTransactions.forEach(t => {
      dataToExport.push({
        Tanggal: dayjs(t.date).format('YYYY-MM-DD HH:mm'),
        Tipe: 'Penjualan Barang',
        'ID Nota': t.id.slice(0, 8),
        'Metode Bayar': t.paymentMethod,
        'Total Omzet (Rp)': t.total,
        'Status Bayar': t.status
      })
    })

    // Data Transaksi Digital
    filteredDigitalTransactions.forEach(d => {
      dataToExport.push({
        Tanggal: dayjs(d.date).format('YYYY-MM-DD HH:mm'),
        Tipe: `Digital (${d.provider || 'Topup/Tarik'})`,
        'ID Nota': d.id.slice(0, 8),
        'Metode Bayar': d.adminPaymentMethod === 'cash' ? 'Tunai' : 'Potong Saldo',
        'Total Omzet (Rp)': d.nominal + (d.adminFee || 0),
        'Status Bayar': 'Lunas'
      })
    })

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Penjualan')

    const fileName = `Laporan_SinarPagi_${selectedPeriod}_${dayjs().format('YYYYMMDD')}.xlsx`
    XLSX.writeFile(workbook, fileName)
  }
}
