//src/router/index.js//
import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import LoginView from '../views/Login.vue'
import { useOperatorStore } from '../stores/operatorStore.js'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: LoginView,
      meta: { title: 'Kasir Login', guestOnly: true }
    },
    {
      path: '/',
      component: MainLayout,
      children: [
        { path: '', redirect: '/kasir' },
        { 
          path: 'kasir', 
          name: 'Kasir', 
          component: () => import('../views/Kasir.vue'),
          meta: { title: 'Kasir' }
        },
        { 
          path: 'products', 
          name: 'ProductsList',
          component: () => import('../views/ProductsList.vue'),
          meta: { title: 'Barang' }
        },
        { 
          path: 'operators', 
          name: 'Operators',
          component: () => import('../views/Operators.vue'),
          meta: { title: 'Operator / Kasir' }
        },
        { 
          path: 'categories', 
          name: 'Categories',
          component: () => import('../views/Categories.vue'),
          meta: { title: 'Kategori Barang' }
        },
        { 
          path: 'add-products', 
          name: 'ProductsAdd',
          component: () => import('../views/ProductsAdd.vue'),
          meta: { title: 'Tambah Barang' }
        },
        { 
          path: 'dashboard', 
          name: 'Dashboard', 
          component: () => import('../views/Dashboard.vue'),
          meta: { title: 'Dashboard' }
        },
        { 
          path: 'members', 
          name: 'Members',
          component: () => import('../views/Members.vue'),
          meta: { title: 'Daftar Member' }
        },
        { 
          path: 'digital', 
          name: 'ProductsDigital',
          component: () => import('../views/ProductsDigital.vue'),
          meta: { title: 'Transaksi Digital' }
        },
        { 
          path: 'sales-history', 
          name: 'SalesHistory',
          component: () => import('../views/SalesHistory.vue'),
          meta: { title: 'Riwayat Penjualan' }
        },
        { 
          path: 'expenses', 
          name: 'Expenses', 
          component: () => import('../views/Expenses.vue'),
          meta: { title: 'Pengeluaran Operasional' }
        },
        { 
          path: 'finance', 
          name: 'Finance', 
          component: () => import('../views/Finance.vue'),
          meta: { title: 'Kas & Keuangan' }
        },
        {
          path: 'settings-menu', 
          name: 'SettingsMenu', 
          component: () => import('../views/SettingsMenu.vue'),
          meta: { title: 'Atur Rokok & Seduh' }
        },
        { 
          path: 'shopping', 
          name: 'Shopping', 
          component: () => import('../views/Shopping.vue'),
          meta: { title: 'Belanja' }
        },
        { 
          path: 'reports', 
          name: 'Reports', 
          component: () => import('../views/Reports.vue'),
          meta: { title: 'Laporan & Rekap' }
        },
        { 
          path: 'settings/qris', 
          name: 'SettingsQris',
          component: () => import('../views/SettingsQris.vue'),
          meta: { title: 'QRIS Toko' }
        },
        { 
          path: 'settings', 
          name: 'Settings', 
          component: () => import('../views/Settings.vue'),
          meta: { title: 'Pengaturan' }
        }
      ]
    }
  ]
})

// ROUTE GUARD UNTUK SESI OPERATOR
router.beforeEach(async (to) => {
  // Update judul halaman secara otomatis
  if (to.meta?.title) {
    document.title = `${to.meta.title} - Sinar Pagi POS`
  }

  const operatorStore = useOperatorStore()

  // Pastikan data operator sempat dimuat dari local storage / Dexie jika belum terisi
  if (operatorStore.operators.length === 0) {
    await operatorStore.loadOperators().catch(() => {})
  }

  // Redirect jika belum login dan mencoba mengakses halaman privat
  if (!to.meta.guestOnly && !operatorStore.isLoggedIn) {
    return '/login'
  }

  // Redirect jika sudah login tetapi membuka halaman login/guest
  if (to.meta.guestOnly && operatorStore.isLoggedIn) {
    return '/kasir'
  }
})
