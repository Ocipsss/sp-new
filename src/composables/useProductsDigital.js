// src/composables/useProductsDigital.js
import { ref, computed } from 'vue'
import { productsDigitalService } from '../services/productsDigitalService.js'
import { memberRepo } from '../db/repositories/memberRepository.js'
import { formatRibuan } from '../utils/formatters/currency.js'
import { toast } from 'vue-sonner'

export function useProductsDigital() {
  const form = ref({
    type: 'topup',
    provider: '',
    nominal: null,
    adminFee: 2000,
    adminPaymentMethod: 'cash'
  })
  const loading = ref(false)

  const members = ref([])
  const selectedMember = ref(null)
  const memberQ = ref('')
  const showMemberPicker = ref(false)

  const loadMembers = async () => {
    members.value = await memberRepo.getAll()
  }

  const filteredMembers = computed(() => {
    const qq = memberQ.value.toLowerCase().trim()
    if (!qq) return members.value.slice(0, 20)
    return members.value.filter(m => m.name.toLowerCase().includes(qq) || (m.phone || '').includes(qq)).slice(0, 20)
  })

  const selectMember = (m) => {
    selectedMember.value = m
    showMemberPicker.value = false
  }

  const estimasiKas = computed(() => {
    const n = Number(form.value.nominal) || 0
    const fee = Number(form.value.adminFee) || 0
    const feeCash = form.value.adminPaymentMethod === 'cash' ? fee : 0
    return form.value.type === 'topup' ? n + feeCash : n - feeCash
  })

  const saveTransaction = async () => {
    if (!form.value.provider?.trim()) {
      toast.error('Pilih atau isi Layanan / Provider terlebih dahulu!')
      return
    }
    if (!form.value.nominal || form.value.nominal <= 0) {
      toast.error('Nominal transaksi harus lebih besar dari 0!')
      return
    }

    loading.value = true
    try {
      await productsDigitalService.create({
        ...form.value,
        memberId: selectedMember.value?.id || null,
        memberName: selectedMember.value?.name || null
      })
      toast.success('Transaksi digital berhasil disimpan!')
      form.value = {
        type: 'topup',
        provider: '',
        nominal: null,
        adminFee: 2000,
        adminPaymentMethod: 'cash'
      }
      selectedMember.value = null
    } catch (e) {
      toast.error(`Gagal menyimpan transaksi: ${e.message}`)
    } finally {
      loading.value = false
    }
  }

  return { 
    form, 
    estimasiKas, 
    loading, 
    members,
    selectedMember,
    memberQ,
    showMemberPicker,
    filteredMembers,
    loadMembers,
    selectMember,
    saveTransaction 
  }
}
