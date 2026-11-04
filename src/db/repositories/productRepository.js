
// src/db/repositories/productRepository.js - FINAL v3 SOFT DELETE + CLOUDINARY OFFLINE-FIRST
import { db } from '../index.js'
import dayjs from 'dayjs'

export const productRepo = {
  getAll: async () => {
    const list = await db.products.toArray()
    return list.filter(p => !p.deleted)
  },
  getById: async (id) => {
    const item = await db.products.get(id)
    return item && !item.deleted ? item : null
  },
  getByCode: async (code) => {
    const item = await db.products.where('code').equals(code).first()
    return item && !item.deleted ? item : null
  },
  create: async (data, imageFile = null) => {
    const id = crypto.randomUUID()
    const now = dayjs().toISOString()
    const doc = {
      ...data,
      id,
      updatedAt: now,
      synced: 0,
      deleted: false,
      imageUrl: null,
      imagePublicId: null,
      imageSynced: imageFile ? 0 : 1,
      imageLocal: imageFile || undefined
    }
    if (imageFile) {
      doc.imagePublicId = `sinar-pagi/products/${id}`
    }
    await db.products.add(doc)
    return id
  },
  update: async (id, data, imageFile = null) => {
    const now = dayjs().toISOString()
    const changes = {
      ...data,
      updatedAt: now,
      synced: 0
    }
    if (imageFile) {
      changes.imageLocal = imageFile
      changes.imageSynced = 0
      const existing = await db.products.get(id)
      changes.imagePublicId = existing?.imagePublicId || `sinar-pagi/products/${id}`
    }
    await db.products.update(id, changes)
  },
  delete: async (id) => {
    // SOFT DELETE - biar 498 di HP jadi 498 juga di cloud
    const now = dayjs().toISOString()
    await db.products.update(id, {
      deleted: true,
      updatedAt: now,
      synced: 0
    })
  },
  hardDelete: (id) => db.products.delete(id)
}
