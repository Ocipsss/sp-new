<!-- src/components/product/ProductForm.vue -->
<template>
<form @submit.prevent="onSubmit" @keydown="handleFormKeydown" class="bg-white p-5 rounded-3xl border flex flex-col gap-4 shadow-sm">
  <!-- GAMBAR PRODUK - CLOUDINARY OFFLINE-FIRST -->
  <div class="flex flex-col gap-2">
    <label class="text-[10px] text-zinc-500 font-bold uppercase">Foto Produk (Cloudinary vezqidog)</label>
    <div class="flex gap-3 items-start">
      <div class="w-24 h-24 bg-zinc-50 border rounded-2xl overflow-hidden flex items-center justify-center shrink-0">
        <img v-if="imagePreview" :src="imagePreview" class="w-full h-full object-cover" />
        <span v-else class="text-[10px] text-zinc-400 text-center">No Image</span>
      </div>
      <div class="flex-1 flex flex-col gap-2">
        <input type="file" accept="image/*" @change="onImageChange" class="block w-full text-xs file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-zinc-900 file:text-white file:font-bold file:text-[11px]" />
        <p class="text-[10px] text-zinc-400">Offline langsung nongol. Online auto upload ke Cloudinary. Max 5MB, auto compress 800px.</p>
        <button v-if="imagePreview" type="button" @click="removeImage" class="text-[11px] text-red-500 font-bold text-left">Hapus Gambar</button>
      </div>
    </div>
  </div>

  <!-- TOGGLE PUBLISH KE WEB - BARU -->
  <div class="flex items-center justify-between p-4 bg-zinc-50 rounded-[1.5rem] border">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
           :class="isPublished ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-200 text-zinc-500'">
        <Globe v-if="isPublished" :size="20" />
        <EyeOff v-else :size="20" />
      </div>
      <div>
        <p class="font-bold text-[13px] text-zinc-900">{{ isPublished ? 'Tampil di Web' : 'Hanya di Kasir' }}</p>
        <p class="text-[11px] text-zinc-500">{{ isPublished ? 'Nongol di sinarpagi.my.id' : 'Tidak tampil di web pelanggan' }}</p>
      </div>
    </div>
    <button 
      type="button"
      @click="isPublished = !isPublished"
      class="relative w-14 h-8 rounded-full transition-all duration-300 shrink-0"
      :class="isPublished ? 'bg-emerald-500' : 'bg-zinc-300'">
      <span class="absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all duration-300"
            :class="isPublished ? 'left-7' : 'left-1'"></span>
    </button>
  </div>

  <!-- Nama Produk -->
  <div class="flex flex-col gap-1">
    <input v-model="name" placeholder="Nama Produk *" class="px-4 py-3 bg-zinc-50 border rounded-xl text-sm font-bold uppercase"/>
    <span v-if="errors.name" class="text-[10px] text-red-500">{{ errors.name }}</span>
  </div>

  <!-- Barcode + Scanner -->
  <div class="flex gap-2">
    <input 
      id="product-barcode-input"
      v-model="code" 
      @keydown.enter.prevent="handleBarcodeEnter"
      @blur="handleBarcodeBlur"
      placeholder="Barcode" 
      class="flex-1 px-4 py-3 bg-zinc-50 border rounded-xl text-sm uppercase"
    />
    <button type="button" @click="handleCameraScan" class="px-4 bg-zinc-900 text-white rounded-xl">
      <ScanLine class="w-4 h-4"/>
    </button>
  </div>
  <div id="reader" class="w-full rounded-xl overflow-hidden"></div>

  <!-- Pilihan Kategori & Satuan Custom Modal -->
  <div class="grid grid-cols-2 gap-2">
    <!-- Tombol Pilih Kategori -->
    <div class="flex flex-col gap-1">
      <label class="text-[10px] text-zinc-500 font-bold uppercase">Kategori</label>
      <button 
        type="button" 
        @click="showCategoryModal = true"
        class="w-full px-4 py-3 bg-zinc-50 border rounded-xl text-sm font-bold uppercase text-left flex justify-between items-center"
      >
        <span class="truncate">{{ category || 'UMUM' }}</span>
        <ChevronDown class="w-4 h-4 text-zinc-400 shrink-0" />
      </button>
    </div>

    <!-- Tombol Pilih Satuan -->
    <div class="flex flex-col gap-1">
      <label class="text-[10px] text-zinc-500 font-bold uppercase">Nama Satuan *</label>
      <button 
        type="button" 
        @click="showUnitModal = true"
        :class="['w-full px-4 py-3 bg-zinc-50 border rounded-xl text-sm font-bold uppercase text-left flex justify-between items-center', !unit && 'text-zinc-400']"
      >
        <span class="truncate">{{ unit || '-- PILIH SATUAN --' }}</span>
        <ChevronDown class="w-4 h-4 text-zinc-400 shrink-0" />
      </button>
      <span v-if="errors.unit" class="text-[10px] text-red-500">{{ errors.unit }}</span>
    </div>
  </div>

  <!-- Kalkulator Grosir -->
  <div class="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col gap-3">
    <div class="text-[10px] font-black text-blue-600 uppercase">Kalkulator Grosir</div>
    
    <div class="grid grid-cols-3 gap-2">
      <div class="col-span-2 flex flex-col gap-1">
        <label class="text-[10px] text-zinc-500 font-bold uppercase">Harga Kulakan</label>
        <input :value="formatRp(packPrice)" @input="onPackPriceInput" inputmode="numeric" placeholder="Rp 0" class="w-full px-3 py-2.5 bg-white border rounded-xl text-sm font-bold"/>
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-[10px] text-zinc-500 font-bold uppercase">Isi / Pak</label>
        <input v-model.number="packQty" type="number" inputmode="numeric" placeholder="12" class="w-full px-3 py-2.5 bg-white border rounded-xl text-sm font-bold"/>
      </div>
    </div>

    <div v-if="toNumber(packPrice) > 0" class="flex flex-col gap-2">
      <div class="flex flex-col gap-1">
        <label class="text-[10px] text-zinc-500 font-bold uppercase">Nama Satuan Grosir</label>
        <button 
          type="button" 
          @click="showPackUnitModal = true"
          class="px-3 py-2.5 bg-white border rounded-xl text-sm font-bold uppercase text-left flex justify-between items-center"
        >
          <span class="truncate">{{ purchasePackName || '-- PILIH SATUAN GROSIR --' }}</span>
          <ChevronDown class="w-4 h-4 text-zinc-400 shrink-0" />
        </button>
      </div>

      <div class="text-[11px] text-blue-600 bg-white p-2.5 rounded-xl border font-semibold uppercase">
        Auto modal / {{ unit || 'satuan' }}: {{ formatRp(autoModal) }}
      </div>
    </div>
  </div>

  <!-- Modal + Jual bersebelahan -->
  <div class="grid grid-cols-2 gap-2">
    <div class="flex flex-col gap-1">
      <label class="text-[10px] text-zinc-500 font-bold uppercase">Modal / {{ unit || 'satuan' }} *</label>
      <input :value="formatRp(price_modal)" @input="onModalInput" inputmode="numeric" placeholder="Rp 0" class="w-full px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm font-bold"/>
      <span v-if="errors.price_modal" class="text-[10px] text-red-500">{{ errors.price_modal }}</span>
    </div>
    <div class="flex flex-col gap-1">
      <label class="text-[10px] text-zinc-500 font-bold uppercase">Harga Jual / {{ unit || 'satuan' }} *</label>
      <input :value="formatRp(price_sell)" @input="onJualInput" inputmode="numeric" placeholder="Rp 0" class="w-full px-3 py-2.5 bg-green-50 border border-green-200 rounded-xl text-sm font-bold"/>
      <span class="text-[10px] text-green-600 font-bold">Margin {{ marginPersen }}%</span>
    </div>
  </div>

  <!-- Stok Awal + Min Stok bersebelahan -->
  <div class="grid grid-cols-2 gap-2">
    <div class="flex flex-col gap-1">
      <label class="text-[10px] text-zinc-500 font-bold uppercase">Stok ({{ unit || 'satuan' }})</label>
      <input v-model.number="qty" type="number" placeholder="0" class="px-4 py-3 bg-zinc-50 border rounded-xl text-sm font-bold"/>
    </div>
    <div class="flex flex-col gap-1">
      <label class="text-[10px] text-zinc-500 font-bold uppercase">Min. Stok</label>
      <input v-model.number="minStock" type="number" placeholder="2" class="px-4 py-3 bg-zinc-50 border rounded-xl text-sm font-bold"/>
    </div>
  </div>

  <button :disabled="isSubmitting" class="w-full bg-zinc-900 text-white py-4 rounded-2xl font-black text-sm active:scale-95 transition">
    {{ isSubmitting ? 'Menyimpan...' : (initialData ? 'Update Barang' : 'Simpan Barang') }}
  </button>
