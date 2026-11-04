<template>
<div class="flex-1 overflow-auto p-4 pb-24">
  <div class="w-full flex flex-col gap-4">
    <div class="w-full bg-white p-6 rounded-[2.5rem] shadow-sm border border-zinc-100">

      <!-- Toggle Top Up / Tarik Tunai -->
      <div class="flex bg-zinc-100 p-1.5 rounded-2xl mb-6 gap-2">
        <button 
          @click="form.type = 'topup'" 
          :class="form.type === 'topup'? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-400'" 
          class="flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition"
        >
          TOP UP
        </button>
        <button 
          @click="form.type = 'tariktunai'" 
          :class="form.type === 'tariktunai'? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-400'" 
          class="flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition"
        >
          TARIK TUNAI
        </button>
      </div>

      <!-- Pilih Member -->
      <div class="mb-5 flex items-center justify-between bg-zinc-50 border border-zinc-200/80 p-3.5 rounded-2xl">
        <div>
          <div class="text-[9px] font-black text-zinc-400 uppercase tracking-wider">Pelanggan / Member</div>
          <div class="text-xs font-bold text-zinc-900 mt-0.5">
            {{ selectedMember ? selectedMember.name : 'Umum / Non-Member' }}
          </div>
        </div>
        <div class="flex gap-2">
          <button 
            v-if="selectedMember" 
            @click="selectedMember = null" 
            class="px-3 py-1.5 bg-red-100 text-red-600 rounded-xl font-bold text-xs"
          >
            Lepas
          </button>
          <button 
            @click="showMemberPicker = true" 
            class="px-3.5 py-1.5 bg-zinc-900 text-white rounded-xl font-bold text-xs active:scale-95 transition"
          >
            {{ selectedMember ? 'Ganti' : 'Pilih Member' }}
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-5">
        <!-- Input Provider -->
        <div>
          <label class="text-[8px] font-black text-zinc-400 ml-1 uppercase tracking-[0.2em]">Layanan / Provider</label>
          <input 
            v-model="form.provider" 
            type="text" 
            placeholder="DANA, OVO, BRI, DLL" 
            class="w-full p-4 mt-1 bg-zinc-50 border rounded-2xl text-[12px] font-black uppercase outline-none focus:ring-2 focus:ring-zinc-900"
          >
        </div>

        <!-- Input Nominal & Admin -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-[8px] font-black text-zinc-400 ml-1 uppercase tracking-[0.2em]">Nominal (Rp)</label>
            <input 
              :value="formatRp(form.nominal)" 
              @input="e => form.nominal = toNumber(e.target.value)" 
              type="text" 
              inputmode="numeric" 
              placeholder="Rp 0" 
              class="w-full p-4 mt-1 bg-zinc-50 border rounded-2xl text-[14px] font-black text-blue-600 outline-none focus:ring-2 focus:ring-zinc-900"
            >
          </div>
          <div>
            <label class="text-[8px] font-black text-zinc-400 ml-1 uppercase tracking-[0.2em]">Biaya Admin (Rp)</label>
            <input 
              :value="formatRp(form.adminFee)" 
              @input="e => form.adminFee = toNumber(e.target.value)" 
              type="text" 
              inputmode="numeric" 
              placeholder="Rp 0" 
              class="w-full p-4 mt-1 bg-zinc-50 border rounded-2xl text-[14px] font-black outline-none focus:ring-2 focus:ring-zinc-900"
            >
          </div>
        </div>

        <!-- Metode Pembayaran Admin -->
        <div>
          <label class="text-[8px] font-black text-zinc-400 ml-1 uppercase tracking-[0.2em]">Metode Bayar Admin:</label>
          <div class="grid grid-cols-2 gap-2 mt-1.5">
            <button 
              @click="form.adminPaymentMethod = 'cash'" 
              :class="form.adminPaymentMethod === 'cash'? 'bg-blue-600 text-white shadow-sm' : 'bg-zinc-100 text-zinc-400'" 
              class="py-3 rounded-xl text-[9px] font-black uppercase transition"
            >
              UANG TUNAI
            </button>
            <button 
              @click="form.adminPaymentMethod = 'digital'" 
              :class="form.adminPaymentMethod === 'digital'? 'bg-blue-600 text-white shadow-sm' : 'bg-zinc-100 text-zinc-400'" 
              class="py-3 rounded-xl text-[9px] font-black uppercase transition"
            >
              POTONG SALDO
            </button>
          </div>
        </div>

        <!-- Kartu Estimasi Kas Fisik -->
        <div :class="form.type === 'topup'? 'bg-blue-600 border-blue-500' : 'bg-orange-500 border-orange-400'" class="p-5 rounded-[1.8rem] shadow-xl border mt-2 transition-colors">
          <div class="flex justify-between items-center mb-1">
            <span class="text-[8px] font-black text-white/70 uppercase">Estimasi Kas Fisik</span>
            <div class="px-2 py-0.5 bg-white/20 rounded text-[7px] font-black text-white uppercase">
              {{ form.type === 'topup'? 'UANG MASUK (+)' : 'UANG KELUAR (-)' }}
            </div>
          </div>
          <div class="text-2xl font-black text-white tracking-tighter">
            {{ form.type === 'topup'? '+' : '-' }} Rp {{ formatRibuan(Math.abs(estimasiKas)) }}
          </div>
          <p class="text-[8px] text-white/60 uppercase mt-2 italic">*Otomatis menyesuaikan perubahan uang tunai di laci kasir</p>
        </div>

        <!-- Tombol Simpan -->
        <button 
          @click="saveTransaction" 
          :disabled="loading" 
          class="w-full py-4.5 bg-zinc-900 disabled:bg-zinc-400 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
        >
          {{ loading? 'MENYIMPAN...' : 'SIMPAN TRANSAKSI' }}
        </button>
      </div>
    </div>
  </div>

  <!-- Modal Member Picker -->
  <div v-if="showMemberPicker" class="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex items-end">
    <div class="w-full max-w-xl mx-auto bg-white rounded-t-[2rem] p-5 max-h-[80vh] flex flex-col">
      <div class="flex justify-between items-center mb-4">
        <div class="font-black text-sm">Pilih Member</div>
        <button @click="showMemberPicker = false" class="p-2 bg-zinc-100 rounded-xl"><X class="w-4 h-4"/></button>
      </div>
      <input v-model="memberQ" placeholder="Cari nama / hp..." class="w-full px-4 py-3 bg-zinc-50 border rounded-xl text-sm mb-3"/>
      <div class="flex-1 overflow-auto">
        <div v-if="filteredMembers.length === 0" class="py-8 text-center text-xs text-zinc-400">Member tidak ditemukan</div>
        <div v-for="m in filteredMembers" :key="m.id" @click="selectMember(m)" class="p-3 border-b border-zinc-50 flex justify-between cursor-pointer hover:bg-zinc-50">
          <div>
            <div class="font-bold text-sm">{{ m.name }}</div>
            <div class="text-[11px] text-zinc-500">{{ m.phone || 'Tanpa No HP' }}</div>
          </div>
          <span class="text-xs font-black self-center bg-zinc-900 text-white px-3 py-1.5 rounded-xl">Pilih</span>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script setup>
import { onMounted } from 'vue'
import { X } from 'lucide-vue-next'
import { useProductsDigital } from '../composables/useProductsDigital.js'
import { formatRp, formatRibuan, toNumber } from '../utils/formatters/currency.js'

const { 
  form, estimasiKas, loading, selectedMember, memberQ, 
  showMemberPicker, filteredMembers, loadMembers, selectMember, saveTransaction 
} = useProductsDigital()

onMounted(() => {
  loadMembers()
})
</script>
