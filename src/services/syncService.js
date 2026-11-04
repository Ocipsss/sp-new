// src/services/syncService.js
import { reactive } from 'vue'
import { db } from '../db'
import { supabase } from './supabase.js'
import dayjs from 'dayjs'
import Big from 'big.js'
import { cloudinaryService } from './cloudinaryService.js'

const TABLES_TO_SYNC = [
  'products',
  'product_packages',
  'categories',
  'transactions',
  'transaction_items',
  'members',
  'debt_payments',
  'shopping_list',
  'cash_accounts',
  'cash_mutations',
  'expenses',
  'digital_transactions',
  'services',
  'units',
  'operators',
  'settings'
]

let isSyncing = false
let intervalId = null
let isPullingFromCloud = false

export function getIsPullingFromCloud() { 
  return isPullingFromCloud 
}

export const syncStatus = reactive({
  isOnline: navigator.onLine,
  isSyncing: false,
  unsyncedCount: 0,
  pendingPullCount: 0,
  lastSyncedAt: null,
  isAutoSyncEnabled: false
})

export async function updateUnsyncedCount() {
  if (!db) return
  try {
    let total = 0
    for (const t of TABLES_TO_SYNC) {
      try {
        if (!db[t]) continue
        const count = await db[t].where('synced').equals(0).count().catch(() => 0)
        total += count
      } catch (e) {
        console.warn('[Sync] count error:', t, e)
      }
    }
    syncStatus.unsyncedCount = total
  } catch (e) {
    console.warn('[Sync] Count check error:', e)
  }
}

async function bumpCatalogVersion() {
  if (!navigator.onLine || !supabase) return
  try {
    await supabase.from('meta').upsert({
      id: 'catalog',
      version: Date.now(),
      updatedAt: new Date().toISOString(),
      pendingCount: 1
    })
    console.log('[Sync] meta/catalog version bumped')
  } catch (e) {
    console.warn('[Sync] Gagal bump catalog version', e)
  }
}

export async function checkForCloudUpdates() {
  if (!navigator.onLine || !supabase) return
  try {
    const { data, error } = await supabase.from('meta').select('*').eq('id', 'catalog').single()
    if (error || !data) return

    const lastPull = localStorage.getItem('lastPullAt')
    if (!data.updatedAt) return

    const cloudTime = new Date(data.updatedAt).getTime()
    const localTime = lastPull ? new Date(lastPull).getTime() : 0

    if (cloudTime > localTime) {
      syncStatus.pendingPullCount = data.pendingCount || 1
    } else {
      syncStatus.pendingPullCount = 0
    }
  } catch (e) {
    console.warn('[Sync] Check update fail:', e)
  }
}

export async function pullAllFromCloud() {
  if (!navigator.onLine || isPullingFromCloud || !db || !supabase) return
  isPullingFromCloud = true
  syncStatus.isSyncing = true
  let wasEmpty = false
  try {
    console.log('[Sync] Narik ulang seluruh master dari Supabase...')
    wasEmpty = true
    for (const tableName of TABLES_TO_SYNC) {
      if (!db[tableName]) continue
      const { data, error } = await supabase.from(tableName).select('*')
      if (error || !data || !data.length) continue

      const formattedData = data.map(item => ({
        ...item,
        synced: 1
      })).filter(item => !item.deleted)

      if (formattedData.length) {
        await db[tableName].bulkPut(formattedData)
        console.log(`[Pull] ${tableName}: ${formattedData.length}`)
      }
    }
    localStorage.setItem('lastPullAt', new Date().toISOString())
    syncStatus.lastSyncedAt = dayjs().format('HH:mm')
    syncStatus.pendingPullCount = 0
    await updateUnsyncedCount()
    
    if (wasEmpty) {
      console.log('[Sync] Pull selesai, mereload halaman...')
      setTimeout(() => window.location.reload(), 600)
    }
  } finally {
    isPullingFromCloud = false
    syncStatus.isSyncing = false
  }
}

