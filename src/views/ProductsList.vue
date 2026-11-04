<!-- src/views/ProductsList.vue -->
<template>
<div class="flex-1 overflow-auto p-4 pb-24 font-sans">
  <!-- HEADER -->
  <div class="flex justify-between items-center mb-4">
    <div>
      <h1 class="font-black text-xl text-zinc-900">Daftar Barang ({{ filtered.length }})</h1>
      <p class="text-xs text-zinc-400">Kelola master data produk toko</p>
    </div>
    <div class="flex gap-2">
      <button v-if="toPublishCount > 0" @click="publishAll" class="bg-emerald-600 text-white px-3.5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 active:scale-95 transition shadow-sm" :title="`Publish ${toPublishCount} barang ke web`">
        <Globe class="w-4 h-4"/> {{ toPublishCount === filtered.length ? `Publish All (${toPublishCount})` : `Publish (${toPublishCount})` }}
      </button>
      <router-link to="/add-products" class="bg-zinc-900 text-white px-3.5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 active:scale-95 transition shadow-sm">
        <Plus class="w-4 h-4"/> Tambah
      </router-link>
      <button @click="showFilter=true" class="p-2.5 bg-white border border-zinc-200 text-zinc-700 rounded-2xl relative active:scale-95 transition shadow-sm">
        <Filter class="w-4 h-4"/>
        <span v-if="isFiltered" class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
      </button>
    </div>
  </div>

  <!-- SEARCH -->
  <div class="relative mb-3">
    <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"/>
    <input 
      id="product-search-input"
      ref="searchInputRef"
      v-model="q" 
      autofocus
      placeholder="Ketik nama / scan barcode..." 
      class="w-full pl-11 pr-20 py-3 bg-white border border-zinc-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-zinc-900 shadow-sm"
    />
    
    <!-- TOMBOL SCANNER KAMERA KHUSUS HP -->
    <button 
      type="button"
      @click="toggleCamera"
      class="absolute right-11 top-1/2 -translate-y-1/2 p-1.5 bg-zinc-900 text-white rounded-xl block md:hidden active:scale-95 transition flex items-center justify-center"
      title="Scan Kamera"
    >
      <ScanLine class="w-4 h-4" />
    </button>

    <!-- TOMBOL HAPUS SEARCHBAR -->
    <button 
      v-if="q" 
      type="button"
      @click="clearSearch" 
      class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-full text-zinc-500 hover:text-zinc-800 transition active:scale-95"
      title="Bersihkan Pencarian"
    >
      <X class="w-4 h-4"/>
    </button>
  </div>

  <!-- CONTAINER KAMERA SCANNER LIST BARANG -->
  <div v-show="isScanning" class="mb-3 bg-black rounded-2xl overflow-hidden relative border border-zinc-700 shadow-lg block md:hidden">
    <div id="reader-products" class="w-full"></div>
    <button 
      @click="stop"
      class="absolute top-3 right-3 z-10 px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs font-black shadow-md active:scale-95 transition"
    >
      Tutup Kamera
    </button>
  </div>

  <!-- CHIP FILTER AKTIF -->
  <div v-if="isFiltered" class="flex gap-2 mb-3 overflow-auto">
    <span v-if="filterKategori!=='all'" class="text-[10px] bg-zinc-900 text-white px-3 py-1.5 rounded-full font-black">{{ filterKategori }} ✕</span>
    <span v-if="filterStok!=='all'" class="text-[10px] bg-zinc-900 text-white px-3 py-1.5 rounded-full font-black">{{ labelStok }} ✕</span>
    <button @click="resetFilter" class="text-[10px] bg-zinc-100 px-3 py-1.5 rounded-full font-bold">Reset</button>
  </div>

  <!-- LIST BARANG -->
  <div v-for="p in filtered" :key="p.id" class="p-4 bg-white rounded-2xl border border-zinc-100 mb-2 flex justify-between items-center shadow-sm">
    <div class="flex-1 min-w-0 pr-2">
      <div class="font-bold text-sm text-zinc-900 truncate">{{ p.name }}</div>
      <div class="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
        <span>{{ p.code || 'Tanpa Barcode' }}</span>
        <span>•</span>
        <span class="font-bold text-zinc-700">{{ p.category || 'Umum' }}</span>
        <span>•</span>
        <span>Stok: <strong class="text-zinc-900">{{ p.qty }} {{ p.unit || 'pcs' }}</strong></span>
      </div>
      <div class="text-[11px] text-zinc-500 mt-1">
        Modal Rp {{ formatRibuan(p.price_modal) }} → <strong class="text-emerald-700">Jual Rp {{ formatRibuan(p.price_sell) }}</strong>
      </div>
    </div>

    <div class="flex flex-col items-end gap-2 shrink-0">
      <div class="flex items-center gap-1">
        <span v-if="p.qty===0" class="text-[10px] bg-zinc-900 text-white px-2.5 py-1 rounded-full font-black">HABIS</span>
        <span v-else-if="p.qty <= (p.minStock || 5)" class="text-[10px] bg-red-100 text-red-600 px-2.5 py-1 rounded-full font-black">TIPIS</span>
        <span v-else class="text-[10px] bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-black">AMAN</span>
        <span v-if="p.isPublished" class="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-black flex items-center gap-0.5"><Globe class="w-3 h-3"/> WEB</span>
      </div>

      <!-- TOGGLE PUBLISH + EDIT & HAPUS -->
      <div class="flex items-center gap-1">
        <button @click="togglePublish(p)" :title="p.isPublished ? 'Unpublish dari Web' : 'Publish ke sinarpagi.my.id'" :class="['p-2 rounded-xl transition', p.isPublished ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-zinc-400 bg-zinc-50 hover:bg-zinc-100']">
          <Globe v-if="p.isPublished" class="w-4 h-4"/>
          <EyeOff v-else class="w-4 h-4"/>
        </button>
        <button @click="openEditModal(p)" title="Edit Barang" class="p-2 text-zinc-600 hover:bg-zinc-100 rounded-xl transition">
          <Pencil class="w-4 h-4"/>
        </button>
        <button @click="handleDelete(p)" title="Hapus Barang" class="p-2 text-red-500 hover:bg-red-50 rounded-xl transition">
          <Trash2 class="w-4 h-4"/>
        </button>
      </div>
    </div>
  </div>

  <div v-if="filtered.length===0" class="py-20 text-center text-sm text-zinc-400 font-bold">Barang tidak ditemukan</div>

  <!-- MODAL EDIT BARANG -->
  <div v-if="showEditModal" class="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
    <div class="w-full max-w-lg bg-white rounded-t-[2rem] sm:rounded-[2rem] p-5 shadow-xl max-h-[90vh] flex flex-col">
      <div class="flex justify-between items-center mb-3 shrink-0">
        <h2 class="font-black text-base text-zinc-900">Edit Data Barang</h2>
        <button @click="showEditModal=false" class="p-2 bg-zinc-100 rounded-xl"><X class="w-4 h-4"/></button>
      </div>

      <div class="overflow-auto flex-1 pr-1">
        <ProductForm :initialData="selectedProduct" @success="handleEditSuccess" />
      </div>
    </div>
  </div>

  <!-- MODAL FILTER -->
  <div v-if="showFilter" class="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex items-end">
    <div class="w-full max-w-xl mx-auto bg-white rounded-t-[2rem] p-5 pb-8">
      <div class="w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-4"></div>
      <div class="flex justify-between items-center mb-5">
        <div class="font-black text-base">Filter Barang</div>
        <button @click="showFilter=false" class="p-2 bg-zinc-100 rounded-xl text-xs font-bold">Tutup</button>
      </div>

      <div class="space-y-5">
        <div>
          <div class="text-[10px] font-black tracking-widest text-zinc-400 mb-2">KATEGORI</div>
          <button @click="showCategoryPicker=true" class="w-full flex justify-between items-center px-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold">
            <span>{{ filterKategori === 'all' ? 'Semua Kategori' : filterKategori }}</span>
            <span class="text-zinc-400 text-xs">Pilih →</span>
          </button>
        </div>

        <div>
          <div class="text-[10px] font-black tracking-widest text-zinc-400 mb-2">STOK</div>
          <div class="grid grid-cols-2 gap-2">
            <button v-for="s in stokOptions" :key="s.value" @click="filterStok=s.value" :class="['py-3 rounded-xl text-xs font-black border text-left px-4', filterStok===s.value?'bg-zinc-900 text-white border-zinc-900':'bg-white border-zinc-200']">
              {{ s.label }}
            </button>
          </div>
        </div>

        <div>
          <div class="text-[10px] font-black tracking-widest text-zinc-400 mb-2">URUTKAN</div>
          <select v-model="sortBy" class="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold">
            <option value="name-asc">Nama A-Z</option>
            <option value="name-desc">Nama Z-A</option>
            <option value="stok-asc">Stok Terendah</option>
            <option value="stok-desc">Stok Terbanyak</option>
            <option value="harga-desc">Harga Termahal</option>
            <option value="harga-asc">Harga Termurah</option>
          </select>
        </div>

        <button @click="showFilter=false" class="w-full bg-zinc-900 text-white py-4 rounded-2xl font-black text-sm">Terapkan Filter</button>
      </div>
    </div>
  </div>

  <!-- MODAL DALAM MODAL - PILIH KATEGORI -->
  <div v-if="showCategoryPicker" class="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
    <div class="w-full max-w-xl bg-white rounded-t-[2rem] sm:rounded-[2rem] p-5 pb-8 shadow-2xl max-h-[75vh] flex flex-col">
      <div class="w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-4"></div>
      <div class="flex justify-between items-center mb-3">
        <div class="font-black text-base">Pilih Kategori ({{ categories.length - 1 }})</div>
        <button @click="showCategoryPicker=false" class="p-2 bg-zinc-100 rounded-xl"><X class="w-4 h-4"/></button>
      </div>
      <div class="relative mb-3">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"/>
        <input v-model="categorySearch" placeholder="Cari kategori..." class="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-zinc-900"/>
      </div>
      <div class="overflow-auto flex-1 space-y-2 pr-1">
        <button @click="filterKategori='all'; showCategoryPicker=false" :class="['w-full text-left px-4 py-3 rounded-xl text-sm font-black border flex justify-between', filterKategori==='all'?'bg-zinc-900 text-white border-zinc-900':'bg-white border-zinc-200']">
          <span>Semua Kategori</span><span v-if="filterKategori==='all'">✓</span>
        </button>
        <button v-for="c in filteredCategories" :key="c" @click="filterKategori=c; showCategoryPicker=false" :class="['w-full text-left px-4 py-3 rounded-xl text-sm font-bold border flex justify-between', filterKategori===c?'bg-zinc-900 text-white border-zinc-900':'bg-white border-zinc-200 text-zinc-700']">
          <span>{{ c }}</span><span v-if="filterKategori===c">✓</span>
        </button>
      </div>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, onActivated, onDeactivated, nextTick } from 'vue'
