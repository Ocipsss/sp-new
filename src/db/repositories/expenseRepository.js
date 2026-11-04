import { db } from '../index.js'
import dayjs from 'dayjs'

export const expenseRepository = {
  async getAll() {
    return await db.expenses.orderBy('date').reverse().toArray()
  },

  async getById(id) {
    return await db.expenses.get(id)
  },

  async create(data) {
    const id = crypto.randomUUID()
    const now = dayjs().toISOString()
    const item = {
      id,
      date: data.date || now,
      category: data.category || 'Lain-lain',
      amount: Number(data.amount) || 0,
      note: data.note || '',
      paymentMethod: data.paymentMethod || 'CASH',
      cashPart: data.paymentMethod === 'CASH' ? Number(data.amount) : 0,
      qrisPart: data.paymentMethod === 'QRIS' ? Number(data.amount) : 0,
      updatedAt: now,
      synced: 0
    }
    await db.expenses.add(item)
    return item
  },

  async update(id, data) {
    const now = dayjs().toISOString()
    await db.expenses.update(id, {
      ...data,
      cashPart: data.paymentMethod === 'CASH' ? Number(data.amount) : 0,
      qrisPart: data.paymentMethod === 'QRIS' ? Number(data.amount) : 0,
      updatedAt: now,
      synced: 0
    })
  },

  async delete(id) {
    await db.expenses.delete(id)
  }
}
