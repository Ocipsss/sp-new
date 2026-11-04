// src/db/repositories/memberRepository.js
import { db } from '../index.js'
import dayjs from 'dayjs'

export const memberRepo = {
  // Hanya ambil member yang belum di-soft-delete
  getAll: async () => {
    const list = await db.members.toArray()
    return list.filter(m => !m.deleted)
  },

  getById: async (id) => {
    const item = await db.members.get(id)
    return item && !item.deleted ? item : null
  },
  
  create: async (data) => {
    const id = crypto.randomUUID()
    const now = dayjs().toISOString()
    await db.members.add({
      id,
      name: (data.name || '').toUpperCase().trim(),
      phone: (data.phone || '').trim(),
      address: (data.address || '').toUpperCase().trim(),
      total_spending: 0,
      points: 0,
      debt: 0,
      deleted: false,
      updatedAt: now,
      synced: 0
    })
    return id
  },

  update: async (id, data) => {
    const now = dayjs().toISOString()
    const payload = {
      ...data,
      updatedAt: now,
      synced: 0
    }
    if (data.name) payload.name = data.name.toUpperCase().trim()
    if (data.address) payload.address = data.address.toUpperCase().trim()

    await db.members.update(id, payload)
  },

  delete: async (id) => {
    const stringId = String(id)
    const now = dayjs().toISOString()
    
    // Soft Delete di IndexedDB lokal agar status hapus tersinkron dengan aman saat offline/online
    await db.members.update(stringId, {
      deleted: true,
      updatedAt: now,
      synced: 0
    })
  },

  addDebtPayment: async (paymentData) => {
    const now = dayjs().toISOString()
    const id = paymentData.id || crypto.randomUUID()
    await db.debt_payments.add({
      ...paymentData,
      id,
      date: paymentData.date || now,
      updatedAt: now,
      synced: 0
    })
    return id
  }
}