import { Plus, Search, Filter, Pencil, Trash2, X, ScanLine, Globe, EyeOff } from 'lucide-vue-next'
import { useProductsStore } from '../stores/productStore.js'
import { useProductScanner } from '../composables/useProductScanner.js'
import { formatRibuan } from '../utils/formatters/currency.js'
import ProductForm from '../components/product/ProductForm.vue'
import { toast } from 'vue-sonner'

const store = useProductsStore()
const { isScanning, start, stop } = useProductScanner('reader-products')

const searchInputRef = ref(null)
const q = ref('')
const filterKategori = ref('all')
const filterStok = ref('all')
const sortBy = ref('name-asc')
const showFilter = ref(false)
const showCategoryPicker = ref(false)
const categorySearch = ref('')

const showEditModal = ref(false)
const selectedProduct = ref(null)

const focusSearchInput = () => {
  nextTick(() => {
    searchInputRef.value?.focus()
  })
}

const clearSearch = () => {
  q.value = ''
  focusSearchInput()
}

const toggleCamera = async () => {
  try {
    if (isScanning.value) {
      await stop()
    } else {
      await start((decoded) => {
        q.value = decoded.trim()
        toast.success(`Barcode terbaca: ${decoded}`)
      })
    }
  } catch (err) {
    toast.error(err.message || 'Gagal mengakses kamera HP')
  }
}

