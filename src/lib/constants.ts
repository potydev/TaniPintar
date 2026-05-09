export interface CommodityData {
  id: number
  name: string
  price: number
  change: number
  changePercent: number
  unit: string
  category: string
}

export interface ProvincePrice {
  province: string
  price: number
  change: number
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  unit: string
  stock: number
  category: string
  province: string
  city: string
  image: string
  status: string
  farmerName: string
  farmerAvatar: string
}

export interface LearningModuleData {
  id: string
  title: string
  description: string
  category: string
  level: string
  duration: number
  image: string
  lessonsCount: number
  progress: number
  rating: number
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface LeaderboardEntry {
  rank: number
  name: string
  avatar: string
  province: string
  points: number
  completedModules: number
  streak: number
}

export interface FarmerProfile {
  name: string
  email: string
  phone: string
  province: string
  city: string
  landSize: number
  landUnit: string
  joinDate: string
  totalEarnings: number
  activeProducts: number
  completedModules: number
  points: number
}

// Navigation items
export const navItems = [
  { id: 'home' as const, label: 'Beranda', icon: 'Home' },
  { id: 'pasar-pintar' as const, label: 'PasarPintar', icon: 'TrendingUp' },
  { id: 'pasar-langsung' as const, label: 'PasarLangsung', icon: 'Store' },
  { id: 'akademi-tani' as const, label: 'AkademiTani', icon: 'GraduationCap' },
  { id: 'tanibot' as const, label: 'TaniBot', icon: 'Bot' },
  { id: 'dashboard' as const, label: 'Dashboard', icon: 'LayoutDashboard' },
]

// Mock commodity data
export const mockCommodities: CommodityData[] = [
  { id: 1, name: 'Beras Premium', price: 14500, change: 200, changePercent: 1.4, unit: 'kg', category: 'Bahan Pokok' },
  { id: 2, name: 'Cabai Merah', price: 52000, change: -3000, changePercent: -5.5, unit: 'kg', category: 'Sayuran' },
  { id: 3, name: 'Bawang Merah', price: 38000, change: 1500, changePercent: 4.1, unit: 'kg', category: 'Bumbu' },
  { id: 4, name: 'Jagung', price: 6200, change: 100, changePercent: 1.6, unit: 'kg', category: 'Bahan Pokok' },
  { id: 5, name: 'Kedelai', price: 11500, change: -200, changePercent: -1.7, unit: 'kg', category: 'Bahan Pokok' },
  { id: 6, name: 'Cabai Rawit', price: 48000, change: 5000, changePercent: 11.6, unit: 'kg', category: 'Sayuran' },
  { id: 7, name: 'Bawang Putih', price: 32000, change: 0, changePercent: 0, unit: 'kg', category: 'Bumbu' },
  { id: 8, name: 'Tomat', price: 12000, change: -800, changePercent: -6.3, unit: 'kg', category: 'Sayuran' },
  { id: 9, name: 'Kentang', price: 15000, change: 500, changePercent: 3.4, unit: 'kg', category: 'Sayuran' },
  { id: 10, name: 'Gula Pasir', price: 16500, change: 0, changePercent: 0, unit: 'kg', category: 'Bahan Pokok' },
]

// Mock products for marketplace
export const mockProducts: Product[] = [
  { id: '1', name: 'Beras Organik Rojolele', description: 'Beras organik premium dari Wonosobo, ditanam tanpa pestisida kimia. Cocok untuk keluarga yang peduli kesehatan.', price: 16000, unit: 'kg', stock: 500, category: 'Beras', province: 'Jawa Tengah', city: 'Wonosobo', image: '', status: 'aktif', farmerName: 'Pak Sugeng', farmerAvatar: '' },
  { id: '2', name: 'Cabai Merah Keriting Segar', description: 'Cabai merah keriting segar panen pagi, kualitas super. Cocok untuk industri kuliner dan rumah tangga.', price: 45000, unit: 'kg', stock: 200, category: 'Sayuran', province: 'Jawa Barat', city: 'Garut', image: '', status: 'aktif', farmerName: 'Bu Eneng', farmerAvatar: '' },
  { id: '3', name: 'Kopi Arabika Gayo Grade 1', description: 'Kopi arabika specialty dari dataran tinggi Gayo Aceh. Roasting medium, rasa fruity dengan aftertaste cokelat.', price: 85000, unit: 'kg', stock: 100, category: 'Kopi', province: 'Aceh', city: 'Takengon', image: '', status: 'aktif', farmerName: 'Pak Usman', farmerAvatar: '' },
  { id: '4', name: 'Bawang Merah Brebes', description: 'Bawang merah varietas Bima Brebes, ukuran besar dan tahan lama. Kualitas terbaik dari sentra bawang terbesar di Jawa.', price: 35000, unit: 'kg', stock: 300, category: 'Bumbu', province: 'Jawa Tengah', city: 'Brebes', image: '', status: 'aktif', farmerName: 'Pak Wahyu', farmerAvatar: '' },
  { id: '5', name: 'Jagung Manis Lokal', description: 'Jagung manis varietas lokal, manis alami tanpa pestisida. Cocok untuk direbus atau dijadikan olahan.', price: 7000, unit: 'kg', stock: 1000, category: 'Pangan', province: 'Jawa Timur', city: 'Jember', image: '', status: 'aktif', farmerName: 'Pak Budi', farmerAvatar: '' },
  { id: '6', name: 'Kopi Robusta Temanggung', description: 'Kopi robusta dari lereng Sumbing dan Sindoro. Full body dengan aroma rempah khas Temanggung.', price: 55000, unit: 'kg', stock: 250, category: 'Kopi', province: 'Jawa Tengah', city: 'Temanggung', image: '', status: 'aktif', farmerName: 'Pak Sutrisno', farmerAvatar: '' },
]

// Mock learning modules
export const mockModules: LearningModuleData[] = [
  { id: '1', title: 'Teknik Budidaya Padi Organik', description: 'Pelajari teknik budidaya padi organik dari persiapan lahan hingga panen. Termasuk pengelolaan hama alami dan kompos.', category: 'Pertanian', level: 'pemula', duration: 45, image: '', lessonsCount: 8, progress: 0, rating: 4.8 },
  { id: '2', title: 'Pemasaran Digital untuk Petani', description: 'Kuasai strategi pemasaran digital untuk meningkatkan penjualan hasil panen. Dari marketplace hingga media sosial.', category: 'Bisnis', level: 'menengah', duration: 30, image: '', lessonsCount: 6, progress: 0, rating: 4.9 },
  { id: '3', title: 'Analisis Harga & Prediksi Pasar', description: 'Belajar membaca tren harga komoditas dan membuat keputusan jual beli yang tepat berdasarkan data.', category: 'Ekonomi', level: 'menengah', duration: 40, image: '', lessonsCount: 7, progress: 0, rating: 4.7 },
  { id: '4', title: 'Pengelolaan Irigasi Cerdas', description: 'Teknik pengelolaan air untuk lahan pertanian yang efisien, termasuk sistem irigasi tetes dan sensor kelembaban.', category: 'Teknologi', level: 'lanjutan', duration: 35, image: '', lessonsCount: 5, progress: 0, rating: 4.6 },
  { id: '5', title: 'Keuangan & Tabungan Petani', description: 'Kelola keuangan pertanian dengan cerdas. Pelajari pencatatan, perencanaan, dan strategi menabung untuk petani.', category: 'Keuangan', level: 'pemula', duration: 25, image: '', lessonsCount: 5, progress: 0, rating: 4.8 },
  { id: '6', title: 'Pengendalian Hama Terpadu (PHT)', description: 'Strategi pengendalian hama secara terpadu yang ramah lingkungan dan efektif untuk berbagai tanaman.', category: 'Pertanian', level: 'lanjutan', duration: 50, image: '', lessonsCount: 10, progress: 0, rating: 4.5 },
]

// Mock quiz questions
export const mockQuizQuestions: QuizQuestion[] = [
  {
    id: '1',
    question: 'Apa yang dimaksud dengan pertanian organik?',
    options: [
      'Pertanian yang menggunakan pestisida kimia minimal',
      'Pertanian yang tidak menggunakan bahan kimia sintetis',
      'Pertanian yang hanya menggunakan pupuk organik',
      'Pertanian yang dikelola oleh petani lokal'
    ],
    correctAnswer: 1,
    explanation: 'Pertanian organik adalah sistem pertanian yang menghindari penggunaan bahan kimia sintetis seperti pestisida dan pupuk buatan, dan mengandalkan proses alami untuk menjaga kesuburan tanah dan mengendalikan hama.'
  },
  {
    id: '2',
    question: 'Kapan waktu terbaik untuk menjual cabai merah berdasarkan pola harga di Indonesia?',
    options: [
      'Januari - Februari (musim hujan)',
      'Mei - Juni (menjelang puasa)',
      'September - Oktober (transisi musim)',
      'Desember - Januari (Natal & Tahun Baru)'
    ],
    correctAnswer: 0,
    explanation: 'Berdasarkan data historis, harga cabai merah cenderung tertinggi pada Januari-Februari (musim hujan) karena pasokan berkurang akibat cuaca buruk yang mengganggu panen dan distribusi.'
  },
  {
    id: '3',
    question: 'Berapa jarak tanam ideal untuk padi varietas Ciherang?',
    options: ['20x20 cm', '25x25 cm', '30x30 cm', '40x40 cm'],
    correctAnswer: 1,
    explanation: 'Jarak tanam ideal untuk padi Ciherang adalah 25x25 cm menggunakan sistem tegel atau jajar legowo. Jarak ini memberikan ruang optimal untuk pertumbuhan anakan dan penyerapan nutrisi.'
  },
  {
    id: '4',
    question: 'Apa fungsi utama dari aplikasi marketplace pertanian?',
    options: [
      'Mengganti peran tengkulak sepenuhnya',
      'Menghubungkan petani langsung dengan pembeli',
      'Menyediakan pupuk gratis untuk petani',
      'Membuat petani menjadi teknologi'
    ],
    correctAnswer: 1,
    explanation: 'Fungsi utama marketplace pertanian adalah memfasilitasi koneksi langsung antara petani dan pembeli, sehingga petani mendapat harga lebih adil dan pembeli mendapat produk segar langsung dari sumbernya.'
  },
  {
    id: '5',
    question: 'Indikator apa yang digunakan untuk menentukan kematangan padi siap panen?',
    options: [
      'Warna batang yang menguning',
      'Bulir padi yang menguning 95% dan malai merunduk',
      'Daun yang mulai gugur',
      'Umur tanam 90 hari'
    ],
    correctAnswer: 1,
    explanation: 'Indikator utama kematangan panen padi adalah bulir padi yang sudah menguning 95% (biji keras dan jernih) serta malai yang merunduk karena berat butir gabah. Umur tanam bisa berbeda-beda tergantung varietas.'
  }
]

// Mock leaderboard
export const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, name: 'Pak Sugeng', avatar: '', province: 'Jawa Tengah', points: 2850, completedModules: 12, streak: 45 },
  { rank: 2, name: 'Bu Ratna', avatar: '', province: 'Jawa Barat', points: 2640, completedModules: 11, streak: 38 },
  { rank: 3, name: 'Pak Darmawan', avatar: '', province: 'Jawa Timur', points: 2510, completedModules: 10, streak: 30 },
  { rank: 4, name: 'Bu Siti', avatar: '', province: 'Sumatera Utara', points: 2380, completedModules: 10, streak: 28 },
  { rank: 5, name: 'Pak Hasan', avatar: '', province: 'Sulawesi Selatan', points: 2250, completedModules: 9, streak: 25 },
  { rank: 6, name: 'Bu Dewi', avatar: '', province: 'Bali', points: 2100, completedModules: 9, streak: 22 },
  { rank: 7, name: 'Pak Andi', avatar: '', province: 'Nusa Tenggara Barat', points: 1980, completedModules: 8, streak: 20 },
  { rank: 8, name: 'Bu Rina', avatar: '', province: 'Lampung', points: 1850, completedModules: 8, streak: 18 },
  { rank: 9, name: 'Pak Joko', avatar: '', province: 'Yogyakarta', points: 1720, completedModules: 7, streak: 15 },
  { rank: 10, name: 'Bu Ani', avatar: '', province: 'West Nusa Tenggara', points: 1600, completedModules: 7, streak: 12 },
]

