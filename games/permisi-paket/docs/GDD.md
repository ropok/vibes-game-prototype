# Permisi Paket! — Game Design Document

## Gagasan dan pengalaman

Permisi Paket! adalah petualangan kurir dari atas di kota kecil Indonesia yang cerah. Pemain membawa paket dari pos ke berbagai rumah, memperoleh uang, dan meningkatkan perlengkapan. Kesenangannya datang dari mengenali lingkungan, memilih lintasan, menghindari lalu lintas, lalu merasakan perjalanan menjadi lebih lancar setelah membeli peningkatan.

Prototipe berdiri sendiri untuk desktop dan browser ponsel. Satu sesi awal berlangsung sekitar 10–20 menit bergantung rute dan pilihan peningkatan. Tidak ada akun, server, iklan, pengumpulan data, atau kebutuhan aset dari jaringan setelah game dimuat.

## Siklus permainan

1. Ambil satu paket di Pos Paket dan pulihkan kondisi secara gratis.
2. Lihat nama penerima, nomor rumah, distrik, upah, arah, dan jarak pada panel misi.
3. Jelajahi jalan menuju pintu rumah sambil mengatur stamina dan menghindari kendaraan.
4. Interaksi di pintu tujuan untuk menyerahkan paket dan menerima uang satu kali.
5. Kembali ke pos untuk pekerjaan berikutnya atau mampir ke Bengkel Siap Jalan.

Tiga paket pertama menuju rumah terdekat di Kebun Sore. Paket selanjutnya mengajak pemain ke Kampung Pelangi dan Taman Teduh. Urutan tetap membuat proses pengenalan lebih jelas dan simulasi mudah diuji. Sesudah 18 tujuan, urutan berulang dengan ID paket baru.

## Dunia dan navigasi

Dunia berukuran 3200 × 2400 unit dengan 18 rumah di tiga distrik. Jaringan jalan horizontal pada y=500, 1150, 1800, dan 2150 terhubung oleh jalan vertikal pada x=500, 1600, dan 2700. Rumah menghadap jalan dan memiliki pintu serta jalur pendek yang bisa didekati. Pos dan bengkel bersebelahan di sisi selatan kota. Taman, pepohonan, kebun bunga, trotoar, zebra cross, nomor rumah, dan penduduk membangun identitas tempat.

Kamera mengikuti kurir dengan batas dunia. Bidang pandang maksimal sekitar 1040 × 800 unit; pada ponsel lebih sempit. Peta kecil bersifat skematis, menampilkan jaringan jalan dan penanda penting. Kotak transparan menunjukkan bidang kamera. Panah tujuan tetap terlihat di panel misi, sedangkan pintu tujuan memiliki cincin dan penanda kuning di dunia.

Bangunan menghalangi gerakan dengan radius tubuh 14 unit. Taman dan dekorasi tidak menambah hambatan yang membingungkan. Tidak ada fog of war permanen, teleportasi tujuan, atau peta utama yang memperlihatkan seluruh kota sekaligus.

## Gerakan, risiko, dan pemulihan

Kecepatan dasar 180 unit/detik. Input diagonal dinormalisasi. Lari menggunakan pengali 1,45 dengan konsumsi 22 stamina/detik; stamina awal 100 dan pulih 16/detik saat berjalan atau diam. Kurir tetap dapat berjalan ketika stamina habis.

Enam kendaraan mengikuti lintasan jalan yang terhubung. Tabrakan memberi kerusakan dasar 25, diperkecil helm, lalu perlindungan 1,5 detik. Kondisi nol mengembalikan kurir ke pos dengan kondisi dan stamina penuh, tanpa kehilangan uang atau paket. Pos menawarkan pemulihan gratis kapan pun. Penduduk merupakan dekorasi bergerak tanpa kerusakan.

## Ekonomi dan peningkatan

Upah paket adalah pembulatan dari `(80 + min(100, jarakPosKeRumah / 23)) × (1 + 0,15 × levelTas)`. Nilai dikunci saat paket diterima. ID unik dan daftar pengantaran selesai mencegah pembayaran berulang.

Masing-masing peningkatan memiliki level 0–3. Biaya level berikutnya adalah Rp100, Rp200, dan Rp350. Dana diperiksa sebelum transaksi dan pembelian membutuhkan kedekatan dengan bengkel.

