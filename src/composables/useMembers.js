// src/composables/useMembers.js
import { ref, computed } from 'vue'
import { memberRepo } from '../db/repositories/memberRepository.js'
import { memberService } from '../services/memberService.js'
import { toast } from 'vue-sonner'

export function useMembers() {
  const members = ref([])
  const searchQuery = ref('')

  const showModal = ref(false)
  const editingId = ref(null)
  const form = ref({ name: '', phone: '', address: '' })

  const showPayModal = ref(false)
  const selectedMemberForPay = ref(null)
  const payAmount = ref(0)
  const paymentMethod = ref('CASH')

  // Mengurutkan daftar member secara alfabetis A-Z
  const filteredMembers = computed(() => {
    const q = searchQuery.value.toLowerCase().trim()
    let list = members.value

    if (q) {
      list = list.filter(m => 
        (m.name || '').toLowerCase().includes(q) || 
        (m.phone || '').includes(q)
      )
    }

    return [...list].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  })

  const loadMembers = async () => {
    members.value = await memberRepo.getAll()
  }

  const openModal = (m = null) => {
    if (m) {
      editingId.value = m.id
      form.value = { name: m.name, phone: m.phone || '', address: m.address || '' }
    } else {
      editingId.value = null
      form.value = { name: '', phone: '', address: '' }
    }
    showModal.value = true
  }

  const saveMember = async () => {
    if (!form.value.name.trim()) return

    if (editingId.value) {
      await memberRepo.update(editingId.value, form.value)
    } else {
      await memberRepo.create(form.value)
    }

    showModal.value = false
    await loadMembers()
  }

  const deleteMember = async (m) => {
    if (confirm(`Hapus member "${m.name}"?`)) {
      await memberRepo.delete(m.id)
      await loadMembers()
    }
  }

  const openPayModal = (m) => {
    selectedMemberForPay.value = m
    payAmount.value = m.debt || 0
    paymentMethod.value = 'CASH'
    showPayModal.value = true
  }

  const submitPayDebt = async () => {
    if (!selectedMemberForPay.value) return

    const amount = Number(payAmount.value)
    const currentDebt = Number(selectedMemberForPay.value.debt || 0)

    if (isNaN(amount) || amount <= 0) {
      toast.error('Nominal pembayaran harus berupa angka lebih dari 0!')
      return
    }

    if (amount > currentDebt) {
      toast.error(`Nominal pembayaran melebihi sisa utang! (Maks: Rp ${currentDebt.toLocaleString('id-ID')})`)
      return
    }

    try {
      await memberService.payDebt({
        memberId: selectedMemberForPay.value.id,
        amount,
        paymentMethod: paymentMethod.value
      })

      toast.success('Pembayaran utang berhasil dicatat!')
      showPayModal.value = false
      payAmount.value = 0
      selectedMemberForPay.value = null
      paymentMethod.value = 'CASH'

      await loadMembers()
    } catch (e) {
      toast.error(e.message || 'Gagal memproses pembayaran utang')
    }
  }

  return {
    members,
    searchQuery,
    filteredMembers,
    showModal,
    editingId,
    form,
    showPayModal,
    selectedMemberForPay,
    payAmount,
    paymentMethod,
    loadMembers,
    openModal,
    saveMember,
    deleteMember,
    openPayModal,
    submitPayDebt
  }
}