// Price history data (30 days)
export const generatePriceHistory = (basePrice: number, days: number = 30) => {
  const data = []
  const today = new Date()
  for (let i = days; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const variation = (Math.random() - 0.45) * basePrice * 0.08
    const price = Math.round(basePrice + variation)
    data.push({
      date: date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
      price,
      volume: Math.round(Math.random() * 1000 + 500),
    })
  }
  return data
}

// Province price data for heatmap
export const mockProvincePrices: ProvincePrice[] = [
  { province: 'Aceh', price: 14800, change: 300 },
  { province: 'Sumatera Utara', price: 14200, change: -100 },
  { province: 'Sumatera Barat', price: 14500, change: 200 },
  { province: 'Riau', price: 15000, change: 500 },
  { province: 'Jambi', price: 14600, change: 100 },
  { province: 'Sumatera Selatan', price: 14400, change: -200 },
  { province: 'Bengkulu', price: 14300, change: -300 },
  { province: 'Lampung', price: 14700, change: 200 },
  { province: 'Bangka Belitung', price: 15200, change: 700 },
  { province: 'Banten', price: 14600, change: 100 },
  { province: 'DKI Jakarta', price: 15500, change: 1000 },
  { province: 'Jawa Barat', price: 14300, change: -200 },
  { province: 'Jawa Tengah', price: 14100, change: -400 },
  { province: 'DI Yogyakarta', price: 14400, change: -100 },
  { province: 'Jawa Timur', price: 14200, change: -200 },
  { province: 'Bali', price: 14900, change: 400 },
  { province: 'NTB', price: 15000, change: 500 },
  { province: 'NTT', price: 15100, change: 600 },
  { province: 'Kalimantan Barat', price: 14800, change: 300 },
  { province: 'Kalimantan Tengah', price: 14700, change: 200 },
  { province: 'Kalimantan Selatan', price: 14600, change: 100 },
  { province: 'Kalimantan Timur', price: 14900, change: 400 },
  { province: 'Sulawesi Utara', price: 15100, change: 600 },
  { province: 'Sulawesi Tengah', price: 15000, change: 500 },
  { province: 'Sulawesi Selatan', price: 14800, change: 300 },
  { province: 'Sulawesi Tenggara', price: 14900, change: 400 },
  { province: 'Maluku', price: 15300, change: 800 },
  { province: 'Papua', price: 15500, change: 1000 },
]

