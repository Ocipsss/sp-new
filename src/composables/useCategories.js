// src/composables/useCategories.js
import { ref, computed, nextTick } from 'vue'
import { categoryRepo } from '../db/repositories/categoryRepository.js'
import { unitRepo } from '../db/repositories/unitRepository.js'

export function useCategories() {
  const categories = ref([])
  const units = ref([])
  const searchQuery = ref('')
  const activeTab = ref('category') // Pindahkan state tab ke composable
  const showModal = ref(false)
  const formName = ref('')
  const editingId = ref(null)
  const inputRef = ref(null)

  const filteredCategories = computed(() => {
    const q = searchQuery.value.toLowerCase().trim()
    if (!q) return categories.value
    return categories.value.filter(c => c.name.toLowerCase().includes(q))
  })

  const filteredUnits = computed(() => {
    const q = searchQuery.value.toLowerCase().trim()
    if (!q) return units.value
    return units.value.filter(u => u.name.toLowerCase().includes(q))
  })

  const loadCategories = async () => {
    const data = await categoryRepo.getAll()
    categories.value = data.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  }

  const loadUnits = async () => {
    const data = await unitRepo.getAll()
    units.value = data.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  }

  // Unified Modal Handler (Support Category & Unit)
  const openModal = (item = null) => {
    if (item) {
      editingId.value = item.id
      formName.value = item.name
    } else {
      editingId.value = null
      formName.value = ''
    }
    showModal.value = true
    nextTick(() => inputRef.value?.focus())
  }

  const closeModal = () => {
    showModal.value = false
    formName.value = ''
    editingId.value = null
  }

  const saveCategory = async () => {
    const formattedName = formName.value.trim().toUpperCase()
    if (!formattedName) return

    if (editingId.value) {
      await categoryRepo.update(editingId.value, formattedName)
    } else {
      await categoryRepo.create(formattedName)
    }

    closeModal()
    await loadCategories()
  }

  const deleteCategory = async (cat) => {
    if (confirm(`Hapus kategori "${cat.name}"?`)) {
      await categoryRepo.delete(cat.id)
      await loadCategories()
    }
  }

  const saveUnit = async () => {
    const formattedName = formName.value.trim().toUpperCase()
    if (!formattedName) return

    if (editingId.value) {
      await unitRepo.update(editingId.value, formattedName)
    } else {
      await unitRepo.create(formattedName)
    }

    closeModal()
    await loadUnits()
  }

  const deleteUnit = async (u) => {
    if (confirm(`Hapus satuan "${u.name}"?`)) {
      await unitRepo.delete(u.id)
      await loadUnits()
    }
  }

  // Single Form Submit Handler
  const handleSubmit = async () => {
    if (!formName.value.trim()) return

    if (activeTab.value === 'category') {
      await saveCategory()
    } else {
      await saveUnit()
    }
  }

  return {
    categories,
    units,
    searchQuery,
    activeTab,
    filteredCategories,
    filteredUnits,
    showModal,
    formName,
    editingId,
    inputRef,
    loadCategories,
    loadUnits,
    openModal,
    closeModal,
    handleSubmit,
    deleteCategory,
    deleteUnit
  }
}
