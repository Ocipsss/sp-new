<template>
  <div class="flex-1 overflow-auto p-4 pb-24 space-y-6">
    <!-- Header -->
    <div>
      <h1 class="font-black text-xl text-zinc-900">Pengaturan Menu & Jasa</h1>
      <p class="text-xs text-zinc-400">Geser paket ⋮⋮ buat atur posisi eceran 1 BTG ke atas/bawah</p>
    </div>

    <!-- Tab Navigasi -->
    <div class="flex bg-zinc-100 p-1 rounded-2xl gap-1">
      <button 
        @click="activeTab = 'seduh'" 
        :class="['flex-1 py-2.5 rounded-xl text-xs font-bold transition', activeTab === 'seduh' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500']"
      >
        Tarif Jasa per Kategori
      </button>
      <button 
        @click="activeTab = 'rokok'" 
        :class="['flex-1 py-2.5 rounded-xl text-xs font-bold transition', activeTab === 'rokok' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500']"
      >
        Harga Paket
      </button>
    </div>

    <!-- TAB 1: TARIF JASA SEDUH / TAMBAHAN -->
    <div v-if="activeTab === 'seduh'" class="space-y-4">
      <div class="flex justify-between items-center">
        <h2 class="font-black text-sm text-zinc-800">Daftar Tarif Jasa</h2>
        <button 
          @click="openServiceModal()" 
          class="bg-zinc-900 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition"
        >
          <Plus class="w-4 h-4"/> Tambah Jasa
        </button>
      </div>

      <div v-if="sortedServices.length === 0" class="py-12 text-center text-zinc-400 text-xs bg-white rounded-2xl border border-zinc-100">
        Belum ada tarif jasa
      </div>

      <div v-else class="space-y-2">
        <div 
          v-for="s in sortedServices" 
          :key="s.id" 
          class="p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm flex items-center justify-between"
        >
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-bold text-sm text-zinc-900">{{ s.name }}</span>
              <span v-if="getServiceIds(s).length" class="px-2 py-0.5 bg-zinc-900 text-white rounded-md text-[10px] font-black uppercase">
                KHUSUS: {{ getServiceIds(s).length > 1 ? `${getServiceIds(s).length} PRODUK` : getProductName(getServiceIds(s)[0]) }}
              </span>
              <span v-else class="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[10px] font-black uppercase">
                {{ s.category || 'Umum' }}
              </span>
            </div>
            <div class="text-xs text-amber-600 font-black mt-0.5">Rp {{ formatRibuan(s.price) }}</div>
            <div v-if="getServiceIds(s).length > 1" class="text-[10px] text-zinc-400 mt-1 truncate max-w-[220px]">
              {{ getServiceIds(s).map(id => getProductName(id)).join(', ') }}
            </div>
          </div>
          <div class="flex gap-1">
            <button @click="openServiceModal(s)" class="p-2 text-zinc-600 hover:bg-zinc-100 rounded-xl">
              <Pencil class="w-4 h-4"/>
            </button>
            <button @click="handleDeleteService(s)" class="p-2 text-red-500 hover:bg-red-50 rounded-xl">
              <Trash2 class="w-4 h-4"/>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: HARGA PAKET (ROKOK & PERMEN) -->
    <div v-if="activeTab === 'rokok'" class="space-y-4">
      <div class="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button 
          @click="selectedPackageCat = 'ALL'"
          :class="[
            'px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition',
            selectedPackageCat === 'ALL' ? 'bg-zinc-900 text-white shadow-sm' : 'bg-white text-zinc-600 border border-zinc-200'
          ]"
        >
          Semua ({{ rokokProducts.length }})
        </button>
        <button 
          v-for="cat in availablePackageCategories" 
          :key="cat"
          @click="selectedPackageCat = cat"
          :class="[
            'px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition uppercase',
            selectedPackageCat === cat ? 'bg-zinc-900 text-white shadow-sm' : 'bg-white text-zinc-600 border border-zinc-200'
          ]"
        >
          {{ cat }}
        </button>
      </div>

      <div v-if="filteredRokokProducts.length === 0" class="py-12 text-center text-zinc-400 text-xs bg-white rounded-2xl border border-zinc-100">
        Belum ada produk dengan kategori ini
      </div>

      <div v-else class="space-y-3">
        <div 
          v-for="p in filteredRokokProducts" 
          :key="p.id" 
          class="p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm space-y-3"
        >
          <div class="flex justify-between items-center border-b border-zinc-50 pb-2">
            <div>
              <div class="font-bold text-sm text-zinc-900 flex items-center gap-2">
                <span>{{ p.name }}</span>
                <span class="px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-md text-[10px] font-black uppercase">
                  {{ p.category }}
                </span>
              </div>
              <div class="text-[11px] text-zinc-400">Harga Utuh: Rp {{ formatRibuan(p.price_sell) }}</div>
            </div>
            <div class="flex gap-1">
              <button 
                @click="openServiceModal(null, p)" 
                class="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-xl text-xs font-bold hover:bg-amber-200 active:scale-95 transition"
              >
                + Jasa
              </button>
              <button 
                @click="openPackageModal(p)" 
                class="px-3 py-1.5 bg-zinc-100 text-zinc-800 rounded-xl text-xs font-bold hover:bg-zinc-200 active:scale-95 transition"
              >
                + Paket
              </button>
            </div>
          </div>

          <!-- LIST PAKET DRAG & DROP -->
          <div class="space-y-1.5">
            <div class="text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <GripVertical class="w-3 h-3"/> Tekan & geser ⋮⋮ buat atur posisi eceran
            </div>
            <div 
              v-for="(pkg, idx) in getPackagesForProduct(p.id)" 
              :key="pkg.id"
              :data-pkg-id="pkg.id"
              draggable="true"
              @dragstart="onDragStart(pkg)"
              @dragover.prevent="onDragOver(pkg)"
              @dragleave="dragOverId = null"
              @drop="onDrop(p.id, pkg)"
              @dragend="onDragEnd"
              :class="[
                'flex justify-between items-center p-2.5 rounded-xl text-xs border-2 transition-all cursor-grab active:cursor-grabbing select-none',
                draggedPkg?.id === pkg.id ? 'opacity-30 bg-zinc-200 border-dashed border-zinc-400' : 'bg-zinc-50 border-transparent',
                dragOverId === pkg.id ? 'border-amber-400 bg-amber-50 scale-[1.02] shadow-md' : ''
              ]"
            >
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 bg-white border border-zinc-200 rounded-lg flex items-center justify-center cursor-grab">
                  <GripVertical class="w-4 h-4 text-zinc-400"/>
                </div>
                <span class="w-5 h-5 bg-zinc-900 text-white rounded-full flex items-center justify-center text-[10px] font-black">{{ idx + 1 }}</span>
                <div>
                  <span class="font-bold text-zinc-800">{{ pkg.name }}</span>
                  <span class="text-zinc-400 ml-1.5">({{ pkg.qty_pcs }})</span>
                </div>
              </div>
              <div class="flex items-center gap-1">
                <span class="font-black text-zinc-900 mr-1">Rp {{ formatRibuan(pkg.price_sell) }}</span>
                <button @click="openPackageModal(p, pkg)" class="p-1.5 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100">
                  <Pencil class="w-3.5 h-3.5"/>
                </button>
                <button @click="handleDeletePackage(pkg)" class="p-1.5 bg-white border border-zinc-200 rounded-lg text-red-500 hover:bg-red-50">
                  <Trash2 class="w-3.5 h-3.5"/>
                </button>
              </div>
            </div>
            <div v-if="getPackagesForProduct(p.id).length === 0" class="text-[11px] text-zinc-400 text-center py-2">Belum ada paket, klik + Paket</div>
          </div>

          <div v-if="getServicesForProduct(p).some(s => getServiceIds(s).length)" class="space-y-1.5 pt-2 border-t border-dashed border-zinc-200">
            <div class="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Jasa Khusus Produk Ini (override kategori)</div>
            <div 
              v-for="js in getServicesForProduct(p).filter(s => getServiceIds(s).length)" 
              :key="js.id" 
              class="flex justify-between items-center p-2.5 bg-amber-50 border border-amber-100 rounded-xl text-xs"
            >
              <span class="font-bold text-zinc-800">{{ js.name }}</span>
              <div class="flex items-center gap-1.5">
                <span class="font-black text-amber-700 mr-1">Rp {{ formatRibuan(js.price) }}</span>
                <button @click="openServiceModal(js)" class="p-1 text-zinc-600 hover:bg-amber-100 rounded-lg"><Pencil class="w-3.5 h-3.5"/></button>
                <button @click="handleDeleteService(js)" class="p-1 text-red-500 hover:bg-red-100 rounded-lg"><Trash2 class="w-3.5 h-3.5"/></button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- Modal Form Jasa -->
    <div v-if="showServiceModal" class="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div class="w-full max-w-md bg-white rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-xl space-y-4 max-h-[90vh] overflow-auto">
        <div class="flex justify-between items-center">
          <h2 class="font-black text-base">{{ editingServiceId ? 'Edit Tarif Jasa' : 'Tambah Tarif Jasa' }}</h2>
          <button @click="showServiceModal = false" class="p-2 bg-zinc-100 rounded-xl"><X class="w-4 h-4"/></button>
        </div>

        <form @submit.prevent="handleSaveService" class="space-y-3">
          <div class="flex items-center gap-2 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
            <button type="button" @click="isCustomService = !isCustomService" :class="['w-10 h-6 rounded-full p-0.5 transition shrink-0', isCustomService ? 'bg-zinc-900' : 'bg-zinc-200']">
              <div :class="['w-4 h-4 bg-white rounded-full shadow transition-transform', isCustomService ? 'translate-x-4' : 'translate-x-0']"></div>
            </button>
            <div>
              <div class="text-xs font-black text-zinc-800">Jasa khusus untuk produk pilihan</div>
              <div class="text-[10px] text-zinc-500">Bisa pilih 1 atau beberapa produk sekaligus</div>
            </div>
          </div>

          <div v-if="isCustomService">
            <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Pilih Produk * ({{ serviceForm.productIds.length }} dipilih)</label>
            <button 
              type="button" 
              @click="showProductPickerModal = true"
              class="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm font-bold text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-zinc-900"
            >
              <span class="truncate">{{ serviceForm.productIds.length ? `${serviceForm.productIds.length} PRODUK DIPILIH` : 'PILIH PRODUK' }}</span>
              <ChevronDown class="w-4 h-4 text-zinc-400 shrink-0" />
            </button>
            <div v-if="serviceForm.productIds.length" class="flex flex-wrap gap-1 mt-2">
              <span v-for="pid in serviceForm.productIds" :key="pid" class="px-2 py-1 bg-zinc-900 text-white rounded-full text-[10px] font-bold flex items-center gap-1">
                {{ getProductName(pid) }}
                <button type="button" @click="toggleProduct(pid)" class="ml-1 bg-white/20 rounded-full w-3.5 h-3.5 flex items-center justify-center">✕</button>
              </span>
            </div>
          </div>

          <div>
            <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Untuk Kategori Produk *</label>
            <button 
              type="button" 
              @click="showCategoryPickerModal = true"
              class="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold uppercase text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-zinc-900"
            >
              <span class="truncate">{{ serviceForm.category || 'PILIH KATEGORI' }}</span>
              <ChevronDown class="w-4 h-4 text-zinc-400 shrink-0" />
            </button>
            <p v-if="isCustomService" class="text-[10px] text-zinc-400 mt-1">Otomatis ikut kategori produk pertama, tapi bisa diubah</p>
          </div>

          <div>
            <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Nama Layanan *</label>
            <input 
              v-model="serviceForm.name" 
              required 
              placeholder="CONTOH: SEDUH, ES BATU, DLL" 
              class="w-full px-4 py-3 bg-zinc-50 border rounded-xl text-sm font-bold uppercase"
            />
          </div>
          <div>
            <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Biaya Jasa (Rp) *</label>
            <input 
              :value="formatRp(serviceForm.price)" 
              @input="e => serviceForm.price = toNumber(e.target.value)" 
              type="text" 
              inputmode="numeric" 
              required 
              placeholder="Rp 0" 
              class="w-full px-4 py-3 bg-zinc-50 border rounded-xl text-lg font-black text-zinc-900"
            />
          </div>
          <div class="flex gap-2 pt-2">
            <button type="button" @click="showServiceModal = false" class="flex-1 py-3 bg-zinc-100 font-bold text-xs rounded-xl">Batal</button>
            <button type="submit" class="flex-1 py-3 bg-zinc-900 text-white font-bold text-xs rounded-xl shadow-md">Simpan</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Form Paket Eceran -->
    <div v-if="showPackageModal" class="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div class="w-full max-w-md bg-white rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-xl space-y-4">
        <div class="flex justify-between items-center">
          <div>
            <h2 class="font-black text-base">{{ editingPackageId ? 'Edit Paket Eceran' : 'Tambah Paket Eceran' }}</h2>
            <p class="text-xs text-zinc-400">{{ selectedRokokProduct?.name }}</p>
          </div>
          <button @click="showPackageModal = false" class="p-2 bg-zinc-100 rounded-xl"><X class="w-4 h-4"/></button>
        </div>

        <form @submit.prevent="handleSavePackage" class="space-y-3">
          <div>
            <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Nama Varian *</label>
            <input 
              v-model="packageForm.name" 
              required 
              placeholder="CONTOH: 1 BATANG, 3 BIJI, 1 RENTENG" 
              class="w-full px-4 py-3 bg-zinc-50 border rounded-xl text-sm font-bold uppercase"
            />
          </div>
          <div>
            <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Jumlah Pcs/Batang Dipotong *</label>
            <input v-model.number="packageForm.qty_pcs" type="number" required placeholder="1" class="w-full px-4 py-3 bg-zinc-50 border rounded-xl text-sm font-bold"/>
          </div>
          <div>
            <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Harga Jual Varian (Rp) *</label>
            <input 
              :value="formatRp(packageForm.price_sell)" 
              @input="e => packageForm.price_sell = toNumber(e.target.value)" 
              type="text" 
              inputmode="numeric" 
              required 
              placeholder="Rp 0" 
              class="w-full px-4 py-3 bg-zinc-50 border rounded-xl text-lg font-black text-zinc-900"
            />
          </div>
          <div class="flex gap-2 pt-2">
            <button type="button" @click="showPackageModal = false" class="flex-1 py-3 bg-zinc-100 font-bold text-xs rounded-xl">Batal</button>
            <button type="submit" class="flex-1 py-3 bg-zinc-900 text-white font-bold text-xs rounded-xl shadow-md">
              {{ editingPackageId ? 'Simpan Perubahan' : 'Simpan Paket' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Picker Kategori -->
    <div v-if="showCategoryPickerModal" class="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="w-full max-w-sm bg-white rounded-[2rem] p-5 shadow-xl animate-in zoom-in-95 duration-200 max-h-[80vh] flex flex-col">
        <div class="flex justify-between items-center mb-3">
          <h3 class="font-black text-base text-zinc-900">Pilih Kategori Produk</h3>
          <button type="button" @click="showCategoryPickerModal = false" class="p-2 bg-zinc-100 rounded-xl"><X class="w-4 h-4"/></button>
        </div>
        <div class="space-y-1.5 overflow-auto flex-1 pr-1">
          <div v-if="categoryOptions.length === 0" class="py-6 text-center text-xs text-zinc-400">Belum ada kategori</div>
          <button 
            v-for="cat in categoryOptions" 
            :key="cat.id" 
            type="button"
            @click="serviceForm.category = cat.name; showCategoryPickerModal = false"
            :class="['w-full p-3 rounded-xl font-bold text-xs text-left uppercase transition', serviceForm.category === cat.name ? 'bg-zinc-900 text-white shadow-md' : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-800']"
          >
            {{ cat.name }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Picker Produk MULTI -->
    <div v-if="showProductPickerModal" class="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="w-full max-w-sm bg-white rounded-[2rem] p-5 shadow-xl max-h-[80vh] flex flex-col">
        <div class="flex justify-between items-center mb-3">
          <h3 class="font-black text-base text-zinc-900">Pilih Produk ({{ serviceForm.productIds.length }})</h3>
          <button type="button" @click="showProductPickerModal = false" class="p-2 bg-zinc-100 rounded-xl"><X class="w-4 h-4"/></button>
        </div>
        <div class="relative mb-3">
          <input v-model="productSearch" placeholder="Cari produk..." class="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold"/>
        </div>
        <div class="space-y-1.5 overflow-auto flex-1 pr-1">
          <button 
            v-for="prod in productOptions" 
            :key="prod.id" 
            type="button"
            @click="toggleProduct(prod.id)"
            :class="['w-full p-3 rounded-xl font-bold text-xs text-left transition flex justify-between items-center', serviceForm.productIds.includes(prod.id) ? 'bg-zinc-900 text-white shadow-md' : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-800']"
          >
            <div class="min-w-0 flex-1">
              <div class="truncate">{{ prod.name }}</div>
              <div class="text-[10px] opacity-60 uppercase">{{ prod.category }}</div>
            </div>
            <div v-if="serviceForm.productIds.includes(prod.id)" class="ml-2 w-5 h-5 bg-white text-zinc-900 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">✓</div>
          </button>
        </div>
        <div class="flex gap-2 pt-3 border-t border-zinc-100 mt-3">
          <button type="button" @click="serviceForm.productIds = []" class="flex-1 py-2.5 bg-zinc-100 rounded-xl text-xs font-bold">Clear</button>
          <button type="button" @click="showProductPickerModal = false" class="flex-1 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold">Selesai ({{ serviceForm.productIds.length }})</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated } from 'vue'
import { Plus, Pencil, Trash2, X, ChevronDown, GripVertical } from 'lucide-vue-next'
import { useSettingsMenu } from '../composables/useSettingsMenu.js'
import { formatRibuan, formatRp, toNumber } from '../utils/formatters/currency.js'

const activeTab = ref('seduh')
const selectedPackageCat = ref('ALL')

const {
  allProducts,
  rokokProducts,
  services,
  categoryOptions,
  loadData,
  getPackagesForProduct,
  getServicesForProduct,
  getProductById,
  savePackage,
  deletePackage,
  reorderPackages,
  saveService,
  deleteService
} = useSettingsMenu()

const sortedServices = computed(() => {
  return [...services.value].sort((a, b) => 
    (a.name || '').localeCompare(b.name || '', 'id', { sensitivity: 'base' })
  )
})

const availablePackageCategories = computed(() => {
  const cats = new Set(rokokProducts.value.map(p => (p.category || 'UMUM').toUpperCase()))
  return Array.from(cats)
})

const filteredRokokProducts = computed(() => {
  if (selectedPackageCat.value === 'ALL') return rokokProducts.value
  return rokokProducts.value.filter(
    p => (p.category || 'UMUM').toUpperCase() === selectedPackageCat.value
  )
})

// DRAG & DROP STATE
const draggedPkg = ref(null)
const dragOverId = ref(null)

const onDragStart = (pkg) => {
  draggedPkg.value = pkg
}
const onDragOver = (pkg) => {
  dragOverId.value = pkg.id
}
const onDragEnd = () => {
  draggedPkg.value = null
  dragOverId.value = null
}
const onDrop = async (productId, targetPkg) => {
  if (!draggedPkg.value || draggedPkg.value.id === targetPkg.id) {
    onDragEnd()
    return
  }
  const list = getPackagesForProduct(productId)
  const fromIdx = list.findIndex(p => p.id === draggedPkg.value.id)
  const toIdx = list.findIndex(p => p.id === targetPkg.id)
  const newList = [...list]
  const [moved] = newList.splice(fromIdx, 1)
  newList.splice(toIdx, 0, moved)
  await reorderPackages(productId, newList.map(p => p.id))
  onDragEnd()
}

// Modal State Jasa & Picker
const showServiceModal = ref(false)
const showCategoryPickerModal = ref(false)
const showProductPickerModal = ref(false)
const editingServiceId = ref(null)
const isCustomService = ref(false)
const productSearch = ref('')
const serviceForm = ref({ name: '', price: 0, category: 'Mie', productId: null, productIds: [] })

const productOptions = computed(() => {
  const q = productSearch.value.toLowerCase()
  let list = allProducts.value
  if(q) list = list.filter(p => (p.name||'').toLowerCase().includes(q))
  return list.slice(0, 80)
})

const getServiceIds = (s) => {
  if (s.productIds && Array.isArray(s.productIds) && s.productIds.length) return s.productIds
  if (s.productId) return [s.productId]
  return []
}

const getProductName = (id) => {
  if(!id) return ''
  return getProductById(id)?.name || 'Produk tidak ditemukan'
}

const toggleProduct = (id) => {
  const list = [...(serviceForm.value.productIds || [])]
  const idx = list.indexOf(id)
  if(idx > -1) list.splice(idx, 1)
  else list.push(id)
  serviceForm.value.productIds = list
  if(list.length === 1){
    const p = getProductById(list[0])
    if(p && p.category) serviceForm.value.category = p.category
  }
}

const openServiceModal = async (s = null, productOverride = null) => {
  await loadData()
  productSearch.value = ''
  if (s) {
    editingServiceId.value = s.id
    const ids = getServiceIds(s)
    isCustomService.value = ids.length > 0
    serviceForm.value = { 
      name: (s.name || '').toUpperCase(), 
      price: s.price, 
      category: s.category || 'Mie',
      productId: null,
      productIds: ids
    }
  } else if (productOverride) {
    editingServiceId.value = null
    isCustomService.value = true
    serviceForm.value = { 
      name: 'SEDUH', 
      price: 3000, 
      category: productOverride.category || categoryOptions.value[0]?.name || 'Mie',
      productId: null,
      productIds: [productOverride.id]
    }
  } else {
    editingServiceId.value = null
    isCustomService.value = false
    serviceForm.value = { 
      name: 'SEDUH', 
      price: 2000, 
      category: categoryOptions.value[0]?.name || 'Mie',
      productId: null,
      productIds: []
    }
  }
  showServiceModal.value = true
}

const handleSaveService = async () => {
  if(isCustomService.value && (!serviceForm.value.productIds || serviceForm.value.productIds.length === 0)){
    alert('Pilih produk dulu met, bisa lebih dari 1')
    return
  }
  try {
    await saveService({
      id: editingServiceId.value,
      name: (serviceForm.value.name || '').toUpperCase().trim(),
      price: Number(serviceForm.value.price) || 0,
      category: serviceForm.value.category,
      productId: null,
      productIds: isCustomService.value ? serviceForm.value.productIds : []
    })
    showServiceModal.value = false
  } catch (e) {
    console.error('GAGAL SAVE JASA:', e)
    alert('Gagal simpan: ' + (e.message || e))
  }
}

const handleDeleteService = async (s) => {
  if (confirm(`Hapus tarif "${s.name}"?`)) {
    await deleteService(s.id)
  }
}

// Modal State Paket Eceran
const showPackageModal = ref(false)
const editingPackageId = ref(null)
const selectedRokokProduct = ref(null)
const packageForm = ref({ name: '', qty_pcs: 1, price_sell: 0 })

const openPackageModal = (p, pkg = null) => {
  selectedRokokProduct.value = p
  if (pkg) {
    editingPackageId.value = pkg.id
    packageForm.value = {
      name: pkg.name,
      qty_pcs: pkg.qty_pcs,
      price_sell: pkg.price_sell
    }
  } else {
    editingPackageId.value = null
    packageForm.value = { name: '', qty_pcs: 1, price_sell: 0 }
  }
  showPackageModal.value = true
}

const handleSavePackage = async () => {
  if (!selectedRokokProduct.value) return
  await savePackage({
    id: editingPackageId.value || undefined,
    productId: selectedRokokProduct.value.id,
    name: (packageForm.value.name || '').toUpperCase().trim(),
    qty_pcs: packageForm.value.qty_pcs,
    price_sell: packageForm.value.price_sell
  })
  showPackageModal.value = false
}

const handleDeletePackage = async (pkg) => {
  if (confirm(`Hapus opsi paket "${pkg.name}"?`)) {
    await deletePackage(pkg.id)
  }
}

onMounted(() => {
  loadData()
})
onActivated(() => {
  loadData()
})
</script>