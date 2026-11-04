<template>
  <div class="flex-1 overflow-auto p-4 pb-24">
    <!-- Header -->
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="font-black text-xl">Daftar Member</h1>
        <p class="text-xs text-zinc-400">Total {{ members.length }} pelanggan terdaftar</p>
      </div>
      <button 
        @click="openModal()" 
        class="bg-zinc-900 text-white px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 active:scale-95 transition"
      >
        <UserPlus class="w-4 h-4" /> Tambah
      </button>
    </div>

    <!-- Search Input -->
    <div class="relative mb-4">
      <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
      <input 
        v-model="searchQuery" 
        placeholder="Cari nama / nomor HP..." 
        class="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-zinc-900 shadow-sm"
      />
    </div>

    <!-- Empty State -->
    <div v-if="filteredMembers.length === 0" class="py-12 text-center text-zinc-400 text-xs">
      Belum ada member ditemukan
    </div>

    <!-- Member Cards -->
    <div v-else class="space-y-3">
      <div 
        v-for="m in filteredMembers" 
        :key="m.id" 
        class="p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm flex flex-col gap-3"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-zinc-900 text-white rounded-xl flex items-center justify-center font-black text-sm shrink-0">
              {{ m.name.charAt(0).toUpperCase() }}
            </div>
            <div>
              <div class="font-bold text-sm text-zinc-900">{{ m.name }}</div>
              <div class="text-xs text-zinc-400">{{ m.phone || 'Tanpa No HP' }}</div>
            </div>
          </div>

          <div class="flex items-center gap-1">
            <button @click="openModal(m)" class="p-2 text-zinc-600 hover:bg-zinc-100 rounded-xl transition">
              <Pencil class="w-4 h-4" />
            </button>
            <button @click="deleteMember(m)" class="p-2 text-red-500 hover:bg-red-50 rounded-xl transition">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Detail Poin, Total Belanja & Utang -->
        <div class="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-100 text-center">
          <div class="bg-amber-50 p-2 rounded-xl border border-amber-100">
            <div class="text-[9px] font-black text-amber-600 uppercase">Poin Member</div>
            <div class="text-xs font-black text-amber-700 mt-0.5">{{ formatRibuan(m.points || 0) }} pts</div>
          </div>

          <div class="bg-zinc-50 p-2 rounded-xl border border-zinc-100">
            <div class="text-[9px] font-black text-zinc-400 uppercase">Total Belanja</div>
            <div class="text-xs font-black text-zinc-900 mt-0.5">Rp {{ formatRibuan(m.total_spending || 0) }}</div>
          </div>

          <div :class="['p-2 rounded-xl border', (m.debt || 0) > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100']">
            <div :class="['text-[9px] font-black uppercase', (m.debt || 0) > 0 ? 'text-red-500' : 'text-emerald-600']">Utang / Piutang</div>
            <div :class="['text-xs font-black mt-0.5', (m.debt || 0) > 0 ? 'text-red-600' : 'text-emerald-700']">
              Rp {{ formatRibuan(m.debt || 0) }}
            </div>
          </div>
        </div>

        <!-- Tombol Bayar Utang -->
        <button 
          v-if="(m.debt || 0) > 0" 
          @click="openPayModal(m)"
          class="w-full py-2.5 bg-red-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition mt-1"
        >
          <CreditCard class="w-4 h-4" /> Bayar / Cicil Utang
        </button>
      </div>
    </div>

    <!-- Modal Form (Tambah / Edit Member) -->
    <div v-if="showModal" class="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div class="w-full max-w-md bg-white rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-xl animate-in slide-in-from-bottom duration-200">
        <div class="flex justify-between items-center mb-4">
          <h2 class="font-black text-base">{{ editingId ? 'Edit Member' : 'Tambah Member Baru' }}</h2>
          <button @click="showModal = false" class="p-2 bg-zinc-100 rounded-xl"><X class="w-4 h-4" /></button>
        </div>

        <form @submit.prevent="saveMember" class="space-y-3">
          <div>
            <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Nama Lengkap *</label>
            <input 
              v-model="form.name" 
              required 
              placeholder="CONTOH: BUDI SANTOSO" 
              class="w-full px-4 py-3 bg-zinc-50 border rounded-xl text-sm font-bold uppercase" 
            />
          </div>

          <div>
            <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">No. Telepon / WA</label>
            <input v-model="form.phone" type="tel" placeholder="081234567890" class="w-full px-4 py-3 bg-zinc-50 border rounded-xl text-sm font-bold" />
          </div>

          <div>
            <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Alamat</label>
            <textarea 
              v-model="form.address" 
              rows="2" 
              placeholder="Alamat rumah / toko" 
              class="w-full px-4 py-3 bg-zinc-50 border rounded-xl text-sm font-bold uppercase"
            ></textarea>
          </div>

          <div class="flex gap-2 pt-2">
            <button type="button" @click="showModal = false" class="flex-1 py-3 bg-zinc-100 font-bold text-xs rounded-xl">Batal</button>
            <button type="submit" class="flex-1 py-3 bg-zinc-900 text-white font-bold text-xs rounded-xl shadow-md">{{ editingId ? 'Simpan' : 'Tambah' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Bayar Utang -->
    <div v-if="showPayModal" class="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div class="w-full max-w-md bg-white rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-xl animate-in slide-in-from-bottom duration-200">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h2 class="font-black text-base">Pembayaran Utang</h2>
            <p class="text-xs text-zinc-400">{{ selectedMemberForPay?.name }}</p>
          </div>
          <button @click="showPayModal = false" class="p-2 bg-zinc-100 rounded-xl"><X class="w-4 h-4" /></button>
        </div>

        <div class="bg-red-50 border border-red-100 p-3 rounded-xl mb-4">
          <div class="text-[10px] text-red-500 font-black uppercase">Sisa Utang Saat Ini</div>
          <div class="text-lg font-black text-red-600 mt-0.5">Rp {{ formatRibuan(selectedMemberForPay?.debt || 0) }}</div>
        </div>

        <form @submit.prevent="submitPayDebt" class="space-y-3">
          <!-- Pilihan Metode Pembayaran (CASH / QRIS) -->
          <div>
            <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Metode Pembayaran</label>
            <div class="grid grid-cols-2 gap-2">
              <button 
                type="button"
                @click="paymentMethod = 'CASH'" 
                :class="['py-2.5 rounded-xl text-xs font-bold border transition', paymentMethod === 'CASH' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-zinc-50 border-zinc-200 text-zinc-600']"
              >
                Tunai (CASH)
              </button>
              <button 
                type="button"
                @click="paymentMethod = 'QRIS'" 
                :class="['py-2.5 rounded-xl text-xs font-bold border transition', paymentMethod === 'QRIS' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-zinc-50 border-zinc-200 text-zinc-600']"
              >
                QRIS / Bank
              </button>
            </div>
          </div>

          <div>
            <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Nominal Bayar *</label>
            <input 
              :value="formatRp(payAmount)" 
              @input="e => payAmount = toNumber(e.target.value)"
              type="text" 
              inputmode="numeric" 
              placeholder="Rp 0" 
              required 
              class="w-full px-4 py-3 bg-zinc-50 border rounded-xl text-lg font-black text-zinc-900"
            />
          </div>

          <button 
            type="button" 
            @click="payAmount = selectedMemberForPay?.debt || 0" 
            class="w-full py-2 bg-zinc-100 border text-zinc-700 rounded-xl text-xs font-bold"
          >
            Pelunasan Total (Rp {{ formatRibuan(selectedMemberForPay?.debt || 0) }})
          </button>

          <div class="flex gap-2 pt-2">
            <button type="button" @click="showPayModal = false" class="flex-1 py-3 bg-zinc-100 font-bold text-xs rounded-xl">Batal</button>
            <button type="submit" :disabled="payAmount <= 0" class="flex-1 py-3 bg-zinc-900 disabled:bg-zinc-300 text-white font-bold text-xs rounded-xl shadow-md">
              Proses Bayar ({{ paymentMethod }})
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { UserPlus, Search, Pencil, Trash2, X, CreditCard } from 'lucide-vue-next'
import { formatRibuan, formatRp, toNumber } from '../utils/formatters/currency.js'
import { useMembers } from '../composables/useMembers.js'

const {
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
} = useMembers()

onMounted(() => {
  loadMembers()
})
</script>
