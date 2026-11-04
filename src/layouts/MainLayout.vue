<template>
<div class="min-h-screen bg-zinc-900 overflow-hidden relative font-sans">
  <!-- SIDEBAR OFF-CANVAS (Khusus Mobile HP < md) -->
  <aside 
    :class="[
      'fixed top-0 left-0 h-full w-[280px] z-[60] transition-transform duration-300 ease-in-out will-change-transform md:hidden', 
      isOpen ? 'translate-x-0' : '-translate-x-full'
    ]"
  >
    <SidebarComponent 
      :groups="groups" 
      :activePage="activePage" 
      @select-page="handleSelect" 
      @close="isOpen = false" 
    />
  </aside>

  <!-- OVERLAY SENTUH MOBILE -->
  <div 
    v-if="isOpen" 
    @click="isOpen = false" 
    class="fixed inset-0 z-[55] bg-black/40 backdrop-blur-xs cursor-pointer md:hidden"
  ></div>

  <!-- OVERLAY TRANSPARAN UNTUK MENUTUP DOCK TABLET / DESKTOP -->
  <div 
    v-if="activeDropdown" 
    @click="activeDropdown = null" 
    class="hidden md:block fixed inset-0 z-30 cursor-default"
  ></div>

  <!-- MAIN CONTAINER Halaman Utama -->
  <div class="min-h-screen bg-zinc-50 flex flex-col overflow-hidden h-screen transition-all">

    <!-- HEADER STICKY -->
    <header class="shrink-0 h-[64px] md:h-18 w-full bg-white/80 backdrop-blur-xl border-b border-zinc-200/60 px-4 md:px-6 flex justify-between items-center z-40 sticky top-0 relative">
      
      <!-- KIRI: BURGER MENU (MOBILE) & LOGO BRAND -->
      <div class="flex items-center gap-3">
        <button 
          @click="isOpen = !isOpen" 
          class="md:hidden p-2.5 bg-zinc-900 text-white rounded-xl active:scale-95 transition"
          title="Menu Navigasi"
        >
          <Menu class="w-5 h-5"/>
        </button>

        <div class="flex items-center gap-3">
          <img 
            src="/sinar-pagi-icon-color.svg" 
            alt="Sinar Pagi Logo" 
            class="w-9 h-9 object-contain"
          />

          <div class="flex flex-col">
            <span class="font-black text-xs md:text-sm text-zinc-900 leading-tight">Sinar Pagi</span>
            <span class="text-[11px] font-bold text-zinc-400 leading-tight">{{ activePage }}</span>
          </div>
        </div>
      </div>

      <!-- TENGAH (TABLET & DESKTOP): DASHBOARD + DROPDOWNS -->
      <div class="hidden md:flex items-center gap-2 bg-zinc-200/50 p-1.5 rounded-full border border-zinc-200/80">
        
        <!-- TOMBOL DASHBOARD LANGSUNG (KIRI) -->
        <router-link 
          to="/dashboard"
          :class="[
            'px-4.5 py-2 rounded-full text-xs md:text-sm font-black flex items-center gap-2 transition-all duration-200 active:scale-95 select-none',
            route.path === '/dashboard'
              ? 'bg-zinc-900 text-white shadow-md'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/50'
          ]"
        >
          <LayoutDashboard class="w-4 h-4" />
          <span>Dashboard</span>
        </router-link>

        <!-- KATEGORI DROPDOWN (TRANSAKSI, KATALOG, KEUANGAN, SETTING) -->
        <button 
          v-for="cat in navCategories" 
          :key="cat.id"
          @click="toggleDropdown(cat.id)"
          :class="[
            'px-4.5 py-2 rounded-full text-xs md:text-sm font-black flex items-center gap-2 transition-all duration-200 active:scale-95 select-none',
            activeDropdown === cat.id 
              ? 'bg-zinc-900 text-white shadow-md' 
              : isCategoryActive(cat)
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/50'
          ]"
        >
          <component :is="cat.icon" class="w-4 h-4" />
          <span>{{ cat.title }}</span>
          <span 
            v-if="isCategoryActive(cat)" 
            class="w-2 h-2 bg-amber-500 rounded-full"
          ></span>
        </button>
      </div>

      <!-- FLOATING GLASSMORPHISM DOCK MACOS STYLE -->
      <div 
        v-if="activeDropdown"
        class="hidden md:flex absolute top-[calc(100%+12px)] left-1/2 -translate-x-1/2 z-50 bg-zinc-900/90 backdrop-blur-2xl text-white rounded-3xl p-3 shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-zinc-700/60 animate-in fade-in zoom-in-95 duration-150 items-center gap-2"
      >
        <button 
          v-for="sub in activeCategoryItems" 
          :key="sub.name"
          @click="handleSelect(sub)"
          :class="[
            'px-5 py-3.5 rounded-2xl transition-all duration-150 flex flex-col items-center gap-2 text-center group active:scale-95 min-w-[105px]',
            route.path === sub.to 
              ? 'bg-white text-zinc-950 shadow-lg font-black' 
              : 'hover:bg-zinc-800/80 text-zinc-300 hover:text-white'
          ]"
        >
          <div :class="[
            'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
            route.path === sub.to ? 'bg-zinc-900 text-amber-400' : 'bg-zinc-800 text-zinc-400 group-hover:text-amber-400 group-hover:bg-zinc-700'
          ]">
            <component :is="sub.icon" class="w-5 h-5" />
          </div>
          <span class="text-xs font-bold tracking-tight whitespace-nowrap">{{ sub.name }}</span>
        </button>
      </div>

      <!-- KANAN: STATUS PRINTER, CLOUD SYNC, MEMBER / KASIR -->
      <div class="flex items-center gap-2 md:gap-3">
        <!-- TOMBOL PRINTER BLUETOOTH -->
        <button 
          @click="toggleConnection" 
          :disabled="isConnecting"
          :title="isConnected ? `Terhubung: ${printerDevice?.name || 'Printer'}` : 'Hubungkan Printer Bluetooth'"
          :class="[
            'relative p-2.5 md:p-3 rounded-2xl border transition flex items-center justify-center active:scale-95',
            isConnected 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
              : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-900'
          ]"
        >
          <Printer :class="['w-4 h-4 md:w-5 md:h-5', isConnecting ? 'animate-pulse' : '']" />

          <span 
            :class="[
              'absolute -top-1 -right-1 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full border-2 border-white',
              isConnected ? 'bg-emerald-500' : 'bg-zinc-300'
            ]"
          ></span>
        </button>

        <!-- INDIKATOR & TOMBOL PUSH MANUAL KE CLOUD -->
        <button 
          @click="manualSync" 
          :disabled="syncStatus.isSyncing"
          :title="syncStatus.isOnline ? (syncStatus.isSyncing ? 'Sedang Upload ke Cloud...' : 'Klik untuk Upload Manual ke Cloud') : 'Mode Offline'"
          :class="[
            'px-2.5 py-1.5 md:px-3.5 md:py-2 rounded-full text-[10px] md:text-xs font-black flex items-center gap-1.5 md:gap-2 border transition active:scale-95',
            !syncStatus.isOnline ? 'bg-zinc-100 text-zinc-500 border-zinc-200' :
            syncStatus.isSyncing ? 'bg-amber-50 text-amber-700 border-amber-200' :
            syncStatus.unsyncedCount > 0 ? 'bg-red-50 text-red-600 border-red-200' :
            'bg-emerald-50 text-emerald-700 border-emerald-200'
          ]"
        >
          <RefreshCw :class="['w-3 h-3 md:w-4 md:h-4', syncStatus.isSyncing && 'animate-spin']" />
          
          <span class="hidden sm:inline">
            <template v-if="!syncStatus.isOnline">Offline</template>
            <template v-else-if="syncStatus.isSyncing">Mengunggah...</template>
            <template v-else-if="syncStatus.unsyncedCount > 0">{{ syncStatus.unsyncedCount }} belum di-upload</template>
            <template v-else>Backup {{ syncStatus.lastSyncedAt || 'OK' }}</template>
          </span>

          <span 
            :class="[
              'w-2 h-2 rounded-full sm:hidden',
              !syncStatus.isOnline ? 'bg-zinc-400' :
              syncStatus.isSyncing ? 'bg-amber-500 animate-pulse' :
              syncStatus.unsyncedCount > 0 ? 'bg-red-500' : 'bg-emerald-500'
            ]"
          ></span>
        </button>

        <!-- TOMBOL KASIR / MEMBER -->
        <router-link v-if="!isKasirPage" to="/kasir" class="p-2.5 md:p-3 bg-zinc-900 text-white rounded-xl md:rounded-2xl active:scale-95 transition" title="Ke Kasir">
          <Store class="w-5 h-5 md:w-6 md:h-6"/>
        </router-link>
        <button v-else @click="openMember" class="p-2.5 md:p-3 bg-zinc-900 text-white rounded-xl md:rounded-2xl active:scale-95 transition" title="Pilih Member">
          <Users class="w-5 h-5 md:w-6 md:h-6"/>
        </button>
      </div>
    </header>

    <!-- MAIN ROUTER VIEW -->
    <main class="flex-1 overflow-hidden flex flex-col max-w-full md:max-w-4xl lg:max-w-6xl mx-auto w-full relative transition-all">
      <router-view v-slot="{ Component }">
        <keep-alive :exclude="['ProductsAdd']">
          <component :is="Component" :key="$route.fullPath" />
        </keep-alive>
      </router-view>
    </main>

  </div>