export async function pullDeltaFromCloud() {
  if (!navigator.onLine || isPullingFromCloud || !supabase) return
  const lastPull = localStorage.getItem('lastPullAt')
  if (!lastPull) return pullAllFromCloud()
  isPullingFromCloud = true
  try {
    for (const tableName of TABLES_TO_SYNC) {
      if (!db[tableName]) continue
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .gt('updatedAt', lastPull)

      if (error || !data || !data.length) continue

      const dirtyIds = await db[tableName].where('synced').equals(0).primaryKeys().catch(() => [])
      const incoming = data.map(item => ({ ...item, synced: 1 })).filter(i => !dirtyIds.includes(i.id))

      if (incoming.length) await db[tableName].bulkPut(incoming)
    }
    localStorage.setItem('lastPullAt', new Date().toISOString())
    syncStatus.pendingPullCount = 0
  } finally {
    isPullingFromCloud = false
  }
}

export const syncRealtime = {
  toggleAutoSync(enabled) {
    syncStatus.isAutoSyncEnabled = enabled
    localStorage.setItem('auto_sync_enabled', enabled ? 'true' : 'false')
    if (!enabled) this.stopRealtime()
  },

  async pushLocalToCloud() {
    syncStatus.isOnline = navigator.onLine
    if (!navigator.onLine || isSyncing || !db || !supabase) {
      await updateUnsyncedCount()
      return
    }
    isSyncing = true
    syncStatus.isSyncing = true
    let shouldBumpCatalog = false

    try {
      try {
        await cloudinaryService.uploadPendingImages()
      } catch (imgErr) {
        console.warn('[Sync] Gagal upload pending images:', imgErr?.message)
      }

      for (const tableName of TABLES_TO_SYNC) {
        if (!db[tableName]) continue
        const unsynced = await db[tableName].where('synced').equals(0).toArray()
        if (!unsynced.length) continue

        shouldBumpCatalog = true

        const payload = unsynced.map(item => {
          const clean = { ...item }

          // Sanitasi kolom lokal yang tidak ada pada schema Supabase
          delete clean.synced
          delete clean.imageLocal
          delete clean.imagePublicId
          delete clean.isPublished
          delete clean.pack_price
          delete clean.pack_unit
          delete clean.pack_qty

          // Pemasikan tipe data numerik
          if (clean.price !== undefined) clean.price = Number(clean.price) || 0
          if (clean.buyPrice !== undefined) clean.buyPrice = Number(clean.buyPrice) || 0
          if (clean.stock !== undefined) clean.stock = Number(clean.stock) || 0

          return clean
        })

        const { error } = await supabase.from(tableName).upsert(payload)

        if (!error) {
          const updates = unsynced.map(c => ({ key: c.id, changes: { synced: 1 } }))
          await db[tableName].bulkUpdate(updates)
          console.log(`[Sync Success] ${tableName}: ${unsynced.length} terkirim.`)
        } else {
          console.error(`[Sync Error] Gagal upsert tabel ${tableName}:`, error.message, error.details)
        }
      }

      if (shouldBumpCatalog) {
        await bumpCatalogVersion()
      }
      syncStatus.lastSyncedAt = dayjs().format('HH:mm')
    } catch (e) {
      console.error('[Sync] Push manual gagal:', e?.message || e)
    } finally {
      isSyncing = false
      syncStatus.isSyncing = false
      await updateUnsyncedCount()
    }
  },

  initRealtimePull() { this.stopRealtime() },
  stopRealtime() { if (intervalId) { clearInterval(intervalId); intervalId = null } },

  async init() {
    try {
      if (!supabase || !db) return
      const updateOnlineStatus = () => { syncStatus.isOnline = navigator.onLine }
      window.addEventListener('online', updateOnlineStatus)
      window.addEventListener('offline', updateOnlineStatus)
      this.stopRealtime()

      const prodCount = await db.products.where('deleted').notEqual(true).count().catch(() => db.products.count().catch(() => 0))
      if (prodCount === 0 && navigator.onLine) {
        await pullAllFromCloud()
      } else {
        if (navigator.onLine) {
          pullDeltaFromCloud()
          checkForCloudUpdates()
        }
        await updateUnsyncedCount()
      }
    } catch (e) {
      console.error('[Sync] Init error:', e?.message, e)
    }
  }
}

export const syncService = syncRealtime
export default syncRealtime
