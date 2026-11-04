// src/composables/useSettingsMenu.js - FULL FINAL DRAG & DROP SUPPORT
import { ref } from 'vue'
import { productRepo } from '../db/repositories/productRepository.js'
import { packageRepository } from '../db/repositories/packageRepository.js'
import { serviceRepository } from '../db/repositories/serviceRepository.js'
import { categoryRepo } from '../db/repositories/categoryRepository.js'

export function useSettingsMenu() {
  const allProducts = ref([])
  const rokokProducts = ref([])
  const packages = ref([])
  const services = ref([])
  const categoryOptions = ref([])
  const loading = ref(false)

  // Helper: ambil semua productId dari service (support lama productId & baru productIds)
  const getServiceIds = (s) => {
    if (s.productIds && Array.isArray(s.productIds) && s.productIds.length) return s.productIds
    if (s.productId) return [s.productId]
    return []
  }

  const loadData = async () => {
    loading.value = true
    try {
      const [allProductsData, allPackages, allServices, allCategories] = await Promise.all([
        productRepo.getAll(),
        packageRepository.getAll(),
        serviceRepository.getAll(),
        categoryRepo.getAll()
      ])
      
      allProducts.value = [...allProductsData].sort((a,b) => (a.name||'').localeCompare(b.name||'', 'id'))

      const packageCategories = ['rokok', 'permen']
      rokokProducts.value = allProductsData
        .filter(p => {
          const cat = (p.category || '').toLowerCase()
          return packageCategories.some(k => cat.includes(k))
        })
        .sort((a, b) => {
          const catCompare = (a.category || '').localeCompare(b.category || '')
          if (catCompare !== 0) return catCompare
          return (a.name || '').localeCompare(b.name || '')
        })

      packages.value = [...allPackages].sort((a,b) => (a.order ?? 999) - (b.order ?? 999))
      services.value = allServices
      categoryOptions.value = [...allCategories].sort((a, b) => 
        (a.name || '').localeCompare(b.name || '', 'id')
      )
    } finally {
      loading.value = false
    }
  }

  const getPackagesForProduct = (productId) => {
    return packages.value
      .filter(pkg => pkg.productId === productId)
      .sort((a,b) => (a.order ?? 999) - (b.order ?? 999))
  }

  const getServicesForProduct = (product) => {
    if(!product) return []
    const pCat = (product.category || '').toUpperCase()

    const custom = services.value.filter(s => {
      const ids = getServiceIds(s)
      return ids.length > 0 && ids.includes(product.id)
    })
    if (custom.length > 0) return custom

    return services.value.filter(s => {
      const ids = getServiceIds(s)
      return ids.length === 0 && (s.category || '').toUpperCase() === pCat
    })
  }

  const getProductById = (id) => allProducts.value.find(p => p.id === id)

  const savePackage = async (pkgData) => {
    await packageRepository.savePackage(pkgData)
    await loadData()
  }

  const deletePackage = async (id) => {
    await packageRepository.deletePackage(id)
    await loadData()
  }

  // REORDER DRAG & DROP - geser paket eceran 1 BTG ke atas bawah
  const reorderPackages = async (productId, orderedIds) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await packageRepository.updateOrder(orderedIds[i], i)
    }
    await loadData()
  }

  // tetep keep biar ga error kalo masih ada yang pake
  const movePackage = async (pkg, direction) => {
    const list = getPackagesForProduct(pkg.productId)
    const idx = list.findIndex(p => p.id === pkg.id)
    const newIdx = direction === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= list.length) return
    const current = list[idx]
    const target = list[newIdx]
    const currentOrder = current.order ?? idx
    const targetOrder = target.order ?? newIdx
    await packageRepository.updateOrder(current.id, targetOrder)
    await packageRepository.updateOrder(target.id, currentOrder)
    await loadData()
  }

  const saveService = async (serviceData) => {
    const plainProductIds = serviceData.productIds 
      ? [...serviceData.productIds] 
      : (serviceData.productId ? [serviceData.productId] : [])

    const normalized = {
      ...JSON.parse(JSON.stringify(serviceData)),
      productId: null,
      productIds: plainProductIds
    }
    delete normalized.productId_old
    await serviceRepository.saveService(normalized)
    await loadData()
  }

  const deleteService = async (id) => {
    await serviceRepository.deleteService(id)
    await loadData()
  }

  return {
    allProducts,
    rokokProducts,
    packages,
    services,
    categoryOptions,
    loading,
    loadData,
    getPackagesForProduct,
    getServicesForProduct,
    getProductById,
    getServiceIds,
    savePackage,
    deletePackage,
    movePackage,
    reorderPackages,
    saveService,
    deleteService
  }
}