</form>

<!-- MODAL PILIH KATEGORI -->
<div v-if="showCategoryModal" class="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
  <div class="w-full max-w-sm bg-white rounded-[2rem] p-5 shadow-xl animate-in zoom-in-95 fade-in duration-200 max-h-[80vh] flex flex-col">
    <div class="flex justify-between items-center mb-3">
      <h3 class="font-black text-base text-zinc-900">Pilih Kategori</h3>
      <button type="button" @click="showCategoryModal = false" class="p-2 bg-zinc-100 rounded-xl"><X class="w-4 h-4"/></button>
    </div>

    <div class="space-y-1.5 overflow-auto flex-1 pr-1">
      <button 
        type="button" 
        @click="category = 'UMUM'; showCategoryModal = false"
        :class="['w-full p-3 rounded-xl font-bold text-xs text-left uppercase transition', category === 'UMUM' ? 'bg-zinc-900 text-white' : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-800']"
      >
        UMUM
      </button>

      <button 
        v-for="cat in categories" 
        :key="cat.id" 
        type="button"
        @click="category = cat.name.toUpperCase(); showCategoryModal = false"
        :class="['w-full p-3 rounded-xl font-bold text-xs text-left uppercase transition', category === cat.name.toUpperCase() ? 'bg-zinc-900 text-white' : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-800']"
      >
        {{ cat.name }}
      </button>
    </div>
  </div>
