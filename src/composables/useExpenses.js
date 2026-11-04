// src/composables/useExpenses.js
import { ref, computed } from 'vue'
import { expenseService } from '../services/expenseService.js'
import { toast } from 'vue-sonner'
import dayjs from 'dayjs'

export function useExpenses() {
  const expenses = ref([])
  const searchQuery = ref('')
  const selectedCategory = ref('ALL')
  const loading = ref(false)

  const showModal = ref(false)
  const form = ref({
    category: 'Plastik & Bungkusan',
    amount: null,
    paymentMethod: 'CASH',
    note: '',
    date: dayjs().format('YYYY-MM-DDTHH:mm')
  })

  const categoryOptions = [
    'Plastik & Bungkusan',
    'Listrik & Air',
    'Sewa Tempat',
    'Gaji Karyawan',
    'Transportasi / Bensin',
    'Perbaikan & Alat',
    'Lain-lain'
  ]

  const loadExpenses = async () => {
    loading.value = true
    try {
      expenses.value = await expenseService.getAllExpenses()
    } finally {
      loading.value = false
    }
  }

  const filteredExpenses = computed(() => {
    const q = searchQuery.value.toLowerCase().trim()
    return expenses.value.filter(e => {
      const matchQuery = !q || 
        (e.note || '').toLowerCase().includes(q) || 
        (e.category || '').toLowerCase().includes(q)
      
      const matchCat = selectedCategory.value === 'ALL' || e.category === selectedCategory.value

      return matchQuery && matchCat
    })
  })

  const totalHariIni = computed(() => {
    const today = dayjs().startOf('day')
    return expenses.value
      .filter(e => dayjs(e.date).isAfter(today))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
  })

  const totalBulanIni = computed(() => {
    const startOfMonth = dayjs().startOf('month')
    return expenses.value
      .filter(e => dayjs(e.date).isAfter(startOfMonth))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
  })

  const resetForm = () => {
    form.value = {
      category: 'Plastik & Bungkusan',
      amount: null,
      paymentMethod: 'CASH',
      note: '',
      date: dayjs().format('YYYY-MM-DDTHH:mm')
    }
  }

  const openModal = () => {
    resetForm()
    showModal.value = true
  }

  const closeModal = () => {
    showModal.value = false
    resetForm()
  }

  const saveExpense = async () => {
    const amount = Number(form.value.amount)

    // GUARD: Angka positif & valid
    if (isNaN(amount) || amount <= 0) {
      toast.error('Nominal pengeluaran harus berupa angka lebih dari 0!')
      return
    }

    loading.value = true
    try {
      await expenseService.addExpense({
        ...form.value,
        amount
      })
      toast.success('Pengeluaran berhasil dicatat & kas dipotong!')
      closeModal()
      await loadExpenses()
    } catch (err) {
      toast.error(`Gagal menyimpan: ${err.message}`)
    } finally {
      loading.value = false
    }
  }

  const deleteExpense = async (expense) => {
    if (!confirm(`Hapus catatan pengeluaran "${expense.category}" (Rp ${expense.amount.toLocaleString('id-ID')})?\nSaldo kas/bank akan dikembalikan.`)) {
      return
    }

    loading.value = true
    try {
      await expenseService.deleteExpense(expense)
      toast.success('Pengeluaran dihapus & kas dikembalikan!')
      await loadExpenses()
    } catch (err) {
      toast.error(`Gagal menghapus: ${err.message}`)
    } finally {
      loading.value = false
    }
  }

  const formatDate = (d) => dayjs(d).format('DD MMM YYYY • HH:mm')

  return {
    expenses,
    searchQuery,
    selectedCategory,
    loading,
    showModal,
    form,
    categoryOptions,
    filteredExpenses,
    totalHariIni,
    totalBulanIni,
    loadExpenses,
    openModal,
    closeModal,
    saveExpense,
    deleteExpense,
    formatDate
  }
}
