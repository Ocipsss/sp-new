// src/db/index.js
import Dexie from 'dexie'

export const db = new Dexie('SinarPagiDB')

db.version(1).stores({
  products: 'id, code, name, category, price_modal, price_sell, qty, unit, minStock, idealStock, purchasePackName, packQty, packPrice, updatedAt, synced, imageSynced, deleted',
  product_packages: 'id, productId, name, order, qty_pcs, price_sell, updatedAt, synced, deleted',
  categories: 'id, name, updatedAt, synced, deleted',
  transactions: 'id, date, total, memberId, paymentMethod, amountPaid, paidAmount, remaining, change, status, dueDate, updatedAt, synced',
  transaction_items: 'id, transactionId, productId, serviceId, updatedAt, synced',
  members: 'id, name, phone, address, total_spending, points, debt, updatedAt, synced, deleted',
  debt_payments: 'id, transactionId, memberId, date, amount, paymentMethod, updatedAt, synced',
  shopping_list: 'id, productId, isBought, category, updatedAt, synced',
  cash_accounts: 'id, name, type, balance, updatedAt, synced, deleted',
  cash_mutations: 'id, date, accountId, type, amount, category, note, refId, updatedAt, synced',
  expenses: 'id, date, category, amount, note, paymentMethod, cashPart, qrisPart, updatedAt, synced',
  digital_transactions: 'id, date, type, provider, nominal, adminFee, adminPaymentMethod, totalReceived, profit, updatedAt, synced',
  services: 'id, name, price, category, productId, *productIds, updatedAt, synced, deleted',
  units: 'id, name, updatedAt, synced, deleted',
  operators: 'id, name, role, pin, updatedAt, synced, deleted',
  settings: 'id, updatedAt, synced'
})

// Migrasi lokal otomatis sekali jalan saat DB siap
db.on('ready', async () => {
  try {
    await db.services.toCollection().modify(service => {
      if (service.deleted === 0) service.deleted = false
      if (service.deleted === 1) service.deleted = true
    })
  } catch (e) {
    console.warn('[DB Migration] Gagal konversi deleted service ke Boolean:', e)
  }
})

export default db
