export const toNumber = (v) => Number(String(v?? '').replace(/[^0-9]/g, '')) || 0

export const formatRp = (v) => {
  const n = toNumber(v)
  if (!n) return ''
  return `Rp ${n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
}

export const formatRibuan = (v) => {
  const n = toNumber(v)
  if (!n) return ''
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}