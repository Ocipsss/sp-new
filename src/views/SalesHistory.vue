<template>
  <div class="flex-1 overflow-auto p-4 pb-28 space-y-5 font-sans">
    
    <!-- HEADER & AKSI -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="font-black text-xl text-zinc-900 tracking-tight">Riwayat Penjualan</h1>
        <p class="text-xs text-zinc-400 font-medium mt-0.5">
          Menampilkan <span class="font-bold text-zinc-700">{{ filteredTransactions.length }}</span> transaksi
        </p>
      </div>
    </div>

    <!-- METRICS RINGKASAN BUKU KAS (3 KOLOM MODERN) -->
    <div class="grid grid-cols-2 md:grid-cols-3 gap-2.5">
      <!-- Total Arus Kas -->
      <div class="bg-gradient-to-br from-zinc-900 to-zinc-800 text-white p-3.5 rounded-2xl shadow-md flex flex-col justify-between">
        <div class="flex justify-between items-center text-zinc-400">
          <span class="text-[10px] font-black uppercase tracking-wider">Total Omzet</span>
          <Wallet class="w-4 h-4 text-amber-400" />
        </div>
        <div class="text-base md:text-lg font-black mt-2 tracking-tight">
          Rp {{ formatRibuan(totalOmzet) }}
        </div>
      </div>

      <!-- Sisa Piutang TEMPO -->
      <div class="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-2xl shadow-xs flex flex-col justify-between">
        <div class="flex justify-between items-center text-amber-700">
          <span class="text-[10px] font-black uppercase tracking-wider">Piutang TEMPO</span>
          <Clock class="w-4 h-4 text-amber-600" />
        </div>
        <div class="text-base md:text-lg font-black text-amber-700 mt-2 tracking-tight">
          Rp {{ formatRibuan(totalPiutang) }}
        </div>
      </div>

      <!-- Transaksi Sukses / Transaksi Void -->
      <div class="col-span-2 md:col-span-1 bg-white border border-zinc-200/80 p-3.5 rounded-2xl shadow-xs flex flex-col justify-between">
        <div class="flex justify-between items-center text-zinc-400">
          <span class="text-[10px] font-black uppercase tracking-wider">Status Transaksi</span>
          <CheckCircle2 class="w-4 h-4 text-emerald-500" />
        </div>
        <div class="flex items-center justify-between mt-2">
          <div class="text-xs font-bold text-zinc-800">
            <span class="text-emerald-600 font-black text-sm">{{ countSuccessTrx }}</span> Berhasil
          </div>
          <div class="text-xs font-bold text-zinc-400">
            <span class="text-red-500 font-black text-sm">{{ countVoidTrx }}</span> Batal
          </div>
        </div>
      </div>
    </div>

    <!-- FILTER & PENCARIAN -->
    <div class="space-y-2.5">
      <!-- Search Bar -->
      <div class="relative">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input 
          v-model="searchQuery" 
          placeholder="Cari ID nota, nama member, atau produk..." 
          class="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-zinc-900 shadow-xs transition"
        />
        <button 
          v-if="searchQuery" 
          @click="searchQuery = ''"
          class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Filter Chips -->
      <div class="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button 
          v-for="f in filterOptions" 
          :key="f.value"
          @click="selectedFilter = f.value"
          :class="[
            'px-4 py-2 rounded-xl text-xs font-black shrink-0 transition-all select-none active:scale-95',
            selectedFilter === f.value 
              ? 'bg-zinc-900 text-white shadow-sm' 
              : 'bg-white text-zinc-600 border border-zinc-200/80 hover:bg-zinc-100'
          ]"
        >
          {{ f.label }}
        </button>
      </div>
    </div>

    <!-- EMPTY STATE -->
    <div v-if="filteredTransactions.length === 0" class="py-16 text-center bg-white rounded-3xl border border-zinc-200/60 shadow-xs p-6 space-y-2">
      <div class="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto text-zinc-400">
        <Receipt class="w-6 h-6" />
      </div>
      <div class="font-bold text-sm text-zinc-800">Tidak ada riwayat penjualan</div>
      <p class="text-xs text-zinc-400 max-w-xs mx-auto">Coba ubah kata kunci pencarian atau ganti kategori filter di atas.</p>
    </div>

    <!-- LIST KARTU TRANSAKSI -->
    <div v-else class="space-y-3">
      <div 
        v-for="t in filteredTransactions" 
        :key="t.id"
        @click="selectedTransaction = t"
        :class="[
          'bg-white p-4 rounded-2xl border transition-all duration-150 cursor-pointer flex flex-col gap-3 group hover:border-zinc-300 active:scale-[0.99]',
          isVoid(t) ? 'border-red-200 bg-red-50/20 opacity-75' : 'border-zinc-200/70 shadow-xs'
        ]"
      >
        <!-- Header Kartu: Member & Badge Metode -->
        <div class="flex justify-between items-start gap-2">
          <div class="min-w-0 flex-1">
            <div class="font-black text-xs text-zinc-900 flex items-center gap-2 truncate">
              <span :class="isVoid(t) && 'line-through text-zinc-400'">{{ t.memberName || 'Pelanggan Umum' }}</span>
              
              <!-- Tag Jenis Transaksi -->
              <span 
                :class="t.trxType === 'DIGITAL' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-zinc-100 text-zinc-600 border-zinc-200'"
                class="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border shrink-0"
              >
                {{ t.trxType }}
              </span>

              <!-- Tag Status VOID -->
              <span v-if="isVoid(t)" class="bg-red-600 text-white px-2 py-0.5 rounded-md text-[9px] font-black uppercase shrink-0">
                VOID
              </span>
            </div>

            <!-- Tanggal & ID Nota -->
            <div class="text-[10px] text-zinc-400 font-medium mt-1 flex items-center gap-2">
              <span class="flex items-center gap-1"><Calendar class="w-3 h-3 text-zinc-400" /> {{ formatDate(t.date) }}</span>
              <span>•</span>
              <span class="font-mono text-zinc-400">#{{ t.id.slice(0, 8) }}</span>
            </div>
          </div>

          <!-- Badge Metode Pembayaran -->
          <div :class="[
            'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0 flex items-center gap-1.5',
            isVoid(t) ? 'bg-red-100 border-red-200 text-red-600' :
            t.paymentMethod === 'TEMPO' ? 'bg-amber-100 border-amber-200 text-amber-800' :
            t.paymentMethod === 'QRIS' ? 'bg-blue-100 border-blue-200 text-blue-700' : 'bg-emerald-100 border-emerald-200 text-emerald-800'
          ]">
            <component :is="getPaymentIcon(t.paymentMethod)" class="w-3 h-3" />
            <span>{{ isVoid(t) ? 'BATAL' : t.paymentMethod }}</span>
          </div>
        </div>

        <!-- Preview Isi Barang Nota -->
        <div class="bg-zinc-50/80 p-2.5 rounded-xl border border-zinc-100 text-xs text-zinc-600 font-medium flex justify-between items-center">
          <div class="truncate pr-2">
            <template v-if="t.trxType === 'DIGITAL'">
              <span class="font-bold text-zinc-800">{{ t.digitalType === 'topup' ? 'Top Up Digital' : 'Tarik Tunai' }}</span> 
              • Admin: Rp {{ formatRibuan(t.adminFee) }}
            </template>
            <template v-else>
              <span class="text-zinc-700 font-semibold truncate">{{ getItemPreview(t) }}</span>
            </template>
          </div>
          <span class="text-[10px] font-black text-zinc-400 shrink-0 uppercase">{{ t.items?.length || 0 }} ITEM</span>
        </div>

        <!-- Footer Kartu: Total Harga & Aksi Cepat Cetak -->
        <div class="flex justify-between items-center pt-1 border-t border-zinc-100/80">
          <div class="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
            {{ t.trxType === 'DIGITAL' ? 'Arus Kas Fisik' : 'Total Bayar' }}
          </div>

          <div class="flex items-center gap-3">
            <div :class="['text-sm font-black tracking-tight', isVoid(t) ? 'line-through text-zinc-400' : t.total < 0 ? 'text-red-500' : 'text-zinc-900']">
              {{ t.total < 0 ? '-' : '' }}Rp {{ formatRibuan(Math.abs(t.total)) }}
            </div>

            <!-- Shortcut Cetak Nota Cepat -->
            <button 
              @click.stop="quickPrint(t)"
              title="Cetak Nota" 
              class="p-2 bg-zinc-100 hover:bg-zinc-900 hover:text-white text-zinc-600 rounded-xl transition active:scale-90"
            >
              <Printer class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL DETAIL TRANSAKSI MACOS/MOBILE SHEET STYLE -->
    <div v-if="selectedTransaction" class="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div class="w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2rem] p-6 shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        
        <!-- Modal Header -->
        <div class="flex justify-between items-start mb-4 border-b border-zinc-100 pb-3">
          <div>
            <div class="flex items-center gap-2">
              <h2 class="font-black text-base text-zinc-900">
                {{ selectedTransaction.trxType === 'DIGITAL' ? 'Detail Transaksi Digital' : 'Detail Rincian Nota' }}
              </h2>
              <span v-if="isVoid(selectedTransaction)" class="text-[9px] bg-red-600 text-white px-2 py-0.5 rounded font-black uppercase tracking-wider">BATAL</span>
            </div>
            <p class="text-[11px] font-mono text-zinc-400 mt-0.5">ID: {{ selectedTransaction.id }}</p>
          </div>
          <button @click="selectedTransaction = null" class="p-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl transition">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Info Card Ringkas -->
        <div class="bg-zinc-50 p-3.5 rounded-2xl border border-zinc-100 space-y-2 mb-4 text-xs">
          <div class="flex justify-between items-center">
            <span class="text-zinc-500 font-medium">Waktu Transaksi:</span>
            <span class="font-bold text-zinc-800">{{ formatDate(selectedTransaction.date) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-zinc-500 font-medium">Nama Pelanggan:</span>
            <span class="font-bold text-zinc-800">{{ selectedTransaction.memberName || 'Pelanggan Umum' }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-zinc-500 font-medium">Metode Pembayaran:</span>
            <span class="font-black text-zinc-900 uppercase px-2 py-0.5 bg-white border border-zinc-200 rounded-md text-[10px]">
              {{ selectedTransaction.paymentMethod }}
            </span>
          </div>
        </div>

        <!-- Rincian Item / Produk -->
        <div class="flex-1 overflow-auto space-y-2 mb-4 pr-1">
          <div class="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-2">Item Produk</div>
          
          <template v-if="selectedTransaction.trxType === 'DIGITAL'">
            <div class="flex justify-between items-center py-2 border-b border-zinc-100">
              <span class="text-xs font-bold text-zinc-800">Nominal {{ selectedTransaction.digitalType === 'topup' ? 'Top Up' : 'Tarik Tunai' }}</span>
              <span class="font-black text-xs text-zinc-900">Rp {{ formatRibuan(selectedTransaction.nominal) }}</span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-zinc-100">
              <span class="text-xs font-bold text-zinc-800">Biaya Admin (Profit)</span>
              <span class="font-black text-xs text-emerald-600">Rp {{ formatRibuan(selectedTransaction.adminFee) }}</span>
            </div>
          </template>

          <template v-else>
            <div 
              v-for="item in selectedTransaction.items" 
              :key="item.id"
              class="flex justify-between items-center py-2 border-b border-zinc-100 last:border-0"
            >
              <div>
                <div class="font-bold text-xs text-zinc-900">{{ item.productName }}</div>
                <div class="text-[10px] text-zinc-400 font-medium">Rp {{ formatRibuan(item.price) }} x {{ item.qty }}</div>
              </div>
              <div class="font-black text-xs text-zinc-900">
                Rp {{ formatRibuan(item.subtotal || (item.price * item.qty)) }}
              </div>
            </div>
          </template>
        </div>

        <!-- Action Buttons Footer -->
        <div class="border-t border-zinc-100 pt-3 space-y-2.5">
          <div class="flex justify-between items-center mb-1">
            <span class="font-bold text-xs text-zinc-500 uppercase tracking-wider">Total Pembayaran</span>
            <span :class="['font-black text-lg tracking-tight', isVoid(selectedTransaction) ? 'line-through text-zinc-400' : 'text-zinc-900']">
              Rp {{ formatRibuan(Math.abs(selectedTransaction.total)) }}
            </span>
          </div>

          <div class="flex gap-2">
            <!-- Edit di Kasir (Barang Only) -->
            <button 
              v-if="selectedTransaction.trxType === 'BARANG' && !isVoid(selectedTransaction)"
              @click="handleEditInKasir(selectedTransaction)"
              class="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded-xl font-bold text-xs transition active:scale-95 flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Pencil class="w-4 h-4" /> Edit di Kasir
            </button>

            <!-- Cetak Struk -->
            <button 
              @click="showReceiptModal = true"
              class="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition active:scale-95"
            >
              <Printer class="w-4 h-4" /> Cetak Nota
            </button>
          </div>

          <div class="flex gap-2">
            <button 
              v-if="!isVoid(selectedTransaction)"
              @click="handleVoid(selectedTransaction)" 
              :disabled="loading"
              class="flex-1 py-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl font-bold text-xs transition active:scale-95"
            >
              Batalkan (Void)
            </button>
            <button 
              @click="selectedTransaction = null" 
              class="flex-1 py-3 bg-zinc-100 text-zinc-700 rounded-xl font-bold text-xs hover:bg-zinc-200 transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Struk / Reprint Nota -->
    <ReceiptModal 
      v-if="showReceiptModal && selectedTransaction" 
      :transaction="selectedTransaction" 
      @close="handleCloseReceipt" 
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Search, Receipt, Calendar, X, Printer, Pencil, Wallet, Clock, CheckCircle2,
  Banknote, QrCode, BookOpen
} from 'lucide-vue-next'
import { formatRibuan } from '../utils/formatters/currency.js'
import { useSalesHistory } from '../composables/useSalesHistory.js'
import { useKasirStore } from '../stores/kasirStore.js'
import { toast } from 'vue-sonner'
import ReceiptModal from '../components/ReceiptModal.vue'

const router = useRouter()
const kasirStore = useKasirStore()

const {
  searchQuery,
  selectedFilter,
  selectedTransaction,
  loading,
  filterOptions,
  filteredTransactions,
  totalOmzet,
  totalPiutang,
  loadHistory,
  handleVoid,
  formatDate
} = useSalesHistory()

const showReceiptModal = ref(false)

// Pengecekan Transaksi Dibatalkan / Void
const isVoid = (t) => t?.status === 'void' || t?.status === 'CANCELLED'

// Hitung Statistik Transaksi Berhasil & Batal
const countSuccessTrx = computed(() => filteredTransactions.value.filter(t => !isVoid(t)).length)
const countVoidTrx = computed(() => filteredTransactions.value.filter(t => isVoid(t)).length)

// Format Ringkasan Item Produk di Kartu
const getItemPreview = (t) => {
  if (!t.items || t.items.length === 0) return 'Tidak ada detail barang'
  const firstItems = t.items.slice(0, 2).map(i => `${i.productName} (${i.qty}x)`).join(', ')
  const remaining = t.items.length - 2
  return remaining > 0 ? `${firstItems} +${remaining} lainnya` : firstItems
}

// Ikon Metode Pembayaran
const getPaymentIcon = (method) => {
  if (method === 'QRIS') return QrCode
  if (method === 'TEMPO') return BookOpen
  return Banknote
}

// Quick Print langsung dari Kartu
const quickPrint = (transaction) => {
  selectedTransaction.value = transaction
  showReceiptModal.value = true
}

// Lempar Transaksi ke Kasir
const handleEditInKasir = (transaction) => {
  kasirStore.loadTransactionForEdit(transaction)
  toast.info(`Memuat nota #${transaction.id.slice(0, 8)} ke kasir...`)
  router.push('/kasir')
}

const handleCloseReceipt = () => {
  showReceiptModal.value = false
  selectedTransaction.value = null
}

onMounted(() => loadHistory())
onActivated(() => loadHistory())
</script>
