# MEMORY-V.1.md — Sinar Pagi POS Master Technical Documentation

> **Generated:** 13 Oktober 2026[span_2](start_span)[span_2](end_span)  
> **Project:** Sinar Pagi POS (Offline-First Warung & Retail POS Application)[span_3](start_span)[span_3](end_span)  
> **Evolution Covered:** v1.1 – v1.6 ➔ v1.7 ➔ v1.8 ➔ v1.9 ➔ v1.10[span_4](start_span)[span_4](end_span)[span_5](start_span)[span_5](end_span)  
> **Tech Stack:** Vue 3 (Composition API), Vite, Pinia (Persisted State), Vue Router 4, Dexie IndexedDB (`SinarPagiDB`), Firebase Firestore, Tailwind CSS v4, Vee-Validate + Zod, Big.js, Day.js, HTML5-QRCode, Lucide Vue Next, Vue-Sonner, ESC/POS Encoder, jsPDF, XLSX[span_6](start_span)[span_6](end_span)[span_7](start_span)[span_7](end_span).

---

## 1. Executive Summary & Version Progression History

### 📜 Ringkasan Evolusi Versi (v1.1 - v1.6 hingga v1.10)

* **Versi 1.1 – 1.6 (Pondasi Aplikasi & Integrasi Keuangan):**
  * Penataan layout global & penyesuaian tampilan responsif per halaman (`Kasir.vue`, `ProductsList.vue`, dll)[span_8](start_span)[span_8](end_span).
  * Konsolidasi akun saldo digital ke dalam akun **Rekening / QRIS / Wallet (`acc_bank`)**[span_9](start_span)[span_9](end_span).
  * Penambahan indikator **Total Piutang Member (TEMPO)**[span_10](start_span)[span_10](end_span).
  * Implementasi pemicu mutasi saldo otomatis untuk transaksi kasir tunai (`acc_cash`) / QRIS (`acc_bank`) dan transaksi produk digital[span_11](start_span)[span_11](end_span).
  * Perbaikan navigasi drawer pada `Sidebar.vue`[span_12](start_span)[span_12](end_span)[span_13](start_span)[span_13](end_span).

* **Versi 1.7 (Pemurnian Arsitektur / Refactoring SoC):**
  * Pemisahan layer repositori dan service (`memberService.js`, `salesHistoryService.js`, `reportService.js`, `backupService.js`)[span_14](start_span)[span_14](end_span).
  * Implementasi **Dexie Hooks** (`creating`, `updating`, `deleting`) pada `src/db/index.js` untuk pemicu sinkronisasi cloud otomatis tanpa pemicu manual di UI[span_15](start_span)[span_15](end_span).
  * Penambahan kait `onActivated` pada tampilan KeepAlive (`Dashboard.vue`, `Finance.vue`, `SalesHistory.vue`, `Reports.vue`)[span_16](start_span)[span_16](end_span).

* **Versi 1.8 (Sesi Operator & Multi-Cart Pending):**
  * Integrasi Pinia `operatorStore` dengan verifikasi PIN dan pemicu `router.beforeEach` sebagai *route guard*[span_17](start_span)[span_17](end_span).
  * Dukungan *multi-cart* pending (`pendingCarts`) pada halaman kasir[span_18](start_span)[span_18](end_span)[span_19](start_span)[span_19](end_span).
  * Integrasi varian eceran rokok & jasa seduh/racik dinamis per kategori[span_20](start_span)[span_20](end_span)[span_21](start_span)[span_21](end_span).
  * Pencatatan beban pengeluaran operasional (`expenses`) dengan pemotongan saldo kas/bank otomatis[span_22](start_span)[span_22](end_span)[span_23](start_span)[span_23](end_span).

* **Versi 1.9 (Konsistensi Piutang & Integrasi Cloud Operator):**
  * Integrasi pemilih member pada transaksi Produk Digital dengan akumulasi poin 1% dari profit biaya admin[span_24](start_span)[span_24](end_span).
  * Sinkronisasi total piutang TEMPO pada Riwayat Penjualan & Dashboard langsung dengan agregat `member.debt`[span_25](start_span)[span_25](end_span).
  * Perbaikan manajemen penghapusan operator di Firestore (`deleteDoc`) dan pencegahan pembuatan operator fiktif otomatis pada mode Incognito[span_26](start_span)[span_26](end_span).

