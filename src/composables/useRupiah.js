/*
import { computed } from 'vue'
import { formatRp, formatRibuan, toNumber } from '../utils/formatters/currency.js'

export function useRupiah(fieldRef, withPrefix = true) {
  const display = computed(() => {
    return withPrefix ? formatRp(fieldRef.value) : formatRibuan(fieldRef.value)
  })

  const onInput = (e) => {
    const raw = toNumber(e.target.value)
    fieldRef.value = raw
    // paksa tampil Rp di input nya langsung
    e.target.value = withPrefix ? formatRp(raw) : formatRibuan(raw)
  }

  return { display, onInput, toNumber, formatRp, formatRibuan }
}
*/