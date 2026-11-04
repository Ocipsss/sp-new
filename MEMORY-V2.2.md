# CHANGELOG-V2.2.md - Ringkasan Perubahan Sistem POS Sinar Pagi

Dokumentasi pembaruan dan penambahan fitur dari versi MEMO V2.1 ke versi V2.2 (berdasarkan analisis `src.txt` terbaru).

---

## 1. Skema Database & Sinkronisasi Cloud
* **IndexedDB v2 (`SinarPagiDB`)**: Penambahan tabel baru (`digital_transactions`, `shopping_list`, `cash_accounts`, `cash_mutations`, `debt_payments`) untuk memisah pencatatan keuangan dan transaksi digital.
* **Firestore Sync Engine**: Integrasi pemicu *debounced push* otomatis saat terjadi perubahan data lokal, serta pengaman flag `isPullingFromCloud` guna mencegah loop sinkronisasi.
* **Kalkulasi Piutang Reaktif**: Sisa utang/piutang member dihitung ulang secara presisi dengan `big.js` setiap kali ada transaksi kredit atau pembayaran cicilan.

## 2. Peningkatan Transaksi Kasir (`Kasir.vue`)
* **Stok Minus (Opsi B)**: Transaksi tetap dapat diproses meskipun stok barang di bawah nol, dilengkapi notifikasi *toast* yang mendaftar barang-barang minus.
* **Eceran & Jasa**: Pengelolaan eceran rokok (batangan atau setengah bungkus via `product_packages`) dan otomatisasi biaya jasa seduh atau olahan (`services`).
* **Pending Cart & Scanner Barcode**: Kemampuan menyimpan sementara keranjang belanja serta optimasi *buffer keydown debounced* untuk pemindai barcode fisik HID.

## 3. Transaksi Digital & PPOB (`ProductsDigital.vue`)
* **Layanan Top Up & Tarik Tunai**: Dukungan transaksi e-wallet dan transfer bank (DANA, OVO, BRI, dll).
* **Fleksibilitas Biaya Admin**: Opsi pemotongan admin via **CASH** (masuk ke kas laci) atau **DIGITAL** (memotong saldo bank).

## 4. Modul Restock & Kulakan (`Shopping.vue`)
* **Auto-Restock**: Otomatis menarik produk yang menyentuh batas minimum stok (`qty <= minStock`).
* **Integrasi Stok & Kas**: Penandaan barang dibeli secara otomatis menambah stok master dan mencatat pengeluaran di kas/bank.
* **Format Ekspor WA**: Fitur menyalin daftar belanja menjadi format teks rapi untuk dikirimkan ke supplier via WhatsApp.

## 5. Manajemen Keuangan & Pembatalan Transaksi (Void)
* **Dual Account Aset**: Pemisahan pencatatan kas fisik laci (`acc_cash`) dan rekening/QRIS (`acc_bank`).
* **Hitung Ulang Historis**: Fungsi `recalculateFromHistory` untuk merestorasi akumulasi saldo kas dan bank dari seluruh riwayat awal transaksi.
* **Atomic Void**: Pembatalan transaksi membalikkan stok, mengoreksi mutasi kas/bank, serta menyesuaikan poin dan piutang member secara simultan.

## 6. Hardware, PWA, & Sistem
* **Cetak Nota & PDF**: Pengiriman byte ESC/POS berbasis *20-byte chunking* via Web Bluetooth API dan pembuatan dokumen PDF (`jsPDF`).
* **Keamanan & PWA**: Akses operator via PIN Numpad touchscreen, proteksi *route guard*, dan penanganan tombol *back* fisik Android PWA.
* **Pemeliharaan Data**: Backup/restore JSON dengan *network guard*, konversi massal nama barang ke KAPITAL, serta reset database lokal/cloud untuk pengujian.
