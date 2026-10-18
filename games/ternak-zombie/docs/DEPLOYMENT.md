# Build dan itch.io

Dari `games/ternak-zombie`, gunakan Node.js 22 dan npm 10:

```sh
npm ci
npm test
npm run build
npm run package:itch
npm run smoke:browser
npm run smoke:layout
```

ZIP `artifacts/ternak-zombie-web.zip` berisi `index.html` di akar, dengan aset relatif untuk iframe dan path bersarang. Packaging memeriksa referensi aset, impor jaringan, symlink, serta batas file dan ukuran itch.io. Game tidak membutuhkan backend, kredensial, atau akun pemain. Browser smoke membutuhkan Playwright; arahkan `PLAYWRIGHT_MODULE` dan `PLAYWRIGHT_EXECUTABLE` ke instalasi lokal bila tidak tersedia dalam resolusi module biasa.

Unggah ZIP ke proyek HTML itch.io, tandai sebagai game browser, aktifkan mobile dan fullscreen, lalu periksa kontrol sentuh di portrait dan landscape sebelum publikasi.

Workflow `.github/workflows/deploy-ternak-zombie-itch.yml` hanya berjalan manual melalui `workflow_dispatch`. Siapkan GitHub environment `itch-ternak-zombie`, variable `ITCH_TARGET` berupa `username/slug`, dan secret `BUTLER_API_KEY`. Workflow memvalidasi test, build, dan arsip sebelum mengunggah `dist` ke kanal `html5` memakai butler resmi. Jangan commit API key. Konfigurasi workflow tidak berarti deployment sudah dijalankan atau halaman itch.io sudah diterbitkan.

CI repository menyertakan game ini dalam matrix build. Screenshot dan arsip lokal ditulis ke `artifacts`. Status validasi aktual dicatat pada hasil pekerjaan; keberadaan skrip bukan bukti bahwa pengujian telah lulus. Halaman itch.io yang dihosting dan ponsel fisik perlu diuji sesudah deployment.

Validasi perubahan zona 18 Oktober 2026: 27 dari 27 test engine lulus; build dan packaging lulus dengan 3 file dan ZIP 362.626 byte. Smoke mekanik keyboard/sentuh dan layout empat ukuran layar lulus. Setelah perbaikan UI akhir, build diperbarui dan pemeriksaan produksi terarah memastikan tembok selesai menampilkan level 1 serta progres penuh tanpa panah upgrade berikutnya. Preview lokal port 4181 merespons HTTP 200. Deployment belum dijalankan; halaman itch.io yang dihosting serta ponsel fisik belum diverifikasi.
