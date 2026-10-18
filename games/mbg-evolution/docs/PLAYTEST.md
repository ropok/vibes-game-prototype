# Playtest

Setelah `npm run build`, jalankan `npm run smoke:browser` untuk kampanye lengkap. Gunakan `npm run smoke:embed` untuk regresi singkat: empat ukuran iframe, interaksi sentuh, evolusi pertama di desktop, label progress, target energi berikutnya, reload, dan info koleksi. Harness menggunakan Chromium headless, menyajikan build produksi pada direktori bersarang, dan membuka game dalam iframe. Jika Playwright bukan dependency lokal, berikan `PLAYWRIGHT_MODULE` dan bila perlu `PLAYWRIGHT_EXECUTABLE` sebagai path absolut. Bukti gambar disimpan di `artifacts`.

Periksa desktop 1440×1000, sentuh 390×844, sempit 320×568, dan landscape 844×390. Pastikan makanan dapat dipukul lalu diserap, makanan hidup tidak langsung menghasilkan energi, evolusi membutuhkan energi yang cukup, dan dialog penemuan dapat ditutup. Koleksi hanya mengungkap nama, gambar, dan info bentuk yang telah ditemukan.

Kampanye maju melalui target makanan di arena sampai bentuk ke-12; evolusi berlangsung otomatis saat ambang energi tercapai. Harness tidak menyuntikkan state engine atau menyediakan cheat produk. Periksa ompreng kecil mendekati target sebelum memukul serta animasi konsumsi saat menyerap. Buku Evolusi berada di arena; panel pilih bahan, sidebar, dan tombol evolusi manual tidak ditampilkan. Uji gambar tiap bentuk, indikator energi, keyboard, fokus dialog, mute, reduced motion, dan target sentuh.

Uji reload sesudah penyerapan dan evolusi: energi serta koleksi harus tetap konsisten dan penemuan tidak boleh terduplikasi. Pause harus menghentikan perubahan arena. Tombol reset membuka konfirmasi; batal mempertahankan progress, konfirmasi memulai sesi awal. Pada akhir kampanye, mulai ulang juga harus memerlukan konfirmasi.

Harness memeriksa fallback save rusak/tidak tersedia menggunakan konteks browser khusus. Jangan mengubah data pemain nyata untuk pengujian. Screenshot dan hasil otomatis melengkapi playtest manusia; keduanya tidak membuktikan pengalaman pada semua perangkat atau kebijakan penyimpanan pihak ketiga.

## Riwayat validasi 17 Oktober 2026 sebelum revisi arena

Lulus: 21 test, build produksi, packaging ZIP, dan smoke kampanye lengkap. Kampanye mencapai 100 serapan melalui aksi UI dan membuka seluruh 12 bentuk, dengan gambar tiap bentuk. Pemeriksaan empat ukuran layar, iframe bersarang, save/reload, serta fallback simpanan rusak dan tidak tersedia juga lulus.

Build dan packaging sumber akhir serta `npm run smoke:embed` lulus di desktop, touch, narrow, dan landscape. Regresi evolusi pertama memverifikasi label progress langsung, XP, serta reload tanpa duplikasi. Pengujian dilakukan pada Chromium otomatis; ponsel fisik dan halaman itch.io yang dihosting belum diverifikasi.

Hasil di atas berlaku untuk versi sebelum revisi arena dan evolusi otomatis.

## Hasil revisi arena dan evolusi otomatis

Lulus: 22/22 test engine dan kampanye produksi penuh dengan 100 serapan, seluruh 12 bentuk, evolusi otomatis, serta animasi pendekatan dan konsumsi sebelum XP diberikan. Save/reload, reset dengan konfirmasi, dan empat ukuran layar juga lulus. Setelah pembaruan CSS serta ilustrasi terakhir, build, packaging, dan regresi singkat empat ukuran layar kembali lulus. Ponsel fisik dan halaman itch.io yang dihosting belum diverifikasi.
