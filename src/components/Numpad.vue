<script setup>
const props = defineProps({
  modelValue: { type: String, default: '' },
  maxLength: { type: Number, default: 6 }
})

const emit = defineEmits(['update:modelValue', 'submit', 'close'])

function onPress(num) {
  if (props.modelValue.length < props.maxLength) {
    emit('update:modelValue', props.modelValue + num)
  }
}
function onDelete() {
  emit('update:modelValue', props.modelValue.slice(0, -1))
}
function onClear() {
  emit('update:modelValue', '')
}
</script>

<template>
  <div class="mt-4 animate-in slide-in-from-bottom-2 duration-200">
    <div class="grid grid-cols-3 gap-3">
      <button v-for="n in 9" :key="n" type="button" @click="onPress(String(n))" class="h-[56px] bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl text-xl font-black active:scale-95 transition">
        {{ n }}
      </button>
      <button type="button" @click="onClear" class="h-[56px] bg-zinc-800 text-zinc-400 rounded-2xl text-[11px] font-black tracking-widest active:scale-95">CLEAR</button>
      <button type="button" @click="onPress('0')" class="h-[56px] bg-zinc-800 text-white rounded-2xl text-xl font-black active:scale-95">0</button>
      <button type="button" @click="onDelete" class="h-[56px] bg-zinc-800 text-amber-400 rounded-2xl font-bold active:scale-95">⌫</button>
    </div>
    <button type="button" @click="emit('submit')" class="w-full mt-3 h-12 bg-amber-500 hover:bg-amber-400 text-black rounded-2xl font-black text-xs tracking-widest active:scale-95 transition">MASUK SHIFT</button>
    <button type="button" @click="emit('close')" class="w-full mt-2 text-[10px] font-bold text-zinc-500">Tutup Numpad</button>
  </div>
</template>