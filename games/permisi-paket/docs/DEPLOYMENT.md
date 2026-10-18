# Build dan itch.io

Jalankan dari `games/permisi-paket` memakai Node.js 22:

```sh
npm ci
npm test
npm run build
npm run package:itch
npm run smoke:browser
```

Arsip `artifacts/permisi-paket-web.zip` menempatkan `index.html` di akar. Referensi aset relatif mendukung direktori bersarang dan iframe. Packaging memeriksa aset hilang, impor jaringan, symlink, dan batas ukuran itch.io. Game berjalan tanpa backend maupun akun pemain.

Untuk unggah manual, buat proyek itch.io berjenis HTML, unggah ZIP, lalu tandai sebagai game browser. Aktifkan dukungan mobile dan fullscreen. Uji portrait dan landscape di halaman itch.io sebelum publikasi, termasuk tombol sentuh, pause, dan penyimpanan. Progress terikat pada browser dan asal situs; perpindahan dari localhost ke itch.io tidak memindahkan save.

Workflow `.github/workflows/deploy-permisi-paket-itch.yml` hanya berjalan melalui `workflow_dispatch`. Setelah akun itch.io siap, buat environment GitHub `itch-permisi-paket`, variable `ITCH_TARGET` berformat `username/slug`, dan secret `BUTLER_API_KEY`. Jangan masukkan kunci ke `.env` yang di-commit. Workflow melakukan validasi, build, packaging, dan upload `dist` ke kanal `html5` memakai butler resmi. Penambahan konfigurasi ini tidak menjalankan deployment atau menerbitkan halaman proyek.

CI memasukkan game ini dalam matrix validasi repository. Bukti pengujian lokal dan screenshot disimpan di `artifacts`; hasil akhir yang sudah benar-benar dijalankan dicatat dalam laporan perubahan, bukan diasumsikan dari keberadaan skrip.

Validasi lokal 18 Oktober 2026: instalasi bersih memakai npm 10 dan lockfile proyek lulus, 15 test engine lulus, build serta packaging lulus. ZIP akhir berukuran 359.412 byte. Smoke gameplay lengkap pertama lulus; setelah perbaikan CSS panel misi, pemeriksaan layout akhir empat viewport juga lulus. Detail batas pengujian ulang gameplay dicatat di `PLAYTEST.md`. Preview lokal pada port 4179 merespons HTTP 200. Deployment, halaman itch.io yang dihosting, dan ponsel fisik belum diuji.