const categories = computed(() => {
  const cats = new Set(store.list.map(p => p.category).filter(Boolean))
  return ['all', ...Array.from(cats).sort((a, b) => a.localeCompare(b, 'id', { sensitivity: 'base' }))]
})

const filteredCategories = computed(() => {
  const list = categories.value.filter(c => c !== 'all')
  if (!categorySearch.value) return list
  return list.filter(c => c.toLowerCase().includes(categorySearch.value.toLowerCase()))
})

const stokOptions = [
  { value: 'all', label: 'Semua' },
  { value: 'tipis', label: 'Tipis (≤ minStok)' },
  { value: 'habis', label: 'Habis (0)' },
  { value: 'aman', label: 'Aman' },
]

const labelStok = computed(() => stokOptions.find(s => s.value === filterStok.value)?.label || 'All')
const isFiltered = computed(() => filterKategori.value !== 'all' || filterStok.value !== 'all' || q.value)

const filtered = computed(() => {
  let list = store.list.filter(p => {
    const matchQ = !q.value || p.name.toLowerCase().includes(q.value.toLowerCase()) || (p.code || '').toLowerCase().includes(q.value.toLowerCase())
    const matchCat = filterKategori.value === 'all' || p.category === filterKategori.value
    let matchStok = true
    if (filterStok.value === 'tipis') matchStok = p.qty <= (p.minStock || 5) && p.qty > 0
    if (filterStok.value === 'habis') matchStok = p.qty === 0
    if (filterStok.value === 'aman') matchStok = p.qty > (p.minStock || 5)
    return matchQ && matchCat && matchStok
  })

  if (sortBy.value === 'name-asc') list = list.sort((a, b) => a.name.localeCompare(b.name))
  if (sortBy.value === 'name-desc') list = list.sort((a, b) => b.name.localeCompare(a.name))
  if (sortBy.value === 'stok-asc') list = list.sort((a, b) => a.qty - b.qty)
  if (sortBy.value === 'stok-desc') list = list.sort((a, b) => b.qty - a.qty)
  if (sortBy.value === 'harga-desc') list = list.sort((a, b) => (b.price_sell || 0) - (a.price_sell || 0))
  if (sortBy.value === 'harga-asc') list = list.sort((a, b) => (a.price_sell || 0) - (b.price_sell || 0))

  return list
})

