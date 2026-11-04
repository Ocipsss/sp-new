// src/services/kasirService.js
import { db } from '../db/index.js'
import dayjs from 'dayjs'
import { financeRepo } from '../db/repositories/financeRepository.js'

export const kasirService = {
  async checkout({ cart, member, paymentMethod, operator }) {
    const now = dayjs().toISOString()
    const id = crypto.randomUUID()
    const total = cart.reduce((s, c) => s + (c.price_sell * c.cartQty), 0)
    const isTempo = paymentMethod === 'TEMPO'

    // GUARD 1: Validasi metode TEMPO wajib memilih member
    if (isTempo && !member) throw new Error('Member wajib dipilih untuk metode pembayaran TEMPO!')
    
    // GUARD 2: Validasi keranjang tidak boleh kosong
    if (!cart || cart.length === 0) throw new Error('Keranjang belanja masih kosong!')

    let totalProfit = 0
    const stockWarnings = []

    // FIX ATOMIC: bungkus semua operasi DB dalam 1 Dexie transaction biar hemat kuota & gak corrupt
    await db.transaction('rw', db.transactions, db.transaction_items, db.products, db.members, db.cash_accounts, db.cash_mutations, async () => {
      // 1. Simpan header transaksi
      await db.transactions.add({
        id, 
        date: now, 
        total, 
        memberId: member?.id || null,
        operatorId: operator?.id || null,
        operatorName: operator?.name || 'Kasir',
        paymentMethod, 
        amountPaid: isTempo ? 0 : total, 
        paidAmount: isTempo ? 0 : total,
        remaining: isTempo ? total : 0, 
        status: isTempo ? 'unpaid' : 'paid',
        dueDate: isTempo ? dayjs().add(7, 'day').toISOString() : null,
        updatedAt: now, 
        synced: 0
      })

      // 2. Pencatatan mutasi kas/bank
      if (paymentMethod === 'CASH') {
        await financeRepo.addMutation({
          accountId: 'acc_cash',
          type: 'IN',
          amount: total,
          category: 'Penjualan Toko',
          note: `Transaksi Kasir (${operator?.name || 'Kasir'}) #${id.slice(0, 8)}`,
          refId: id
        })
      } else if (paymentMethod === 'QRIS') {
        await financeRepo.addMutation({
          accountId: 'acc_bank',
          type: 'IN',
          amount: total,
          category: 'Penjualan Toko',
          note: `Transaksi QRIS (${operator?.name || 'Kasir'}) #${id.slice(0, 8)}`,
          refId: id
        })
      }

      // 3. Olah item transaksi & pemotongan stok (OPSI B: Boleh Minus)
      for (const c of cart) {
        const modal = c.price_modal || 0
        const itemProfit = (c.price_sell - modal) * c.cartQty
        totalProfit += Math.max(0, itemProfit)

        // Simpan item transaksi
        await db.transaction_items.add({
          id: crypto.randomUUID(), 
          transactionId: id, 
          productId: c.id,
          serviceId: c.isServed ? 'SERVICE_SEDUH' : null, 
          name: c.name, 
          qty: c.cartQty, 
          price: c.price_sell,
          subtotal: c.price_sell * c.cartQty, 
          updatedAt: now, 
          synced: 0
        })

        // Cek ketersediaan produk di database
        const product = await db.products.get(c.id)
        if (product) {
          const qtyDipotong = c.packageInfo ? (c.packageInfo.qty_pcs * c.cartQty) : c.cartQty
          const currentQty = product.qty || 0
          const newQty = currentQty - qtyDipotong

          // GUARD OPSI B: Catat peringatan jika stok menjadi minus (< 0)
          if (newQty < 0) {
            stockWarnings.push(`${product.name} (Sisa Stok: ${newQty})`)
          }

          await db.products.update(c.id, { 
            qty: newQty, 
            updatedAt: now, 
            synced: 0 
          })
        }
      }

      // 4. Update data member (poin, spending, & piutang) jika ada
      if (member) {
        const currentMember = await db.members.get(member.id)
        if (currentMember) {
          const earnedPoints = Math.floor(totalProfit * 0.01)
          const updatedPoints = (currentMember.points || 0) + earnedPoints
          const updatedSpending = (currentMember.total_spending || 0) + total
          const updatedDebt = isTempo ? (currentMember.debt || 0) + total : (currentMember.debt || 0)

          await db.members.update(member.id, {
            points: updatedPoints,
            total_spending: updatedSpending,
            debt: updatedDebt,
            updatedAt: now,
            synced: 0
          })
        }
      }
    })

    return { id, total, stockWarnings }
  },

  async getInitialData() {
    const [products, members] = await Promise.all([
      db.products.toArray(),
      db.members.toArray()
    ])
    return { products, members }
  }
}