</div>

<!-- MODAL PILIH SATUAN UTAMA -->
<div v-if="showUnitModal" class="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
  <div class="w-full max-w-sm bg-white rounded-[2rem] p-5 shadow-xl animate-in zoom-in-95 fade-in duration-200 max-h-[80vh] flex flex-col">
    <div class="flex justify-between items-center mb-3">
      <h3 class="font-black text-base text-zinc-900">Pilih Satuan Utama</h3>
      <button type="button" @click="showUnitModal = false" class="p-2 bg-zinc-100 rounded-xl"><X class="w-4 h-4"/></button>
    </div>

    <div class="space-y-1.5 overflow-auto flex-1 pr-1">
      <button 
        v-for="u in units" 
        :key="u.id" 
        type="button"
        @click="unit = u.name.toUpperCase(); showUnitModal = false"
        :class="['w-full p-3 rounded-xl font-bold text-xs text-left uppercase transition', unit === u.name.toUpperCase() ? 'bg-zinc-900 text-white' : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-800']"
      >
        {{ u.name }}
      </button>
    </div>
  </div>
</div>

<!-- MODAL PILIH SATUAN GROSIR -->
<div v-if="showPackUnitModal" class="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
  <div class="w-full max-w-sm bg-white rounded-[2rem] p-5 shadow-xl animate-in zoom-in-95 fade-in duration-200 max-h-[80vh] flex flex-col">
    <div class="flex justify-between items-center mb-3">
      <h3 class="font-black text-base text-zinc-900">Pilih Satuan Grosir</h3>
      <button type="button" @click="showPackUnitModal = false" class="p-2 bg-zinc-100 rounded-xl"><X class="w-4 h-4"/></button>
    </div>

    <div class="space-y-1.5 overflow-auto flex-1 pr-1">
      <button 
        type="button" 
        @click="purchasePackName = ''; showPackUnitModal = false"
        class="w-full p-3 bg-zinc-50 hover:bg-zinc-100 rounded-xl font-bold text-xs text-left text-red-500 uppercase transition"
      >
        -- KOSONGKAN --
      </button>

      <button 
        v-for="u in units" 
        :key="u.id" 
        type="button"
        @click="purchasePackName = u.name.toUpperCase(); showPackUnitModal = false"
        :class="['w-full p-3 rounded-xl font-bold text-xs text-left uppercase transition', purchasePackName === u.name.toUpperCase() ? 'bg-zinc-900 text-white' : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-800']"
      >
        {{ u.name }}
      </button>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onActivated } from 'vue'
