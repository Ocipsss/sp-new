import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { registerSW } from 'virtual:pwa-register'
import './style.css'
import 'vue-sonner/style.css'
import App from './App.vue'
import { router } from './router/index.js'
import { syncRealtime as syncService } from './services/syncService.js'

// di main.js paling atas, di bawah import
window.addEventListener('unhandledrejection', (e) => {
  if (e.reason?.name === 'AbortError') {
    e.preventDefault()
  }
})

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Versi baru Sinar Pagi POS tersedia. Perbarui sekarang?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('Sinar Pagi POS siap digunakan secara offline.')
  }
})

const app = createApp(App)
const pinia = createPinia()

pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.use(router)

// Mount aplikasi secara langsung tanpa tergantung Firebase Auth
app.mount('#app')

try {
  syncService.init()
} catch (e) {
  console.error('Sync gagal init, jalan offline dulu:', e)
}
