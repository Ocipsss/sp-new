// src/composables/useProductForm.js
import { ref } from 'vue'
import { useForm, useField } from 'vee-validate'
import { productSchema } from '../schemas/product.schema.js'
import { categoryRepo } from '../db/repositories/categoryRepository.js'
import { unitRepo } from '../db/repositories/unitRepository.js'

function toTypedSchema(zodSchema) {
  return {
    parse(values) {
      const r = zodSchema.safeParse(values)
      if (r.success) return {}
      const errs = {}
      r.error.issues.forEach(i => { errs[i.path.join('.')] = i.message })
      return errs
    }
  }
}

export function useProductForm() {
  const categories = ref([])
  const units = ref([])

  const { handleSubmit, errors, isSubmitting } = useForm({
    validationSchema: toTypedSchema(productSchema),
    initialValues: {
      name: '',
      code: '',
      category: 'Umum',
      unit: '',
      purchasePackName: '',
      packPrice: '',
      packQty: '',
      price_modal: '',
      price_sell: '',
      qty: '',
      minStock: 2
    }
  })

  const { value: name } = useField('name')
  const { value: code } = useField('code')
  const { value: category } = useField('category')
  const { value: unit } = useField('unit')
  const { value: purchasePackName } = useField('purchasePackName')
  const { value: packPrice } = useField('packPrice')
  const { value: packQty } = useField('packQty')
  const { value: price_modal } = useField('price_modal')
  const { value: price_sell } = useField('price_sell')
  const { value: qty } = useField('qty')
  const { value: minStock } = useField('minStock')

  const loadCategories = async () => {
    const data = await categoryRepo.getAll()
    categories.value = data.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  }

  const loadUnits = async () => {
    const data = await unitRepo.getAll()
    units.value = data.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  }

  return {
    name,
    code,
    category,
    unit,
    purchasePackName,
    packPrice,
    packQty,
    price_modal,
    price_sell,
    qty,
    minStock,
    categories,
    units,
    loadCategories,
    loadUnits,
    handleSubmit,
    errors,
    isSubmitting
  }
}
