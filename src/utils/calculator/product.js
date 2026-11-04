import Big from 'big.js'

// Helper buat ubah "12.000" atau "Rp 1.250.000" jadi 12000
const toNumber = (v) => {
  if (typeof v === 'number') return v
  if (!v) return 0
  const cleaned = String(v).replace(/[^0-9]/g, '') // hapus titik, koma, Rp
  return Number(cleaned) || 0
}

export const calcModalDariPack = (packPrice, packQty) => {
  const price = toNumber(packPrice)
  const qty = toNumber(packQty)
  if (!price || !qty) return 0
  try {
    return Number(Big(price).div(qty).round(0))
  } catch { return 0 }
}

export const calcMargin = (jual, modal) => {
  const j = toNumber(jual)
  const m = toNumber(modal)
  if (!m || !j) return 0
  try {
    return Number(Big(j).minus(m).div(m).times(100).round(0))
  } catch { return 0 }
}

export const getBarangTipis = (products) =>
  products.filter(p => (p.qty || 0) <= (p.minStock || 5))