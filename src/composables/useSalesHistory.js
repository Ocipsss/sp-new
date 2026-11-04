import { ref, computed } from 'vue'
import { salesHistoryService } from '../services/salesHistoryService.js'
import { toast } from 'vue-sonner'
import dayjs from 'dayjs'
import localeId from 'dayjs/locale/id'

dayjs.locale(localeId)

export function useSalesHistory() {
  const transactions = ref([])
  const totalPiutang = ref(0)
  const searchQuery = ref('')
  const selectedFilter = ref('TODAY') // Default langsung ke 'Hari Ini'
  const selectedTransaction = ref(null)
  const loading = ref(false)

  const filterOptions = [
    { label: 'Hari Ini', value: 'TODAY' },
    { label: 'Semua', value: 'ALL' },
    { label: 'Barang', value: 'BARANG' },
    { label: 'Digital', value: 'DIGITAL' },
    { label: 'Cash', value: 'CASH' },
    { label: 'QRIS', value: 'QRIS' },
    { label: 'Tempo', value: 'TEMPO' },
    { label: 'Void', value: 'VOID' }
  ]

  const loadHistory = async () => {
    loading.value = true
    try {
      const data = await salesHistoryService.getCombinedHistory()
      transactions.value = data.transactions || []
      totalPiutang.value = data.totalPiutang || 0
    } catch (e) {
      toast.error(`Gagal memuat riwayat: ${e.message}`)
    } finally {
      loading.value = false
    }
  }

  const handleVoid = async (transaction) => {
    if (!confirm(`Apakah Anda yakin ingin membatalkan (VOID) nota ${transaction.id.slice(0, 8)}?\nStok barang dan kas/bank akan dikembalikan.`)) {
      return
    }

    loading.value = true
    try {
      await salesHistoryService.voidTransaction(transaction)
      toast.success('Transaksi berhasil dibatalkan!')
      selectedTransaction.value = null
      await loadHistory()
    } catch (e) {
      toast.error(`Gagal membatalkan transaksi: ${e.message}`)
    } finally {
      loading.value = false
    }
  }

  const filteredTransactions = computed(() => {
    const q = searchQuery.value.toLowerCase().trim()

    return transactions.value.filter(t => {
      // 1. Filter Pencarian Teks (Cari ID, Member, Provider, atau Nama Produk)
      const matchQuery = !q || 
        (t.memberName || '').toLowerCase().includes(q) || 
        (t.provider || '').toLowerCase().includes(q) || 
        (t.id || '').toLowerCase().includes(q) ||
        t.items?.some(item => (item.productName || '').toLowerCase().includes(q))

      // 2. Filter Kategori / Tanggal Hari Ini
      let matchFilter = true
      if (selectedFilter.value === 'TODAY') {
        matchFilter = dayjs(t.date).isSame(dayjs(), 'day')
      } else if (selectedFilter.value === 'BARANG') {
        matchFilter = t.trxType === 'BARANG'
      } else if (selectedFilter.value === 'DIGITAL') {
        matchFilter = t.trxType === 'DIGITAL'
      } else if (selectedFilter.value === 'CASH') {
        matchFilter = (t.paymentMethod === 'CASH' || t.paymentMethod === 'TUNAI')
      } else if (selectedFilter.value === 'QRIS') {
        matchFilter = t.paymentMethod === 'QRIS'
      } else if (selectedFilter.value === 'TEMPO') {
        matchFilter = t.paymentMethod === 'TEMPO'
      } else if (selectedFilter.value === 'VOID') {
        matchFilter = (t.status === 'void' || t.status === 'CANCELLED')
      }

      return matchQuery && matchFilter
    })
  })

  const totalOmzet = computed(() => {
    return filteredTransactions.value
      .filter(t => t.status !== 'void' && t.status !== 'CANCELLED')
      .reduce((sum, t) => sum + (t.total || 0), 0)
  })

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return dayjs(dateString).format('DD MMM YYYY • HH:mm')
  }

  return {
    transactions,
    searchQuery,
    selectedFilter,
    selectedTransaction,
    loading,
    filterOptions,
    filteredTransactions,
    totalOmzet,
    totalPiutang,
    loadHistory,
    handleVoid,
    formatDate
  }
}
