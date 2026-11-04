// src/db/repositories/unitRepository.js
import { db } from '../index.js'
import dayjs from 'dayjs'

export const unitRepo = {
  getAll: () => (db.units ? db.units.toArray() : db.table('units').toArray()),
  getById: (id) => (db.units ? db.units.get(id) : db.table('units').get(id)),
  create: async (name) => {
    const id = crypto.randomUUID()
    const now = dayjs().toISOString()
    const item = { id, name, updatedAt: now, synced: 0 }
    const table = db.units || db.table('units')
    await table.add(item)
    return id
  },
  update: async (id, name) => {
    const now = dayjs().toISOString()
    const table = db.units || db.table('units')
    await table.update(id, { name, updatedAt: now, synced: 0 })
  },
  delete: (id) => (db.units || db.table('units')).delete(id)
}