* **Versi 1.10 (Master Release - Keuangan & Void Komprehensif):**
  * Rekalkulasi ulang saldo kas/bank retroaktif via `recalculateFromHistory()`[span_27](start_span)[span_27](end_span).
  * Fitur VOID komprehensif (pengembalian stok, pembatalan mutasi saldo, pemulihan poin/piutang member)[span_28](start_span)[span_28](end_span).
  * Fitur restock otomatis belanja kulakan dengan konfirmasi modal riil dan dukungan undo[span_29](start_span)[span_29](end_span).
  * Cetak struk thermal Bluetooth via `ESC/POS` (58mm & 80mm) serta generasi PDF nota via `jsPDF`[span_30](start_span)[span_30](end_span).

---

## 2. Tech Stack, Library & Responsive Layout Structure

### A. Tech Stack & Core Libraries
- **Core:** Vue 3 (Composition API) + Vite + Vue Router 4, Tailwind CSS v4[span_31](start_span)[span_31](end_span)[span_32](start_span)[span_32](end_span)
- **Database Local:** Dexie.js (`SinarPagiDB` v1)[span_33](start_span)[span_33](end_span)[span_34](start_span)[span_34](end_span)
- **Database Cloud & Sync:** Firebase Firestore (`VITE_FIREBASE_*`)[span_35](start_span)[span_35](end_span)[span_36](start_span)[span_36](end_span)
- **State & Validation:** Pinia + `pinia-plugin-persistedstate`, Vee-Validate + Zod[span_37](start_span)[span_37](end_span)[span_38](start_span)[span_38](end_span)
- **Utilities & Export:** Big.js (Akurasi Presisi Keuangan), Day.js, HTML5-QRCode, Lucide Vue Next, ESC/POS Encoder, jsPDF, XLSX, Vue-Sonner[span_39](start_span)[span_39](end_span)[span_40](start_span)[span_40](end_span)

### B. Layout Structure & Responsive Fixes
- **Global Layout (`src/layouts/MainLayout.vue`):**
  - Outer Container: `min-h-screen bg-zinc-900 overflow-hidden`[span_41](start_span)[span_41](end_span)
  - Inner Wrapper: `h-screen flex flex-col overflow-hidden` dengan pemicu `translate` saat sidebar dibuka[span_42](start_span)[span_42](end_span).
  - Header: `shrink-0 h-[56px] bg-white border-b z-40` *(Fixed Header Global)*[span_43](start_span)[span_43](end_span)
  - Main Area: `flex-1 overflow-hidden flex flex-col max-w-xl mx-auto w-full` *(Proses scroll terjadi di dalam inner view)*[span_44](start_span)[span_44](end_span)

- **View-Specific Responsive Layouts:**
  - **`Kasir.vue`:**
    - Outer: `flex flex-col h-[calc(100dvh-56px)] overflow-hidden bg-zinc-50`[span_45](start_span)[span_45](end_span)
    - Search Bar: `shrink-0 sticky top-0 z-10 bg-zinc-50 p-4`[span_46](start_span)[span_46](end_span)
    - Cart List: `flex-1 overflow-auto px-4 pb-4` *(Kontainer yang dapat di-scroll)*[span_47](start_span)[span_47](end_span)
    - Payment Drawer: `shrink-0 sticky bottom-0 z-20 bg-zinc-900 rounded-t-[2rem] p-5 pb-7`[span_48](start_span)[span_48](end_span)
  - **`ProductsList.vue` / `ProductsAdd.vue` / `Dashboard.vue`:**
    - Root: `flex-1 overflow-auto p-4 pb-24`[span_49](start_span)[span_49](end_span)

---

## 3. Peta Arsitektur & Separation of Concerns (SoC)

Aplikasi dibangun menggunakan arsitektur modular **Offline-First**:


