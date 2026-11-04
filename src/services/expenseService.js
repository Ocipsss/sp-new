import { expenseRepository } from '../db/repositories/expenseRepository.js'
import { financeRepo } from '../db/repositories/financeRepository.js'

export const expenseService = {
  async getAllExpenses() {
    return await expenseRepository.getAll()
  },

  async addExpense(data) {
    // 1. Simpan data pengeluaran
    const newItem = await expenseRepository.create(data)

    // 2. Potong kas / bank di sistem Keuangan (OUT)
    const accountId = data.paymentMethod === 'QRIS' ? 'acc_bank' : 'acc_cash'
    const accLabel = accountId === 'acc_bank' ? 'Bank / QRIS' : 'Kas Laci'

    await financeRepo.addMutation({
      accountId,
      type: 'OUT',
      amount: newItem.amount,
      category: `Operasional: ${newItem.category}`,
      note: `${newItem.note || newItem.category} (via ${accLabel})`,
      refId: newItem.id
    })

    return newItem
  },

  async deleteExpense(expense) {
    // 1. Hapus data pengeluaran
    await expenseRepository.delete(expense.id)

    // 2. Pengembalian dana mutasi kas / bank (IN)
    const accountId = expense.paymentMethod === 'QRIS' ? 'acc_bank' : 'acc_cash'

    await financeRepo.addMutation({
      accountId,
      type: 'IN',
      amount: expense.amount,
      category: 'Pembatalan Pengeluaran',
      note: `Batal Pengeluaran ${expense.category}: ${expense.note || ''}`,
      refId: expense.id
    })
  }
}
