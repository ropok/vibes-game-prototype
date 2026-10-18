# Permisi Paket!

Game petualangan kurir berbahasa Indonesia untuk browser desktop dan ponsel. Ambil satu paket di Pos Paket, jelajahi tiga kampung, temukan pintu penerima, lalu gunakan upah untuk meningkatkan perlengkapan. Target pertama adalah 12 pengantaran; permainan tetap berlanjut setelah target tercapai.

Seluruh gambar dibuat secara prosedural di dalam game. Tidak memuat font, gambar, musik, akun, atau layanan eksternal.

## Jalankan

Memerlukan Node.js 20.19+ atau 22.12+ dan npm. Dari direktori ini:

```sh
npm ci
npm run dev
```

Buka alamat lokal yang ditampilkan. Untuk produksi gunakan `npm run build`; hasilnya berada di `dist/`, dengan jalur aset relatif agar dapat dimainkan dalam iframe. Lihat [panduan distribusi](docs/DEPLOYMENT.md) untuk paket itch.io dan pemeriksaan browser.

## Kontrol

| Tindakan | Desktop | Ponsel |
| --- | --- | --- |
| Bergerak | WASD atau tombol panah | Joystick kiri |
| Berlari | Tahan Shift | Tahan Lari |
| Ambil paket / antar / bengkel / pulih | E atau tombol Interaksi | Tombol Interaksi |
| Jeda / lanjut | Escape atau Jeda | Jeda |
| Panduan | Bantuan | Bantuan |
| Suara opsional | Tombol Suara | Tombol Suara |

Peta kecil memperlihatkan posisi kurir, tujuan kuning, Pos Paket (P), dan Bengkel Siap Jalan (B). Panah pada panel misi menunjuk tujuan. Kamera utama mengikuti kurir dan hanya menampilkan lingkungan sekitarnya, sehingga pemain harus menjelajahi kota untuk menemukan rumah.

Saat pengantaran berhasil, kurir berteriak **“MISI PAKET!”** melalui balon percakapan yang mengikuti kurir sekitar dua detik. Tombol Interaksi di pintu tujuan menampilkan “Teriak: MISI PAKET!”. Aktifkan **Suara** untuk mendengar teriakan menggunakan suara bahasa Indonesia dari browser jika tersedia. Suara awalnya mati; balon tetap muncul pada browser tanpa dukungan suara. Teriakan tidak menjeda permainan dan tidak menambah pembayaran. Jeda, pindah tab, mulai ulang, dan mematikan suara menghentikan ucapan yang sedang berlangsung.

Kurir memiliki tampilan depan, belakang, kanan, dan kiri yang berbeda, serta mempertahankan arah terakhir saat berhenti. Tampilan belakang memperlihatkan ransel paket, tampilan depan memperlihatkan wajah dan tali tas, sementara kedua profil memperlihatkan sisi helm dan paket. Animasi langkah ringan mengikuti gerakan dan dinonaktifkan jika perangkat meminta pengurangan gerakan. Semua arah mempertahankan perubahan warna helm dan jaket dari peningkatan.

## Aturan

- Mendekat hingga 96 unit dari loket atau pintu untuk berinteraksi. Hanya rumah penerima paket aktif yang menerima pengantaran.
- Upah dasar Rp80 ditambah bonus jarak hingga Rp100. Upah dikunci ketika paket diterima dan dibayar sekali setelah paket sampai.
- Berlari meningkatkan kecepatan 45%, menghabiskan 22 stamina per detik. Berjalan atau diam memulihkan 16 stamina per detik.
- Enam kendaraan mengitari jalan. Tabrakan mengurangi 25 kondisi dasar dan memberi perlindungan singkat 1,5 detik. Jika kondisi habis, kurir kembali ke pos dengan paket dan uang tetap aman.
- Berinteraksi di pos memulihkan seluruh kondisi dan stamina secara gratis. Paket baru diambil jika tas kosong.
- Setiap perlengkapan memiliki tiga level, dengan biaya Rp100, Rp200, lalu Rp350. Pembelian hanya tersedia di bengkel.

| Perlengkapan | Efek setiap level |
| --- | --- |
| Sepatu kilat | +12% kecepatan jalan dan lari |
| Tas profesional | +15% upah paket yang diambil berikutnya |
| Helm tangguh | −15% kerusakan tabrakan dasar |
| Jaket nyaman | +25 kapasitas stamina |

## Simpan dan jeda

Progres disimpan otomatis di `localStorage` setiap dua detik, setelah transaksi, serta ketika meninggalkan halaman. Posisi, uang, paket aktif, jumlah pengantaran, dan peningkatan tetap tersimpan. Tab yang kehilangan fokus otomatis dijeda; tidak ada penghasilan atau pergerakan saat offline. Data rusak atau versi tidak dikenal memulai progres bersih. Jika penyimpanan browser tidak tersedia, sesi tetap bisa dimainkan dan status simpan menjelaskan kondisinya.

Menu Bantuan atau Jeda menyediakan mulai ulang dengan konfirmasi. Menghapus penyimpanan browser juga menghapus progres.

## Validasi dan struktur

```sh
npm test
npm run build
npm run smoke:browser
npm run smoke:shout
npm run smoke:sprites
npm run package:itch
```

- `src/engine.js`: simulasi murni dengan langkah tetap 1/60 detik, transaksi, dan validasi simpan.
- `src/data.js`: kota 3200 × 2400, 18 rumah, jaringan jalan, pos, bengkel, dan data peningkatan.
- `src/art.js`: ilustrasi kota dan tekstur karakter lokal.
- `src/main.js`: kamera Phaser, UI, input keyboard/sentuh, peta, jeda, dan penyimpanan.
- `tests/`: pengujian aturan permainan.
- `scripts/`: validasi browser dan paket distribusi.

Rancangan lengkap berada di [GDD](docs/GDD.md). Kode mengikuti lisensi MIT pada akar repositori.
