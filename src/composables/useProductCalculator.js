/*
import { computed } from 'vue'
import { calcModalDariPack, calcMargin } from '../utils/calculator/product.js'

export function useProductCalculator(packPriceRef, packQtyRef, priceSellRef = { value: 0 }) {
  const modalPerPcs = computed(() =>
    calcModalDariPack(packPriceRef.value, packQtyRef.value)
  )
  const marginPersen = computed(() =>
    calcMargin(priceSellRef.value, modalPerPcs.value)
  )
  return { modalPerPcs, marginPersen }
}
*/