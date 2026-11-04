<!-- src/views/Shopping.vue -->
<template>
<div class="flex-1 overflow-auto p-4 pb-28 space-y-4">
  <!-- Header Title & Quick Action -->
  <div class="flex justify-between items-center">
    <div>
      <h1 class="font-black text-xl text-zinc-900">Belanja Kulakan</h1>
      <p class="text-xs text-zinc-400">Daftar kebutuhan restock toko</p>
    </div>

    <div class="flex gap-2">
      <button 
        @click="handleExportCopy" 
        title="Salin Daftar Belanja"
        class="p-2.5 bg-white border border-zinc-200 text-zinc-700 rounded-2xl font-bold text-xs flex items-center justify-center hover:bg-zinc-50 active:scale-95 transition shadow-sm"
      >
        <Share2 class="w-4 h-4" />
      </button>

      <button 
        @click="openModal" 
        class="bg-zinc-900 text-white px-3.5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 active:scale-95 transition shadow-sm"
      >
        <Plus class="w-4 h-4" /> Tambah
      </button>
    </div>
  </div>

  <div class="grid grid-cols-3 gap-2">
    <div class="bg-white border border-zinc-100 p-3 rounded-2xl shadow-sm flex flex-col justify-between">
      <span class="text-[9px] font-black text-zinc-400 uppercase tracking-wider">Total Item</span>
      <div class="text-base font-black text-zinc-900 mt-1">
        {{ totalItems }} <span class="text-[10px] font-bold text-zinc-400">item</span>
      </div>
    </div>

    <div class="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl shadow-sm flex flex-col justify-between">
      <span class="text-[9px] font-black text-emerald-600 uppercase tracking-wider">Selesai Dibeli</span>
      <div class="text-base font-black text-emerald-700 mt-1">
        {{ boughtItemsCount }}/{{ totalItems }}
      </div>
    </div>

    <div class="bg-amber-50 border border-amber-100 p-3 rounded-2xl shadow-sm flex flex-col justify-between">
      <span class="text-[9px] font-black text-amber-600 uppercase tracking-wider">Est. Modal</span>
      <div class="text-xs font-black text-amber-700 mt-1 truncate">
        Rp {{ formatRibuan(estimatedTotalCost) }}
      </div>
    </div>
  </div>

  <div class="bg-zinc-900 text-white p-4 rounded-3xl flex items-center justify-between gap-3 shadow-md">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center shrink-0">
        <Sparkles class="w-5 h-5" />
      </div>
      <div>
        <div class="font-black text-xs text-white">Rekomendasi Restock Otomatis</div>
        <div class="text-[10px] text-zinc-400">Tambah produk dengan stok tipis (&lt;= min stock)</div>
      </div>
    </div>
    <button 
      @click="triggerAutoRestock" 
      :disabled="loading"
      class="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-zinc-950 rounded-xl font-black text-[11px] shrink-0 transition"
    >
      + Barang Tipis
    </button>
  </div>

  <div class="space-y-2">
    <div class="relative">
      <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
      <input 
        v-model="searchQuery" 
        placeholder="Cari barang belanjaan..." 
        class="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-zinc-900 shadow-sm"
      />
      <button v-if="searchQuery" @click="searchQuery=''" class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-zinc-100 rounded-full text-zinc-400">
        <X class="w-3 h-3" />
      </button>
    </div>

    <div class="flex items-center justify-between gap-2">
      <!-- Filter Segmented Control -->
      <div class="flex bg-zinc-100 p-1 rounded-2xl gap-1 flex-1">
        <button 
          v-for="f in filterOptions" 
          :key="f.value"
          @click="activeFilter = f.value"
          :class="[
            'flex-1 py-2 rounded-xl text-[11px] font-bold transition',
            activeFilter === f.value ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'
          ]"
        >
          {{ f.label }}
        </button>
      </div>

      <!-- Clear Completed Button -->
      <button 
        v-if="boughtItemsCount > 0"
        @click="clearCompletedItems"
        title="Hapus yang sudah dibeli"
        class="p-2.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 border border-zinc-200 rounded-2xl transition shrink-0"
      >
        <Trash2 class="w-4 h-4" />
      </button>
    </div>
  </div>

  <div v-if="filteredItems.length === 0" class="py-16 text-center text-zinc-400 text-xs bg-white rounded-3xl border border-zinc-100 p-6">
    <ShoppingBag class="w-10 h-10 text-zinc-300 mx-auto mb-2" />
    <div class="font-bold text-zinc-500 text-sm">Tidak ada barang belanjaan</div>
    <p class="text-[11px] text-zinc-400 mt-1">Klik "+ Barang Tipis" untuk otomatis mengambil produk dari master</p>
  </div>

  <div v-else class="space-y-2">
    <div 
      v-for="item in filteredItems" 
      :key="item.id"
      :class="[
        'p-4 rounded-3xl border transition flex items-center justify-between gap-3 shadow-sm',
        item.isBought 
          ? 'bg-zinc-50/80 border-zinc-200/60 opacity-60' 
          : 'bg-white border border-zinc-100 hover:border-zinc-300'
      ]"
    >
      <!-- Checkbox & Detail Item -->
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <button 
          @click="handleToggleClick(item)"
          :class="[
            'w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition',
            item.isBought ? 'bg-emerald-500 text-white' : 'bg-zinc-100 text-transparent border border-zinc-300'
          ]"
        >
          <Check class="w-4 h-4 stroke-[3]" />
        </button>

        <div class="min-w-0 flex-1">
          <div :class="['font-bold text-sm text-zinc-900 truncate', item.isBought && 'line-through text-zinc-400']">
            {{ item.name }}
          </div>
          <div class="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-0.5">
            <span class="px-1.5 py-0.5 bg-zinc-100 rounded text-zinc-600 font-semibold text-[10px]">{{ item.category || 'Umum' }}</span>
            <span>Qty: <strong class="text-zinc-800">{{ item.qty }} {{ item.unit }}</strong></span>
            <span v-if="item.estimatedPrice > 0">• Est: <strong class="text-amber-600">Rp {{ formatRibuan(item.estimatedPrice) }}</strong></span>
          </div>
          <div v-if="item.notes" class="text-[10px] text-amber-600/90 font-medium italic mt-0.5">
            {{ item.notes }}
          </div>
        </div>
      </div>

      <!-- Delete Action -->
      <button 
        @click="deleteItem(item.id)" 
        class="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition shrink-0"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  </div>

  <!-- Modal Konfirmasi Bayar Kulakan -->
  <div v-if="showPayModal" class="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
    <div class="w-full max-w-md bg-white rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-xl animate-in slide-in-from-bottom duration-200">
      <div class="flex justify-between items-center mb-4">
        <div>
          <h2 class="font-black text-base text-zinc-900">Konfirmasi Pembayaran Kulakan</h2>
          <p class="text-xs text-zinc-400">{{ targetItemForPay?.name }} ({{ targetItemForPay?.qty }} {{ targetItemForPay?.unit }})</p>
        </div>
        <button @click="showPayModal = false" class="p-2 bg-zinc-100 rounded-xl"><X class="w-4 h-4" /></button>
      </div>

      <form @submit.prevent="submitToggleBought(targetItemForPay, payForm)" class="space-y-4">
        <div>
          <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Sumber Dana Pembayaran *</label>
          <div class="grid grid-cols-2 gap-2">
            <button 
              type="button"
              @click="payForm.accountId = 'acc_cash'" 
              :class="['py-3 rounded-xl text-xs font-bold border transition', payForm.accountId === 'acc_cash' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-zinc-50 border-zinc-200 text-zinc-600']"
            >
              Kas Laci (Tunai)
            </button>
            <button 
              type="button"
              @click="payForm.accountId = 'acc_bank'" 
              :class="['py-3 rounded-xl text-xs font-bold border transition', payForm.accountId === 'acc_bank' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-zinc-50 border-zinc-200 text-zinc-600']"
            >
              Bank / QRIS
            </button>
          </div>
        </div>

        <div>
          <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Total Nominal Riil *</label>
          <input 
            :value="formatRp(payForm.actualPrice)" 
            @input="e => payForm.actualPrice = toNumber(e.target.value)" 
            type="text" 
            inputmode="numeric" 
            required
            class="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-lg font-black text-zinc-900" 
          />
        </div>

        <div class="flex gap-2 pt-2">
          <button type="button" @click="showPayModal = false" class="flex-1 py-3 bg-zinc-100 font-bold text-xs rounded-xl">Batal</button>
          <button type="submit" class="flex-1 py-3 bg-zinc-900 text-white font-bold text-xs rounded-xl shadow-md">Simpan &amp; Potong Kas</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal Form Tambah Belanjaan -->
  <div v-if="showAddModal" class="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
    <div class="w-full max-w-md bg-white rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200">
      <div class="flex justify-between items-center mb-4 shrink-0">
        <div>
          <h2 class="font-black text-base text-zinc-900">Tambah Belanjaan</h2>
          <p class="text-xs text-zinc-400">Pilih dari master produk atau input manual</p>
        </div>
        <button @click="showAddModal = false" class="p-2 bg-zinc-100 rounded-xl">
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Modal Toggle Mode -->
      <div class="flex bg-zinc-100 p-1 rounded-xl mb-4 shrink-0">
        <button 
          @click="isCustomItem = false" 
          :class="['flex-1 py-2 text-xs font-bold rounded-lg transition', !isCustomItem ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500']"
        >
          Dari Master Produk
        </button>
        <button 
          @click="isCustomItem = true" 
          :class="['flex-1 py-2 text-xs font-bold rounded-lg transition', isCustomItem ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500']"
        >
          Input Manual
        </button>
      </div>

      <div class="overflow-auto flex-1 space-y-3 pr-1">
        <!-- MODE 1: PILIH DARI MASTER PRODUK -->
        <div v-if="!isCustomItem" class="space-y-3">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              v-model="productSearch" 
              placeholder="Cari master produk..." 
              class="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border rounded-xl text-xs font-bold"
            />
          </div>

          <div v-if="filteredMasterProducts.length > 0" class="max-h-[160px] overflow-auto border border-zinc-100 rounded-xl divide-y">
            <div 
              v-for="p in filteredMasterProducts" 
              :key="p.id"
              @click="selectProductForAdd(p)"
              :class="['p-2.5 text-xs flex justify-between items-center cursor-pointer hover:bg-zinc-50 transition', form.productId === p.id && 'bg-amber-50 font-bold border-l-4 border-amber-500']"
            >
              <div>
                <div class="font-bold text-zinc-900">{{ p.name }}</div>
                <div class="text-[10px] text-zinc-400">
                  Stok sisa: {{ p.qty }} • Rp {{ formatRibuan(p.price_modal) }}
                  <span v-if="p.packUnit || p.pack_unit"> • Grosir: {{ p.packUnit || p.pack_unit }}</span>
                </div>
              </div>
              <span class="text-[10px] bg-zinc-100 px-2 py-0.5 rounded font-black text-zinc-600">Pilih</span>
            </div>
          </div>
        </div>

        <!-- FORM INPUT UTAMA -->
        <form @submit.prevent="saveItem" class="space-y-3">
          <div>
            <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Nama Barang *</label>
            <input 
              v-model="form.name" 
              required 
              placeholder="Nama barang / produk" 
              class="w-full px-4 py-2.5 bg-zinc-50 border rounded-xl text-sm font-bold" 
            />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Jumlah Belanja *</label>
              <input 
                v-model.number="form.qty" 
                type="number" 
                min="0" 
                required 
                class="w-full px-4 py-2.5 bg-zinc-50 border rounded-xl text-sm font-bold" 
              />
            </div>
            <div>
              <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Satuan *</label>
              <!-- Pilihan Satuan (Ecer & Grosir) jika dari Master Produk -->
              <select 
                v-if="!isCustomItem && availableUnits.length > 0" 
                v-model="form.unit" 
                class="w-full px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-zinc-900"
              >
                <option v-for="u in availableUnits" :key="u.value" :value="u.value">
                  {{ u.label }} - Rp {{ formatRibuan(u.priceModal) }}
                </option>
              </select>
              <!-- Input manual jika Custom Item -->
              <input 
                v-else 
                v-model="form.unit" 
                placeholder="pcs / dus / slop" 
                class="w-full px-4 py-2.5 bg-zinc-50 border rounded-xl text-sm font-bold" 
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Est. Total Modal (Rp)</label>
              <input 
                :value="formatRp(form.estimatedPrice)" 
                @input="e => form.estimatedPrice = toNumber(e.target.value)" 
                type="text" 
                inputmode="numeric" 
                placeholder="Rp 0" 
                class="w-full px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm font-black text-zinc-900" 
              />
            </div>
            <div>
              <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Kategori</label>
              <select v-model="form.category" class="w-full px-3 py-2.5 bg-zinc-50 border rounded-xl text-xs font-bold">
                <option v-for="c in categories" :key="c.id" :value="c.name">{{ c.name }}</option>
                <option value="Umum">Umum</option>
              </select>
            </div>
          </div>

          <div>
            <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Catatan Tambahan</label>
            <input 
              v-model="form.notes" 
              placeholder="Misal: Beli rasa cokelat &amp; keju" 
              class="w-full px-4 py-2.5 bg-zinc-50 border rounded-xl text-xs font-bold" 
            />
          </div>

          <div class="flex gap-2 pt-2">
            <button type="button" @click="showAddModal = false" class="flex-1 py-3 bg-zinc-100 font-bold text-xs rounded-xl">Batal</button>
            <button type="submit" class="flex-1 py-3 bg-zinc-900 text-white font-bold text-xs rounded-xl shadow-md">Simpan Belanjaan</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
