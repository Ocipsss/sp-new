<script setup>
import { LogOut } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useOperatorStore } from '../stores/operatorStore.js'

const props = defineProps({ groups: Array, activePage: String })
const emit = defineEmits(['select-page', 'close'])

const router = useRouter()
const operatorStore = useOperatorStore()

const handleItemClick = (item) => {
  emit('select-page', item)
  if (item.to) {
    router.push(item.to)
  }
}

const handleLogout = () => {
  if (confirm('Akhiri shift & keluar dari akun operator ini?')) {
    operatorStore.logout()
    router.push('/login')
  }
}
</script>

<template>
<div class="h-full bg-zinc-900 text-white flex flex-col overflow-hidden">
  <!-- Header App & Operator Active -->
  <div class="p-6 md:p-7 pb-4 shrink-0 space-y-3 md:space-y-4">
    <div class="flex justify-between items-center">
      <span class="font-black text-lg md:text-xl tracking-tight">SINAR PAGI</span>
    </div>

    <!-- Info Operator Aktif & Tombol Switch Shift -->
    <div class="bg-zinc-800/80 p-3 md:p-4 rounded-2xl border border-zinc-700/50 flex items-center justify-between">
      <div class="min-w-0 flex-1 pr-2">
        <div class="text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-wider">Shift Aktif</div>
        <div class="font-bold text-xs md:text-sm text-white truncate">{{ operatorStore.operatorName }}</div>
      </div>
      <button 
        @click="handleLogout" 
        title="Ganti Operator / Keluar Shift"
        class="px-2.5 py-1.5 md:px-3 md:py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-bold text-[10px] md:text-xs flex items-center gap-1 md:gap-1.5 active:scale-95 transition shrink-0"
      >
        <LogOut class="w-3 h-3 md:w-4 md:h-4" /> Shift
      </button>
    </div>
  </div>

  <!-- Area Menu Scroll -->
  <div class="flex-1 overflow-y-auto px-6 md:px-7 py-2 space-y-6 md:space-y-7">
    <div v-for="group in groups" :key="group.title">
      <div class="text-[10px] md:text-xs font-black tracking-widest text-zinc-500 uppercase mb-3">
        {{ group.title }}
      </div>
      <ul class="flex flex-col gap-1 md:gap-1.5">
        <li 
          v-for="m in group.items" 
          :key="m.name" 
          @click="handleItemClick(m)"
          :class="[
            'px-4 py-3 md:px-5 md:py-3.5 rounded-2xl text-sm md:text-base font-bold flex items-center gap-3 md:gap-3.5 cursor-pointer transition active:scale-95', 
            activePage === m.name ? 'bg-white text-zinc-900 shadow-md' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
          ]"
        >
          <component :is="m.icon" class="w-4 h-4 md:w-5 md:h-5 shrink-0"/> 
          <span>{{ m.name }}</span>
        </li>
      </ul>
    </div>
  </div>

  <div class="shrink-0 p-6 md:p-7 pt-4 border-t border-zinc-800 text-[10px] md:text-xs text-zinc-500 font-bold">
    Sinar Pagi v1.2 FIXED
  </div>
</div>
</template>
