// src/services/salesHistoryService.js
import { db } from '../db/index.js'
import { transactionRepo } from '../db/repositories/transactionRepository.js'
import { memberRepo } from '../db/repositories/memberRepository.js'
import { productRepo } from '../db/repositories/productRepository.js'
import { financeRepo } from '../db/repositories/financeRepository.js'
import { productsDigitalService } from './productsDigitalService.js'
import dayjs from 'dayjs'

export const salesHistoryService = {
  async getCombinedHistory() {
    const [transactions, members, products, allItems, digitalTransactions] = await Promise.all([
      transactionRepo.getAll(),
      memberRepo.getAll(),
      productRepo.getAll(),
      transactionRepo.getAllItems(),
      productsDigitalService.getAll()
    ])

    const memberMap = new Map(members.map(m => [m.id, m.name]))
    const productMap = new Map(products.map(p => [p.id, p.name]))

    const totalPiutang = members.reduce((sum, m) => sum + (Number(m.debt) || 0), 0)

    const formattedBarang = transactions.map(t => {
      const items = allItems
        .filter(item => item.transactionId === t.id)
        .map(item => ({
          ...item,
          productName: item.name || productMap.get(item.productId) || 'Produk Dihapus'
        }))

      return {
        ...t,
        trxType: 'BARANG',
        memberName: t.memberId ? (memberMap.get(t.memberId) || 'Member Tidak Ditemukan') : 'Umum / Non-Member',
        items
      }
    })

    const formattedDigital = digitalTransactions.map(d => {
      const isTopup = d.type === 'topup'
      const isCashAdmin = d.adminPaymentMethod === 'cash'
      
      let kasImpact = 0
      if (isTopup) {
        kasImpact = d.nominal + (isCashAdmin ? d.adminFee : 0)
      } else {
        kasImpact = -(d.nominal - (isCashAdmin ? d.adminFee : 0))
      }

      return {
        id: d.id,
        date: d.date,
        trxType: 'DIGITAL',
        digitalType: d.type,
        provider: d.provider,
        nominal: d.nominal,
        adminFee: d.adminFee,
        adminPaymentMethod: d.adminPaymentMethod,
        total: kasImpact,
        profit: d.profit || d.adminFee,
        status: d.status || 'SUCCESS',
        paymentMethod: isCashAdmin ? 'CASH' : 'DIGITAL_SALDO',
        memberName: `Digital: ${d.provider}`,
        items: [
          {
            id: d.id,
            productName: `${isTopup ? 'TOP UP' : 'TARIK TUNAI'} ${d.provider}`,
            qty: 1,
            price: d.nominal,
            subtotal: d.nominal
          }
        ]
      }
    })

    const transactionsList = [...formattedBarang, ...formattedDigital].sort((a, b) => new Date(b.date) - new Date(a.date))

    return {
      transactions: transactionsList,
      totalPiutang
    }
  },

  // FUNGSI EDIT TRANSAKSI BARANG
  async updateTransaction(originalTrx, updatedItems, newPaymentData = {}) {
    const now = dayjs().toISOString()
    const oldItems = await transactionRepo.getItemsByTransactionId(originalTrx.id)

    // Ambil data header transaksi lama secara aman dari repository atau Dexie langsung
    const existingTrxHeader = (await transactionRepo.getById(originalTrx.id)) || (await db.transactions.get(originalTrx.id)) || originalTrx

    // Tentukan metode bayar & member baru dari payload
    const newPaymentMethod = newPaymentData.paymentMethod || existingTrxHeader.paymentMethod || 'CASH'
    const newMemberId = newPaymentData.memberId !== undefined ? newPaymentData.memberId : (existingTrxHeader.memberId || null)

    // 1. Peta stok lama vs stok baru untuk menghitung selisih kuantitas
    const oldQtyMap = new Map()
    oldItems.forEach(i => {
      if (i.productId) oldQtyMap.set(i.productId, (oldQtyMap.get(i.productId) || 0) + (i.qty || 0))
    })

    const newQtyMap = new Map()
    let newTotal = 0

    updatedItems.forEach(i => {
      const subtotal = (Number(i.price) || 0) * (Number(i.qty) || 0)
      newTotal += subtotal
      if (i.productId) {
        newQtyMap.set(i.productId, (newQtyMap.get(i.productId) || 0) + (Number(i.qty) || 0))
      }
    })

    // 2. Adjust stok produk berdasarkan selisih (Delta)
    const allProductIds = new Set([...oldQtyMap.keys(), ...newQtyMap.keys()])
    for (const prodId of allProductIds) {
      const oldQty = oldQtyMap.get(prodId) || 0
      const newQty = newQtyMap.get(prodId) || 0
      const delta = oldQty - newQty // Positif = stok kembali, Negatif = stok berkurang

      if (delta !== 0) {
        const prod = await productRepo.getById(prodId)
        if (prod) {
          await productRepo.update(prodId, {
            qty: (prod.qty || 0) + delta
          })
        }
      }
    }

    // 3. Re-write item transaksi di database
    const existingItemIds = oldItems.map(i => i.id)
    if (existingItemIds.length > 0) {
      await db.transaction_items.bulkDelete(existingItemIds)
    }

    const itemsToInsert = updatedItems.map(i => ({
      id: crypto.randomUUID(),
      transactionId: originalTrx.id,
      productId: i.productId || null,
      serviceId: i.serviceId || null,
      name: i.productName || i.name || 'Barang',
      qty: Number(i.qty) || 1,
      price: Number(i.price) || 0,
      subtotal: (Number(i.price) || 0) * (Number(i.qty) || 0),
      updatedAt: now,
      synced: 0
    }))
    await db.transaction_items.bulkPut(itemsToInsert)

    // 4. Rekonsiliasi Mutasi Keuangan & Arus Kas
    const oldAccId = existingTrxHeader.paymentMethod === 'QRIS' ? 'acc_bank' : existingTrxHeader.paymentMethod === 'CASH' ? 'acc_cash' : null
    const newAccId = newPaymentMethod === 'QRIS' ? 'acc_bank' : newPaymentMethod === 'CASH' ? 'acc_cash' : null

    // Batalkan dampak kas transaksi lama
    if (oldAccId && (existingTrxHeader.total || 0) > 0) {
      await financeRepo.addMutation({
        accountId: oldAccId,
        type: 'OUT',
        amount: existingTrxHeader.total,
        category: 'Koreksi Transaksi',
        note: `Koreksi Edit Nota #${originalTrx.id.slice(0, 8)}`,
        refId: originalTrx.id
      })
    }

    // Masukkan arus kas transaksi baru
    if (newAccId && newTotal > 0) {
      await financeRepo.addMutation({
        accountId: newAccId,
        type: 'IN',
        amount: newTotal,
        category: 'Penjualan Kasir',
        note: `Update Nota #${originalTrx.id.slice(0, 8)}`,
        refId: originalTrx.id
      })
    }

    // 5. Rekonsiliasi Piutang & Total Spending Member
    if (existingTrxHeader.memberId) {
      const oldMember = await memberRepo.getById(existingTrxHeader.memberId)
      if (oldMember) {
        const debtRollback = existingTrxHeader.paymentMethod === 'TEMPO' ? (existingTrxHeader.total || 0) : 0
        await memberRepo.update(existingTrxHeader.memberId, {
          debt: Math.max(0, (oldMember.debt || 0) - debtRollback),
          total_spending: Math.max(0, (oldMember.total_spending || 0) - (existingTrxHeader.total || 0))
        })
      }
    }

    if (newMemberId) {
      const newMember = await memberRepo.getById(newMemberId)
      if (newMember) {
        const addedDebt = newPaymentMethod === 'TEMPO' ? newTotal : 0
        await memberRepo.update(newMemberId, {
          debt: (newMember.debt || 0) + addedDebt,
          total_spending: (newMember.total_spending || 0) + newTotal
        })
      }
    }

    // 6. Update header transaksi
    const newAmountPaid = newPaymentMethod === 'TEMPO' ? 0 : (newPaymentData.amountPaid !== undefined ? newPaymentData.amountPaid : newTotal)
    const newRemaining = newPaymentMethod === 'TEMPO' ? newTotal : 0

    await db.transactions.update(originalTrx.id, {
      total: newTotal,
      paymentMethod: newPaymentMethod,
      memberId: newMemberId,
      amountPaid: newAmountPaid,
      paidAmount: newAmountPaid,
      remaining: newRemaining,
      updatedAt: now,
      synced: 0
    })

    return { id: originalTrx.id, total: newTotal }
  },

  async voidTransaction(transaction) {
    const now = dayjs().toISOString()

    if (transaction.trxType === 'BARANG') {
      if (transaction.status === 'void') throw new Error('Transaksi ini sudah dibatalkan.')

      const items = await transactionRepo.getItemsByTransactionId(transaction.id)
      for (const item of items) {
        if (item.productId) {
          const product = await productRepo.getById(item.productId)
          if (product) {
            await productRepo.update(item.productId, {
              qty: (product.qty || 0) + (item.qty || 0)
            })
          }
        }
      }

      if (transaction.paymentMethod === 'CASH' && transaction.total > 0) {
        await financeRepo.addMutation({
          accountId: 'acc_cash',
          type: 'OUT',
          amount: transaction.total,
          category: 'Pembatalan Transaksi',
          note: `Void Transaksi Kasir #${transaction.id.slice(0, 8)}`,
          refId: transaction.id
        })
      } else if (transaction.paymentMethod === 'QRIS' && transaction.total > 0) {
        await financeRepo.addMutation({
          accountId: 'acc_bank',
          type: 'OUT',
          amount: transaction.total,
          category: 'Pembatalan Transaksi',
          note: `Void Transaksi QRIS #${transaction.id.slice(0, 8)}`,
          refId: transaction.id
        })
      }

      if (transaction.memberId) {
        const member = await memberRepo.getById(transaction.memberId)
        if (member) {
          const newSpending = Math.max(0, (member.total_spending || 0) - transaction.total)
          const newDebt = transaction.paymentMethod === 'TEMPO' 
            ? Math.max(0, (member.debt || 0) - (transaction.remaining || transaction.total))
            : (member.debt || 0)

          await memberRepo.update(transaction.memberId, {
            total_spending: newSpending,
            debt: newDebt
          })
        }
      }

      await db.transactions.update(transaction.id, {
        status: 'void',
        updatedAt: now,
        synced: 0
      })

    } else if (transaction.trxType === 'DIGITAL') {
      if (transaction.status === 'CANCELLED') throw new Error('Transaksi digital sudah dibatalkan.')

      const isTopup = transaction.digitalType === 'topup'
      const isCashAdmin = transaction.adminPaymentMethod === 'cash'

      if (isTopup) {
        const cashOut = transaction.nominal + (isCashAdmin ? transaction.adminFee : 0)
        if (cashOut > 0) {
          await financeRepo.addMutation({
            accountId: 'acc_cash',
            type: 'OUT',
            amount: cashOut,
            category: 'Pembatalan Transaksi Digital',
            note: `Void Top Up ${transaction.provider}`,
            refId: transaction.id
          })
        }
        const bankIn = isCashAdmin ? transaction.nominal : Math.max(0, transaction.nominal - transaction.adminFee)
        await financeRepo.addMutation({
          accountId: 'acc_bank',
          type: 'IN',
          amount: bankIn,
          category: 'Pembatalan Transaksi Digital',
          note: `Pengembalian Modal Top Up ${transaction.provider}`,
          refId: transaction.id
        })
      } else {
        const cashIn = transaction.nominal - (isCashAdmin ? transaction.adminFee : 0)
        if (cashIn > 0) {
          await financeRepo.addMutation({
            accountId: 'acc_cash',
            type: 'IN',
            amount: cashIn,
            category: 'Pembatalan Transaksi Digital',
            note: `Void Tarik Tunai ${transaction.provider}`,
            refId: transaction.id
          })
        }
        const bankOut = isCashAdmin ? transaction.nominal : transaction.nominal + transaction.adminFee
        await financeRepo.addMutation({
          accountId: 'acc_bank',
          type: 'OUT',
          amount: bankOut,
          category: 'Pembatalan Transaksi Digital',
          note: `Penarikan Saldo Tarik Tunai ${transaction.provider}`,
          refId: transaction.id
        })
      }

      await db.digital_transactions.update(transaction.id, {
        status: 'CANCELLED',
        profit: 0,
        updatedAt: now,
        synced: 0
      })
    }
  }
}
