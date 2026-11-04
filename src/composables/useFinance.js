// src/composables/useFinance.js
import { ref, computed } from 'vue'
import { financeRepo } from '../db/repositories/financeRepository.js'
import { toast } from 'vue-sonner'

export function useFinance() {
  const accounts = ref([])
  const mutations = ref([])
  const totalPiutang = ref(0)
  const loading = ref(false)

  const totalSaldo = computed(() => accounts.value.reduce((s, a) => s + (a.balance || 0), 0))

  const loadData = async () => {
    loading.value = true
    try {
      accounts.value = await financeRepo.getAccounts()
      mutations.value = await financeRepo.getMutations()
      totalPiutang.value = await financeRepo.getTotalPiutang()
    } finally {
      loading.value = false
    }
  }

  const syncFromHistory = async () => {
    loading.value = true
    try {
      await financeRepo.recalculateFromHistory()
      await loadData()
      toast.success('Berhasil menghitung ulang saldo dan piutang!')
    } catch (err) {
      toast.error(`Gagal menghitung ulang: ${err.message}`)
    } finally {
      loading.value = false
    }
  }

  const setBalance = async (accountId, amount, note) => {
    const targetAmount = Number(amount)

    if (isNaN(targetAmount) || targetAmount < 0) {
      toast.error('Nominal saldo awal tidak boleh bernilai negatif!')
      return false
    }

    await financeRepo.setInitialBalance(accountId, targetAmount, note)
    toast.success('Saldo awal berhasil diperbarui!')
    await loadData()
    return true
  }

  const handleTransfer = async (fromAccId, toAccId, amount, note) => {
    const transferAmount = Number(amount)

    if (isNaN(transferAmount) || transferAmount <= 0) {
      toast.error('Nominal transfer harus lebih besar dari 0!')
      return
    }
    
    await financeRepo.addMutation({
      accountId: fromAccId, type: 'OUT', amount: transferAmount,
      category: 'Pindah Saldo', note: `Transfer ke ${toAccId}: ${note}`
    })

    await financeRepo.addMutation({
      accountId: toAccId, type: 'IN', amount: transferAmount,
      category: 'Pindah Saldo', note: `Transfer dari ${fromAccId}: ${note}`
    })

    toast.success('Transfer saldo berhasil!')
    await loadData()
  }

  return {
    accounts,
    mutations,
    totalSaldo,
    totalPiutang,
    loading,
    loadData,
    syncFromHistory,
    setBalance,
    handleTransfer
  }
}
