// Original fictional creatures. Thresholds are local costs for the next discovery.
const entries = [
  ['Ompreng Kosong',40,'28 × 18 × 7 cm','nasi nyasar','Bersendawa tanpa pernah makan.','Wadah berkaki lidi yang menganggap gema perutnya sebagai lagu kebangsaan pribadi. Badannya masih bersih, tetapi tutupnya sudah mengunyah udara.','Gema perut'],
  ['Ompreng Bertaring',50,'31 × 20 × 10 cm','wortel koprol','Takut pada sikat gigi.','Dua gigi susu tumbuh di bibir wadah, disertai mata yang terlalu yakin akan kemampuan mengunyahnya. Ia mengejar wortel sambil mengeluarkan bunyi sendok jatuh.','Gigitan sendok'],
  ['Ompreng Isi Perdana',60,'34 × 22 × 16 cm','telur loncat','Menghitung butir nasi saat gugup.','Seporsi nasi menjadi rambut, telur menjadi mata tambahan, dan sayuran merambat seperti alis. Untuk pertama kalinya ia merasa lengkap—selama tiga detik.','Rambut nasi'],
  ['Ompreng Lauk Lincah',70,'45 × 29 × 34 cm','tahu kabur','Selalu belok sebelum selesai berpikir.','Empat kaki sosis dan lengan garpu membuatnya berlari miring dengan penuh percaya diri. Tutupnya berkibar seperti topi koki yang salah ukuran.','Langkah sosis'],
  ['Ompreng Kuah Meluap',80,'62 × 40 × 48 cm','bakso menggelinding','Bersin seperti teko.','Perut wadah berubah menjadi kolam sup dengan kumis uap dan ekor mi panjang. Setiap langkah menghasilkan ombak kecil yang terlihat jauh lebih dramatis daripada seharusnya.','Ombak sup'],
  ['Ompreng Beracun Pelangi',90,'77 × 52 × 61 cm','brokoli antariksa','Ceguknya mengubah warna alis.','Setelah menelan jamur komet, kuahnya memendar ungu dan menghasilkan gelembung bermata. Racun ajaib ini membuat sendok bersin dan bayangan menari sendiri.','Gelembung ajaib'],
  ['Ompreng Berkepala Tiga',100,'110 × 84 × 93 cm','tempe kembar','Selalu kalah suara melawan dirinya sendiri.','Tiga tutup tumbuh menjadi kepala yang terus berdebat tentang lauk terakhir. Tubuhnya ditopang kaki lentur, sementara lidah mi saling kusut.','Debat tiga tutup'],
  ['Gerobak Perut Besar',110,'180 × 120 × 150 cm','jagung ngebut','Parkir sambil mendengkur.','Ompreng membesar menjadi gerobak hidup dengan roda donat, cerobong sendok, dan mulut etalase. Ia membunyikan bel setiap kali menemukan camilan yang sudah jelas terlihat.','Bel camilan'],
  ['Dapur Keliling Menggelinding',120,'3 × 2 × 2,8 m','kentang meteor','Menyalakan lampu saat lapar.','Panci menjadi bahu dan kompor dingin membentuk dada, seluruhnya bergerak di atas roda piring. Antena spatulanya mencari aroma dari dimensi sebelah.','Antena aroma'],
  ['SPPG',130,'7 × 5 × 6 m','labu raksasa','Stempelnya berbunyi “nyam”.','Dapur menjelma bangunan berkaki dengan jendela bermata dan pintu yang menjilat remah. Makhluk dapur ini gemar menumpuk panci sebagai mahkota dan menghitung lauk dengan centong.','Centong penghitung'],
  ['Kompleks Dapur Berjalan',150,'15 × 12 × 10 m','semangka bulan','Tersesat di lorong tubuhnya sendiri.','Beberapa dapur bergabung menjadi makhluk berkaki banyak, dihubungkan lorong mi dan pagar sumpit. Setiap cerobong menyenandungkan nada berbeda sehingga makan siangnya terdengar seperti latihan orkestra.','Orkestra cerobong'],
  ['Kopdes',0,'40 × 32 × 25 m','prasmanan galaksi','Rapat dimulai dengan bunyi perut serentak.','Seluruh desa dapur berdiri di atas satu ompreng raksasa, lengkap dengan menara centong dan matahari telur kecil. Ia akhirnya menemukan makanan favoritnya: makan bersama semua kepala yang pernah tumbuh darinya.','Jamuan semesta'],
];
const artTypes = ['empty-tray','fanged-tray','rice-hair-tray','sausage-runner','soup-pool','rainbow-slime','three-lids','donut-cart','stove-rover','walking-kitchen','kitchen-complex','village-tray'];
export const FORMS = Object.freeze(entries.map(([name,threshold,dimensions,favorite,quirk,lore,ability],index) => Object.freeze({ id:index,rank:index+1,name,threshold,dimensions,favorite,quirk,lore,ability,artType:artTypes[index],damage:index+1 })));
export const FOODS = Object.freeze([
  {name:'Nasi Nyasar',hp:1,energy:10,color:'#fff7d8'},
  {name:'Wortel Koprol',hp:2,energy:10,color:'#f38d54'},
  {name:'Telur Loncat',hp:2,energy:10,color:'#ffcf59'},
  {name:'Tahu Kabur',hp:1,energy:10,color:'#efbe79'},
  {name:'Brokoli Antariksa',hp:2,energy:10,color:'#8ab578'},
  {name:'Bakso Menggelinding',hp:3,energy:10,color:'#c48c78'},
].map(Object.freeze));
