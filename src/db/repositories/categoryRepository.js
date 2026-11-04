// src/db/repositories/categoryRepository.js
import { db } from '../index.js'
import dayjs from 'dayjs'

export const categoryRepo = {
  getAll: () => db.categories.toArray(),
  getById: (id) => db.categories.get(id),
  create: async (name) => {
    const id = crypto.randomUUID()
    const now = dayjs().toISOString()
    await db.categories.add({
      id,
      name,
      updatedAt: now,
      synced: 0
    })
    return id
  },
  update: async (id, name) => {
    const now = dayjs().toISOString()
    const oldCategory = await db.categories.get(id)

    if (oldCategory && oldCategory.name !== name) {
      const oldName = oldCategory.name

      // 1. Update nama kategori di tabel categories
      await db.categories.update(id, {
        name,
        updatedAt: now,
        synced: 0
      })

      // 2. Cari semua produk yang menggunakan kategori lama, lalu perbarui ke nama baru
      const products = await db.products.where('category').equals(oldName).toArray()
      for (const p of products) {
        await db.products.update(p.id, {
          category: name,
          updatedAt: now,
          synced: 0
        })
      }
    } else {
      await db.categories.update(id, {
        name,
        updatedAt: now,
        synced: 0
      })
    }
  },
  delete: (id) => db.categories.delete(id)
}