// SMART PUBLISH - CUMA HITUNG YANG BELUM PUBLISH / BELUM SYNC
const toPublishFiltered = computed(() => {
  return filtered.value.filter(p => !p.isPublished || p.synced === 0)
})

const toPublishCount = computed(() => toPublishFiltered.value.length)

const resetFilter = () => {
  filterKategori.value = 'all'
  filterStok.value = 'all'
  q.value = ''
  sortBy.value = 'name-asc'
}

const openEditModal = (p) => {
  selectedProduct.value = p
  showEditModal.value = true
}

const handleEditSuccess = () => {
  showEditModal.value = false
  selectedProduct.value = null
}

const handleDelete = async (p) => {
  if (confirm(`Hapus barang "${p.name}"?`)) {
    await store.remove(p.id)
  }
}

const togglePublish = async (p) => {
  const newStatus = !p.isPublished
  await store.update(p.id, { isPublished: newStatus })
  toast.success(newStatus ? `${p.name} publish ke web` : `${p.name} unpublish`)
}

const publishAll = async () => {
  const listToPublish = toPublishFiltered.value
  const count = listToPublish.length
  if (!count) return toast.info('Semua sudah publish')
  if (!confirm(`Publish ${count} barang ke sinarpagi.my.id?`)) return
  let ok = 0
  for (const prod of listToPublish) {
    await store.update(prod.id, { isPublished: true })
    ok++
  }
  toast.success(`${ok} barang publish ke web!`)
}

let barcodeBuffer = ''
let lastKeyTime = Date.now()

const handleGlobalKeydown = (e) => {
  if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) return

  const activeEl = document.activeElement
  const isTypingInInput = activeEl && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName)
  const isProductSearchInput = activeEl && activeEl.id === 'product-search-input'
  if (isTypingInInput && !isProductSearchInput) return

  const currentTime = Date.now()
  if (currentTime - lastKeyTime > 50) barcodeBuffer = ''

  if (e.key === 'Enter') {
    if (isProductSearchInput) {
      e.preventDefault()
      barcodeBuffer = ''
      nextTick(() => {
        searchInputRef.value?.select()
      })
    } else if (barcodeBuffer.trim().length > 0) {
      e.preventDefault()
      q.value = barcodeBuffer.trim()
      barcodeBuffer = ''
      nextTick(() => {
        searchInputRef.value?.focus()
        searchInputRef.value?.select()
      })
    }
  } else if (e.key.length === 1) {
    barcodeBuffer += e.key
  }

  lastKeyTime = currentTime
}

const attachListener = () => {
  window.removeEventListener('keydown', handleGlobalKeydown)
  window.addEventListener('keydown', handleGlobalKeydown)
}

const detachListener = () => {
  window.removeEventListener('keydown', handleGlobalKeydown)
}

onMounted(() => {
  store.fetch()
  focusSearchInput()
  attachListener()
})

onUnmounted(() => {
  detachListener()
  stop()
})

onActivated(() => {
  store.fetch()
  focusSearchInput()
  attachListener()
})

onDeactivated(() => {
  detachListener()
  stop()
})
</script>