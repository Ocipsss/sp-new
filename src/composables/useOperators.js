// src/composables/useOperators.js
import { ref, computed } from 'vue'
import { operatorRepo } from '../db/repositories/operatorRepository.js'

export function useOperators() {
  const operators = ref([])
  const searchQuery = ref('')
  const showModal = ref(false)
  const editingId = ref(null)
  const form = ref({ name: '', role: 'Kasir', pin: '' })

  const filteredOperators = computed(() => {
    const q = searchQuery.value.toLowerCase().trim()
    if (!q) return operators.value
    return operators.value.filter(o => 
      o.name.toLowerCase().includes(q) || 
      (o.role || '').toLowerCase().includes(q)
    )
  })

  const loadOperators = async () => {
    operators.value = await operatorRepo.getAll()
  }

  const openModal = (op = null) => {
    if (op) {
      editingId.value = op.id
      form.value = { name: op.name, role: op.role || 'Kasir', pin: op.pin || '' }
    } else {
      editingId.value = null
      form.value = { name: '', role: 'Kasir', pin: '' }
    }
    showModal.value = true
  }

  const saveOperator = async () => {
    if (!form.value.name.trim()) return

    if (editingId.value) {
      await operatorRepo.update(editingId.value, form.value)
    } else {
      await operatorRepo.create(form.value)
    }

    showModal.value = false
    await loadOperators()
    // syncRealtime.pushLocalToCloud() -> Dihapus, ditangani Dexie Hook
  }

  const deleteOperator = async (op) => {
    if (confirm(`Hapus operator / kasir "${op.name}"?`)) {
      await operatorRepo.delete(op.id)
      await loadOperators()
      // syncRealtime.pushLocalToCloud() -> Dihapus, ditangani Dexie Hook
    }
  }

  return {
    operators,
    searchQuery,
    filteredOperators,
    showModal,
    editingId,
    form,
    loadOperators,
    openModal,
    saveOperator,
    deleteOperator
  }
}
