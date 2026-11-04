<template>
<div class="flex-1 overflow-auto p-4 pb-28 space-y-4">
  <!-- Header Title -->
  <div>
    <h1 class="font-black text-xl text-zinc-900">Pengaturan Toko</h1>
    <p class="text-xs text-zinc-400">Kelola identitas nota, printer, dan cadangan data</p>
  </div>

  <!-- Section 1: Profil Toko & Struk -->
  <div class="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm space-y-4">
    <div class="flex items-center gap-2 border-b border-zinc-50 pb-3">
      <Store class="w-5 h-5 text-zinc-900" />
      <span class="font-black text-sm text-zinc-900">Identitas Toko & Struk Nota</span>
    </div>
    <form @submit.prevent="saveSettings" class="space-y-3">
      <div>
        <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Nama Toko / Warung *</label>
        <input v-model="form.storeName" required placeholder="Contoh: SINAR PAGI" class="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-zinc-900 uppercase" />
      </div>
      <div>
        <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Alamat Toko</label>
        <textarea v-model="form.storeAddress" rows="2" placeholder="CIHELEUT JL. TALAS UJUNG NO. 38" class="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-zinc-900"></textarea>
      </div>
      <div>
        <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">No. Telepon / WhatsApp</label>
        <input v-model="form.storePhone" type="tel" placeholder="089516477760" class="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-zinc-900" />
      </div>
      <div>
        <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Pesan Footer Struk</label>
        <textarea v-model="form.receiptFooter" rows="2" placeholder="HATUR NUHUN!" class="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-zinc-900"></textarea>
      </div>
      <button type="submit" :disabled="loading" class="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 text-white rounded-xl font-bold text-xs shadow-md transition active:scale-95">Simpan Profil Toko</button>
    </form>
  </div>

  <!-- Section 2: Sinkronisasi - VERSI FINAL HEMAT -->
  <div class="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm space-y-4">
    <div class="flex items-center gap-2 border-b border-zinc-50 pb-3">
      <Cloud class="w-5 h-5 text-zinc-900" />
      <span class="font-black text-sm text-zinc-900">Sinkronisasi Cloud (Hemat Kuota)</span>
    </div>

    <div class="flex items-center justify-between">
      <div>
        <span class="font-bold text-xs text-zinc-900 block">Mode Online</span>
        <span class="text-[11px] text-zinc-400">Online: {{ syncStatus.isOnline ? 'Ya' : 'Offline' }} | Belum sync: {{ syncStatus.unsyncedCount }}</span>
      </div>
      <label class="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" :checked="syncStatus.isAutoSyncEnabled" @change="handleToggleSync" class="sr-only peer" />
        <div class="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
      </label>
    </div>

    <!-- Tombol Sync Manual - INI YANG IRIT -->
    <div class="grid grid-cols-2 gap-2">
      <button type="button" @click="handlePush" :disabled="syncStatus.isSyncing" class="py-3 bg-zinc-900 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5">
        <UploadCloud class="w-4 h-4" />
        <span>{{ syncStatus.isSyncing ? 'Menyinkron...' : `Push (${syncStatus.unsyncedCount})` }}</span>
      </button>

      <!-- Tombol Tarik Master + Badge Indikator Update -->
      <button 
        type="button" 
        @click="handlePull" 
        :disabled="syncStatus.isSyncing" 
        class="relative py-3 bg-white border border-zinc-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
      >
        <DownloadCloud class="w-4 h-4" />
        <span>Tarik Master</span>

        <!-- Badge Angka Pembaruan (Hanya muncul jika ada update baru) -->
        <span 
          v-if="syncStatus.pendingPullCount > 0" 
          class="absolute -top-2 -right-2 bg-amber-500 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-bounce"
        >
          {{ syncStatus.pendingPullCount }}
        </span>
      </button>
    </div>
    <p class="text-[10px] text-zinc-400">Push = kirim yang berubah aja (irit). Tarik Master = buat pas abis clear cache HP.</p>
  </div>

  <!-- Section 3: Printer -->
  <div class="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm space-y-4">
    <div class="flex items-center gap-2 border-b border-zinc-50 pb-3">
      <Printer class="w-5 h-5 text-zinc-900" />
      <span class="font-black text-sm text-zinc-900">Pengaturan Printer Bluetooth</span>
    </div>
    <div class="space-y-3 text-xs">
      <div>
        <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Ukuran Kertas Thermal (Tombol Fisik Printer)</label>
        <div class="grid grid-cols-2 gap-2">
          <button type="button" @click="form.printerPaperSize = '58mm'" :class="['py-2.5 rounded-xl font-bold border transition', form.printerPaperSize === '58mm' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-zinc-50 border-zinc-200 text-zinc-600']">58 mm (Kecil)</button>
          <button type="button" @click="form.printerPaperSize = '80mm'" :class="['py-2.5 rounded-xl font-bold border transition', form.printerPaperSize === '80mm' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-zinc-50 border-zinc-200 text-zinc-600']">80 mm (Besar)</button>
        </div>
        <p class="text-[10px] text-zinc-400 mt-1">Ini untuk setting tombol fisik di printer bluetooth. 58mm biasanya untuk printer mini portable.</p>
      </div>
    </div>
  </div>

  <!-- Section 4: Backup File Lokal (AMAN) -->
  <div class="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm space-y-4">
    <div class="flex items-center gap-2 border-b border-zinc-50 pb-3">
      <Database class="w-5 h-5 text-zinc-900" />
      <span class="font-black text-sm text-zinc-900">Cadangan File Lokal</span>
    </div>
    <div class="grid grid-cols-2 gap-2">
      <button type="button" @click="exportBackup" class="py-3 bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"><Download class="w-4 h-4" /><span>Unduh JSON</span></button>
      <label class="py-3 border rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 bg-white text-blue-700 border-blue-200 hover:bg-blue-50 cursor-pointer"><Upload class="w-4 h-4" /><span>Impor JSON</span><input type="file" accept=".json" @change="importBackup" class="hidden" /></label>
    </div>
  </div>

  <!-- Section 5: Dev Mode - Khusus pas develop di HP -->
  <div class="bg-amber-50 p-5 rounded-3xl border border-amber-200 shadow-sm space-y-3">
    <div class="flex items-center gap-2 border-b border-amber-200/60 pb-3">
      <HardDrive class="w-5 h-5 text-amber-600" />
      <span class="font-black text-sm text-amber-900">Dev Mode - Clear Cache HP</span>
    </div>
    <p class="text-xs text-amber-800/80">Kalo lu clear cache lewat Pengaturan Situs HP, pake tombol ini biar balik lagi tanpa boros kuota.</p>
    <button type="button" @click="handlePullAll" class="w-full py-3 bg-amber-600 text-white rounded-xl font-bold text-xs">🔄 Tarik Ulang Semua Master dari Cloud</button>
  </div>

  <!-- Section 6: Reset -->
  <div class="bg-red-50 p-5 rounded-3xl border border-red-200/80 shadow-sm space-y-3">
    <div class="flex items-center gap-2 border-b border-red-200/60 pb-3">
      <Trash2 class="w-5 h-5 text-red-600" />
      <span class="font-black text-sm text-red-900">Reset Riwayat Transaksi</span>
    </div>
    <p class="text-xs text-red-700/80">Master produk & stok tidak terhapus.</p>
    <button type="button" @click="resetTransactionsData" :disabled="loading || !isOnline" :class="['w-full py-3 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2', isOnline ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-zinc-300 text-zinc-500']"><Trash2 class="w-4 h-4" /><span>Kosongkan Riwayat</span></button>
  </div>
