import { productRepo } from '../db/repositories/productRepository.js'

export const productService = {
  async createProduct(formData, modalPerPcs) {
    const exist = formData.code? await productRepo.getByCode(formData.code) : null
    if(exist) throw new Error(`Kode sudah dipakai ${exist.name}`)
    return await productRepo.create({
     ...formData,
      price_modal: modalPerPcs,
      unit: formData.unit || 'pcs',
    })
  }
}