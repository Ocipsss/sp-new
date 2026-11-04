<!-- src/views/Dashboard.vue -->
<template>
  <div class="flex-1 overflow-auto p-4 space-y-4 pb-28 font-sans">
    
    <!-- HEADER & AKSI CEPAT -->
    <div class="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-950 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
      <!-- Glow Accent Background -->
      <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="flex justify-between items-start relative z-10">
        <div>
          <div class="text-[10px] font-black tracking-widest text-amber-400 uppercase flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            Sinar Pagi • Ringkasan Toko
          </div>
          <div class="text-2xl font-black mt-1 capitalize tracking-tight">{{ today }}</div>
        </div>

        <!-- Indicator Status Online / Local -->
        <div class="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold text-zinc-300 border border-white/10 flex items-center gap-1.5">
          <Store class="w-3.5 h-3.5 text-amber-400" />
          <span>Toko Aktif</span>
        </div>
      </div>

      <!-- Quick Action Buttons -->
      <div class="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-white/10 relative z-10">
        <router-link to="/kasir" class="bg-amber-500 hover:bg-amber-400 text-zinc-950 py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm">
          <ShoppingCart class="w-3.5 h-3.5" /> Buka Kasir
        </router-link>
        <router-link to="/shopping" class="bg-white/10 hover:bg-white/20 text-white py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 border border-white/10">
          <PackagePlus class="w-3.5 h-3.5 text-amber-400" /> Restock
        </router-link>
        <router-link to="/reports" class="bg-white/10 hover:bg-white/20 text-white py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 border border-white/10">
          <BarChart3 class="w-3.5 h-3.5 text-amber-400" /> Laporan
        </router-link>
      </div>
    </div>

    <!-- METRIC CARDS GRID (4 KOLOM STATISTIK) -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <!-- Omzet Hari Ini -->
      <div class="bg-white rounded-[1.5rem] border border-zinc-200/80 p-4 shadow-xs flex flex-col justify-between">
        <div class="flex justify-between items-center text-zinc-400">
          <span class="text-[10px] font-black uppercase tracking-wider">Omzet Hari Ini</span>
          <div class="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Wallet class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-3">
          <div class="font-black text-lg text-zinc-900 tracking-tight">Rp {{ formatRibuan(stats.omzetHariIni || 0) }}</div>
          <div class="text-[10px] text-zinc-400 font-bold mt-0.5">Penjualan Kotor</div>
        </div>
      </div>

      <!-- Estimasi Profit Hari Ini -->
      <div class="bg-white rounded-[1.5rem] border border-zinc-200/80 p-4 shadow-xs flex flex-col justify-between">
        <div class="flex justify-between items-center text-zinc-400">
          <span class="text-[10px] font-black uppercase tracking-wider">Estimasi Profit</span>
          <div class="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <TrendingUp class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-3">
          <div class="font-black text-lg text-emerald-600 tracking-tight">Rp {{ formatRibuan(stats.profitHariIni || 0) }}</div>
          <div class="text-[10px] text-zinc-400 font-bold mt-0.5">Keuntungan Bersih</div>
        </div>
      </div>

      <!-- Total Transaksi -->
      <div class="bg-white rounded-[1.5rem] border border-zinc-200/80 p-4 shadow-xs flex flex-col justify-between">
        <div class="flex justify-between items-center text-zinc-400">
          <span class="text-[10px] font-black uppercase tracking-wider">Transaksi</span>
          <div class="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Receipt class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-3">
          <div class="font-black text-lg text-zinc-900 tracking-tight">{{ stats.totalTrxHariIni || 0 }} <span class="text-xs font-bold text-zinc-400">Nota</span></div>
          <div class="text-[10px] text-zinc-400 font-bold mt-0.5">Hari Ini</div>
        </div>
      </div>

      <!-- Total Piutang TEMPO -->
      <div class="bg-amber-500/10 border border-amber-500/20 rounded-[1.5rem] p-4 shadow-xs flex flex-col justify-between">
        <div class="flex justify-between items-center text-amber-700">
          <span class="text-[10px] font-black uppercase tracking-wider">Piutang TEMPO</span>
          <div class="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center">
            <Clock class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-3">
          <div class="font-black text-lg text-amber-700 tracking-tight">Rp {{ formatRibuan(stats.totalPiutang || 0) }}</div>
          <div class="text-[10px] text-amber-600/80 font-bold mt-0.5">Belum Dilunasi</div>
        </div>
      </div>
    </div>

    <!-- GRAFIK OMZET 7 HARI -->
    <div class="bg-white rounded-[1.5rem] border border-zinc-200/80 p-5 shadow-xs space-y-3">
      <div class="flex justify-between items-center">
        <div>
          <div class="font-black text-sm text-zinc-900">Tren Omzet 7 Hari Terakhir</div>
          <p class="text-[11px] text-zinc-400 font-medium">Grafik histori pendapatan harian toko</p>
        </div>
        <span class="px-2.5 py-1 bg-zinc-100 text-zinc-600 rounded-lg text-[10px] font-black uppercase">7 Hari</span>
      </div>

      <div class="h-[190px] pt-2">
        <Line v-if="chartData.labels.length > 0" :data="chartData" :options="chartOptions"/>
        <div v-else class="h-full flex flex-col items-center justify-center text-xs text-zinc-400 font-bold gap-2">
          <BarChart3 class="w-6 h-6 text-zinc-300 animate-pulse" />
          <span>{{ loading ? 'Memuat grafik...' : 'Belum ada data grafik' }}</span>
        </div>
      </div>
    </div>

    <!-- 2 KOLOM WIDGET: RESTOCK & PRODUK TERLARIS -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      
      <!-- WIDGET RESTOCK STOK TIPIS -->
      <div class="bg-white rounded-[1.5rem] border border-zinc-200/80 p-5 shadow-xs flex flex-col justify-between space-y-3">
        <div class="flex justify-between items-center border-b border-zinc-100 pb-3">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle class="w-4 h-4" />
            </div>
            <div>
              <div class="font-black text-sm text-zinc-900">Stok Menipis</div>
              <div class="text-[10px] text-zinc-400 font-medium">{{ stats.lowStock || 0 }} barang butuh restock</div>
            </div>
          </div>
          <router-link to="/shopping" class="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 active:scale-95 transition">
            Kulakan <ArrowRight class="w-3.5 h-3.5" />
          </router-link>
        </div>

        <div v-if="lowProducts.length === 0" class="py-8 text-center text-xs text-zinc-400 font-bold bg-zinc-50/50 rounded-xl border border-dashed border-zinc-200">
          ✨ Semua stok barang aman
        </div>

        <div v-else class="space-y-2 max-h-[220px] overflow-y-auto pr-1">
          <div 
            v-for="p in lowProducts" 
            :key="p.id" 
            class="p-2.5 bg-zinc-50 hover:bg-zinc-100/80 rounded-xl border border-zinc-100 flex items-center justify-between transition"
          >
            <div class="min-w-0 pr-2">
              <div class="text-xs font-bold text-zinc-900 truncate">{{ p.name }}</div>
              <div class="text-[10px] text-zinc-400 font-medium uppercase">{{ p.category || 'Umum' }}</div>
            </div>
            <span class="px-2.5 py-1 bg-red-100 border border-red-200 text-red-700 rounded-lg text-xs font-black shrink-0">
              Sisa {{ p.qty }} {{ p.unit || 'pcs' }}
            </span>
          </div>
        </div>
      </div>

      <!-- WIDGET PRODUK TERLARIS (TOP SELLING) -->
      <div class="bg-white rounded-[1.5rem] border border-zinc-200/80 p-5 shadow-xs flex flex-col justify-between space-y-3">
        <div class="flex justify-between items-center border-b border-zinc-100 pb-3">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Flame class="w-4 h-4" />
            </div>
            <div>
              <div class="font-black text-sm text-zinc-900">Produk Terlaris</div>
              <div class="text-[10px] text-zinc-400 font-medium">Item paling banyak dibeli hari ini</div>
            </div>
          </div>
        </div>

        <div v-if="!topProducts || topProducts.length === 0" class="py-8 text-center text-xs text-zinc-400 font-bold bg-zinc-50/50 rounded-xl border border-dashed border-zinc-200">
          Belum ada penjualan hari ini
        </div>

        <div v-else class="space-y-2 max-h-[220px] overflow-y-auto pr-1">
          <div 
            v-for="(tp, idx) in topProducts" 
            :key="tp.name" 
            class="p-2.5 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-between"
          >
            <div class="flex items-center gap-2.5 min-w-0 pr-2">
              <span :class="[
                'w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0',
                idx === 0 ? 'bg-amber-400 text-zinc-950' :
                idx === 1 ? 'bg-zinc-200 text-zinc-700' : 'bg-zinc-100 text-zinc-500'
              ]">
                {{ idx + 1 }}
              </span>
              <span class="text-xs font-bold text-zinc-900 truncate">{{ tp.name }}</span>
            </div>
            <span class="text-xs font-black text-zinc-800 shrink-0">
              {{ tp.qty }} <span class="text-[10px] font-bold text-zinc-400">terjual</span>
            </span>
          </div>
        </div>
      </div>

    </div>

  </div>