import { ScanLine, ChevronDown, X, Globe, EyeOff } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useProductForm } from '../../composables/useProductForm.js'
import { useProductScanner } from '../../composables/useProductScanner.js'
import { calcModalDariPack, calcMargin } from '../../utils/calculator/product.js'
import { formatRp, toNumber } from '../../utils/formatters/currency.js'
import { useProductsStore } from '../../stores/productStore.js'
import { productRepo } from '../../db/repositories/productRepository.js'
import { toast } from 'vue-sonner'

const props = defineProps({
  initialData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['success'])

const showCategoryModal = ref(false)
const showUnitModal = ref(false)
const showPackUnitModal = ref(false)

const { 
  name, code, category, unit, purchasePackName, packPrice, packQty, 
  price_modal, price_sell, qty, minStock, categories, units, loadCategories, loadUnits,
  handleSubmit, errors, isSubmitting 
} = useProductForm()

const { start } = useProductScanner()
const router = useRouter()
const productStore = useProductsStore()

// ===== GAMBAR - BARU =====
const imageFile = ref(null)
const imagePreview = ref(null)
const isPublished = ref(false)

function onImageChange(e) {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    toast.error('Gambar max 5MB')
    return
  }
  compressImage(file).then(compressed => {
    imageFile.value = compressed
    imagePreview.value = URL.createObjectURL(compressed)
  })
}
function removeImage() {
  imageFile.value = null
  imagePreview.value = null
  isPublished.value = false
}
function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxW = 800
        let w = img.width, h = img.height
        if (w > maxW) { h = h * maxW / w; w = maxW }
        canvas.width = w; canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.7)
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  })
}


const autoModal = computed(() => calcModalDariPack(packPrice.value, packQty.value))
const marginPersen = computed(() => calcMargin(price_sell.value, price_modal.value))

// --- LOGIKA BLOKIR SCANNER DI LUAR INPUT BARCODE ---
let lastKeyTime = 0
let fastKeyBurstCount = 0

const handleFormKeydown = (e) => {
  const isBarcodeInput = e.target && e.target.id === 'product-barcode-input'
  if (isBarcodeInput) return

  const now = Date.now()
  const timeDiff = now - lastKeyTime
  lastKeyTime = now

  if (timeDiff < 40) {
    fastKeyBurstCount++
  } else {
    fastKeyBurstCount = 0
  }

  if (fastKeyBurstCount >= 1) {
    e.preventDefault()
    e.stopPropagation()

    if (fastKeyBurstCount === 1 && e.target && 'value' in e.target) {
      const val = e.target.value
      if (val.length > 0) {
        e.target.value = val.slice(0, -1)
        e.target.dispatchEvent(new Event('input'))
      }
    }
  }
}

const resetFormFields = () => {
  name.value = ''
  code.value = ''
  category.value = 'UMUM'
  unit.value = ''
  purchasePackName.value = ''
  packPrice.value = 0
  packQty.value = 0
  price_modal.value = 0
  price_sell.value = 0
  qty.value = 0
  minStock.value = 2
  imageFile.value = null
  imagePreview.value = null
  isPublished.value = false
}

