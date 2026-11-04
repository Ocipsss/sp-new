<template>
  <router-view />
  <Toaster position="top-center" richColors />
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { Toaster, toast } from 'vue-sonner'

let lastBackPressTime = 0
// HAPUS autoBackupInterval - ini biang boros kuota 10MB tiap 30 menit
// Kalo mau backup, pake manual atau ke Storage, bukan Firestore doc

function handleBackButton() {
  const currentTime = new Date().getTime()
  if (currentTime - lastBackPressTime < 2000) {
    window.close()
    setTimeout(() => { window.location.href = 'about:blank' }, 100)
  } else {
    lastBackPressTime = currentTime
    toast.info('Tekan sekali lagi untuk keluar')
    history.pushState({ ...history.state }, '', location.href)
  }
}

onMounted(() => {
  history.pushState({ ...history.state }, '', location.href)
  window.addEventListener('popstate', handleBackButton)
  // initAutoBackup() -> DIMATIKAN, ini yang bikin boros kuota
})

onUnmounted(() => {
  window.removeEventListener('popstate', handleBackButton)
})
</script>