</div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  Menu, Package, Store, LayoutDashboard, 
  Users, ShoppingCart, Tags, History, Coffee, Smartphone, Wallet, RefreshCw, BarChart3, Settings, Receipt, Printer, Layers, QrCode
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import SidebarComponent from '../components/Sidebar.vue'
import { syncStatus, syncRealtime } from '../services/syncService.js'
import { usePrinter } from '../composables/usePrinter.js'

const isOpen = ref(false)
const activeDropdown = ref(null)
const route = useRoute()
const router = useRouter()

const { isConnected, isConnecting, printerDevice, toggleConnection } = usePrinter()

const activePage = computed(() => route.meta.title || 'Barang')
const isKasirPage = computed(() => route.path.startsWith('/kasir'))

// STRUKTUR NAVIGASI UTAMA
const navCategories = ref([
  {
    id: 'transaksi',
    title: 'Transaksi',
    icon: Store,
    items: [
      { name: 'Kasir', icon: Store, to: '/kasir' },
      { name: 'Digital', icon: Smartphone, to: '/digital' },
      { name: 'Riwayat', icon: History, to: '/sales-history' },
      { name: 'Kulakan', icon: ShoppingCart, to: '/shopping' }
    ]
  },
  {
    id: 'katalog',
    title: 'Katalog & Kontak',
    icon: Layers,
    items: [
      { name: 'Barang', icon: Package, to: '/products' },
      { name: 'Kategori', icon: Tags, to: '/categories' },
      { name: 'Menu & Seduh', icon: Coffee, to: '/settings-menu' },
      { name: 'Member', icon: Users, to: '/members' }
    ]
  },
  {
    id: 'keuangan',
    title: 'Keuangan',
    icon: Wallet,
    items: [
      { name: 'Kas & Bank', icon: Wallet, to: '/finance' },
      { name: 'Pengeluaran', icon: Receipt, to: '/expenses' },
      { name: 'Laporan', icon: BarChart3, to: '/reports' }
    ]
  },
  {
    id: 'setting',
    title: 'Setting',
    icon: Settings,
    items: [
      { name: 'Settings', icon: Settings, to: '/settings' },
      { name: 'Operators', icon: Users, to: '/operators' },
      { name: 'Settings QRIS', icon: QrCode, to: '/settings/qris' }
    ]
  }
])