| Peningkatan | Efek | Komunikasi visual |
| --- | --- | --- |
| Sepatu kilat | +12% kecepatan per level | Angka level di bengkel dan gerakan lebih cepat |
| Tas profesional | +15% upah per level | Nilai upah baru pada panel paket |
| Helm tangguh | −15% kerusakan dasar per level | Warna helm dan garis reflektif berubah |
| Jaket nyaman | +25 stamina per level | Warna jaket, aksen reflektif, dan kapasitas bar berubah |

## Tujuan dan kelanjutan

Penghargaan “Kurir Andalan” muncul setelah 12 paket. Tidak ada penghentian sesi: pemain dapat menuntaskan semua peningkatan, mengunjungi seluruh distrik, dan terus mengantar. Tidak ada timer yang memaksa, penalti uang, atau kondisi kalah permanen.

## Antarmuka dan kontrol

HUD menampilkan uang, jumlah pengantaran, kondisi, stamina, misi, jarak, panah, dan peta. Tombol Interaksi berubah mengikuti konteks. Desktop mendukung WASD/panah, Shift, E, dan Escape. Ponsel menggunakan joystick analog, tombol lari yang ditahan, dan Interaksi. Suara sintetis pendek dapat diaktifkan melalui tombol khusus.

Di pintu penerima, tombol berubah menjadi “Teriak: MISI PAKET!”. Pengantaran yang berhasil memunculkan balon “MISI PAKET!” selama 2,2 detik yang mengikuti kurir, menyesuaikan batas layar, dan menghindari panel HUD. Balon tidak menangkap sentuhan, tidak menambah gerakan animasi, serta tidak menjeda atau mengulang transaksi. Jika Suara dinyalakan, interaksi langsung pemain dapat mengucapkan kalimat tersebut melalui Speech Synthesis dengan bahasa `id-ID`, memilih suara Indonesia jika tersedia. Dukungan suara bersifat opsional dan tidak membutuhkan aset suara eksternal. Ucapan sebelumnya dibatalkan sebelum ucapan baru, serta dihentikan saat membuka dialog, berpindah tab, mulai ulang, atau mematikan suara.

Sprite kurir memiliki empat arah berbeda: depan dengan wajah dan tali tas, belakang dengan ransel penuh tanpa wajah, serta profil kanan/kiri dengan sisi wajah, helm, dan paket yang sesuai. Arah mengikuti sumbu gerak dominan dan bertahan saat diam. Gerak diagonal seimbang mempertahankan arah terakhir yang sesuai agar tidak berkedip antararah. Dua pose langkah menggerakkan lengan dan kaki saat berjalan/berlari; perangkat dengan preferensi reduced motion memakai pose diam. Setiap arah dan pose memiliki seluruh varian helm dan jaket level 0–3.

Intro mengajarkan tiga langkah inti. Bantuan menjelaskan aturan dan penyimpanan. Jeda, bantuan, konfirmasi reset, dan bengkel membekukan simulasi. Semua input dibersihkan saat membuka dialog, kehilangan fokus, atau membatalkan sentuhan agar kurir tidak bergerak tanpa sengaja. Dialog mendukung keyboard dan fokus tetap di dalam dialog.

## Teknologi dan penyimpanan

Phaser 3.90 merender dunia; Vite membangun berkas browser dengan jalur aset relatif. Seluruh ilustrasi dibuat dengan Graphics dan tekstur Canvas lokal. UI menggunakan HTML/CSS sehingga panel dan tombol dapat menyesuaikan layar sempit.

Engine menggunakan langkah tetap 1/60 detik dengan batas masukan waktu 0,25 detik untuk mencegah lompatan panjang. State permainan dapat diserialisasi dan diuji tanpa Phaser. Penyimpanan versi 1 mencakup posisi valid, kondisi, stamina, saldo, peningkatan, paket aktif, urutan paket, dan daftar ID selesai. Data yang tidak memenuhi skema ditolak menjadi state baru. Waktu simulasi, tombol tertahan, status dialog, dan waktu offline tidak disimpan.

## Lingkup prototipe

Termasuk dunia tunggal, 18 penerima, satu jenis paket, empat jalur peningkatan, kendaraan, kontrol sentuh dan keyboard, peta, penyimpanan lokal, tutorial, bantuan, reset terkonfirmasi, dan penghargaan 12 pengantaran. Pengembangan lanjutan dapat menambah variasi pekerjaan dan kawasan, tetapi prototipe ini sudah memiliki siklus pengantaran lengkap tanpa layanan eksternal.
