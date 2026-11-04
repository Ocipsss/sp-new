// src/composables/useShopping.js
import { ref, computed, watch } from 'vue'
import { shoppingService } from '../services/shoppingService.js'
import { productRepo } from '../db/repositories/productRepository.js'
import { categoryRepo } from '../db/repositories/categoryRepository.js'

export function useShopping() {
  const items = ref([])
  const products = ref([])
  const categories = ref([])
  const searchQuery = ref('')
  const activeFilter = ref('ALL')
  const loading = ref(false)

  // State Modal Tambah Belanjaan & Searchbar Master Produk
  const showAddModal = ref(false)
  const isCustomItem = ref(false)
  const selectedProduct = ref(null)
  const productSearch = ref('')

  const form = ref({
    productId: null,
    name: '',
    category: 'Umum',
    qty: 0,
    unit: 'pcs',
    estimatedPrice: 0,
    notes: ''
  })

  // Filter Master Produk berdasarkan query di modal
  const filteredMasterProducts = computed(() => {
    const q = productSearch.value.toLowerCase().trim()
    if (!q) return []
    return products.value
      .filter(p => p.name.toLowerCase().includes(q) || (p.code || '').toLowerCase().includes(q))
      .slice(0, 10)
  })

  // Opsi pilihan satuan (Eceran & Grosir/Pack) berdasarkan skema DB Dexie
  const availableUnits = computed(() => {
    if (!selectedProduct.value) return []
    const p = selectedProduct.value
    const units = []

    // 1. Satuan Eceran (pcs / unit utama)
    const ecerUnit = p.unit || 'pcs'
    const ecerModal = Number(p.price_modal) || 0
    units.push({
      label: `${ecerUnit} (Ecer)`,
      value: ecerUnit,
      priceModal: ecerModal,
      type: 'unit'
    })

    // 2. Satuan Grosir / Pack / Dus (Membaca purchasePackName, packQty, packPrice)
    const packUnit = p.purchasePackName || p.packUnit || p.pack_unit
    const packQty = Number(p.packQty || p.pack_qty) || 1

    // Ambil harga modal grosir (packPrice) atau hitung otomatis
    let packModalPrice = Number(p.packPrice || p.packPriceModal)

    if (!packModalPrice || isNaN(packModalPrice) || packModalPrice === 0) {
      packModalPrice = ecerModal * packQty
    }

    // Masukkan opsi grosir jika purchasePackName terisi
    if (packUnit) {
      units.push({
        label: `${packUnit} (${packQty} ${ecerUnit})`,
        value: packUnit,
        priceModal: packModalPrice,
        type: 'pack'
      })
    }

    return units
  })

  // Watcher: Hitung otomatis estimasi modal berdasarkan input qty & satuan yang dipilih
  watch(
    [() => form.value.qty, () => form.value.unit],
    ([newQty, newUnit]) => {
      if (!selectedProduct.value) return

      const qtyNum = Number(newQty) || 0
      const matchedUnit = availableUnits.value.find(u => u.value === newUnit)
      const unitPriceModal = matchedUnit ? matchedUnit.priceModal : (selectedProduct.value.price_modal || 0)

      form.value.estimatedPrice = Math.round(unitPriceModal * qtyNum)
    }
  )

  // State Modal Konfirmasi Bayar Kulakan
  const showPayModal = ref(false)
  const targetItemForPay = ref(null)
  const payForm = ref({
    actualPrice: 0,
    accountId: 'acc_cash'
  })

  const totalItems = computed(() => items.value.length)
  const boughtItemsCount = computed(() => items.value.filter(i => i.isBought).length)
  const pendingItemsCount = computed(() => items.value.filter(i => !i.isBought).length)
  
  const estimatedTotalCost = computed(() => {
    return items.value.reduce((sum, item) => sum + (Number(item.estimatedPrice) || 0), 0)
  })

  const boughtTotalCost = computed(() => {
    return items.value
      .filter(i => i.isBought)
      .reduce((sum, item) => sum + (Number(item.estimatedPrice) || 0), 0)
  })

  const filteredItems = computed(() => {
    const q = searchQuery.value.toLowerCase().trim()
    return items.value.filter(item => {
      const matchQuery = !q || 
        item.name.toLowerCase().includes(q) || 
        (item.category || '').toLowerCase().includes(q)
      
      const matchFilter = 
        activeFilter.value === 'ALL' ||
        (activeFilter.value === 'PENDING' && !item.isBought) ||
        (activeFilter.value === 'BOUGHT' && item.isBought)

      return matchQuery && matchFilter
    })
  })

  const loadData = async () => {
    loading.value = true
    try {
      const [shoppingData, productData, categoryData] = await Promise.all([
        shoppingService.getShoppingItems(),
        productRepo.getAll(),
        categoryRepo.getAll()
      ])
      items.value = shoppingData
      products.value = productData
      categories.value = categoryData
    } finally {
      loading.value = false
    }
  }

  const handleAutoRestock = async () => {
    loading.value = true
    try {
      const addedCount = await shoppingService.populateLowStockItems()
      await loadData()
      return addedCount
    } finally {
      loading.value = false
    }
  }

  const handleToggleClick = (item) => {
    if (!item.isBought) {
      targetItemForPay.value = item
      payForm.value = {
        actualPrice: item.estimatedPrice || 0,
        accountId: 'acc_cash'
      }
      showPayModal.value = true
    } else {
      if (confirm(`Batalkan status selesai beli "${item.name}"?\nStok barang dan kas/bank akan dikembalikan.`)) {
        submitToggleBought(item, { accountId: 'acc_cash', actualPrice: item.estimatedPrice })
      }
    }
  }

  const submitToggleBought = async (item, options) => {
    await shoppingService.toggleBoughtStatus(item, options)
    showPayModal.value = false
    targetItemForPay.value = null
    await loadData()
  }

  const openModal = () => {
    isCustomItem.value = false
    selectedProduct.value = null
    productSearch.value = ''
    form.value = {
      productId: null,
      name: '',
      category: categories.value[0]?.name || 'Umum',
      qty: 0,
      unit: 'pcs',
      estimatedPrice: 0,
      notes: ''
    }
    showAddModal.value = true
  }

  const selectProductForAdd = (product) => {
    selectedProduct.value = product
    form.value.productId = product.id
    form.value.name = product.name
    form.value.category = product.category || 'Umum'
    form.value.qty = 0
    form.value.estimatedPrice = 0

    // Pilih otomatis opsi grosir jika produk memiliki purchasePackName
    const packUnit = product.purchasePackName || product.packUnit || product.pack_unit
    if (packUnit) {
      form.value.unit = packUnit
    } else {
      form.value.unit = product.unit || 'pcs'
    }

    productSearch.value = ''
  }

  const saveItem = async () => {
    if (!form.value.name.trim()) return

    await shoppingService.addShoppingItem(form.value)
    productSearch.value = ''
    showAddModal.value = false
    await loadData()
  }

  const deleteItem = async (id) => {
    await shoppingService.removeItem(id)
    await loadData()
  }

  const clearCompletedItems = async () => {
    await shoppingService.clearCompleted()
    await loadData()
  }

  const exportShoppingListText = () => {
    const pending = items.value.filter(i => !i.isBought)
    if (pending.length === 0) return ''

    let text = `*DAFTAR BELANJA KULAKAN SINAR PAGI*\n`
    text += `Tanggal: ${new Date().toLocaleDateString('id-ID')}\n`
    text += `===============================\n\n`

    pending.forEach((item, idx) => {
      text += `${idx + 1}. *${item.name}*\n`
      text += `   • Jumlah: ${item.qty} ${item.unit}\n`
      if (item.estimatedPrice > 0) {
        text += `   • Est. Modal: Rp ${item.estimatedPrice.toLocaleString('id-ID')}\n`
      }
      if (item.notes) {
        text += `   • Catatan: ${item.notes}\n`
      }
      text += `\n`
    })

    text += `===============================\n`
    text += `*Estimasi Total Modal:* Rp ${estimatedTotalCost.value.toLocaleString('id-ID')}\n`

    return text
  }

  return {
    items,
    products,
    categories,
    searchQuery,
    activeFilter,
    loading,
    showAddModal,
    showPayModal,
    targetItemForPay,
    payForm,
    isCustomItem,
    selectedProduct,
    productSearch,
    filteredMasterProducts,
    availableUnits,
    form,
    totalItems,
    boughtItemsCount,
    pendingItemsCount,
    estimatedTotalCost,
    boughtTotalCost,
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
  }
}