// Recommended crops based on profitability
export const mockRecommendations = [
  { rank: 1, crop: 'Cabai Rawit', profitMargin: 65, season: 'Kering', difficulty: 'Sedang', expectedReturn: 'Rp 48.000.000/ha', trend: 'up' },
  { rank: 2, crop: 'Bawang Merah', profitMargin: 55, season: 'Kering', difficulty: 'Sedang', expectedReturn: 'Rp 38.000.000/ha', trend: 'up' },
  { rank: 3, crop: 'Jagung Manis', profitMargin: 45, season: 'Semua', difficulty: 'Mudah', expectedReturn: 'Rp 28.000.000/ha', trend: 'stable' },
  { rank: 4, crop: 'Tomat Cherry', profitMargin: 50, season: 'Kering', difficulty: 'Sedang', expectedReturn: 'Rp 32.000.000/ha', trend: 'up' },
  { rank: 5, crop: 'Kangkung Organik', profitMargin: 40, season: 'Semua', difficulty: 'Mudah', expectedReturn: 'Rp 15.000.000/ha', trend: 'stable' },
]

// Farmer profile mock
export const mockFarmerProfile: FarmerProfile = {
  name: 'Pak Ahmad Tani',
  email: 'ahmad.tani@email.com',
  phone: '0812-3456-7890',
  province: 'Jawa Tengah',
  city: 'Solo',
  landSize: 2.5,
  landUnit: 'hektar',
  joinDate: 'Maret 2025',
  totalEarnings: 45750000,
  activeProducts: 3,
  completedModules: 4,
  points: 1250,
}
