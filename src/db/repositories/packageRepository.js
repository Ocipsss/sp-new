import { db } from '../index.js'

function toPlain(obj) {
  return JSON.parse(JSON.stringify(obj))
}

export const packageRepository = {
  async getAll() {
    const list = await db.product_packages.toArray()
    // Hanya tampilkan paket yang belum di-soft-delete + sort by order
    return list
      .filter(item => !item.deleted)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
  },

  async getByProduct(productId) {
    const list = await db.product_packages.where('productId').equals(productId).toArray()
    return list
      .filter(item => !item.deleted)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
  },

  async savePackage(packageData) {
    const id = packageData.id || `pkg_${Date.now()}`
    
    // kalo paket baru belum punya order, kasih order paling bawah buat produk itu
    let orderToSave = packageData.order
    if (orderToSave === undefined || orderToSave === null) {
      const existing = await db.product_packages.where('productId').equals(packageData.productId).toArray()
      const maxOrder = existing.reduce((max, p) => Math.max(max, p.order ?? 0), -1)
      orderToSave = maxOrder + 1
    }

    const newItem = { 
      ...toPlain(packageData), 
      id, 
      order: orderToSave,
      deleted: false,
      updatedAt: new Date().toISOString(),
      synced: 0 
    }
    await db.product_packages.put(newItem)
    return newItem
  },

  async deletePackage(id) {
    const stringId = String(id)
    const now = new Date().toISOString()

    // Soft Delete di lokal agar syncService aman mendorong status hapus ke Firestore
    await db.product_packages.update(stringId, { 
      deleted: true, 
      updatedAt: now, 
      synced: 0 
    })
  },

  async updateOrder(id, newOrder) {
    await db.product_packages.update(String(id), {
      order: newOrder,
      updatedAt: new Date().toISOString(),
      synced: 0
    })
  }
}