const checkExistingBarcode = async (barcodeVal) => {
  if (!barcodeVal) return false
  const cleanCode = String(barcodeVal).toUpperCase().trim()
  if (!cleanCode) return false

  const allProducts = await productRepo.getAll()
  const existingProduct = allProducts.find(
    p => String(p.code || '').toUpperCase().trim() === cleanCode
  )

  if (existingProduct && existingProduct.id !== props.initialData?.id) {
    const productName = existingProduct.name || 'Tanpa Nama'
    toast.error(`Barcode "${cleanCode}" sudah digunakan oleh: ${productName}`)
    code.value = ''
    return true
  }
  return false
}

const handleBarcodeEnter = async () => {
  await checkExistingBarcode(code.value)
}

const handleBarcodeBlur = async () => {
  await checkExistingBarcode(code.value)
}

const handleCameraScan = () => {
  start(async (scannedCode) => {
    code.value = scannedCode
    await checkExistingBarcode(scannedCode)
  })
}

const initFormData = async () => {
  await loadCategories()
  await loadUnits()

  if (props.initialData) {
    name.value = (props.initialData.name || '').toUpperCase()
    code.value = (props.initialData.code || '').toUpperCase()
    category.value = (props.initialData.category || 'UMUM').toUpperCase()
    unit.value = (props.initialData.unit || '').toUpperCase()
    purchasePackName.value = (props.initialData.purchasePackName || '').toUpperCase()
    packPrice.value = props.initialData.packPrice || 0
    packQty.value = props.initialData.packQty || 0
    price_modal.value = props.initialData.price_modal || 0
    price_sell.value = props.initialData.price_sell || 0
    qty.value = props.initialData.qty || 0
    minStock.value = props.initialData.minStock || 2
    isPublished.value = props.initialData.isPublished || false
    if (props.initialData.imageUrl) imagePreview.value = props.initialData.imageUrl
    else if (props.initialData.imageLocal) imagePreview.value = URL.createObjectURL(props.initialData.imageLocal)
  } else {
    resetFormFields()
  }
}

onMounted(initFormData)

onActivated(() => {
  if (!props.initialData) {
    resetFormFields()
  }
})

const onPackPriceInput = (e) => {
  const raw = toNumber(e.target.value)
  packPrice.value = raw
  e.target.value = formatRp(raw)
}
const onModalInput = (e) => {
  const raw = toNumber(e.target.value)
  price_modal.value = raw
  e.target.value = formatRp(raw)
}
const onJualInput = (e) => {
  const raw = toNumber(e.target.value)
  price_sell.value = raw
  e.target.value = formatRp(raw)
}

watch(autoModal, (val) => { if (val > 0) price_modal.value = val })

const onSubmit = handleSubmit(async (vals) => {
  const payload = {
    name: (vals.name || '').toUpperCase().trim(),
    code: (vals.code || '').toUpperCase().trim(),
    category: (category.value || 'UMUM').toUpperCase().trim(),
    unit: (unit.value || '').toUpperCase().trim(),
    purchasePackName: (purchasePackName.value || '').toUpperCase().trim(),
    packPrice: toNumber(packPrice.value),
    packQty: toNumber(packQty.value),
    price_modal: toNumber(price_modal.value),
    price_sell: toNumber(price_sell.value),
    qty: toNumber(qty.value),
    minStock: toNumber(minStock.value) || 2,
    isPublished: isPublished.value
  }

  const isDuplicate = await checkExistingBarcode(payload.code)
  if (isDuplicate) return

  if (props.initialData?.id) {
    await productStore.update(props.initialData.id, payload, imageFile.value)
    toast.success('Barang berhasil diperbarui!')
    emit('success')
  } else {
    await productStore.add(payload, imageFile.value)
    toast.success('Barang berhasil ditambahkan!')
    resetFormFields()
    router.push('/products')
  }
})
</script>
