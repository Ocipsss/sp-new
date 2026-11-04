<!-- src/views/Categories.vue -->
<template>
  <div class="flex-1 overflow-auto p-4 pb-24">
    <!-- Header ringkas -->
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="font-black text-xl text-zinc-900">
          {{ activeTab === 'category' ? 'Kategori Barang' : 'Satuan Barang' }}
        </h1>
        <p class="text-xs text-zinc-400">
          {{ activeTab === 'category' ? `Total ${categories.length} kategori` : `Total ${units.length} satuan` }}
        </p>
      </div>
      <button 
        @click="openModal()" 
        class="bg-zinc-900 text-white px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 active:scale-95 transition shadow-sm"
      >
        <Plus class="w-4 h-4" /> Tambah
      </button>
    </div>

    <!-- Tab Navigasi -->
    <div class="flex bg-zinc-100 p-1 rounded-2xl gap-1 mb-4">
      <button 
        @click="activeTab = 'category'" 
        :class="['flex-1 py-2.5 rounded-xl text-xs font-bold transition', activeTab === 'category' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500']"
      >
        Kategori Barang
      </button>
      <button 
        @click="activeTab = 'unit'" 
        :class="['flex-1 py-2.5 rounded-xl text-xs font-bold transition', activeTab === 'unit' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500']"
      >
        Satuan Barang
      </button>
    </div>

    <!-- Input Pencarian -->
    <div class="relative mb-4">
      <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
      <input 
        v-model="searchQuery" 
        :placeholder="activeTab === 'category' ? 'Cari kategori...' : 'Cari satuan...'" 
        class="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-zinc-900 shadow-sm"
      />
    </div>

    <!-- TAB 1: KATEGORI BARANG -->
    <div v-if="activeTab === 'category'">
      <div v-if="filteredCategories.length === 0" class="py-12 text-center text-zinc-400 text-xs bg-white rounded-2xl border border-zinc-100">
        Belum ada kategori
      </div>

      <div v-else class="space-y-2">
        <div 
          v-for="cat in filteredCategories" 
          :key="cat.id" 
          class="p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm flex items-center justify-between"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-zinc-100 text-zinc-900 rounded-xl flex items-center justify-center font-black text-sm">
              {{ cat.name.charAt(0).toUpperCase() }}
            </div>
            <div>
              <div class="font-bold text-sm text-zinc-900">{{ cat.name }}</div>
              <div class="text-[10px] text-zinc-400">ID: {{ cat.id.slice(0, 8) }}...</div>
            </div>
          </div>

          <div class="flex items-center gap-1">
            <button @click="openModal(cat)" class="p-2 text-zinc-600 hover:bg-zinc-100 rounded-xl transition">
              <Pencil class="w-4 h-4" />
            </button>
            <button @click="deleteCategory(cat)" class="p-2 text-red-500 hover:bg-red-50 rounded-xl transition">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: SATUAN BARANG -->
    <div v-if="activeTab === 'unit'">
      <div v-if="filteredUnits.length === 0" class="py-12 text-center text-zinc-400 text-xs bg-white rounded-2xl border border-zinc-100">
        Belum ada satuan kustom
      </div>

      <div v-else class="space-y-2">
        <div 
          v-for="u in filteredUnits" 
          :key="u.id" 
          class="p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm flex items-center justify-between"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl flex items-center justify-center font-black text-xs uppercase">
              {{ u.name.slice(0, 3) }}
            </div>
            <div>
              <div class="font-bold text-sm text-zinc-900">{{ u.name }}</div>
              <div class="text-[10px] text-zinc-400">Satuan Master</div>
            </div>
          </div>

          <div class="flex items-center gap-1">
            <button @click="openModal(u)" class="p-2 text-zinc-600 hover:bg-zinc-100 rounded-xl transition">
              <Pencil class="w-4 h-4" />
            </button>
            <button @click="deleteUnit(u)" class="p-2 text-red-500 hover:bg-red-50 rounded-xl transition">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Form (Tambah / Edit Kategori atau Satuan) -->
    <div v-if="showModal" class="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div class="w-full max-w-md bg-white rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-xl animate-in slide-in-from-bottom duration-200">
        <div class="flex justify-between items-center mb-4">
          <h2 class="font-black text-base">
            {{ editingId ? 'Edit' : 'Tambah' }} {{ activeTab === 'category' ? 'Kategori' : 'Satuan' }} Baru
          </h2>
          <button @click="closeModal" class="p-2 bg-zinc-100 rounded-xl">
            <X class="w-4 h-4" />
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">
              Nama {{ activeTab === 'category' ? 'Kategori' : 'Satuan' }} *
            </label>
            <input 
              v-model="formName" 
              ref="inputRef" 
              :placeholder="activeTab === 'category' ? 'CONTOH: MINUMAN, SEMBAKO...' : 'CONTOH: PCS, BUNGKUS, RENTENG...'" 
              required 
              class="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-zinc-900 uppercase"
            />
          </div>

          <div class="flex gap-2 pt-2">
            <button type="button" @click="closeModal" class="flex-1 py-3 bg-zinc-100 font-bold text-xs rounded-xl">
              Batal
            </button>
            <button type="submit" class="flex-1 py-3 bg-zinc-900 text-white font-bold text-xs rounded-xl shadow-md">
              {{ editingId ? 'Simpan' : 'Tambah' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { Plus, Search, Pencil, Trash2, X } from 'lucide-vue-next'
import { useCategories } from '../composables/useCategories.js'

const {
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
} = useCategories()

onMounted(() => {
  loadCategories()
  loadUnits()
})
</script>
