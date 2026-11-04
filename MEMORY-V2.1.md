MEMORY-V2.1.md
Dokumentasi perubahan sistem dan pembaruan kode versi 2.1.
1. Responsive Layout & UI Header
 * src/layouts/MainLayout.vue
   * Penyesuaian ukuran header dari h-[56px] menjadi md:h-16 khusus tampilan tablet (breakpoint md:).
   * Pembesaran tombol dan ikon header pada layar tablet:
     * Burger Menu & Tombol Navigasi Kanan: p-2.5 → md:p-3, Ikon w-5 h-5 → md:w-6 md:h-6.
     * Ikon Printer Bluetooth: w-4 h-4 → md:w-5 md:h-5.
     * Indikator Sync Realtime: w-3 h-3 → md:w-4 md:h-4.
2. Standarisasi Format KAPITAL Data Master & Migrasi Database
 * src/services/backupService.js
   * Penambahan fungsi convertAllToUppercase() untuk mengubah seluruh data lama di IndexedDB (Produk, Kategori, Satuan, dan Paket Eceran Rokok) menjadi huruf KAPITAL secara permanen.
   * Menandai data hasil migrasi dengan synced: 0 dan pembaharuan updatedAt agar terdorong otomatis ke Cloud Firestore.
 * src/composables/useSettings.js
   * Penambahan fungsi convertDataToUppercase() untuk memicu migrasi data ke KAPITAL dengan konfirmasi pengguna dan dialog notifikasi.
 * src/views/Settings.vue
   * Penambahan tombol aksi "Ubah Semua Data Master ke KAPITAL" pada seksi Cadangan & Pemulihan Data.
 * src/components/product/ProductForm.vue
   * Penambahan class Tailwind uppercase pada seluruh elemen input teks (name, code), pilihan kategori, dan satuan.
   * Formatter onSubmit dipastikan mengubah string ke .toUpperCase().trim() sebelum masuk ke store/service.
 * src/composables/useCategories.js
   * Pengubahan fungsi saveCategory dan saveUnit agar setiap penambahan atau pembaruan master data otomatis diformat ke .toUpperCase().trim().
3. Sinkronisasi Pengaturan Toko ke Cloud Firestore
 * src/db/repositories/settingsRepository.js
   * Penambahan atribut updatedAt dan synced: 0 pada fungsi saveSettings dan inisialisasi getSettings.
 * src/services/syncService.js
   * Penambahan tabel 'settings' ke dalam array TABLES_TO_SYNC agar pengaturan toko disinkronkan otomatis secara realtime (push/pull) antar perangkat.
4. Tata Letak Struk & Penanganan Modal Nota
 * src/services/receiptService.js
   * Penyamaan konfigurasi printer Bluetooth thermal dengan standar StrukNota (32 karakter/baris untuk kertas 58mm, alokasi 20 karakter detail item + 12 karakter subtotal).
   * Restrukturisasi tata letak metadata struk:
     * Member: Ditampilkan pada bagian header metadata (di bawah Tanggal/Nota jika ada).
     * Kasir: Dipindahkan ke bagian paling bawah struk, tepat di bawah teks ucapan terima kasih/footer (Kasir: Admin).
   * Penyesuaian tata letak yang identik pada dokumen cetak PDF.
 * src/components/ReceiptModal.vue
   * Penambahan panggilan emit('close') pada fungsi handleDownloadPdf agar modal nota otomatis tertutup dan kembali ke mode siap transaksi setelah file PDF selesai diunduh.
5. Optimalisasi Halaman Kasir (Auto-Focus Searchbar)
 * src/views/Kasir.vue
   * Penambahan ref="searchInputRef" pada input pencarian produk.
   * Penambahan fungsi focusSearchInput() yang dipanggil saat onMounted dan onActivated (<keep-alive>) untuk memastikan kursor langsung aktif di kolom pencarian tanpa perlu diklik manual.
