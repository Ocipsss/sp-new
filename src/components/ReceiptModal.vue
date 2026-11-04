<!-- src/components/ReceiptModal.vue -->
<template>
  <div class="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
    <div class="w-full max-w-sm bg-white rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom duration-200">
      
      <!-- Header Dialog -->
      <div class="flex justify-between items-center border-b border-zinc-100 pb-3">
        <div>
          <h2 class="font-black text-base text-zinc-900">Transaksi Selesai</h2>
          <p class="text-xs text-zinc-400">ID: #{{ transaction?.id?.slice(0, 8) }}</p>
        </div>
        <button @click="emit('close')" class="p-2 bg-zinc-100 rounded-xl">
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Ringkasan Struk Nota (Thermal Look) -->
      <div class="bg-zinc-50 border border-zinc-200/60 p-4 rounded-2xl space-y-2 text-xs font-mono">
        <div class="text-center font-bold text-sm text-zinc-800">SINAR PAGI</div>
        
        <!-- Info Kasir & Member -->
        <div class="flex justify-between text-[10px] text-zinc-500 border-b border-zinc-200/60 pb-1.5">
          <span>Kasir: {{ transaction?.operatorName || 'Admin' }}</span>
          <span>Member: {{ transaction?.memberName || 'Umum' }}</span>
        </div>

        <div class="border-b border-dashed border-zinc-300 pb-2 text-[10px] text-zinc-500 text-center">
          {{ formatDate(transaction?.date) }}
        </div>

        <!-- Daftar Item Struk Thermal -->
        <div class="max-h-48 overflow-y-auto space-y-2 my-2 pr-1 border-b border-dashed border-zinc-300 pb-2">
          <div v-for="item in transaction?.items" :key="item.id || item.productId" class="text-[11px] space-y-0.5">
            <div class="font-bold text-zinc-800 break-words leading-tight">
              {{ item.productName || item.name }}
            </div>
            <div class="flex justify-between text-zinc-500 text-[10px]">
              <span>{{ item.qty }}x {{ formatRibuan(item.price) }}</span>
              <span class="font-bold text-zinc-800">Rp {{ formatRibuan(item.subtotal || (item.price * item.qty)) }}</span>
            </div>
          </div>
        </div>

        <!-- Ringkasan Rincian Pembayaran -->
        <div class="pt-1 space-y-1">
          <div class="flex justify-between font-black text-sm text-zinc-900">
            <span>TOTAL</span>
            <span>Rp {{ formatRibuan(transaction?.total) }}</span>
          </div>
          <div class="flex justify-between text-[11px] text-zinc-600">
            <span>METODE BAYAR</span>
            <span class="font-bold uppercase">{{ transaction?.paymentMethod }}</span>
          </div>
          <div v-if="transaction?.paymentMethod === 'CASH'" class="flex justify-between text-[11px] text-zinc-600">
            <span>BAYAR</span>
            <span>Rp {{ formatRibuan(transaction?.amountPaid || transaction?.total) }}</span>
          </div>
          <div v-if="transaction?.paymentMethod === 'CASH'" class="flex justify-between text-[11px] text-emerald-600 font-bold">
            <span>KEMBALI</span>
            <span>Rp {{ formatRibuan(Math.max(0, (transaction?.amountPaid || transaction?.total) - transaction?.total)) }}</span>
          </div>
        </div>
      </div>

      <!-- Tombol Aksi Cetak & Unduh -->
      <div class="space-y-2">
        <button 
          @click="handlePrintBluetooth" 
          :disabled="printing"
          class="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-md"
        >
          <Printer class="w-4 h-4" />
          <span>{{ printing ? 'Menghubungkan Printer...' : 'Cetak Thermal (Bluetooth)' }}</span>
        </button>

        <button 
          @click="handleDownloadPdf" 
          class="w-full py-3.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95"
        >
          <FileText class="w-4 h-4" />
          <span>Unduh Nota (PDF)</span>
        </button>

        <button 
          @click="emit('close')" 
          class="w-full py-3 bg-zinc-100 text-zinc-700 rounded-2xl font-bold text-xs hover:bg-zinc-200 transition"
        >
          Transaksi Baru
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { X, Printer, FileText } from 'lucide-vue-next'
import { receiptService } from '../services/receiptService.js'
import { formatRibuan } from '../utils/formatters/currency.js'
import { toast } from 'vue-sonner'
import dayjs from 'dayjs'

const props = defineProps({
  transaction: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])

const printing = ref(false)

const formatDate = (dateStr) => dateStr ? dayjs(dateStr).format('DD/MM/YYYY • HH:mm') : '-'

const handlePrintBluetooth = async () => {
  printing.value = true
  try {
    await receiptService.printThermal(props.transaction)
    toast.success('Struk berhasil dicetak!')
    emit('close')
  } catch (err) {
    toast.error(`Gagal mencetak: ${err.message}`)
  } finally {
    printing.value = false
  }
}

const handleDownloadPdf = async () => {
  try {
    await receiptService.downloadPdf(props.transaction)
    toast.success('Nota PDF berhasil diunduh!')
    emit('close')
  } catch (err) {
    toast.error(`Gagal mengunduh PDF: ${err.message}`)
  }
}
</script>