</template>

<script setup>
import { onMounted } from 'vue'
import { Plus, Search, Trash2, X, Check, ShoppingBag, Sparkles, Share2 } from 'lucide-vue-next'
import { useShopping } from '../composables/useShopping.js'
import { formatRibuan, formatRp, toNumber } from '../utils/formatters/currency.js'
import { toast } from 'vue-sonner'

const {
  categories,
  searchQuery,
  activeFilter,
  loading,
  showAddModal,
  showPayModal,
  targetItemForPay,
  payForm,
  isCustomItem,
  form,
  productSearch,
  filteredMasterProducts,
  availableUnits,
  totalItems,
  boughtItemsCount,
  estimatedTotalCost,
  filteredItems,
  loadData,
  handleAutoRestock,
  handleToggleClick,
  submitToggleBought,
  openModal,
  selectProductForAdd,
  saveItem,
  deleteItem,
  clearCompletedItems,
  exportShoppingListText
} = useShopping()

const filterOptions = [
  { label: 'Semua', value: 'ALL' },
  { label: 'Belum', value: 'PENDING' },
  { label: 'Selesai', value: 'BOUGHT' }
]

const triggerAutoRestock = async () => {
  const count = await handleAutoRestock()
  if (count > 0) {
    toast.success(`Berhasil menambahkan ${count} produk tipis ke daftar belanja!`)
  } else {
    toast.info('Tidak ada produk baru bersisa stok tipis untuk ditambahkan.')
  }
}

const handleExportCopy = () => {
  const text = exportShoppingListText()
  if (!text) {
    toast.info('Belum ada item yang perlu dibeli.')
    return
  }

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Daftar belanja berhasil disalin ke clipboard!')
    }).catch(() => {
      copyFallback(text)
    })
  } else {
    copyFallback(text)
  }
}

const copyFallback = (text) => {
  const textarea = document.createElement('textarea')
  textarea.value = text
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
  toast.success('Daftar belanja berhasil disalin!')
}

onMounted(() => {
  loadData()
})
</script>
