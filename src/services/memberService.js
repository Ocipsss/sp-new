import { memberRepo } from '../db/repositories/memberRepository.js'
import { financeRepo } from '../db/repositories/financeRepository.js'
import dayjs from 'dayjs'

export const memberService = {
  async payDebt({ memberId, amount, paymentMethod = 'CASH' }) {
    const now = dayjs().toISOString()
    const member = await memberRepo.getById(memberId)
    if (!member) throw new Error('Member tidak ditemukan')

    const payAmount = Number(amount) || 0
    if (payAmount <= 0) throw new Error('Nominal pembayaran harus lebih besar dari 0')

    const newDebt = Math.max(0, (member.debt || 0) - payAmount)

    // 1. Catat riwayat cicilan utang
    const paymentId = crypto.randomUUID()
    await memberRepo.addDebtPayment({
      id: paymentId,
      memberId,
      transactionId: null,
      date: now,
      amount: payAmount,
      paymentMethod
    })

    // 2. Update sisa utang member
    await memberRepo.update(memberId, { debt: newDebt })

    // 3. Tentukan akun kas tujuan: CASH ke acc_cash, QRIS/BANK ke acc_bank
    const targetAccount = (paymentMethod === 'QRIS' || paymentMethod === 'BANK') ? 'acc_bank' : 'acc_cash'
    const accountLabel = targetAccount === 'acc_bank' ? 'QRIS / Bank' : 'Tunai'

    await financeRepo.addMutation({
      accountId: targetAccount,
      type: 'IN',
      amount: payAmount,
      category: 'Pembayaran Utang Member',
      note: `Cicilan/Pelunasan utang a.n ${member.name} (${accountLabel})`,
      refId: paymentId
    })

    return newDebt
  }
}
