<!-- src/views/Expenses.vue -->
<template>
<div class="flex-1 overflow-auto p-4 pb-28 space-y-4 font-sans">
  <!-- Header Title & Action -->
  <div class="flex justify-between items-center">
    <div>
      <h1 class="font-black text-xl text-zinc-900">Pengeluaran Operasional</h1>
      <p class="text-xs text-zinc-400">Pencatatan beban usaha & pengeluaran kas</p>
    </div>

    <button 
      @click="openModal" 
      class="bg-zinc-900 text-white px-3.5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 active:scale-95 transition shadow-sm"
    >
      <Plus class="w-4 h-4" /> Catat Beban
    </button>
  </div>

  <!-- Cards Ringkasan Total -->
  <div class="grid grid-cols-2 gap-3">
    <div class="bg-white border border-zinc-100 p-4 rounded-3xl shadow-sm">
      <div class="flex items-center gap-2 mb-1">
        <div class="w-7 h-7 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
          <Receipt class="w-4 h-4" />
        </div>
        <span class="text-[10px] font-black text-zinc-400 uppercase">Hari Ini</span>
      </div>
      <div class="text-lg font-black text-zinc-900 mt-1">Rp {{ formatRibuan(totalHariIni) }}</div>
    </div>

    <div class="bg-red-500 text-white p-4 rounded-3xl shadow-md">
      <div class="flex items-center gap-2 mb-1">
        <div class="w-7 h-7 bg-white/20 text-white rounded-xl flex items-center justify-center">
          <TrendingDown class="w-4 h-4" />
        </div>
        <span class="text-[10px] font-black text-white/80 uppercase">Bulan Ini</span>
      </div>
      <div class="text-lg font-black text-white mt-1">Rp {{ formatRibuan(totalBulanIni) }}</div>
    </div>
  </div>

  <!-- Filter & Search Bar -->
  <div class="space-y-2">
    <div class="relative">
      <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
      <input 
        v-model="searchQuery" 
        placeholder="Cari beban, plastik, listrik..." 
        class="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-zinc-900 shadow-sm"
      />
    </div>

    <!-- Dropdown / Horizontal Scroll Category Filter -->
    <div class="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      <button 
        @click="selectedCategory = 'ALL'"
        :class="[
          'px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition',
          selectedCategory === 'ALL' ? 'bg-zinc-900 text-white shadow-sm' : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
        ]"
      >
        Semua
      </button>
      <button 
        v-for="cat in categoryOptions" 
        :key="cat"
        @click="selectedCategory = cat"
        :class="[
          'px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition',
          selectedCategory === cat ? 'bg-zinc-900 text-white shadow-sm' : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
        ]"
      >
        {{ cat }}
      </button>
    </div>
  </div>

  <!-- Empty State -->
  <div v-if="filteredExpenses.length === 0" class="py-16 text-center text-zinc-400 text-xs bg-white rounded-3xl border border-zinc-100 p-6">
    <Receipt class="w-10 h-10 text-zinc-300 mx-auto mb-2" />
    <div class="font-bold text-zinc-500 text-sm">Belum Ada Pengeluaran</div>
    <p class="text-[11px] text-zinc-400 mt-1">Klik "+ Catat Beban" untuk menambahkan pengeluaran operasional baru</p>
  </div>

  <!-- Daftar Pengeluaran -->
  <div v-else class="space-y-2.5">
    <div 
      v-for="e in filteredExpenses" 
      :key="e.id"
      class="bg-white p-4 rounded-3xl border border-zinc-100 shadow-sm flex items-center justify-between gap-3"
    >
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <span class="font-bold text-sm text-zinc-900 truncate">{{ e.note || e.category }}</span>
          <span class="px-2 py-0.5 bg-red-50 text-red-600 border border-red-100 rounded-md text-[9px] font-black uppercase shrink-0">
            {{ e.category }}
          </span>
        </div>
        <div class="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-2">
          <span>{{ formatDate(e.date) }}</span>
          <span>•</span>
          <span class="font-bold text-zinc-600">via {{ e.paymentMethod === 'QRIS' ? 'Bank/QRIS' : 'Kas Laci' }}</span>
        </div>
      </div>

      <div class="flex items-center gap-3 shrink-0">
        <div class="text-right">
          <div class="font-black text-sm text-red-600">-Rp {{ formatRibuan(e.amount) }}</div>
        </div>
        <button 
          @click="deleteExpense(e)" 
          class="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>

  <!-- Modal Form Tambah Pengeluaran -->
  <div v-if="showModal" class="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
    <div class="w-full max-w-md bg-white rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-xl animate-in slide-in-from-bottom duration-200">
      <div class="flex justify-between items-center mb-4">
        <div>
          <h2 class="font-black text-base text-zinc-900">Catat Pengeluaran Operasional</h2>
          <p class="text-xs text-zinc-400">Saldo kas/bank akan otomatis terpotong</p>
        </div>
        <button @click="closeModal" class="p-2 bg-zinc-100 rounded-xl"><X class="w-4 h-4" /></button>
      </div>

      <form @submit.prevent="saveExpense" class="space-y-3.5">
        <div>
          <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Kategori Beban *</label>
          <select v-model="form.category" class="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold">
            <option v-for="cat in categoryOptions" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <div>
          <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Nominal Pengeluaran *</label>
          <input 
            :value="formatRp(form.amount)" 
            @input="e => form.amount = toNumber(e.target.value)" 
            type="text" 
            inputmode="numeric" 
            placeholder="Rp 0" 
            required
            class="w-full px-4 py-3 bg-red-50/50 border border-red-200 rounded-xl text-lg font-black text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500" 
          />
        </div>

        <div>
          <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Sumber Pembayaran *</label>
          <div class="grid grid-cols-2 gap-2">
            <button 
              type="button"
              @click="form.paymentMethod = 'CASH'" 
              :class="['py-2.5 rounded-xl text-xs font-bold border transition', form.paymentMethod === 'CASH' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-zinc-50 border-zinc-200 text-zinc-600']"
            >
              Kas Laci (Tunai)
            </button>
            <button 
              type="button"
              @click="form.paymentMethod = 'QRIS'" 
              :class="['py-2.5 rounded-xl text-xs font-bold border transition', form.paymentMethod === 'QRIS' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-zinc-50 border-zinc-200 text-zinc-600']"
            >
              Bank / QRIS
            </button>
          </div>
        </div>

        <div>
          <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Catatan / Keterangan</label>
          <input 
            v-model="form.note" 
            placeholder="Misal: Beli kantong plastik 10 pack" 
            class="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold" 
          />
        </div>

        <div class="flex gap-2 pt-2">
          <button type="button" @click="closeModal" class="flex-1 py-3 bg-zinc-100 font-bold text-xs rounded-xl">Batal</button>
          <button type="submit" :disabled="loading" class="flex-1 py-3 bg-zinc-900 disabled:bg-zinc-400 text-white font-bold text-xs rounded-xl shadow-md">Simpan & Potong Kas</button>
        </div>
      </form>
    </div>
  </div>
</div>
</template>

<script setup>
import { onMounted, onActivated } from 'vue'
import { Plus, Search, Trash2, X, Receipt, TrendingDown } from 'lucide-vue-next'
import { useExpenses } from '../composables/useExpenses.js'
import { formatRibuan, formatRp, toNumber } from '../utils/formatters/currency.js'

const {
  searchQuery,
  selectedCategory,
  loading,
  showModal,
  form,
  categoryOptions,
  filteredExpenses,
  totalHariIni,
  totalBulanIni,
  loadExpenses,
  openModal,
  closeModal,
  saveExpense,
  deleteExpense,
  formatDate
} = useExpenses()

onMounted(loadExpenses)
onActivated(loadExpenses)
</script>
