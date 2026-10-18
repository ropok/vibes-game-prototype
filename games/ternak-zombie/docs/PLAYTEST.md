# Playtest

## Pemeriksaan otomatis

`npm test` memeriksa simulasi engine. `npm run smoke:browser` menjalankan build produksi melalui path bersarang dengan input keyboard serta sentuh: tangkap zombie dari sisi timur dan selatan, produksi energi, generator mati, pause, upgrade Kinetik 10 detik, keluar zona untuk menahan progres, kembali tanpa biaya ganda, serta pembangunan tembok 8 detik dengan HP nyata. Level Kinetik berikutnya memerlukan 20 detik. Restart memakai konfirmasi. Data posisi dan zona dibaca dari status publik; smoke tidak menyuntikkan state permainan.

`npm run smoke:layout` adalah pemeriksaan singkat empat ukuran layar (1366×900, 390×844, 320×640, 844×390): HUD berada di layar, minimap terlihat, canvas tampil, dan tidak ada overflow horizontal. Gunakan pemeriksaan singkat ini setelah perubahan CSS; jalankan smoke mekanik ulang bila perilaku game berubah.

## Pemeriksaan manual

- Mulai sebagai Raya. Pancing zombie liar dan bawa masuk area generator dari beberapa sisi; tidak ada pintu khusus.
- Amati tawanan bergerak dalam kandang dan baterai bertambah. Matikan generator: produksi harus nol. Pause harus membekukan gerakan dan sumber daya.
- Berdiri di zona tanah untuk meningkatkan Kinetik, shelter, tembok, dan turret. Biaya dibayar sekali saat pekerjaan dimulai; keluar menahan progres dan kembali melanjutkannya. Pastikan progres terlihat di dunia, kapasitas berubah setelah selesai, serta tembok awalnya belum ada dan memiliki HP setelah dibangun. Kumpulkan rongsok dan perhatikan energi turret saat menembak. Pertahankan shelter selama malam dan periksa hasil serta restart.
- Periksa keyboard, tombol sentuh, audio setelah interaksi, bantuan, portrait, landscape, dan fullscreen iframe itch.io.

## Batas bukti

Smoke browser berfokus pada rangkaian awal dan integrasi kontrol, bukan menunggu seluruh malam. Hasil akhir malam dan aturan gelombang diverifikasi lewat test simulasi. Screenshot lokal tidak membuktikan kompatibilitas ponsel fisik atau deployment itch.io. Catat hasil eksekusi aktual serta keterbatasan yang ditemukan pada laporan akhir.

## Status validasi perubahan zona — 18 Oktober 2026

- Seluruh 27 test engine lulus. Build dan packaging lulus; ZIP memuat 3 file dengan ukuran 362.626 byte.
- Smoke mekanik produksi keyboard dan sentuh lulus: dua arah penangkapan, gerak tawanan dan energi, generator mati, pause, pembayaran sekali, progres upgrade tertahan saat keluar zona lalu dilanjutkan, tembok dengan HP nyata, serta restart terkonfirmasi.
- Layout lulus pada 1366×900, 390×844, 320×640, dan 844×390, termasuk progres aktif di dalam layar tanpa overflow horizontal. Screenshot penangkapan, progres upgrade, dan tembok selesai tersedia.
- Setelah perbaikan tampilan akhir, build diperbarui dan pemeriksaan produksi terarah lulus: `DINDING · LV 1 ✓`, tanpa panah ke level 2, serta progres penuh 1/1 saat tetap berdiri di zona. Bukti: `artifacts/wall-completed-ui.png`.
- Preview lokal port 4181 merespons HTTP 200.

Browser smoke tidak menunggu gelombang malam penuh; cakupan akhir malam berasal dari test simulasi. Ponsel fisik dan halaman itch.io yang dihosting belum diuji. Deployment belum dijalankan.