[ Views / Components ] ──► [ Composables / Pinia Stores ] ──► [ Services / Repositories ] ──► [ Dexie DB / Firestore ]

### Matriks Pemetaan Komponen

| Halaman / View | Route Path | Composable / Store | Repository / Service | Responsibilitas Utama |
| :--- | :--- | :--- | :--- | :--- |
| **Login** | `/login`[span_50](start_span)[span_50](end_span) | `useOperatorStore`[span_51](start_span)[span_51](end_span) | `operatorRepo`[span_52](start_span)[span_52](end_span) | Autentikasi operator, verifikasi PIN, & manajemen sesi shift aktif[span_53](start_span)[span_53](end_span). |
| **Kasir** | `/kasir`[span_54](start_span)[span_54](end_span) | `useKasir.js`, `kasirStore.js`[span_55](start_span)[span_55](end_span) | `kasirService.js`, `receiptService.js`, `packageRepository.js`, `serviceRepository.js`[span_56](start_span)[span_56](end_span)[span_57](start_span)[span_57](end_span) | Transaksi kasir, pending cart, varian eceran rokok & jasa seduh, barcode scanner, cetak nota[span_58](start_span)[span_58](end_span)[span_59](start_span)[span_59](end_span). |
| **Transaksi Digital** | `/digital`[span_60](start_span)[span_60](end_span) | `useProductsDigital.js`[span_61](start_span)[span_61](end_span) | `productsDigitalService.js`, `memberRepo`, `financeRepo`[span_62](start_span)[span_62](end_span)[span_63](start_span)[span_63](end_span) | Transaksi Topup & Tarik Tunai, pemotongan saldo vs tunai, kalkulasi kas laci, akumulasi poin member[span_64](start_span)[span_64](end_span)[span_65](start_span)[span_65](end_span). |
| **Riwayat Penjualan** | `/sales-history`[span_66](start_span)[span_66](end_span) | `useSalesHistory.js`[span_67](start_span)[span_67](end_span) | `salesHistoryService.js`, `transactionRepo`, `financeRepo`[span_68](start_span)[span_68](end_span)[span_69](start_span)[span_69](end_span) | Combined history (Barang & Digital), VOID transaksi, rekap piutang TEMPO, re-print nota[span_70](start_span)[span_70](end_span)[span_71](start_span)[span_71](end_span). |
| **Belanja Kulakan** | `/shopping`[span_72](start_span)[span_72](end_span) | `useShopping.js`[span_73](start_span)[span_73](end_span) | `shoppingService.js`, `shoppingRepository.js`, `financeRepo`[span_74](start_span)[span_74](end_span) | Restock otomatis stok tipis, toggle dibeli (potong kas/tambah stok), ekspor teks belanjaan[span_75](start_span)[span_75](end_span). |
| **Kas & Keuangan** | `/finance`[span_76](start_span)[span_76](end_span) | `useFinance.js`[span_77](start_span)[span_77](end_span) | `financeRepo`[span_78](start_span)[span_78](end_span)[span_79](start_span)[span_79](end_span) | Ringkasan saldo kas/bank, hitung ulang dari riwayat, mutasi saldo, set saldo awal[span_80](start_span)[span_80](end_span)[span_81](start_span)[span_81](end_span). |
| **Pengeluaran Operasional**| `/expenses`[span_82](start_span)[span_82](end_span) | `useExpenses.js`[span_83](start_span)[span_83](end_span) | `expenseService.js`, `expenseRepository.js`, `financeRepo`[span_84](start_span)[span_84](end_span)[span_85](start_span)[span_85](end_span) | Catat beban usaha (plastik, listrik, dll), otomatis potong kas/bank, pemulihan saat dihapus[span_86](start_span)[span_86](end_span)[span_87](start_span)[span_87](end_span). |
| **Laporan & Rekap** | `/reports`[span_88](start_span)[span_88](end_span) | - | `reportService.js`[span_89](start_span)[span_89](end_span) | Breakdown omzet, profit barang & digital, margin %, ekspor laporan ke Excel (`.xlsx`)[span_90](start_span)[span_90](end_span). |
| **Dashboard** | `/dashboard`[span_91](start_span)[span_91](end_span) | `useDashboard.js`[span_92](start_span)[span_92](end_span) | `dashboardService.js`[span_93](start_span)[span_93](end_span) | Stat ringkasan omzet, piutang, grafik 7 hari, dan daftar barang perlu restock[span_94](start_span)[span_94](end_span). |
| **Daftar Barang** | `/products`[span_95](start_span)[span_95](end_span) | `useProductsStore`[span_96](start_span)[span_96](end_span) | `productRepo`[span_97](start_span)[span_97](end_span)[span_98](start_span)[span_98](end_span) | Katalog produk, filter & sorting stok/kategori, scanner barcode HID[span_99](start_span)[span_99](end_span)[span_100](start_span)[span_100](end_span). |
| **Tambah/Edit Barang** | `/add-products`[span_101](start_span)[span_101](end_span) | `useProductForm.js`[span_102](start_span)[span_102](end_span) | `productService.js`, `productRepo`[span_103](start_span)[span_103](end_span)[span_104](start_span)[span_104](end_span) | Form master produk, kalkulator grosir/isi pak, modal auto[span_105](start_span)[span_105](end_span)[span_106](start_span)[span_106](end_span). |
| **Kategori & Satuan** | `/categories`[span_107](start_span)[span_107](end_span) | `useCategories.js`[span_108](start_span)[span_108](end_span) | `categoryRepo`, `unitRepo`[span_109](start_span)[span_109](end_span)[span_110](start_span)[span_110](end_span) | Master data kategori & satuan barang, auto-update kategori di produk terkait[span_111](start_span)[span_111](end_span)[span_112](start_span)[span_112](end_span). |
| **Atur Rokok & Seduh** | `/settings-menu`[span_113](start_span)[span_113](end_span) | `useSettingsMenu.js`[span_114](start_span)[span_114](end_span) | `packageRepository.js`, `serviceRepository.js`[span_115](start_span)[span_115](end_span)[span_116](start_span)[span_116](end_span) | Konfigurasi paket eceran rokok (1 btg, 1/2 bks) & tarif jasa per kategori (seduh mie/kopi)[span_117](start_span)[span_117](end_span)[span_118](start_span)[span_118](end_span). |
| **Daftar Member** | `/members`[span_119](start_span)[span_119](end_span) | `useMembers.js`[span_120](start_span)[span_120](end_span) | `memberRepo`, `memberService.js`[span_121](start_span)[span_121](end_span)[span_122](start_span)[span_122](end_span) | Master data member, akumulasi poin & total spending, cicilan/pelunasan utang TEMPO[span_123](start_span)[span_123](end_span)[span_124](start_span)[span_124](end_span). |
| **Data Operator** | `/operators`[span_125](start_span)[span_125](end_span) | `useOperators.js`[span_126](start_span)[span_126](end_span) | `operatorRepo`[span_127](start_span)[span_127](end_span) | CRUD akun operator kasir, peran (Kasir/Admin), PIN otorisasi[span_128](start_span)[span_128](end_span). |
| **Pengaturan Toko** | `/settings`[span_129](start_span)[span_129](end_span) | `useSettings.js`[span_130](start_span)[span_130](end_span) | `settingsRepo`, `backupService.js`[span_131](start_span)[span_131](end_span) | Identitas toko untuk nota, kertas thermal (58mm/80mm), backup JSON, reset riwayat transaksi[span_132](start_span)[span_132](end_span). |

