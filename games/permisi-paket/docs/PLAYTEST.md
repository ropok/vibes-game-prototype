# Playtest

Gunakan `npm test`, `npm run build`, `npm run package:itch`, lalu `npm run smoke:browser`. Smoke memakai Chromium melalui Playwright. Jika Playwright tersedia dari runtime lain, set `PLAYWRIGHT_MODULE` ke entry module absolut; gunakan `PLAYWRIGHT_EXECUTABLE` untuk executable Chromium yang sudah tersedia. Artefak lokal tersimpan di `artifacts/`.

Periksa satu putaran kerja lengkap: datangi depot, ambil paket, ikuti panah dan minimap, berhenti dekat rumah tujuan, serahkan paket, terima bayaran, lalu beli upgrade. Ulangi pengiriman untuk memastikan tujuan berganti dan jalan tetap bisa dilalui. Pemain bergerak dengan keyboard atau tombol sentuh; tidak ada teleport dalam smoke.

Periksa desktop, portrait 390×844, portrait sempit 320×640, dan landscape 844×390. Dunia harus lebih besar dari layar kamera; minimap dan panah tetap terlihat. Pastikan HUD tidak menutup kontrol, tombol dapat disentuh, halaman tidak bergulir mendatar, dan kamera mengikuti kurir ketika melintasi kota.

Saat bergerak, aktifkan pause dan pastikan posisi tidak bergeser. Lanjutkan permainan, reload dan periksa uang serta upgrade tersimpan. Reset harus mengembalikan progress awal. Uji browser yang memblokir localStorage: permainan harus tetap dapat dimulai dan dimainkan dalam sesi dengan status penyimpanan yang jujur.

Pengujian otomatis tidak menggantikan sentuhan pada ponsel fisik atau pemeriksaan iframe itch.io yang sudah dihosting. Sebelum publikasi, ulangi pengiriman di perangkat nyata, pindahkan aplikasi ke latar belakang, putar orientasi layar, dan pastikan kontrol tidak tersangkut setelah kembali.

## Catatan validasi 18 Oktober 2026

Sebanyak 15 test engine lulus. Instalasi bersih dari lockfile, build produksi, dan packaging ZIP juga lulus. Smoke browser lengkap pertama lulus di desktop, mobile portrait, portrait sempit, dan landscape. Putaran itu memeriksa pengiriman melalui keyboard dan sentuhan, pembayaran, pembelian upgrade, save/load, pause tanpa pergeseran posisi, reset, serta penyimpanan rusak dan penyimpanan yang diblokir.

Peninjauan screenshot menemukan panel misi terpotong pada desktop. CSS telah diperbaiki, lalu build dan packaging diulang. Pengulangan smoke gameplay berhenti pada navigasi mobile ketika kurir sudah berjarak sekitar 25 piksel dari waypoint tetapi toleransi pengemudi otomatis masih 12 piksel; seluruh pengulangan itu tidak dinyatakan lulus. Toleransi navigasi diperbarui menjadi 32 piksel, masih di dalam radius interaksi pintu 96 piksel.

Pemeriksaan akhir `npm run smoke:layout` lulus pada keempat ukuran layar. Pemeriksaan ini memvalidasi batas HUD, minimap, panah, kanvas kota, kamera yang menampilkan sebagian dunia, tidak adanya overflow horizontal, input gerak nyata, dan pause. Screenshot diperbarui di `artifacts/desktop.png`, `mobile.png`, `narrow.png`, dan `landscape.png`. Lulusnya smoke gameplay pertama dan pemeriksaan layout akhir menjadi bukti terpisah untuk mekanik serta perbaikan CSS terakhir. Preview lokal pada port 4179 mengembalikan HTTP 200.

Belum dilakukan pengujian ponsel fisik, deployment, maupun pemeriksaan halaman itch.io yang dihosting.

Pembaruan visual dan seruan pengiriman telah divalidasi: build serta packaging akhir lulus dengan ZIP 361.021 byte. `npm run smoke:shout` lulus melalui pengiriman nyata, memeriksa teks `MISI PAKET!`, panggilan speech API berbahasa `id-ID`, pembayaran sekali, kontrol tetap berjalan, dan bubble yang berakhir otomatis. Speech API diganti stub dalam pengujian ini; suara Indonesia yang benar-benar terdengar belum diverifikasi. `npm run smoke:sprites` lulus untuk gerak empat arah, arah saat berhenti, dan empat tekstur berbeda; empat close-up kurir serta bubble juga telah ditinjau secara visual. `npm run smoke:layout` kembali lulus di keempat viewport. Engine tidak berubah sejak 15 test sebelumnya lulus, sehingga test engine tidak diulang untuk pembaruan visual ini.