</template>

<script setup>
import { computed, onMounted, onActivated } from 'vue'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js'
import { 
  Store, ShoppingCart, PackagePlus, BarChart3, Wallet, 
  TrendingUp, Receipt, Clock, AlertTriangle, ArrowRight, Flame 
} from 'lucide-vue-next'
import { useDashboard } from '../composables/useDashboard.js'
import { formatRibuan } from '../utils/formatters/currency.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

const { stats, lowProducts, topProducts, chartRaw, loading, load } = useDashboard()

const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })

// Otomatis ter-update tanpa butuh state ref 'chartReady' manual
const chartData = computed(() => {
  if (!chartRaw.value || !Array.isArray(chartRaw.value) || chartRaw.value.length === 0) {
    return { labels: [], datasets: [] }
  }

  return {
    labels: chartRaw.value.map(c => c.label || ''),
    datasets: [{
      data: chartRaw.value.map(c => Number(c.value) || 0),
      borderColor: '#18181b',
      backgroundColor: 'rgba(24,24,27,0.06)',
      borderWidth: 3,
      pointBackgroundColor: '#18181b',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 4,
      fill: true,
      tension: 0.3
    }]
  }
})

const chartOptions = { 
  responsive: true, 
  maintainAspectRatio: false, 
  plugins: { legend: { display: false } }, 
  scales: { 
    y: { display: false }, 
    x: { 
      grid: { display: false },
      ticks: { font: { size: 10, weight: 'bold' }, color: '#a1a1aa' }
    } 
  } 
}

const initDashboard = async () => {
  try {
    await load()
  } catch (e) {
    console.error('Gagal memuat dashboard:', e)
  }
}

onMounted(initDashboard)
onActivated(initDashboard)
</script>
