// src/services/backupService.js
import { db } from '../db/index.js'
import dayjs from 'dayjs'
import { firestore, storage } from './firebase.js'
import { doc, getDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

export const backupService = {
  // 1. Export Manual ke File JSON Lokal - PERTAHANIN, ini yang paling aman
  async exportBackup() {
    try {
      const backupData = {}
      for (const table of db.tables) {
        backupData[table.name] = await table.toArray()
      }
      const jsonString = JSON.stringify(backupData, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const fileName = `${dayjs().format('DDMMYYYY-HH.mm.ss')}.json`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      return true
    } catch (error) {
      console.error('Gagal export backup:', error)
      throw error
    }
  },

  // 2. Auto Backup ke STORAGE (bukan Firestore doc) - HEMAT & GA JEBOL 1MB
  // Hanya backup master, jangan transaksi harian biar kecil
  async uploadBackupToCloud() {
    if (!navigator.onLine) return
    try {
      const masterTables = ['products','product_packages','categories','members','services','units','operators','cash_accounts','settings']
      const backupData = {}
      for (const t of masterTables) {
        if (db[t]) backupData[t] = await db[t].toArray()
      }
      const jsonString = JSON.stringify(backupData)
      const blob = new Blob([jsonString], { type: 'application/json' })
      
      // Simpan ke Storage, bukan Firestore doc - limit 5GB, bukan 1MB
      const fileName = `backups/master-${dayjs().format('YYYY-MM-DD-HHmm')}.json`
      const storageRef = ref(storage, fileName)
      await uploadBytes(storageRef, blob)
      console.log('[Backup] Success to Storage:', fileName)
      return true
    } catch (error) {
      console.error('[AutoBackup] Storage upload failed:', error)
      throw error
    }
  },

  // 3. Restor dari file lokal (yang paling aman pas develop di HP)
  async importBackup(file) {
    if (!file) return false
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const rawParsed = JSON.parse(e.target.result)
          const importedData = rawParsed.database || rawParsed
          await this.processImportData(importedData)
          resolve(true)
        } catch (err) {
          console.error('Error saat impor backup:', err)
          reject(err)
        }
      }
      reader.onerror = () => reject(new Error('Gagal membaca file backup'))
      reader.readAsText(file)
    })
  },

  // Helper impor - jangan clear transaksi dulu kalo cuma master
  async processImportData(importedData) {
    const tableNames = db.tables.map(t => t.name)
    await db.transaction('rw', tableNames, async () => {
      for (const table of db.tables) {
        // Jangan clear semua kalo cuma restore master, tapi untuk full restore ok clear
        if (Object.keys(importedData).includes(table.name)) {
          await table.clear()
        }
      }
      for (const tableName of Object.keys(importedData)) {
        if (db[tableName]) {
          const rows = importedData[tableName]
          if (Array.isArray(rows) && rows.length > 0) {
            const preparedRows = rows.map(item => ({
              ...item,
              synced: item.synced ?? 1 // kalo dari backup cloud anggap sudah sync
            }))
            await db[tableName].bulkPut(preparedRows)
          }
        }
      }
    })
  },

  async resetTransactions() {
    const tableNames = db.tables.map(t => t.name)
    await db.transaction('rw', tableNames, async () => {
      await db.transactions.clear()
      await db.transaction_items.clear()
      await db.expenses.clear()
      await db.digital_transactions.clear()
      await db.debt_payments.clear()
      await db.cash_mutations.clear()
      await db.shopping_list.clear()
      const members = await db.members.toArray()
      for (const m of members) {
        await db.members.update(m.id, { debt: 0, total_spending: 0, points: 0, synced: 0 })
      }
      const accounts = await db.cash_accounts.toArray()
      for (const a of accounts) {
        await db.cash_accounts.update(a.id, { balance: 0, synced: 0 })
      }
    })
  },

  async convertAllToUppercase() {
    const tableNames = ['products', 'categories', 'units', 'product_packages', 'members']
    const now = dayjs().toISOString()
    await db.transaction('rw', tableNames, async () => {
      const products = await db.products.toArray()
      for (const p of products) {
        await db.products.update(p.id, { name: (p.name || '').toUpperCase().trim(), code: (p.code || '').toUpperCase().trim(), category: (p.category || 'UMUM').toUpperCase().trim(), unit: (p.unit || '').toUpperCase().trim(), purchasePackName: (p.purchasePackName || '').toUpperCase().trim(), updatedAt: now, synced: 0 })
      }
      const categories = await db.categories.toArray()
      for (const c of categories) { await db.categories.update(c.id, { name: (c.name || '').toUpperCase().trim(), updatedAt: now, synced: 0 }) }
      const units = await db.units.toArray()
      for (const u of units) { await db.units.update(u.id, { name: (u.name || '').toUpperCase().trim(), updatedAt: now, synced: 0 }) }
      const packages = await db.product_packages.toArray()
      for (const pkg of packages) { await db.product_packages.update(pkg.id, { name: (pkg.name || '').toUpperCase().trim(), updatedAt: now, synced: 0 }) }
      const members = await db.members.toArray()
      for (const m of members) { await db.members.update(m.id, { name: (m.name || '').toUpperCase().trim(), address: (m.address || '').toUpperCase().trim(), updatedAt: now, synced: 0 }) }
    })
  }
}