---

## 4. Skema Database IndexedDB (`SinarPagiDB` v1)

IndexedDB dikelola melalui **Dexie.js** dengan nama database `SinarPagiDB` versi `1`[span_133](start_span)[span_133](end_span)[span_134](start_span)[span_134](end_span):

```javascript
db.version(1).stores({
  products: 'id, code, name, category, price_modal, price_sell, qty, unit, minStock, idealStock, purchasePackName, packQty, packPrice, updatedAt, synced',
  product_packages: 'id, productId, name, qty_pcs, price_sell, updatedAt, synced',
  categories: 'id, name, updatedAt, synced',
  transactions: 'id, date, total, memberId, paymentMethod, amountPaid, paidAmount, remaining, status, dueDate, updatedAt, synced',
  transaction_items: 'id, transactionId, productId, serviceId, updatedAt, synced',
  members: 'id, name, phone, address, total_spending, points, debt, updatedAt, synced',
  debt_payments: 'id, transactionId, memberId, date, amount, paymentMethod, updatedAt, synced',
  shopping_list: 'id, productId, isBought, category, updatedAt, synced',
  cash_accounts: 'id, name, type, balance, updatedAt, synced',
  cash_mutations: 'id, date, accountId, type, amount, category, note, refId, updatedAt, synced',
  expenses: 'id, date, category, amount, note, paymentMethod, cashPart, qrisPart, updatedAt, synced',
  digital_transactions: 'id, date, type, provider, nominal, adminFee, adminPaymentMethod, totalReceived, profit, updatedAt, synced',
  services: 'id, name, price, updatedAt, synced',
  units: 'id, name, updatedAt, synced',
  operators: 'id, name, role, pin, updatedAt, synced',
  settings: 'id'
})

5. Mekanisme Sinkronisasi Hybrid Real-Time (syncService.js)
Aplikasi menggunakan pendekatan Offline-First. Penulisan data dilakukan ke IndexedDB lokal terlebih dahulu, lalu disinkronkan ke Firebase Firestore.
[ Dexie Hook Event ] ──► [ Debounced Trigger ] ──► [ pushLocalToCloud() ] ──► [ Firebase Firestore ]
                                                                                   │
[ Firestore Listener ] ◄── [ Realtime Pull (onSnapshot) ] ◄────────────────────────┘

Kebijakan Sinkronisasi
 * Automated Trigger (Dexie Hooks):
   Tiap kali tabel lokal mengalami perubahan (creating, updating, deleting), Dexie hook memicu syncRealtime.pushLocalToCloud().
 * Kategori Tabel:
   * TABLES_TO_SYNC: Master data (products, product_packages, categories, members, services, units, operators, cash_accounts).
   * TRANSACTION_TABLES: Data transaksi (transactions, transaction_items, expenses, digital_transactions, debt_payments, shopping_list, cash_mutations).
 * Pemberhentian Sinkronisasi Berulang:
   Item Firestore yang berhasil diunggah akan diberi penanda synced: 1 pada IndexedDB lokal untuk mencegah pengiriman ganda.
 * Proteksi Khusus Member Debt:
   Saat menerima pembaruan dari cloud, debt milik member dihitung ulang dari transaksi TEMPO lokal yang belum lunas (remaining > 0) via recalculateMemberDebt(memberId) agar keakuratan angka piutang selalu terjaga.
6. Aturan Bisnis Keuangan, Akuntansi & Transaksi
A. Alur Saldo Kas & Bank (financeRepo)
 * Akun Kas Laci (acc_cash): Menampung transaksi tunai dari Kasir, transaksi tunai produk digital, pelunasan utang member tunai, serta terpotong oleh belanja kulakan / pengeluaran operasional tunai.
 * Akun Rekening/Bank (acc_bank): Menampung transaksi QRIS Kasir, aliran saldo digital (Modal Topup / Masuk Saldo Tarik Tunai), pelunasan utang via Bank, serta terpotong oleh belanja kulakan / pengeluaran via Bank.
B. Transaksi Kasir, Multi-Cart & Poin Member
 * Multi-Cart / Pending Cart (kasirStore.js):
   * Mendukung penyimpanan banyak keranjang belanja (multi-cart) tertunda lengkap dengan label nama pelanggan.
   * Menggunakan Pinia Store dengan pinia-plugin-persistedstate agar keranjang tidak hilang saat pindah halaman.
 * Aturan Pembayaran Checkout:
   * CASH: Membutuhkan validasi bayarNominal >= total.
   * QRIS: Nominal bayar diset otomatis sesuai total belanja.
   * TEMPO: Wajib memilih member terdaftar; sisa tagihan dicatat sebagai utang (debt).
 * Akumulasi Poin Member (1% Profit):
   * Setiap transaksi member yang sukses dihitung nilai keuntungan bersihnya:
     
   * Member memperoleh poin sebesar 1\% dari total keuntungan:
     
C. Rumus & Logika Produk Digital (productsDigitalService.js)
 * Top Up Saldo:
   * Admin Tunai (cash): Kas Laci mendapat +(Nominal + Admin). Modal Bank terpotong -Nominal.
   * Admin Potong Saldo (digital): Kas Laci mendapat +Nominal. Modal Bank terpotong -(Nominal - Admin).
 * Tarik Tunai:
   * Admin Tunai (cash): Kas Laci terpotong -(Nominal - Admin). Saldo Bank bertambah +Nominal.
   * Admin Potong Saldo (digital): Kas Laci terpotong -(Nominal - Admin). Saldo Bank bertambah +(Nominal + Admin).
 * Poin Member: Mendapatkan 1% dari nilai admin fee (profit) jika member dipilih pada transaksi digital.
D. Pembatalan Transaksi (VOID) (salesHistoryService.js)
 * Barang:
   * Stok dikembalikan sesuai qty pada transaction_items.
   * Mutasi kas/bank dibalik (OUT sebesar total transaksi).
   * total_spending member dikurangi; jika pembayaran awal TEMPO, debt member berkurang.
   * Status transaksi diubah menjadi void.
 * Digital:
   * Mutasi kas/bank dibalik sesuai skema jenis Topup/Tarik Tunai.
   * Status transaksi diubah menjadi CANCELLED dan profit dieset menjadi 0.
7. Fitur Unggulan Operasional Kasir & Toko
 * Varian Eceran Rokok & Jasa Seduh (Kasir.vue, SettingsMenu.vue):
   * Apabila produk berkategori Rokok diklik, modal opsi eceran (seperti 1 Batang / 1/2 Bungkus) akan muncul. Stok dipotong berbasis jumlah batang (qty_pcs).
   * Apabila produk lain yang memiliki tarif jasa terkonfigurasi (seperti Kopi/Mie) diklik, opsi penyajikan (Mentah vs Seduh + Biaya Jasa) akan ditawarkan.
 * Restock Otomatis Belanja Kulakan (Shopping.vue):
   * Menarik seluruh produk yang stoknya qty <= minStock ke dalam tabel belanjaan.
   * Mengalkulasi estimasi modal dari packPrice atau price_modal * targetQty.
 * Cetak Thermal & PDF Nota (receiptService.js):
   * Format teks nota otomatis teratur sesuai ukuran kertas (58mm = 32 karakter/baris, 80mm = 48 karakter/baris).
   * Menggunakan format dua kolom rata kiri-kanan presisi (formatTwoColumn).
8. Panduan Pengembangan & Konvensi Kode
 * Penanganan Angka / Nilai Mata Uang (src/utils/formatters/currency.js):
   export const toNumber = (v) => Number(String(v ?? '').replace(/[^0-9]/g, '')) || 0
export const formatRp = (v) => toNumber(v) ? `Rp ${toNumber(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}` : ''
export const formatRibuan = (v) => toNumber(v) ? toNumber(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''

   * Gunakan selalu helper formatRibuan(), formatRp(), dan toNumber() untuk memformat tampilan rupiah atau membersihkan input string dari karakter non-numerik.
   * Hindari manipulasi floating point JavaScript secara langsung untuk angka sensitif; gunakan library big.js untuk kalkulasi pembagian/perkalian presisi.
 * Pencatatan Waktu & Konfigurasi Date/Time:
   * Gunakan format ISO String standar (dayjs().toISOString()) untuk kolom updatedAt, createdAt, dan date pada seluruh tabel IndexedDB.
   * Konfigurasi tanggal Indonesia diatur via instance Day.js:
     import dayjs from 'dayjs'
import localeId from 'dayjs/locale/id'

dayjs.locale(localeId)

 * Penambahan Fitur Baru:
   * Setiap modifikasi tabel IndexedDB wajib memperbarui definisi skema di src/db/index.js dan mendaftarkan nama tabel ke array TABLES_TO_SYNC atau TRANSACTION_TABLES di src/services/syncService.js.

