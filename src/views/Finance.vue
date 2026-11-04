<!-- src/views/Finance.vue -->
<template>
<div class="flex-1 overflow-auto p-4 pb-28 space-y-4 font-sans">
  <!-- Header & Actions -->
  <div class="flex justify-between items-center">
    <div>
      <h1 class="font-black text-xl text-zinc-900">Kas & Keuangan</h1>
      <p class="text-xs text-zinc-400">Ringkasan kas, bank/QRIS, dan saldo piutang</p>
    </div>
    <button 
      @click="syncFromHistory" 
      :disabled="loading"
      class="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 active:scale-95 text-zinc-800 rounded-xl font-bold text-xs transition flex items-center gap-1.5 disabled:opacity-50"
    >
      <RefreshCw :class="['w-3.5 h-3.5', loading && 'animate-spin']" />
      Hitung Ulang
    </button>
  </div>

  <!-- Total Saldo Kas + Bank -->
  <div class="bg-zinc-900 text-white p-5 rounded-[2rem] shadow-md flex justify-between items-center">
    <div>
      <div class="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Saldo Aset (Kas + Bank)</div>
      <div class="text-2xl font-black mt-1">Rp {{ formatRibuan(totalSaldo) }}</div>
    </div>
    <button 
      @click="openModal" 
      class="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs active:scale-95 transition"
    >
      Set Saldo Awal
    </button>
  </div>

  <!-- Kartu Akun Saldo & Piutang -->
  <div class="grid grid-cols-1 gap-3">
    <div 
      v-for="acc in accounts" 
      :key="acc.id"
      class="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm flex justify-between items-center"
    >
      <div class="flex items-center gap-3">
        <div :class="[
          'w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs uppercase',
          acc.type === 'CASH' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
        ]">
          {{ acc.type === 'CASH' ? 'TUNAI' : 'BANK' }}
        </div>
        <div>
          <div class="font-bold text-sm text-zinc-900">{{ acc.name }}</div>
          <div class="text-xs font-black text-zinc-600 mt-0.5">Rp {{ formatRibuan(acc.balance || 0) }}</div>
        </div>
      </div>
    </div>

    <div class="bg-amber-50/80 p-4 rounded-2xl border border-amber-200/80 shadow-sm flex justify-between items-center">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-xs uppercase">
          TEMPO
        </div>
        <div>
          <div class="font-bold text-sm text-amber-950">Total Piutang Member</div>
          <div class="text-xs font-black text-amber-700 mt-0.5">Rp {{ formatRibuan(totalPiutang) }}</div>
        </div>
      </div>
      <router-link to="/members" class="px-3 py-1.5 bg-amber-200/60 hover:bg-amber-200 text-amber-900 font-bold text-xs rounded-xl transition">
        Lihat Member
      </router-link>
    </div>
  </div>

  <!-- Riwayat Mutasi -->
  <div class="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm space-y-3">
    <div class="font-black text-xs text-zinc-400 uppercase tracking-wider">Mutasi Terakhir</div>
    
    <div v-if="mutations.length === 0" class="text-center py-8 text-xs text-zinc-400">
      Belum ada mutasi saldo. Klik "Hitung Ulang" untuk memuat dari riwayat transaksi.
    </div>

    <div v-else class="space-y-2">
      <div 
        v-for="m in mutations.slice(0, 15)" 
        :key="m.id"
        class="flex justify-between items-center py-2.5 border-b border-zinc-50 last:border-0 text-xs"
      >
        <div>
          <div class="font-bold text-zinc-800">{{ m.note || m.category }}</div>
          <div class="text-[10px] text-zinc-400">{{ formatDate(m.date) }}</div>
        </div>
        <div :class="['font-black', m.type === 'IN' ? 'text-emerald-600' : 'text-red-500']">
          {{ m.type === 'IN' ? '+' : '-' }}Rp {{ formatRibuan(m.amount) }}
        </div>
      </div>
    </div>
  </div>

  <!-- Modal Set Saldo Awal -->
  <div v-if="showModal" class="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
    <div class="w-full max-w-md bg-white rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-xl space-y-4 animate-in slide-in-from-bottom duration-200">
      <div class="flex justify-between items-center">
        <h2 class="font-black text-base text-zinc-900">Atur Saldo Awal</h2>
        <button @click="showModal = false" class="p-2 bg-zinc-100 rounded-xl"><X class="w-4 h-4"/></button>
      </div>

      <form @submit.prevent="submitBalance" class="space-y-3">
        <div>
          <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Pilih Akun</label>
          <select v-model="form.accountId" class="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold">
            <option v-for="a in accounts" :key="a.id" :value="a.id">{{ a.name }}</option>
          </select>
        </div>

        <div>
          <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Nominal Saldo (Rp)</label>
          <input 
            :value="formatRp(form.amount)" 
            @input="e => form.amount = toNumber(e.target.value)" 
            type="text" 
            inputmode="numeric" 
            placeholder="Rp 0" 
            class="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-lg font-black text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

        <div>
          <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Catatan</label>
          <input v-model="form.note" placeholder="Misal: Saldo Laci Pagi Ini" class="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold" />
        </div>

        <div class="flex gap-2 pt-2">
          <button type="button" @click="showModal = false" class="flex-1 py-3 bg-zinc-100 font-bold text-xs rounded-xl">Batal</button>
          <button type="submit" :disabled="loading" class="flex-1 py-3 bg-zinc-900 disabled:bg-zinc-400 text-white font-bold text-xs rounded-xl shadow-md">Simpan Saldo</button>
        </div>
      </form>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, onMounted, onActivated } from 'vue'
import { RefreshCw, X } from 'lucide-vue-next'
import { useFinance } from '../composables/useFinance.js'
import { formatRibuan, formatRp, toNumber } from '../utils/formatters/currency.js'
import dayjs from 'dayjs'

const { 
  accounts, 
  mutations, 
  totalSaldo, 
  totalPiutang, 
  loading, 
  loadData, 
  syncFromHistory, 
  setBalance 
} = useFinance()

const showModal = ref(false)
const form = ref({
  accountId: '',
  amount: 0,
  note: 'Saldo Awal'
})

const openModal = () => {
  form.value = {
    accountId: accounts.value[0]?.id || '',
    amount: 0,
    note: 'Saldo Awal'
  }
  showModal.value = true
}

const submitBalance = async () => {
  const success = await setBalance(form.value.accountId, form.value.amount, form.value.note)
  if (success) {
    showModal.value = false
  }
}

const formatDate = (d) => dayjs(d).format('DD MMM YYYY • HH:mm')

onMounted(loadData)
onActivated(loadData)
</script>
