const suratConfig = {
  premium1: {
    status: false, // Default false, di-override Supabase
    data: [
      // Surat 1-4
      { nomor: 1, nama: "الفاتحة", nama_latin: "Al-Fatihah", jumlah_ayat: 7 },
      { nomor: 2, nama: "البقرة", nama_latin: "Al-Baqarah", jumlah_ayat: 286 },
      { nomor: 3, nama: "آل عمران", nama_latin: "Ali 'Imran", jumlah_ayat: 200 },
      { nomor: 4, nama: "النساء", nama_latin: "An-Nisa", jumlah_ayat: 176 }
    ]
  },

  premium2: {
    status: false,
    data: [
      // Surat 5-9
      { nomor: 5, nama: "المائدة", nama_latin: "Al-Ma'idah", jumlah_ayat: 120 },
      { nomor: 6, nama: "الأنعام", nama_latin: "Al-An'am", jumlah_ayat: 165 },
      { nomor: 7, nama: "الأعراف", nama_latin: "Al-A'raf", jumlah_ayat: 206 },
      { nomor: 8, nama: "الأنفال", nama_latin: "Al-Anfal", jumlah_ayat: 75 },
      { nomor: 9, nama: "التوبة", nama_latin: "At-Taubah", jumlah_ayat: 129 }
    ]
  },

  premium3: {
    status: false,
    data: [
      // Surat 10-16
      { nomor: 10, nama: "يونس", nama_latin: "Yunus", jumlah_ayat: 109 },
      { nomor: 11, nama: "هود", nama_latin: "Hud", jumlah_ayat: 123 },
      { nomor: 12, nama: "يوسف", nama_latin: "Yusuf", jumlah_ayat: 111 },
      { nomor: 13, nama: "الرعد", nama_latin: "Ar-Ra'd", jumlah_ayat: 43 },
      { nomor: 14, nama: "إبراهيم", nama_latin: "Ibrahim", jumlah_ayat: 52 },
      { nomor: 15, nama: "الحجر", nama_latin: "Al-Hijr", jumlah_ayat: 99 },
      { nomor: 16, nama: "النحل", nama_latin: "An-Nahl", jumlah_ayat: 128 }
    ]
  },

  premium4: {
    status: false,
    data: [
      // Surat 17-22
      { nomor: 17, nama: "الإسراء", nama_latin: "Al-Isra", jumlah_ayat: 111 },
      { nomor: 18, nama: "الكهف", nama_latin: "Al-Kahf", jumlah_ayat: 110 },
      { nomor: 19, nama: "مريم", nama_latin: "Maryam", jumlah_ayat: 98 },
      { nomor: 20, nama: "طه", nama_latin: "Taha", jumlah_ayat: 135 },
      { nomor: 21, nama: "الأنبياء", nama_latin: "Al-Anbiya", jumlah_ayat: 112 },
      { nomor: 22, nama: "الحج", nama_latin: "Al-Hajj", jumlah_ayat: 78 }
    ]
  },

  premium5: {
    status: false,
    data: [
      // Surat 23-28
      { nomor: 23, nama: "المؤمنون", nama_latin: "Al-Mu'minun", jumlah_ayat: 118 },
      { nomor: 24, nama: "النور", nama_latin: "An-Nur", jumlah_ayat: 64 },
      { nomor: 25, nama: "الفرقان", nama_latin: "Al-Furqan", jumlah_ayat: 77 },
      { nomor: 26, nama: "الشعراء", nama_latin: "Asy-Syu'ara", jumlah_ayat: 227 },
      { nomor: 27, nama: "النمل", nama_latin: "An-Naml", jumlah_ayat: 93 },
      { nomor: 28, nama: "القصص", nama_latin: "Al-Qasas", jumlah_ayat: 88 }
    ]
  },

  premium6: {
    status: false,
    data: [
      // Surat 29-37
      { nomor: 29, nama: "العنكبوت", nama_latin: "Al-'Ankabut", jumlah_ayat: 69 },
      { nomor: 30, nama: "الروم", nama_latin: "Ar-Rum", jumlah_ayat: 60 },
      { nomor: 31, nama: "لقمان", nama_latin: "Luqman", jumlah_ayat: 34 },
      { nomor: 32, nama: "السجدة", nama_latin: "As-Sajdah", jumlah_ayat: 30 },
      { nomor: 33, nama: "الأحزاب", nama_latin: "Al-Ahzab", jumlah_ayat: 73 },
      { nomor: 34, nama: "سبإ", nama_latin: "Saba", jumlah_ayat: 54 },
      { nomor: 35, nama: "فاطر", nama_latin: "Fatir", jumlah_ayat: 45 },
      { nomor: 36, nama: "يس", nama_latin: "Yasin", jumlah_ayat: 83 },
      { nomor: 37, nama: "الصافات", nama_latin: "As-Saffat", jumlah_ayat: 182 }
    ]
  },

  premium7: {
    status: false,
    data: [
      // Surat 38-46
      { nomor: 38, nama: "ص", nama_latin: "Sad", jumlah_ayat: 88 },
      { nomor: 39, nama: "الزمر", nama_latin: "Az-Zumar", jumlah_ayat: 75 },
      { nomor: 40, nama: "غافر", nama_latin: "Ghafir", jumlah_ayat: 85 },
      { nomor: 41, nama: "فصلت", nama_latin: "Fussilat", jumlah_ayat: 54 },
      { nomor: 42, nama: "الشورى", nama_latin: "Asy-Syura", jumlah_ayat: 53 },
      { nomor: 43, nama: "الزخرف", nama_latin: "Az-Zukhruf", jumlah_ayat: 89 },
      { nomor: 44, nama: "الدخان", nama_latin: "Ad-Dukhan", jumlah_ayat: 59 },
      { nomor: 45, nama: "الجاثية", nama_latin: "Al-Jasiyah", jumlah_ayat: 37 },
      { nomor: 46, nama: "الأحقاف", nama_latin: "Al-Ahqaf", jumlah_ayat: 35 }
    ]
  },

  premium8: {
    status: false,
    data: [
      // Surat 47-58
      { nomor: 47, nama: "محمد", nama_latin: "Muhammad", jumlah_ayat: 38 },
      { nomor: 48, nama: "الفتح", nama_latin: "Al-Fath", jumlah_ayat: 29 },
      { nomor: 49, nama: "الحجرات", nama_latin: "Al-Hujurat", jumlah_ayat: 18 },
      { nomor: 50, nama: "ق", nama_latin: "Qaf", jumlah_ayat: 45 },
      { nomor: 51, nama: "الذاريات", nama_latin: "Az-Zariyat", jumlah_ayat: 60 },
      { nomor: 52, nama: "الطور", nama_latin: "At-Tur", jumlah_ayat: 49 },
      { nomor: 53, nama: "النجم", nama_latin: "An-Najm", jumlah_ayat: 62 },
      { nomor: 54, nama: "القمر", nama_latin: "Al-Qamar", jumlah_ayat: 55 },
      { nomor: 55, nama: "الرحمن", nama_latin: "Ar-Rahman", jumlah_ayat: 78 },
      { nomor: 56, nama: "الواقعة", nama_latin: "Al-Waqi'ah", jumlah_ayat: 96 },
      { nomor: 57, nama: "الحديد", nama_latin: "Al-Hadid", jumlah_ayat: 29 },
      { nomor: 58, nama: "المجادلة", nama_latin: "Al-Mujadilah", jumlah_ayat: 22 }
    ]
  },

  premium9: {
    status: false,
    data: [
      // Surat 59-78
      { nomor: 59, nama: "الحشر", nama_latin: "Al-Hasyr", jumlah_ayat: 24 },
      { nomor: 60, nama: "الممتحنة", nama_latin: "Al-Mumtahanah", jumlah_ayat: 13 },
      { nomor: 61, nama: "الصف", nama_latin: "As-Saff", jumlah_ayat: 14 },
      { nomor: 62, nama: "الجمعة", nama_latin: "Al-Jumu'ah", jumlah_ayat: 11 },
      { nomor: 63, nama: "المنافقون", nama_latin: "Al-Munafiqun", jumlah_ayat: 11 },
      { nomor: 64, nama: "التغابن", nama_latin: "At-Taghabun", jumlah_ayat: 18 },
      { nomor: 65, nama: "الطلاق", nama_latin: "At-Talaq", jumlah_ayat: 12 },
      { nomor: 66, nama: "التحريم", nama_latin: "At-Tahrim", jumlah_ayat: 12 },
      { nomor: 67, nama: "الملك", nama_latin: "Al-Mulk", jumlah_ayat: 30 },
      { nomor: 68, nama: "القلم", nama_latin: "Al-Qalam", jumlah_ayat: 52 },
      { nomor: 69, nama: "الحاقة", nama_latin: "Al-Haqqah", jumlah_ayat: 52 },
      { nomor: 70, nama: "المعارج", nama_latin: "Al-Ma'arij", jumlah_ayat: 44 },
      { nomor: 71, nama: "نوح", nama_latin: "Nuh", jumlah_ayat: 28 },
      { nomor: 72, nama: "الجن", nama_latin: "Al-Jinn", jumlah_ayat: 28 },
      { nomor: 73, nama: "المزمل", nama_latin: "Al-Muzzammil", jumlah_ayat: 20 },
      { nomor: 74, nama: "المدثر", nama_latin: "Al-Muddathir", jumlah_ayat: 56 },
      { nomor: 75, nama: "القيامة", nama_latin: "Al-Qiyamah", jumlah_ayat: 40 },
      { nomor: 76, nama: "الإنسان", nama_latin: "Al-Insan", jumlah_ayat: 31 },
      { nomor: 77, nama: "المرسلات", nama_latin: "Al-Mursalat", jumlah_ayat: 50 },
      { nomor: 78, nama: "النبأ", nama_latin: "An-Naba", jumlah_ayat: 40 }
    ]
  },

  premium10: {
    status: false,
    data: [
      // Surat 79-114
      { nomor: 79, nama: "النازعات", nama_latin: "An-Nazi'at", jumlah_ayat: 46 },
      { nomor: 80, nama: "عبس", nama_latin: "'Abasa", jumlah_ayat: 42 },
      { nomor: 81, nama: "التكوير", nama_latin: "At-Takwir", jumlah_ayat: 29 },
      { nomor: 82, nama: "الإنفطار", nama_latin: "Al-Infitar", jumlah_ayat: 19 },
      { nomor: 83, nama: "المطففين", nama_latin: "Al-Mutaffifin", jumlah_ayat: 36 },
      { nomor: 84, nama: "الإنشقاق", nama_latin: "Al-Insyiqaq", jumlah_ayat: 25 },
      { nomor: 85, nama: "البروج", nama_latin: "Al-Buruj", jumlah_ayat: 22 },
      { nomor: 86, nama: "الطارق", nama_latin: "At-Tariq", jumlah_ayat: 17 },
      { nomor: 87, nama: "الأعلى", nama_latin: "Al-A'la", jumlah_ayat: 19 },
      { nomor: 88, nama: "الغاشية", nama_latin: "Al-Ghashiyah", jumlah_ayat: 26 },
      { nomor: 89, nama: "الفجر", nama_latin: "Al-Fajr", jumlah_ayat: 30 },
      { nomor: 90, nama: "البلد", nama_latin: "Al-Balad", jumlah_ayat: 20 },
      { nomor: 91, nama: "الشمس", nama_latin: "Ash-Shams", jumlah_ayat: 15 },
      { nomor: 92, nama: "الليل", nama_latin: "Al-Lail", jumlah_ayat: 21 },
      { nomor: 93, nama: "الضحى", nama_latin: "Adh-Dhuha", jumlah_ayat: 11 },
      { nomor: 94, nama: "الشرح", nama_latin: "Ash-Sharh", jumlah_ayat: 8 },
      { nomor: 95, nama: "التين", nama_latin: "At-Tin", jumlah_ayat: 8 },
      { nomor: 96, nama: "العلق", nama_latin: "Al-'Alaq", jumlah_ayat: 19 },
      { nomor: 97, nama: "القدر", nama_latin: "Al-Qadr", jumlah_ayat: 5 },
      { nomor: 98, nama: "البينة", nama_latin: "Al-Bayyinah", jumlah_ayat: 8 },
      { nomor: 99, nama: "الزلزلة", nama_latin: "Az-Zalzalah", jumlah_ayat: 8 },
      { nomor: 100, nama: "العاديات", nama_latin: "Al-'Adiyat", jumlah_ayat: 11 },
      { nomor: 101, nama: "القارعة", nama_latin: "Al-Qari'ah", jumlah_ayat: 11 },
      { nomor: 102, nama: "التكاثر", nama_latin: "At-Takathur", jumlah_ayat: 8 },
      { nomor: 103, nama: "العصر", nama_latin: "Al-'Asr", jumlah_ayat: 3 },
      { nomor: 104, nama: "الهمزة", nama_latin: "Al-Humazah", jumlah_ayat: 9 },
      { nomor: 105, nama: "الفيل", nama_latin: "Al-Fil", jumlah_ayat: 5 },
      { nomor: 106, nama: "قريش", nama_latin: "Quraish", jumlah_ayat: 4 },
      { nomor: 107, nama: "الماعون", nama_latin: "Al-Ma'un", jumlah_ayat: 7 },
      { nomor: 108, nama: "الكوثر", nama_latin: "Al-Kausar", jumlah_ayat: 3 },
      { nomor: 109, nama: "الكافرون", nama_latin: "Al-Kafirun", jumlah_ayat: 6 },
      { nomor: 110, nama: "النصر", nama_latin: "An-Nasr", jumlah_ayat: 3 },
      { nomor: 111, nama: "المسد", nama_latin: "Al-Masad", jumlah_ayat: 5 },
      { nomor: 112, nama: "الإخلاص", nama_latin: "Al-Ikhlas", jumlah_ayat: 4 },
      { nomor: 113, nama: "الفلق", nama_latin: "Al-Falaq", jumlah_ayat: 5 },
      { nomor: 114, nama: "الناس", nama_latin: "An-Nas", jumlah_ayat: 6 }
    ]
  }
};

export default suratConfig;