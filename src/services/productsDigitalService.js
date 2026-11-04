// src/services/productsDigitalService.js
import { db } from '../db/index.js'
import { financeRepo } from '../db/repositories/financeRepository.js'
import dayjs from 'dayjs'

export const productsDigitalService = {
  async create(data) {
    const now = dayjs().toISOString()
    const id = crypto.randomUUID()
    const nominal = Number(data.nominal) || 0
    const adminFee = Number(data.adminFee) || 0
    const isTopup = data.type === 'topup'
    const isCashAdmin = data.adminPaymentMethod === 'cash'
    const memberId = data.memberId || null
    const memberName = data.memberName || null

    const doc = {
      id,
      date: now,
      updatedAt: now,
      type: data.type,
      provider: data.provider?.toUpperCase().trim(),
      nominal,
      adminFee,
      adminPaymentMethod: data.adminPaymentMethod,
      totalReceived: isTopup && isCashAdmin ? nominal + adminFee : nominal,
      profit: adminFee,
      memberId,
      memberName,
      synced: 0
    }

    const result = await db.digital_transactions.add(doc)

    if (isTopup) {
      const cashIn = nominal + (isCashAdmin ? adminFee : 0)
      if (cashIn > 0) {
        await financeRepo.addMutation({
          accountId: 'acc_cash',
          type: 'IN',
          amount: cashIn,
          category: 'Transaksi Digital',
          note: `Top Up ${doc.provider} (Uang Diterima)`,
          refId: id
        })
      }

      const bankOut = isCashAdmin ? nominal : Math.max(0, nominal - adminFee)
      await financeRepo.addMutation({
        accountId: 'acc_bank',
        type: 'OUT',
        amount: bankOut,
        category: 'Transaksi Digital',
        note: `Modal Top Up ${doc.provider}`,
        refId: id
      })
    } else {
      const cashOut = nominal - (isCashAdmin ? adminFee : 0)
      if (cashOut > 0) {
        await financeRepo.addMutation({
          accountId: 'acc_cash',
          type: 'OUT',
          amount: cashOut,
          category: 'Transaksi Digital',
          note: `Tarik Tunai ${doc.provider} (Uang Diserahkan)`,
          refId: id
        })
      }
      
      const bankIn = isCashAdmin ? nominal : nominal + adminFee
      await financeRepo.addMutation({
        accountId: 'acc_bank',
        type: 'IN',
        amount: bankIn,
        category: 'Transaksi Digital',
        note: `Masuk Saldo Tarik Tunai ${doc.provider}`,
        refId: id
      })
    }

    // Jika ada member yang dipilih, update poin dan total belanja
    if (memberId) {
      const currentMember = await db.members.get(memberId)
      if (currentMember) {
        const totalOmzetDigital = nominal + adminFee
        const earnedPoints = Math.floor(adminFee * 0.01) // 1% dari profit admin fee
        const updatedPoints = (currentMember.points || 0) + earnedPoints
        const updatedSpending = (currentMember.total_spending || 0) + totalOmzetDigital

        await db.members.update(memberId, {
          points: updatedPoints,
          total_spending: updatedSpending,
          updatedAt: now,
          synced: 0
        })
      }
    }

    return result
  },

  async getUnsynced() {
    return await db.digital_transactions.where('synced').equals(0).toArray()
  },

  async markSynced(ids) {
    return await db.digital_transactions.bulkUpdate(
      ids.map(id => ({ key: id, changes: { synced: 1 } }))
    )
  },

  async getAll() {
    return await db.digital_transactions.orderBy('date').reverse().toArray()
  }
}
