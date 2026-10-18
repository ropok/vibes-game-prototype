# Build dan itch.io

Jalankan dari `games/mbg-evolution` menggunakan Node.js 22:

```sh
npm ci
npm test
npm run build
npm run package:itch
```

QA browser produksi: `npm run smoke:browser` menjalankan kampanye lengkap, sedangkan `npm run smoke:embed` menjalankan pemeriksaan singkat empat ukuran iframe dan evolusi pertama. Keduanya memerlukan Playwright/Chromium; lihat `PLAYTEST.md` untuk konfigurasi lokal.

Arsip `artifacts/mbg-evolution-web.zip` berisi `index.html` di akar. Build memakai referensi aset relatif agar dapat berjalan di direktori bersarang dan iframe. Packaging menolak aset hilang, impor eksternal, symlink, dan batas arsip yang terlampaui. Game tidak membutuhkan server aplikasi, akun pemain, atau layanan jaringan.

Untuk unggah manual, buat proyek itch.io berjenis HTML lalu unggah ZIP tersebut dan tandai sebagai game browser. Sesuaikan ukuran iframe dan aktifkan dukungan seluler. Uji tombol sentuh, audio setelah interaksi, penyimpanan, dan tampilan sempit di halaman proyek sebelum publikasi.

Workflow `deploy-mbg-evolution-itch.yml` hanya berjalan melalui `workflow_dispatch`. Siapkan environment GitHub `itch-mbg-evolution` dengan variable `ITCH_TARGET` berformat `username/slug` dan secret `BUTLER_API_KEY`. Workflow memvalidasi, membangun, lalu mengunggah direktori `dist` ke kanal `html5` memakai butler resmi. Jangan simpan kunci di repository. Penambahan workflow bukan pelaksanaan deployment; publikasi tetap mengikuti instruksi pemilik proyek.

Progress tersimpan di browser asal yang sama. Mode privat, pemblokiran penyimpanan, penghapusan data situs, atau perubahan asal dapat menghilangkan progress. Game tetap dapat dimainkan dalam sesi ketika penyimpanan tidak tersedia.

Artefak akhir revisi arena, 17 Oktober 2026: `mbg-evolution-web.zip`, 362.351 byte, SHA-256 `72E8FF838F5BE8F92C02CB9112127AC7B1274F387F614825FA1F6C3AA00D187B`. Sebanyak 22/22 test engine dan kampanye produksi penuh 100 serapan/12 bentuk lulus. Setelah pembaruan CSS serta ilustrasi terakhir, build, packaging, dan pemeriksaan iframe singkat empat ukuran layar kembali lulus. Belum dilakukan deployment atau verifikasi halaman itch.io yang dihosting maupun ponsel fisik.
