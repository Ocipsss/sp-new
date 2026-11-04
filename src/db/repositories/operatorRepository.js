// src/db/repositories/operatorRepository.js
import { db } from '../index.js'
import dayjs from 'dayjs'

async function hashPin(pin) {
  if (!pin) return ''
  const str = String(pin)
  // kalo udah 64 char hex (udah ke-hash) jangan di-hash lagi biar gak double
  if (/^[a-f0-9]{64}$/i.test(str)) return str.toLowerCase()
  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(str)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  } catch {
    // fallback kalo crypto.subtle gak ada di webview jadul, jangan crash
    return str
  }
}

export const operatorRepo = {
  getAll: async () => {
    const table = db.operators || db.table('operators')
    const list = await table.toArray()
    const activeList = list.filter(item => !item.deleted)

    // JIKA KOSONG (Habis clear cache), buat otomatis Operator Bawaan agar bisa login & Impor JSON
    if (activeList.length === 0) {
      const defaultId = 'admin-default'
      const defaultPinHash = await hashPin('1234')
      const defaultOp = {
        id: defaultId,
        name: 'Admin',
        role: 'Owner',
        pin: defaultPinHash,
        deleted: false,
        updatedAt: dayjs().toISOString(),
        synced: 0
      }
      await table.put(defaultOp)
      return [defaultOp]
    }

    return activeList
  },

  getById: async (id) => {
    const table = db.operators || db.table('operators')
    const item = await table.get(id)
    return item && !item.deleted ? item : null
  },

  create: async (data) => {
    const id = crypto.randomUUID()
    const now = dayjs().toISOString()
    const hashedPin = data.pin ? await hashPin(data.pin) : ''
    const item = { 
      id, 
      name: data.name,
      role: data.role || 'Kasir',
      pin: hashedPin,
      deleted: false,
      updatedAt: now, 
      synced: 0 
    }
    const table = db.operators || db.table('operators')
    await table.add(item)
    return id
  },

  update: async (id, data) => {
    const now = dayjs().toISOString()
    const table = db.operators || db.table('operators')
    const payload = { ...data }
    if (payload.pin) {
      payload.pin = await hashPin(payload.pin)
    }
    await table.update(id, { ...payload, updatedAt: now, synced: 0 })
  },

  delete: async (id) => {
    const now = dayjs().toISOString()
    const table = db.operators || db.table('operators')
    // Gunakan Soft Delete agar sinkronisasi offline-first berjalan konsisten
    await table.update(id, { deleted: true, updatedAt: now, synced: 0 })
  }
}