const activeCategoryItems = computed(() => {
  const cat = navCategories.value.find(c => c.id === activeDropdown.value)
  return cat ? cat.items : []
})

// PETA STRUKTUR UNTUK SIDEBAR MOBILE (HP)
const groups = computed(() => {
  const result = [
    {
      title: 'UTAMA',
      items: [{ name: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' }]
    }
  ]

  navCategories.value.forEach(cat => {
    result.push({
      title: cat.title.toUpperCase(),
      items: cat.items.map(item => ({
        name: item.name,
        icon: item.icon,
        to: item.to
      }))
    })
  })

  return result
})

const isCategoryActive = (cat) => {
  return cat.items.some(item => route.path === item.to)
}

const toggleDropdown = (id) => {
  activeDropdown.value = activeDropdown.value === id ? null : id
}

const handleSelect = (m) => {
  isOpen.value = false
  activeDropdown.value = null
  if (m.to) {
    router.push(m.to)
  }
}

watch(() => route.path, () => {
  activeDropdown.value = null
  isOpen.value = false
})

const manualSync = async () => {
  if (!syncStatus.isOnline) {
    toast.error('Perangkat sedang offline')
    return
  }

  if (syncStatus.unsyncedCount === 0) {
    toast.info('Semua data lokal sudah ter-upload')
    return
  }

  toast.info('Memulai upload data ke Cloud...')
  await syncRealtime.pushLocalToCloud()

  if (syncStatus.unsyncedCount === 0) {
    toast.success('Berhasil backup data ke Cloud!')
  } else {
    toast.warning(`Sisa ${syncStatus.unsyncedCount} data belum terupload`)
  }
}

const openMember = () => window.dispatchEvent(new CustomEvent('open-member-picker'))
</script>
