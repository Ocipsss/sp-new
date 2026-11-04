// src/db/repositories/settingsRepository.js
import { db } from '../index.js'
import dayjs from 'dayjs'

export const settingsRepo = {
  async getSettings() {
    const table = db.settings || db.table('settings')
    const item = await table.get('app_config')
    if (!item) {
      const now = dayjs().toISOString()
      const defaultConfig = {
        id: 'app_config',
        storeName: 'SINAR PAGI',
        storeAddress: 'CIHELEUT JL. TALAS UJUNG NO. 38',
        storePhone: '089516477760',
        receiptFooter: 'HATUR NUHUN!',
        printerPaperSize: '58mm',
        autoPrintReceipt: false,
        theme: 'dark',
        updatedAt: now,
        synced: 0
      }
      await table.put(defaultConfig)
      return defaultConfig
    }
    return item
  },

  async saveSettings(data) {
    const table = db.settings || db.table('settings')
    const now = dayjs().toISOString()
    await table.put({
      ...data,
      id: 'app_config',
      updatedAt: now,
      synced: 0
    })
  }
}
