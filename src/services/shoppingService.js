// src/services/shoppingService.js
import { shoppingRepository } from '../db/repositories/shoppingRepository.js'
import { productRepo } from '../db/repositories/productRepository.js'
import { financeRepo } from '../db/repositories/financeRepository.js'

export const shoppingService = {
  async getShoppingItems() {
    return await shoppingRepository.getAll()
  },

  async populateLowStockItems() {
    const allProducts = await productRepo.getAll()
    const currentShoppingList = await shoppingRepository.getAll()
    
    const lowStockProducts = allProducts.filter(p => (p.qty || 0) <= (p.minStock || 5))
    const existingProductIds = new Set(
      currentShoppingList.filter(i => !i.isBought).map(i => i.productId).filter(Boolean)
    )

    const itemsToAdd = []
    for (const p of lowStockProducts) {
      if (!existingProductIds.has(p.id)) {
        const targetQty = (p.packQty && p.packQty > 0) ? p.packQty : Math.max(10, (p.minStock || 5) * 2 - (p.qty || 0))
        
        itemsToAdd.push({
          productId: p.id,
          name: p.name,
          category: p.category || 'Umum',
          qty: targetQty,
          unit: p.unit || 'pcs',
          estimatedPrice: p.packPrice || (p.price_modal * targetQty) || 0,
          isBought: false,
          notes: `Restock otomatis (Stok sisa: ${p.qty})`
        })
      }
    }

    if (itemsToAdd.length > 0) {
      await shoppingRepository.addBulk(itemsToAdd)
    }

    return itemsToAdd.length
  },

  async toggleBoughtStatus(item, options = {}) {
    const { accountId = 'acc_cash', actualPrice = null } = options
    const newStatus = !item.isBought
    const finalPrice = actualPrice !== null ? Number(actualPrice) : (Number(item.estimatedPrice) || 0)

    // 1. Update status barang belanjaan & harga aktual
    await shoppingRepository.update(item.id, { 
      isBought: newStatus,
      estimatedPrice: finalPrice
    })

    if (newStatus) {
      // A. STATUS DIBELI (Selesai): Tambah stok & potong kas/bank
      if (item.productId) {
        const product = await productRepo.getById(item.productId)
        if (product) {
          const qtyToAdd = Number(item.qty) || 0
          const updatedQty = (product.qty || 0) + qtyToAdd

          const changes = { qty: updatedQty }
          if (finalPrice > 0 && item.qty > 0 && !product.packQty) {
            changes.price_modal = Math.round(finalPrice / item.qty)
          }

          await productRepo.update(item.productId, changes)
        }
      }

      // Catat Mutasi Pengeluaran Keuangan (OUT)
      if (finalPrice > 0) {
        const accName = accountId === 'acc_bank' ? 'Bank / QRIS' : 'Kas Laci'
        await financeRepo.addMutation({
          accountId,
          type: 'OUT',
          amount: finalPrice,
          category: 'Belanja Kulakan',
          note: `Kulakan ${item.name} (${item.qty} ${item.unit || 'pcs'}) via ${accName}`,
          refId: item.id
        })
      }
    } else {
      // B. BATAL DIBELI (Dicentang ulang jadi pending): Kurangi stok & kembalikan kas (IN)
      if (item.productId) {
        const product = await productRepo.getById(item.productId)
        if (product) {
          const qtyToRemove = Number(item.qty) || 0
          await productRepo.update(item.productId, {
            qty: Math.max(0, (product.qty || 0) - qtyToRemove)
          })
        }
      }

      // Catat Pengembalian Kas (IN)
      if (finalPrice > 0) {
        await financeRepo.addMutation({
          accountId,
          type: 'IN',
          amount: finalPrice,
          category: 'Pembatalan Belanja',
          note: `Batal Kulakan ${item.name}`,
          refId: item.id
        })
      }
    }

    return newStatus
  },

  async addShoppingItem(data) {
    const newItem = await shoppingRepository.add({
      productId: data.productId || null,
      name: data.name,
      category: data.category || 'Umum',
      qty: Number(data.qty) || 1,
      unit: data.unit || 'pcs',
      estimatedPrice: Number(data.estimatedPrice) || 0,
      isBought: false,
      notes: data.notes || ''
    })

    return newItem
  },

  async removeItem(id) {
    await shoppingRepository.delete(id)
  },

  async clearCompleted() {
    const count = await shoppingRepository.clearBought()
    return count
  }
}
