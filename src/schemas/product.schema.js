import * as z from 'zod'

export const productSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 huruf'),
  code: z.string().optional(),
  category: z.string().default('Umum'),
  unit: z.string().min(1, 'Satuan wajib dipilih'), // Validasi wajib diisi
  purchasePackName: z.string().optional(),
  packPrice: z.coerce.number().optional().default(0),
  packQty: z.coerce.number().optional().default(0),
  price_modal: z.coerce.number().min(1, 'Modal/pcs wajib'),
  price_sell: z.coerce.number().min(1, 'Harga jual wajib'),
  qty: z.coerce.number().min(0).default(0),
  minStock: z.coerce.number().min(1).default(5)
})
