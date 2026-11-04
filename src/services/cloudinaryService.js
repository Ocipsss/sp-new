// src/services/cloudinaryService.js - FINAL OFFLINE-FIRST
import { db } from '../db'

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_PRESET

export const cloudinaryService = {
  async uploadPendingImages() {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      console.warn('[Cloudinary] CLOUD_NAME atau PRESET belum diatur di .env, skip upload')
      return { uploaded: 0 }
    }
    if (!navigator.onLine) {
      console.log('[Cloudinary] Offline, skip upload')
      return { uploaded: 0 }
    }
    const pending = await db.products.where('imageSynced').equals(0).toArray()
    if (!pending.length) return { uploaded: 0 }
    
    let count = 0
    for (const p of pending) {
      if (!p.imageLocal) {
        // ga ada blob lokal, skip tapi tandain synced biar ga loop
        await db.products.update(p.id, { imageSynced: 1 })
        continue
      }
      try {
        console.log(`[Cloudinary] Uploading ${p.name}...`)
        const form = new FormData()
        form.append('file', p.imageLocal)
        form.append('upload_preset', UPLOAD_PRESET)
        if (p.imagePublicId) form.append('public_id', p.imagePublicId)
        else form.append('public_id', `sinar-pagi/products/${p.id}`)

        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: form
        })
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        
        // Simpen URL, hapus blob lokal biar irit IndexedDB
        await db.products.update(p.id, {
          imageUrl: data.secure_url,
          imagePublicId: data.public_id,
          imageSynced: 1,
          synced: 0, // biar URL nya ke-push ke Firestore
          updatedAt: new Date().toISOString()
        })
        // Hapus blob setelah sukses upload biar ga bengkak
        try {
          await db.products.update(p.id, { imageLocal: undefined })
        } catch {}
        count++
        console.log(`[Cloudinary] ✅ ${p.name} -> ${data.secure_url}`)
        await new Promise(r=>setTimeout(r, 300))
      } catch (e) {
        console.warn('[Cloudinary] Upload fail', p.name, e.message)
      }
    }
    return { uploaded: count }
  },

  getThumbUrl(publicId, width = 300) {
    if (!publicId) return null
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${width},f_auto,q_auto/${publicId}`
  },

  getFullUrl(publicId) {
    if (!publicId) return null
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto/${publicId}`
  }
}