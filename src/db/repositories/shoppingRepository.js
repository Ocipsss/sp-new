import { db } from '../index.js'
import dayjs from 'dayjs'

export const shoppingRepository = {
  async getAll() {
    const table = db.shopping_list || db.table('shopping_list')
    return await table.toArray()
  },

  async getById(id) {
    const table = db.shopping_list || db.table('shopping_list')
    return await table.get(id)
  },

  async add(item) {
    const id = item.id || crypto.randomUUID()
    const now = dayjs().toISOString()
    const newItem = {
      ...item,
      id,
      isBought: item.isBought ? 1 : 0,
      createdAt: item.createdAt || now,
      updatedAt: now,
      synced: 0
    }
    
    const table = db.shopping_list || db.table('shopping_list')
    await table.put(newItem)
    return newItem
  },

  async addBulk(items) {
    const now = dayjs().toISOString()
    const preparedItems = items.map(item => ({
      ...item,
      id: item.id || crypto.randomUUID(),
      isBought: item.isBought ? 1 : 0,
      createdAt: item.createdAt || now,
      updatedAt: now,
      synced: 0
    }))

    const table = db.shopping_list || db.table('shopping_list')
    await table.bulkPut(preparedItems)
    return preparedItems
  },

  async update(id, changes) {
    const now = dayjs().toISOString()
    const table = db.shopping_list || db.table('shopping_list')
    const updateData = { ...changes, updatedAt: now, synced: 0 }
    if (typeof changes.isBought === 'boolean') {
      updateData.isBought = changes.isBought ? 1 : 0
    }
    await table.update(id, updateData)
  },

  async delete(id) {
    const table = db.shopping_list || db.table('shopping_list')
    await table.delete(id)
  },

  async clearBought() {
    const table = db.shopping_list || db.table('shopping_list')
    const boughtItems = await table.where('isBought').equals(1).toArray()
    const ids = boughtItems.map(i => i.id)
    await table.bulkDelete(ids)
    return ids.length
  }
}
