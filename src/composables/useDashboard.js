import { ref } from 'vue'
import { dashboardService } from '../services/dashboardService.js'

export function useDashboard() {
  const stats = ref({ totalProducts:0, lowStock:0, trxHariIni:0, omzetHariIni:0, totalPiutang:0, memberBerutang:0 })
  const lowProducts = ref([])
  const chartRaw = ref([])
  const loading = ref(true)

  const load = async () => {
    loading.value = true
    const data = await dashboardService.getDashboardData()
    stats.value = data.stats
    lowProducts.value = data.tipis.slice(0,6)
    chartRaw.value = data.chartRaw
    loading.value = false
  }

  return { stats, lowProducts, chartRaw, loading, load }
}