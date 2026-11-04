import { db } from '../index.js'
import dayjs from 'dayjs'

export const transactionRepo = {
  getAll: () => db.transactions.toArray(),
  getById: (id) => db.transactions.get(id),
  getToday: () => db.transactions.where('date').aboveOrEqual(dayjs().startOf('day').toISOString()).toArray(),
  create: (data) => db.transactions.add(data),
  getItemsByTransactionId: (transactionId) => db.transaction_items.where('transactionId').equals(transactionId).toArray(),
  getAllItems: () => db.transaction_items.toArray()
}