</div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { liveQuery } from 'dexie'
import { db } from '../db/index.js'
import { Store, Cloud, Printer, Database, Download, Upload, UploadCloud, DownloadCloud, HardDrive, Trash2, Type } from 'lucide-vue-next'
import { useSettings } from '../composables/useSettings.js'
import { 
  syncStatus, 
  syncRealtime, 
  pullAllFromCloud, 
  pullDeltaFromCloud, 
  checkForCloudUpdates 
} from '../services/syncService.js'

const { form, loading, loadSettings, saveSettings, exportBackup, importBackup, resetTransactionsData, convertDataToUppercase } = useSettings()
const isOnline = ref(navigator.onLine)
const updateOnlineState = () => { isOnline.value = navigator.onLine }
const handleToggleSync = (e) => { syncRealtime.toggleAutoSync(e.target.checked) }
const handlePush = async () => { await syncRealtime.pushLocalToCloud() }
const handlePull = async () => { 
  await pullDeltaFromCloud() 
}
const handlePullAll = async () => { await pullAllFromCloud() }

let unsyncedSubscription = null

const TABLES_TO_SYNC = [
  'products',
  'product_packages',
  'categories',
  'services',
  'units',
  'operators',
  'settings'
]

onMounted(() => {
  loadSettings()
  window.addEventListener('online', updateOnlineState)
  window.addEventListener('offline', updateOnlineState)
  checkForCloudUpdates()

  // Real-time observer lokal menggunakan Dexie liveQuery sesuai tabel TABLES_TO_SYNC (0% kuota Firebase)
  unsyncedSubscription = liveQuery(async () => {
    if (!db) return 0
    let total = 0
    for (const tableName of TABLES_TO_SYNC) {
      if (!db[tableName]) continue
      try {
        const count = await db[tableName].where('synced').equals(0).count()
        total += count
      } catch (e) {
        // Abaikan jika indeks synced belum siap di tabel tertentu
      }
    }
    return total
  }).subscribe({
    next: (count) => {
      syncStatus.unsyncedCount = count
    },
    error: (err) => console.warn('[Settings] liveQuery unsynced count error:', err)
  })
})

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineState)
  window.removeEventListener('offline', updateOnlineState)

  if (unsyncedSubscription) {
    unsyncedSubscription.unsubscribe()
  }
})
</script>
