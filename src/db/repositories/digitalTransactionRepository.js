/*
import { db } from '../index.js'
import dayjs from 'dayjs'

export const digitalTransactionRepo = {
  getAll: () => (db.digital_transactions ? db.digital_transactions.orderBy('date').reverse().toArray() : db.table('digital_transactions').orderBy('date').reverse().toArray()),
  
  create: async (data) => {
    const id = crypto.randomUUID()
    const now = dayjs().toISOString()
    const item = {
      id,
      date: now,
      type: data.type || 'PULSA',
      provider: data.provider || '',
      targetNumber: data.targetNumber || '',
      nominal: Number(data.nominal) || 0,
      costPrice: Number(data.costPrice) || 0,
      sellingPrice: Number(data.sellingPrice) || 0,
      adminFee: Number(data.adminFee) || 0,
      adminPaymentMethod: data.adminPaymentMethod || 'CASH',
      totalReceived: Number(data.sellingPrice || 0) + Number(data.adminFee || 0),
      profit: (Number(data.sellingPrice || 0) + Number(data.adminFee || 0)) - Number(data.costPrice || 0),
      status: data.status || 'SUCCESS',
      updatedAt: now,
      synced: 0
    }
    const table = db.digital_transactions || db.table('digital_transactions')
    await table.add(item)
    return id
  },

  delete: (id) => (db.digital_transactions || db.table('digital_transactions')).delete(id)
}
*/