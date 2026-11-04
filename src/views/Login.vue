<template>
<div class="min-h-screen bg-zinc-900 text-white flex items-center justify-center p-4 font-sans">
  <div class="w-full max-w-sm bg-zinc-800 border border-zinc-700/60 p-6 rounded-[2.5rem] shadow-2xl flex flex-col gap-5">

    <!-- Header -->
    <div class="text-center space-y-1">
      <div class="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-2 font-black text-xl">
        SP
      </div>
      <h1 class="font-black text-xl tracking-tight">Sinar Pagi POS</h1>
      <p class="text-xs text-zinc-400">Pilih akun operator untuk memulai shift</p>
    </div>

    <!-- Pilihan Operator -->
    <div class="space-y-3">
      <div>
        <label class="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 block">Pilih Operator</label>
        <select
          v-model="selectedOperatorId"
          @change="pin = ''; showNumpad = false"
          class="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-2xl text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="" disabled>-- Pilih Operator --</option>
          <option v-for="op in operatorStore.operators" :key="op.id" :value="op.id">
            {{ op.name }} ({{ op.role }})
          </option>
        </select>
      </div>

      <!-- Input PIN dengan Numpad Custom -->
      <div v-if="activeSelectedOperator?.pin">
        <label class="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 block">PIN Otorisasi</label>
        <input
          :value="'•'.repeat(pin.length)"
          readonly
          placeholder="••••"
          @click="showNumpad = true"
          @focus="showNumpad = true"
          class="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-2xl text-center text-lg font-black tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
        />
        <Numpad
          v-if="showNumpad"
          v-model="pin"
          :max-length="6"
          @submit="handleLogin"
          @close="showNumpad = false"
        />
      </div>
    </div>

    <!-- Button Submit -->
    <button
      v-if="!showNumpad"
      @click="handleLogin"
      :disabled="!selectedOperatorId || loading"
      class="w-full py-4 bg-white hover:bg-zinc-100 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-900 font-black text-xs rounded-2xl transition active:scale-95 shadow-lg mt-2"
    >
      {{ loading ? 'VERIFIKASI...' : 'MASUK SHIFT' }}
    </button>
  </div>
</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useOperatorStore } from '../stores/operatorStore.js'
import { pullAllFromCloud } from '../services/syncService.js'
import { toast } from 'vue-sonner'
import Numpad from '../components/Numpad.vue'

const router = useRouter()
const operatorStore = useOperatorStore()

const selectedOperatorId = ref('')
const pin = ref('')
const loading = ref(false)
const showNumpad = ref(false)

const activeSelectedOperator = computed(() => {
  return operatorStore.operators.find(o => o.id === selectedOperatorId.value)
})

const loadOperators = async () => {
  await operatorStore.loadOperators()
  
  // Jika habis clear cache dan operator di IndexedDB kosong, otomatis tarik master dari Supabase
  if (operatorStore.operators.length === 0) {
    try {
      await pullAllFromCloud()
      await operatorStore.loadOperators()
    } catch (e) {
      console.warn('[Login] Gagal auto pull dari cloud:', e)
    }
  }

  if (operatorStore.operators.length > 0) {
    selectedOperatorId.value = operatorStore.operators[0].id
  }
}

const handleLogin = async () => {
  if (!selectedOperatorId.value) return
  loading.value = true
  try {
    await operatorStore.login(selectedOperatorId.value, pin.value)
    toast.success(`Selamat bertugas, ${operatorStore.operatorName}!`)
    router.push('/kasir')
  } catch (err) {
    toast.error(err.message)
    pin.value = ''
  } finally {
    loading.value = false
  }
}

onMounted(loadOperators)
</script>
