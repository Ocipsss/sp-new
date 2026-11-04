// src/composables/useReports.js
import { ref, computed } from 'vue'
import { reportService } from '../services/reportService.js'
import { toast } from 'vue-sonner'
import dayjs from 'dayjs'

export function useReports() {
  const loading = ref(false)
  const rawTransactions = ref([])
  const rawTransactionItems = ref([])
  const rawDigitalTransactions = ref([])
  const productsMap = ref(new Map())

  const selectedPeriod = ref('today')

  const periodOptions = [
    { label: 'Hari Ini', value: 'today' },
    { label: '7 Hari', value: 'week' },
    { label: 'Bulan Ini', value: 'month' },
    { label: 'Semua', value: 'all' }
  ]

  const loadData = async () => {
    loading.value = true
    try {
      const data = await reportService.getReportData()
      rawTransactions.value = data.rawTransactions
      rawTransactionItems.value = data.rawTransactionItems
      rawDigitalTransactions.value = data.rawDigitalTransactions
      productsMap.value = data.productsMap
    } catch (err) {
      toast.error(`Gagal memuat data laporan: ${err.message}`)
    } finally {
      loading.value = false
    }
  }

  const filteredTransactions = computed(() => {
    const now = dayjs()
    return rawTransactions.value.filter(t => {
      if (!t.date) return false
      const d = dayjs(t.date)
      if (selectedPeriod.value === 'today') return d.isSame(now, 'day')
      if (selectedPeriod.value === 'week') return d.isAfter(now.subtract(7, 'day'))
      if (selectedPeriod.value === 'month') return d.isSame(now, 'month')
      return true
    })
  })

  const filteredDigitalTransactions = computed(() => {
    const now = dayjs()
    return rawDigitalTransactions.value.filter(d => {
      if (!d.date) return false
      const date = dayjs(d.date)
      if (selectedPeriod.value === 'today') return date.isSame(now, 'day')
      if (selectedPeriod.value === 'week') return date.isAfter(now.subtract(7, 'day'))
      if (selectedPeriod.value === 'month') return date.isSame(now, 'month')
      return true
    })
  })

  const omzetBarang = computed(() => filteredTransactions.value.reduce((s, t) => s + (t.total || 0), 0))
  const countBarang = computed(() => filteredTransactions.value.length)

  const profitBarang = computed(() => {
    const validTrxIds = new Set(filteredTransactions.value.map(t => t.id))
    const items = rawTransactionItems.value.filter(i => validTrxIds.has(i.transactionId))
    
    return items.reduce((sum, item) => {
      const prod = productsMap.value.get(item.productId)
      const modal = prod?.price_modal || 0
      const profitPerPcs = (item.price || 0) - modal
      return sum + (Math.max(0, profitPerPcs) * (item.qty || 1))
    }, 0)
  })

  const profitDigital = computed(() => filteredDigitalTransactions.value.reduce((s, d) => s + (d.profit || d.adminFee || 0), 0))
  const countDigital = computed(() => filteredDigitalTransactions.value.length)

  const totalOmzet = computed(() => omzetBarang.value + profitDigital.value)
  const totalProfit = computed(() => profitBarang.value + profitDigital.value)
  const totalTrxCount = computed(() => countBarang.value + countDigital.value)

  const omzetCash = computed(() => filteredTransactions.value.filter(t => t.paymentMethod === 'CASH').reduce((s, t) => s + t.total, 0))
  const omzetQRIS = computed(() => filteredTransactions.value.filter(t => t.paymentMethod === 'QRIS').reduce((s, t) => s + t.total, 0))
  const omzetTempo = computed(() => filteredTransactions.value.filter(t => t.paymentMethod === 'TEMPO').reduce((s, t) => s + t.total, 0))

  const handleExportToExcel = () => {
    try {
      reportService.exportToExcel(
        filteredTransactions.value,
        filteredDigitalTransactions.value,
        selectedPeriod.value
      )
      toast.success('Laporan berhasil diexport ke Excel!')
    } catch (err) {
      toast.error(`Gagal export Excel: ${err.message}`)
    }
  }

  return {
    loading,
    selectedPeriod,
    periodOptions,
    filteredTransactions,
    filteredDigitalTransactions,
    totalOmzet,
    totalProfit,
    totalTrxCount,
    profitBarang,
    countBarang,
    profitDigital,
    countDigital,
    omzetCash,
    omzetQRIS,
    omzetTempo,
    loadData,
    handleExportToExcel
  }
}
