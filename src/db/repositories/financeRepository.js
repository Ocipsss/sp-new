// src/db/repositories/financeRepository.js
import { db } from '../index.js'
import dayjs from 'dayjs'

export const financeRepo = {
  // Ambil daftar akun kas & bank (saldo digital disatukan ke bank)
  async getAccounts() {
    const table = db.cash_accounts || db.table('cash_accounts')
    let accounts = await table.toArray()
    
    // Inisialisasi akun bawaan jika belum ada
    if (accounts.length === 0) {
      const defaultAccounts = [
        { id: 'acc_cash', name: 'Kas Laci (Tunai)', type: 'CASH', balance: 0, updatedAt: dayjs().toISOString(), synced: 0 },
        { id: 'acc_bank', name: 'Rekening / QRIS / Wallet', type: 'BANK', balance: 0, updatedAt: dayjs().toISOString(), synced: 0 }
      ]
      await table.bulkPut(defaultAccounts)
      accounts = defaultAccounts
    } else {
      // Hapus akun digital lama jika ada
      const digitalAcc = accounts.find(a => a.id === 'acc_digital')
      if (digitalAcc) {
        await table.delete('acc_digital')
        accounts = accounts.filter(a => a.id !== 'acc_digital')
      }
    }
    return accounts
  },

  // Ambil total piutang member saat ini
  async getTotalPiutang() {
    const members = await db.members.toArray()
    return members.reduce((sum, m) => sum + (Number(m.debt) || 0), 0)
  },

  // Perbarui saldo akun
  async updateBalance(accountId, deltaAmount) {
    const table = db.cash_accounts || db.table('cash_accounts')
    // Jika ada mutasi ke acc_digital, otomatis dialihkan ke acc_bank
    const targetId = accountId === 'acc_digital' ? 'acc_bank' : accountId
    const acc = await table.get(targetId)
    if (acc) {
      const newBalance = (acc.balance || 0) + deltaAmount
      await table.update(targetId, { balance: newBalance, updatedAt: dayjs().toISOString(), synced: 0 })
    }
  },

  // Set saldo awal manual
  async setInitialBalance(accountId, targetBalance, note = 'Set Saldo Awal') {
    const targetId = accountId === 'acc_digital' ? 'acc_bank' : accountId
    const table = db.cash_accounts || db.table('cash_accounts')
    const acc = await table.get(targetId)
    if (!acc) return

    const currentBalance = acc.balance || 0
    const diff = targetBalance - currentBalance

    if (diff !== 0) {
      await this.addMutation({
        accountId: targetId,
        type: diff > 0 ? 'IN' : 'OUT',
        amount: Math.abs(diff),
        category: 'Penyesuaian Saldo',
        note
      })
    }
  },

  // Ambil daftar mutasi saldo
  async getMutations() {
    const table = db.cash_mutations || db.table('cash_mutations')
    return await table.orderBy('date').reverse().toArray()
  },

  // Tambah mutasi baru
  async addMutation(data) {
    const id = crypto.randomUUID()
    const now = dayjs().toISOString()
    const targetAccId = data.accountId === 'acc_digital' ? 'acc_bank' : data.accountId

    const item = {
      id,
      date: now,
      accountId: targetAccId,
      type: data.type, // 'IN' atau 'OUT'
      amount: Number(data.amount) || 0,
      category: data.category || 'Lainnya',
      note: data.note || '',
      refId: data.refId || null,
      updatedAt: now,
      synced: 0
    }
    
    const table = db.cash_mutations || db.table('cash_mutations')
    await table.add(item)

    const delta = data.type === 'IN' ? item.amount : -item.amount
    await this.updateBalance(targetAccId, delta)

    return id
  },

  // HITUNG ULANG SALDO DARI RIWAYAT TRANSAKSI
  async recalculateFromHistory() {
    const transactions = await db.transactions.toArray()
    const digitalTrx = await db.digital_transactions.toArray()
    const mutationsTable = db.cash_mutations || db.table('cash_mutations')
    const accountsTable = db.cash_accounts || db.table('cash_accounts')
    
    await mutationsTable.clear()
    await this.getAccounts()
    await accountsTable.update('acc_cash', { balance: 0 })
    await accountsTable.update('acc_bank', { balance: 0 })

    // 1. Olah transaksi Kasir (Barang)
    for (const t of transactions) {
      if (t.paymentMethod === 'CASH' && (t.amountPaid > 0 || t.paidAmount > 0 || t.total > 0)) {
        await this.addMutation({
          accountId: 'acc_cash',
          type: 'IN',
          amount: t.paidAmount || t.amountPaid || t.total,
          category: 'Penjualan Toko',
          note: `Transaksi Kasir #${t.id.slice(0, 8)}`,
          refId: t.id
        })
      } else if (t.paymentMethod === 'QRIS') {
        await this.addMutation({
          accountId: 'acc_bank',
          type: 'IN',
          amount: t.total,
          category: 'Penjualan Toko',
          note: `Transaksi QRIS #${t.id.slice(0, 8)}`,
          refId: t.id
        })
      }
    }

        // 2. Olah transaksi Produk Digital
    for (const d of digitalTrx) {
      const isTopup = d.type === 'topup'
      const isCashAdmin = d.adminPaymentMethod === 'cash'

      if (isTopup) {
        const cashIn = d.nominal + (isCashAdmin ? d.adminFee : 0)
        if (cashIn > 0) {
          await this.addMutation({
            accountId: 'acc_cash',
            type: 'IN',
            amount: cashIn,
            category: 'Transaksi Digital',
            note: `Top Up ${d.provider}`,
            refId: d.id
          })
        }

        // Potong bank sesuai skema potong saldo (nominal - admin)
        const bankOut = isCashAdmin ? d.nominal : Math.max(0, d.nominal - d.adminFee)
        await this.addMutation({
          accountId: 'acc_bank',
          type: 'OUT',
          amount: bankOut,
          category: 'Transaksi Digital',
          note: `Modal Top Up ${d.provider}`,
          refId: d.id
        })
      } else {
        const cashOut = d.nominal - (isCashAdmin ? d.adminFee : 0)
        if (cashOut > 0) {
          await this.addMutation({
            accountId: 'acc_cash',
            type: 'OUT',
            amount: cashOut,
            category: 'Transaksi Digital',
            note: `Tarik Tunai ${d.provider}`,
            refId: d.id
          })
        }
        
        const bankIn = isCashAdmin ? d.nominal : d.nominal + d.adminFee
        await this.addMutation({
          accountId: 'acc_bank',
          type: 'IN',
          amount: bankIn,
          category: 'Transaksi Digital',
          note: `Masuk Saldo Tarik Tunai ${d.provider}`,
          refId: d.id
        })
      }
    }
  }
}
