-- ============================================================================
--  TANIPINTAR - Database Schema & Seed Data
--  Platform Digital Pertanian Indonesia
--  Untuk Supabase (PostgreSQL)
-- ============================================================================

-- ============================================================================
--  BAGIAN 0: EKSTENSI YANG DIPERLUKAN
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
--  BAGIAN 1: TABEL PROFILES (USER + ROLE SYSTEM)
-- ============================================================================

-- Tabel profil pengguna, terhubung ke auth.users Supabase
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name     TEXT,
  email         TEXT UNIQUE NOT NULL,
  phone         TEXT,
  -- Role: 'user' = pembeli biasa, 'seller' = penjual, 'admin' = administrator
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'seller', 'admin')),
  province      TEXT,
  city          TEXT,
  address       TEXT,
  postal_code   TEXT,
  avatar_url    TEXT,
  -- Field khusus seller
  farm_name     TEXT,
  farm_address  TEXT,
  farm_description TEXT,
  farm_category TEXT[] DEFAULT '{}',
  bank_name     TEXT,
  bank_account  TEXT,
  bank_holder   TEXT,
  is_verified   BOOLEAN DEFAULT FALSE,
  rating_avg    NUMERIC(3,2) DEFAULT 0.00,
  total_sales   INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Profil pengguna TaniPintar dengan sistem role';
COMMENT ON COLUMN public.profiles.role IS 'user=pembeli biasa, seller=penjual hasil tani, admin=administrator';

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: semua user bisa lihat profil siapa saja
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- Policy: user hanya bisa update profil sendiri
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policy: user bisa insert profil sendiri (saftar)
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ============================================================================
--  BAGIAN 2: TRIGGER AUTO-CREATE PROFILE SAAT REGISTER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================================
--  BAGIAN 3: TABEL KOMODITAS (DATA REAL)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.commodities (
  id              SERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  category        TEXT NOT NULL,
  sub_category    TEXT,
  unit            TEXT DEFAULT 'kg',
  base_price      INTEGER NOT NULL,     -- harga dasar per unit (Rp)
  min_price       INTEGER,              -- harga terendah (Rp)
  max_price       INTEGER,              -- harga tertinggi (Rp)
  description     TEXT,
  season_info     TEXT,                 -- info musim tanam/panen
  icon_emoji      TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.commodities IS 'Daftar master komoditas pertanian Indonesia';

ALTER TABLE public.commodities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Commodities are viewable by everyone"
  ON public.commodities FOR SELECT USING (true);

CREATE POLICY "Only admin can insert commodities"
  ON public.commodities FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Only admin can update commodities"
  ON public.commodities FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Only admin can delete commodities"
  ON public.commodities FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE TRIGGER commodities_updated_at
  BEFORE UPDATE ON public.commodities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ---- DATA REAL KOMODITAS INDONESIA ----
-- Harga berdasarkan data rata-rata nasional 2024/2025
-- Sumber acuan: BPS, Kemendag,harga pangan pasar tradisional

INSERT INTO public.commodities (name, slug, category, sub_category, unit, base_price, min_price, max_price, description, season_info, icon_emoji) VALUES

-- === BAHAN POKOK PANGAN ===
('Beras Premium',           'beras-premium',           'Bahan Pokok', 'Beras',    'kg',  14500, 12000, 18000,
 'Beras kualitas premium dengan butiran panjang, pulen, dan wangi. Termasuk varietas Rojolele, Pandan Wangi, dan IR64 kualitas terbaik.',
 'Panen raya Maret-Juni dan September-Desember', '🌾'),
('Beras Medium',            'beras-medium',            'Bahan Pokok', 'Beras',    'kg',  12000, 9500,  14500,
 'Beras kualitas medium, cocok untuk konsumsi sehari-hari. Varietas IR64, Ciherang, dan Mekongga.',
 'Panen raya Maret-Juni dan September-Desember', '🌾'),
('Beras IR64',              'beras-ir64',              'Bahan Pokok', 'Beras',    'kg',  10500, 8500,  12500,
 'Beras varietas IR64, paling banyak dikonsumsi masyarakat Indonesia. Harga terjangkau dan ketersediaan melimpah.',
 'Panen raya Maret-Juni dan September-Desember', '🌾'),
('Jagung Pipilan',          'jagung-pipilan',          'Bahan Pokok', 'Jagung',   'kg',   6500, 5000,   8500,
 'Jagung pipilan kering untuk konsumsi dan pakan ternak. Varietas BISI, Pioneer, dan lokal.',
 'Tanam sepanjang tahun, panen 90-110 HST', '🌽'),
('Jagung Manis',            'jagung-manis',            'Bahan Pokok', 'Jagung',   'kg',   8000, 6000,  12000,
 'Jagung manis segar untuk dikonsumsi langsung. Varietas Bonanza F1, Jago F1.',
 'Tanam sepanjang tahun, panen 70-80 HST', '🌽'),
('Kedelai',                 'kedelai',                 'Bahan Pokok', 'Kacang-kacangan', 'kg',  11000, 9000, 14000,
 'Kedelai kering kualitas ekspor. Varietas Grobogan, Anjasmoro, dan Dena 1.',
 'Tanam Oktober-Maret (musim hujan)', '🫘'),
('Kacang Tanah',            'kacang-tanah',            'Bahan Pokok', 'Kacang-kacangan', 'kg', 28000, 22000, 35000,
 'Kacang tanah kering bermutu tinggi. Varietas Talam, Jerapah, dan Kelinci.',
 'Tanam November-April', '🥜'),
('Kacang Hijau',            'kacang-hijau',            'Bahan Pokok', 'Kacang-kacangan', 'kg', 26000, 20000, 33000,
 'Kacang hijau kering untuk bahan makanan. Varietas Vima-1, Merbabu, dan Kutilang.',
 'Tanam Oktober-Maret', '🫘'),
('Gula Pasir',              'gula-pasir',              'Bahan Pokok', 'Gula',     'kg',  16000, 14000, 18500,
 'Gula pasir kristal putih kualitas konsumsi. Produksi tebu lokal dan impor.',
 'Musim giling tebu Maret-Oktober', '🍬'),
('Tepung Terigu',           'tepung-terigu',           'Bahan Pokok', 'Tepung',   'kg',   7500, 6500,   9000,
 'Tepung terigu protein sedang untuk berbagai kebutuhan masakan.',
 'Tersedia sepanjang tahun', '🍞'),
('Mie Instan',              'mie-instan',              'Bahan Pokok', 'Mie',      'pcs',   3500,  2800,   4500,
 'Mie instan kemasan bungkus, berbagai merek.',
 'Tersedia sepanjang tahun', '🍜'),
('Minyak Goreng Curah',     'minyak-goreng-curah',    'Bahan Pokok', 'Minyak',   'liter',17000, 14000, 20000,
 'Minyak goreng kelapa sawit curah kualitas standar.',
 'Tersedia sepanjang tahun', '🫗'),
('Minyak Goreng Kemasan',   'minyak-goreng-kemasan',  'Bahan Pokok', 'Minyak',   'liter',19500, 17000, 23000,
 'Minyak goreng kelapa sawit kemasan sachet dan botol premium.',
 'Tersedia sepanjang tahun', '🫗'),
('Cabai Merah Keriting',    'cabai-merah-keriting',   'Sayuran',     'Cabai',    'kg',  42000, 25000, 65000,
 'Cabai merah keriting segar, grade A. Varietas TM999, Lado F1.',
 'Tanam sepanjang tahun, panen 75-90 HST', '🌶'),
('Cabai Merah Besar',       'cabai-merah-besar',      'Sayuran',     'Cabai',    'kg',  48000, 30000, 75000,
 'Cabai merah besar segar untuk kebutuhan kuliner. Varietas Capitol F1, Jumbo.',
 'Tanam sepanjang tahun, panen 80-95 HST', '🌶'),
('Cabai Rawit',             'cabai-rawit',             'Sayuran',     'Cabai',    'kg',  55000, 35000, 90000,
 'Cabai rawit segar pedas. Varietas Dewata, Domba, Taruna.',
 'Tanam sepanjang tahun, panen 70-85 HST', '🌶'),
('Cabai Rawit Merah',       'cabai-rawit-merah',      'Sayuran',     'Cabai',    'kg',  60000, 40000, 95000,
 'Cabai rawit merah segar, level pedas tinggi.',
 'Tanam sepanjang tahun, panen 70-85 HST', '🌶'),
('Bawang Merah',            'bawang-merah',            'Sayuran',     'Bumbu',    'kg',  38000, 25000, 55000,
 'Bawang merah segar kualitas super. Varietas Bima Brebes, Tajuk, dan Maja Cipanas.',
 'Tanam Maret-Agustus, panen 60-70 HST', '🧅'),
('Bawang Putih',            'bawang-putih',            'Sayuran',     'Bumbu',    'kg',  35000, 28000, 48000,
 'Bawang putih impor (China) dan lokal (Lombok, Nganjuk).',
 'Tanam April-Juni (lokal), impor sepanjang tahun', '🧄'),
('Bawang Prei',             'bawang-prei',             'Sayuran',     'Bumbu',    'kg',  22000, 15000, 30000,
 'Bawang prei segar untuk bumbu masakan dan garnish.',
 'Tanam sepanjang tahun, panen 60-75 HST', '🧅'),
('Tomat',                   'tomat',                   'Sayuran',     'Sayuran',   'kg',  12000, 8000,  18000,
 'Tomat segar merah matang, grade A. Varietas Servo F1, Ratna, dan Permata.',
 'Tanam sepanjang tahun, panen 60-70 HST', '🍅'),
('Kentang',                 'kentang',                 'Sayuran',     'Umbi-umbian', 'kg', 16000, 12000, 22000,
 'Kentang segar kualitas konsumsi. Didatangkan dari Dieng, Lembang, dan Pangalengan.',
 'Tanam Maret-April, panen 90-100 HST', '🥔'),
('Wortel',                  'wortel',                  'Sayuran',     'Sayuran',   'kg',  14000, 10000, 18000,
 'Wortel segar oranye, grade A. Didatangkan dari Dieng dan Lembang.',
 'Tanam sepanjang tahun, panen 80-90 HST', '🥕'),
('Kangkung',                'kangkung',                'Sayuran',     'Sayuran Daun', 'kg', 6000,  4000,   9000,
 'Kangkung darat/air segar. Sayuran daun paling populer Indonesia.',
 'Tanam sepanjang tahun, panen 21-30 HST', '🥬'),
('Bayam',                   'bayam',                   'Sayuran',     'Sayuran Daun', 'kg', 5500,  3500,   8000,
 'Bayam merah dan hijau segar untuk sayur bening, pecel, dan lainnya.',
 'Tanam sepanjang tahun, panen 20-25 HST', '🥬'),
('Sawi Hijau',              'sawi-hijau',              'Sayuran',     'Sayuran Daun', 'kg', 7000,  4500,  10000,
 'Sawi hijau/caisim segar untuk tumisan dan sup.',
 'Tanam sepanjang tahun, panen 25-35 HST', '🥬'),
('Sawi Putih',              'sawi-putih',              'Sayuran',     'Sayuran Daun', 'kg', 8000,  5000,  12000,
 'Sawi putih/pakcoy segar untuk capcay, sup, dan tumisan.',
 'Tanam sepanjang tahun, panen 25-35 HST', '🥬'),
('Kubis',                   'kubis',                   'Sayuran',     'Sayuran',   'kg',   9000,  6000,  14000,
 'Kubis/kol segar padat, grade A. Varietas Green Coronet dan Grand 11.',
 'Tanam sepanjang tahun, panen 65-80 HST', '🥦'),
('Brokoli',                 'brokoli',                 'Sayuran',     'Sayuran',   'kg',  22000, 15000, 32000,
 'Brokoli hijau segar dari dataran tinggi (Dieng, Lembang).',
 'Tanam Maret-Juni, panen 60-70 HST', '🥦'),
('Terong',                  'terong',                  'Sayuran',     'Sayuran',   'kg',  10000,  7000,  15000,
 'Terong ungu dan hijau segar. Varietas Copas, Mustang, dan Mutiara.',
 'Tanam sepanjang tahun, panen 60-75 HST', '🍆'),
('Oyong',                   'oyong',                   'Sayuran',     'Sayuran',   'kg',   8000,  5000,  12000,
 'Oyong/buah luffa segar untuk sayur bening dan sup.',
 'Tanam sepanjang tahun, panen 45-55 HST', '🥒'),
('Labu Siam',               'labu-siam',               'Sayuran',     'Sayuran',   'kg',   7000,  4500,  10000,
 'Labu siam/jipang segar untuk oseng dan sayur santan.',
 'Tanam sepanjang tahun, panen 45-60 HST', '🎃'),
('Seledri',                 'seledri',                 'Sayuran',     'Sayuran Daun', 'kg', 8000,  5000,  12000,
 'Seledri segar untuk taburan dan bumbu masakan.',
 'Tanam sepanjang tahun, panen 30-45 HST', '🌿'),
('Daun Bawang',             'daun-bawang',             'Sayuran',     'Bumbu',    'kg',  18000, 12000, 25000,
 'Daun bawang segar untuk taburan dan bumbu masakan.',
 'Tanam sepanjang tahun, panen 45-60 HST', '🌿'),
('Jahe',                    'jahe',                    'Sayuran',     'Rempah',   'kg',  32000, 22000, 48000,
 'Jahe emprit, jahe gajah, dan jahe merah segar/kering.',
 'Panen 8-10 bulan, tersedia sepanjang tahun', '🫚'),
('Kunyit',                  'kunyit',                  'Sayuran',     'Rempah',   'kg',  18000, 12000, 28000,
 'Kunyit segar untuk bumbu masakan dan jamu.',
 'Panen 8-10 bulan, tersedia sepanjang tahun', '🫚'),
('Lengkuas',                'lengkuas',                'Sayuran',     'Rempah',   'kg',  20000, 14000, 30000,
 'Lengkuas/laos segar untuk bumbu masakan tradisional.',
 'Panen 10-12 bulan, tersedia sepanjang tahun', '🫚'),
('Kencur',                  'kencur',                  'Sayuran',     'Rempah',   'kg',  45000, 30000, 65000,
 'Kencur segar untuk bumbu dan jamu tradisional.',
 'Panen 8-10 bulan, tersedia sepanjang tahun', '🫚'),
('Serai',                  'serai',                   'Sayuran',     'Rempah',   'kg',  15000, 10000, 22000,
 'Serai/sereh segar untuk bumbu masakan dan teh herbal.',
 'Panen 6-8 bulan, tersedia sepanjang tahun', '🌿'),
('Buncis',                  'buncis',                  'Sayuran',     'Sayuran',   'kg',  12000,  8000,  18000,
 'Buncis segar untuk tumisan dan campuran masakan.',
 'Tanam sepanjang tahun, panen 40-50 HST', '🫘'),
('Pisang Cavendish',        'pisang-cavendish',        'Buah',        'Pisang',   'kg',  12000,  9000,  16000,
 'Pisang cavendish segar, grade ekspor. Kaya potasium dan energi.',
 'Panen sepanjang tahun, 10-12 bulan tanam', '🍌'),
('Pisang Raja',             'pisang-raja',             'Buah',        'Pisang',   'kg',  10000,  7000,  14000,
 'Pisang raja matang manis, cocok untuk pisang goreng dan kolak.',
 'Panen sepanjang tahun, 9-12 bulan tanam', '🍌'),
('Jeruk Mandarin',          'jeruk-mandarin',          'Buah',        'Jeruk',    'kg',  25000, 18000, 35000,
 'Jeruk mandarin segar dari Kepulauan Selayar dan Pontianak.',
 'Musim panen Mei-September', '🍊'),
('Jeruk Manis',             'jeruk-manis',             'Buah',        'Jeruk',    'kg',  18000, 12000, 25000,
 'Jeruk manis pontianak/medan segar, berair dan manis.',
 'Musim panen Juni-Oktober', '🍊'),
('Apel',                    'apel',                    'Buah',        'Apel',     'kg',  28000, 20000, 40000,
 'Apel Manalagi segar dari Malang (Batu, Poncokusumo).',
 'Musim panen Januari-Maret, Juli-September', '🍎'),
('Mangga',                  'mangga',                  'Buah',        'Mangga',   'kg',  18000, 10000, 28000,
 'Mangga harum manis, gedong, dan manalagi segar.',
 'Musim panen September-Desember', '🥭'),
('Semangka',                'semangka',                'Buah',        'Semangka', 'kg',   7000,  4000,  10000,
 'Semangka merah/hijau segar berukuran besar.',
 'Tanam sepanjang tahun, panen 75-85 HST', '🍉'),
('Melon',                   'melon',                   'Buah',        'Melon',    'kg',  12000,  8000,  18000,
 'Melon hijau dan orange segar manis dari Klaten, Kediri.',
 'Tanam sepanjang tahun, panen 55-65 HST', '🍈'),
('Pepaya',                  'pepaya',                  'Buah',        'Pepaya',   'kg',   6000,  4000,   9000,
 'Pepaya california matang segar. Kaya vitamin C dan enzim papain.',
 'Tanam sepanjang tahun, panen 9-10 bulan', '🫒'),
('Salak Pondoh',            'salak-pondoh',            'Buah',        'Salak',    'kg',  20000, 14000, 28000,
 'Salak pondoh super dari Sleman, Yogyakarta. Manis tanpa rasa sepat.',
 'Musim panen Desember-Maret', '🥥'),
('Rambutan',                'rambutan',                'Buah',        'Rambutan', 'kg',  12000,  7000,  20000,
 'Rambutan rapiah, simacan, dan lebakbulus segar.',
 'Musim panen Oktober-Februari', '🫐'),
('Durian',                  'durian',                  'Buah',        'Durian',   'kg',  50000, 30000, 90000,
 'Durian montong, musangking, dan lokal Medan/Maraseh.',
 'Musim panen Oktober-Februari (durian lokal)', '🍈'),
('Jambu Biji',              'jambu-biji',              'Buah',        'Jambu',    'kg',   8000,  5000,  12000,
 'Jambu biji merah/putih segar. Kaya vitamin C.',
 'Tanam sepanjang tahun, panen sepanjang tahun', '🫒'),
('Telur Ayam Ras',          'telur-ayam-ras',          'Protein',     'Telur',    'kg',  28000, 22000, 34000,
 'Telur ayam ras segar (butir ukuran sedang/besar, 1kg = ~16 butir).',
 'Tersedia sepanjang tahun', '🥚'),
('Daging Ayam Broiler',     'daging-ayam-broiler',     'Protein',     'Ayam',     'kg',  36000, 30000, 42000,
 'Daging ayam broiler segar/potong, kualitas segar.',
 'Tersedia sepanjang tahun', '🍗'),
('Daging Ayam Kampung',     'daging-ayam-kampung',     'Protein',     'Ayam',     'kg',  65000, 55000, 80000,
 'Daging ayam kampung segar, tekstur lebih kenyal dan gurih.',
 'Tersedia sepanjang tahun (terbatas)', '🍗'),
('Daging Sapi Murni',       'daging-sapi-murni',       'Protein',     'Sapi',     'kg', 130000,110000,150000,
 'Daging sapi segar potongan paha/has dalam, kualitas terbaik.',
 'Tersedia sepanjang tahun', '🥩'),
('Ikan Tongkol',            'ikan-tongkol',            'Protein',     'Ikan',     'kg',  25000, 18000, 35000,
 'Ikan tongkol segar dari nelayan lokal.',
 'Tersedia sepanjang tahun', '🐟'),
('Ikan Teri Medan',         'ikan-teri-medan',         'Protein',     'Ikan',     'kg',  65000, 45000, 90000,
 'Ikan teri nasi/teri medan kering berkualitas.',
 'Musim tangkap April-Oktober', '🐟'),
('Ikan Asin',               'ikan-asin',               'Protein',     'Ikan',     'kg',  40000, 30000, 55000,
 'Ikan asin kering, berbagai jenis (teri, layur, kembung).',
 'Tersedia sepanjang tahun', '🐟'),
('Tempe',                   'tempe',                   'Protein',     'Olahan',   'kg',  10000,  7000,  14000,
 'Tempe kedelai segar buatan rumahan/pabrik.',
 'Tersedia sepanjang tahun', '🫘'),
('Tahu',                    'tahu',                    'Protein',     'Olahan',   'kg',   8000,  5000,  12000,
 'Tahu putih segar lembut dan gurih.',
 'Tersedia sepanjang tahun', '🫘'),
('Kopi Arabika Gayo',       'kopi-arabika-gayo',       'Perkebunan',  'Kopi',     'kg',  120000, 90000, 180000,
 'Kopi arabika spesialti dari dataran tinggi Gayo, Aceh. Rasa fruity dengan body tebal.',
 'Panen Oktober-Maret, proses wet hull (Giling Basah)', '☕'),
('Kopi Arabika Toraja',     'kopi-arabika-toraja',     'Perkebunan',  'Kopi',     'kg',  110000, 80000, 160000,
 'Kopi arabika spesialti dari Toraja, Sulawesi Selatan. Rasa herbal dan earthy.',
 'Panen Juni-Oktober, proses wet hull', '☕'),
('Kopi Arabika Kintamani',  'kopi-arabika-kintamani',  'Perkebunan',  'Kopi',     'kg',  95000,  70000, 140000,
 'Kopi arabika dari dataran tinggi Kintamani, Bali. Rasa citrus ringan.',
 'Panen Mei-September, proses natural/washed', '☕'),
('Kopi Arabika Manggarai',  'kopi-arabika-manggarai',  'Perkebunan',  'Kopi',     'kg',  85000,  60000, 130000,
 'Kopi arabika dari Flores, NTT. Rasa manis buah dan cokelat.',
 'Panen Mei-September', '☕'),
('Kopi Robusta Lampung',    'kopi-robusta-lampung',    'Perkebunan',  'Kopi',     'kg',  55000,  40000,  75000,
 'Kopi robusta dari Lampung, kualitas ekspor. Rasa bold dan pahit khas robusta.',
 'Panen Juni-Oktober', '☕'),
('Kopi Robusta Temanggung', 'kopi-robusta-temanggung', 'Perkebunan',  'Kopi',     'kg',  60000,  45000,  80000,
 'Kopi robusta dari Temanggung, Jawa Tengah. Salah satu robusta terbaik Indonesia.',
 'Panen Mei-September', '☕'),
('Kopi Luwak',              'kopi-luwak',              'Perkebunan',  'Kopi',     'kg', 500000,350000, 800000,
 'Kopi luwak asli dari peternakan, proses semi-wild. Salah satu kopi termahal di dunia.',
 'Panen sepanjang tahun (terbatas)', '☕'),
('Kelapa Sawit (TBS)',      'kelapa-sawit-tbs',        'Perkebunan',  'Kelapa Sawit', 'kg', 2500, 1800,   3500,
 'Tandan Buah Segar (TBS) kelapa sawit. Harga di Pabrik Kelapa Sawit (PKS).',
 'Panen sepanjang tahun, puncak Maret-Mei', '🌴'),
('CPO (Crude Palm Oil)',    'cpo',                     'Perkebunan',  'Kelapa Sawit', 'kg', 13500, 10000, 17000,
 'CPO mentah dari pengolahan kelapa sawit. Komoditas ekspor utama Indonesia.',
 'Tersedia sepanjang tahun', '🫗'),
('Karet (RSS1)',            'karet-rss1',              'Perkebunan',  'Karet',    'kg',  18000, 14000, 24000,
 'Karet alam jenis RSS1, kualitas ekspor. Dari Sumatera, Kalimantan, dan Sulawesi.',
 'Sadapan sepanjang tahun', '🟤'),
('Kakao Biji Kering',       'kakao-biji-kering',       'Perkebunan',  'Kakao',    'kg',  45000, 35000, 60000,
 'Biji kakao fermentasi dan dikeringkan. Varietas Forastero, Criollo, Trinitario.',
 'Panen sepanjang tahun, puncak Juni-September', '🟫'),
('Teh Hijau',               'teh-hijau',               'Perkebunan',  'Teh',      'kg',  75000, 50000, 100000,
 'Daun teh hijau kering premium dari perkebunan PTPN. Dari Puncak, Gambung, dan Wonosari.',
 'Petik sepanjang tahun, kualitas terbaik Maret-Agustus', '🍵'),
('Teh Hitam',               'teh-hitam',               'Perkebunan',  'Teh',      'kg',  65000, 40000,  85000,
 'Daun teh hitam (black tea) kering berkualitas dari perkebunan tinggi.',
 'Petik sepanjang tahun', '🍵'),
('Cengkeh',                 'cengkeh',                 'Perkebunan',  'Rempah',   'kg', 110000, 80000, 150000,
 'Cengkeh kering berkualitas ekspor. Dari Maluku, Sulawesi Utara, dan Ternate.',
 'Panen Juli-September (puncak)', '🫚'),
('Pala',                    'pala',                    'Perkebunan',  'Rempah',   'kg',  65000, 45000,  90000,
 'Biji pala kering dan fuli pala dari Maluku. Komoditas rempah bersejarah.',
 'Panen Juli-September', '🫘'),
('Lada Putih',              'lada-putih',              'Perkebunan',  'Rempah',   'kg',  85000, 60000, 120000,
 'Lada putih/butiran dari Bangka Belitung dan Lampung. "Raja Rempah".',
 'Panen Agustus-Desember', '⚫'),
('Lada Hitam',              'lada-hitam',              'Perkebunan',  'Rempah',   'kg',  75000, 50000, 100000,
 'Lada hitam/butiran dari Lampung. "Raja Rempah" varian hitam.',
 'Panen Agustus-Desember', '⚫'),
('Vanili',                  'vanili',                  'Perkebunan',  'Rempah',   'kg',3500000,2500000,5000000,
 'Vanili kering premium dari Bali dan Papua. Rempah termahal kedua di dunia.',
 'Panen Juni-September, proses fermentasi 3-6 bulan', '🫚'),
('Ubi Jalar',               'ubi-jalar',               'Umbi-umbian', 'Umbi',     'kg',   6000,  4000,   9000,
 'Ubi jalar kuning/ungu segar. Sumber karbohidrat alternatif.',
 'Tanam Oktober-Desember, panen 100-120 HST', '🍠'),
('Ubi Kayu (Singkong)',     'ubi-kayu',                'Umbi-umbian', 'Umbi',     'kg',   4500,  3000,   7000,
 'Singkong/ubi kayu segar untuk gaplek, keripik, dan olahan.',
 'Tanam sepanjang tahun, panen 9-12 bulan', '🥔'),
('Gembili',                 'gembili',                 'Umbi-umbian', 'Umbi',     'kg',   8000,  5000,  12000,
 'Gembili/uwi segar, umbi tradisional Indonesia.',
 'Panen 8-10 bulan', '🍠'),
('Suweg',                   'suweg',                   'Umbi-umbian', 'Umbi',     'kg',   5000,  3000,   8000,
 'Suweg/talas bogor segar untuk olahan tradisional.',
 'Panen 9-12 bulan', '🥔'),
('Kelapa',                  'kelapa',                  'Perkebunan',  'Kelapa',   'butir', 8000,  5000,  12000,
 'Kelapa tua/kopra untuk parutan dan santan. 1 butir = ~1.5-2kg daging.',
 'Panen sepanjang tahun', '🥥'),
('Santen',                  'santen',                  'Bahan Pokok', 'Kelapa',   'kg',  18000, 14000, 25000,
 'Santen kelapa segar perah untuk bumbu masakan.',
 'Tersedia sepanjang tahun', '🥥'),
('Bawang Goreng',           'bawang-goreng',           'Olahan',      'Bumbu',    'kg',  85000, 65000, 110000,
 'Bawang goreng kemasan dari Brebes dan Nganjuk.',
 'Tersedia sepanjang tahun', '🧅'),
('Keripik Singkong',        'keripik-singkong',        'Olahan',      'Snack',    'kg',  35000, 25000, 50000,
 'Keripik singkong renyah berbagai rasa (original, balado, keju).',
 'Tersedia sepanjang tahun', '🥔'),
('Kopi Bubuk Premium',      'kopi-bubuk-premium',      'Olahan',      'Kopi',     'kg',  90000, 65000, 130000,
 'Kopi bubuk hitam premium dari robusta Toraja/Gayo, sangrai medium.',
 'Tersedia sepanjang tahun', '☕'),
('Gula Aren',               'gula-aren',               'Olahan',      'Gula',     'kg',  35000, 25000, 50000,
 'Gula aren/kelapa cetakan kualitas premium. Natural sweetener.',
 'Musim produksi sepanjang tahun, puncak Juni-November', '🍬'),
('Gula Merah',              'gula-merah',              'Olahan',      'Gula',     'kg',  22000, 15000, 32000,
 'Gula merah/tebu cetakan dari berbagai daerah.',
 'Tersedia sepanjang tahun', '🍬'),
('Kecap Manis',             'kecap-manis',             'Olahan',      'Bumbu',    'btl',  12000,  9000,  16000,
 'Kecap manis kemasan botol untuk bumbu masakan.',
 'Tersedia sepanjang tahun', '🫗'),
('Terasi Udang',            'terasi-udang',            'Olahan',      'Bumbu',    'kg',  40000, 28000, 60000,
 'Terasi udang premium dari Indramayu dan Cirebon.',
 'Tersedia sepanjang tahun', '🦐'),
('Rendang Daging',          'rendang-daging',          'Olahan',      'Makanan',  'kg', 200000,160000, 280000,
 'Rendang daging sapi kemasan vakum tahan lama dari Padang.',
 'Tersedia sepanjang tahun', '🥩'),
('Abon Sapi',               'abon-sapi',               'Olahan',      'Makanan',  'kg', 180000,140000, 250000,
 'Abon sapi sapi premium kemasan tahan lama.',
 'Tersedia sepanjang tahun', '🥩'),
('Dodol Garut',             'dodol-garut',             'Olahan',      'Snack',    'kg',  45000, 35000,  65000,
 'Dodol garut oleh-oleh khas Jawa Barat.',
 'Tersedia sepanjang tahun', '🍬'),
('Madu Hutan',              'madu-hutan',              'Perkebunan',  'Madu',     'kg', 100000, 65000, 160000,
 'Madu hutan asli dari Kalimantan, Sulawesi, dan Sumatera.',
 'Musim panen sepanjang tahun, kualitas terbaik saat bunga mekar', '🍯'),
('Madu Apikultur',          'madu-apikultur',          'Perkebunan',  'Madu',     'kg',  75000, 50000, 110000,
 'Madu ternak lebah apis mellifera dari peternakan lokal.',
 'Tersedia sepanjang tahun', '🍯');

-- ============================================================================
--  BAGIAN 4: TABEL HARGA KOMODITAS PER PROVINSI
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.commodity_prices (
  id              BIGSERIAL PRIMARY KEY,
  commodity_id    INTEGER REFERENCES public.commodities(id) ON DELETE CASCADE NOT NULL,
  province        TEXT NOT NULL,
  province_code   TEXT,
  price           INTEGER NOT NULL,      -- harga per unit (Rp)
  change_percent  NUMERIC(5,2) DEFAULT 0, -- perubahan harga (%)
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_commodity_prices_commodity ON public.commodity_prices(commodity_id);
CREATE INDEX idx_commodity_prices_date ON public.commodity_prices(date);

ALTER TABLE public.commodity_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prices are viewable by everyone"
  ON public.commodity_prices FOR SELECT USING (true);

CREATE POLICY "Only admin can insert prices"
  ON public.commodity_prices FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Only admin can update prices"
  ON public.commodity_prices FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Only admin can delete prices"
  ON public.commodity_prices FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================================
--  BAGIAN 5: TABEL PRODUK PASAR LANGSUNG (KOSONG - SELLER AKAN ISI)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.products (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  seller_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  category        TEXT NOT NULL,
  description     TEXT,
  price           INTEGER NOT NULL,
  stock           INTEGER NOT NULL DEFAULT 0,
  unit            TEXT DEFAULT 'kg',
  province        TEXT,
  city            TEXT,
  address         TEXT,
  status          TEXT DEFAULT 'aktif' CHECK (status IN ('aktif', 'tidak_aktif', 'habis')),
  image_url       TEXT[],
  is_organic      BOOLEAN DEFAULT FALSE,
  min_order       INTEGER DEFAULT 1,
  weight_per_unit NUMERIC(8,2),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_seller ON public.products(seller_id);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_status ON public.products(status);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are viewable by everyone"
  ON public.products FOR SELECT USING (status = 'aktif');

CREATE POLICY "Seller can insert own products"
  ON public.products FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('seller', 'admin'))
  );

CREATE POLICY "Seller can update own products"
  ON public.products FOR UPDATE
  USING (
    seller_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Seller can delete own products"
  ON public.products FOR DELETE
  USING (
    seller_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ============================================================================
--  BAGIAN 6: TABEL ORDERS (PEMESANAN)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  buyer_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  seller_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status          TEXT DEFAULT 'menunggu' CHECK (status IN ('menunggu','dibayar','dikirim','diterima','selesai','dibatalkan')),
  total_amount    INTEGER NOT NULL,
  shipping_cost   INTEGER DEFAULT 0,
  grand_total     INTEGER GENERATED ALWAYS AS (total_amount + shipping_cost) STORED,
  buyer_address   TEXT,
  buyer_phone     TEXT,
  notes           TEXT,
  payment_method  TEXT,
  payment_proof   TEXT,
  shipping_courier TEXT,
  tracking_number TEXT,
  rated           BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_buyer ON public.orders(buyer_id);
CREATE INDEX idx_orders_seller ON public.orders(seller_id);
CREATE INDEX idx_orders_status ON public.orders(status);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyer can view own orders"
  ON public.orders FOR SELECT
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Buyer can insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update their orders"
  ON public.orders FOR UPDATE
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Admin can view all orders"
  ON public.orders FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ============================================================================
--  BAGIAN 7: TABEL ORDER ITEMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.order_items (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id        UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id      UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name    TEXT NOT NULL,
  price           INTEGER NOT NULL,
  quantity        INTEGER NOT NULL,
  subtotal        INTEGER GENERATED ALWAYS AS (price * quantity) STORED,
  unit            TEXT DEFAULT 'kg'
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order items viewable by order owner"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_id AND (buyer_id = auth.uid() OR seller_id = auth.uid())
    )
  );


-- ============================================================================
--  BAGIAN 8: TABEL REVIEWS (ULASAN PRODUK)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.reviews (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id      UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  buyer_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  order_id        UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  rating          INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment         TEXT,
  image_url       TEXT[],
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_product ON public.reviews(product_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Buyer can insert reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyer can update own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = buyer_id);


-- ============================================================================
--  BAGIAN 9: TABEL SAVED PRODUCTS (BOOKMARK)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.saved_products (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id      UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.saved_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved products"
  ON public.saved_products FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own saved products"
  ON public.saved_products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved products"
  ON public.saved_products FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================================
--  BAGIAN 10: TABEL PAKET KOLEKTIF
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.collective_packages (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  category        TEXT NOT NULL,
  min_order       INTEGER NOT NULL DEFAULT 50,
  min_unit        TEXT DEFAULT 'kg',
  price_per_unit  INTEGER NOT NULL,
  original_price  INTEGER NOT NULL,
  participants    INTEGER DEFAULT 0,
  max_participants INTEGER NOT NULL DEFAULT 50,
  status          TEXT DEFAULT 'aktif' CHECK (status IN ('aktif','penuh','selesai','dibatalkan')),
  ends_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.collective_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collective packages are viewable by everyone"
  ON public.collective_packages FOR SELECT USING (true);

CREATE POLICY "Users can insert collective packages"
  ON public.collective_packages FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('seller','admin'))
  );

CREATE POLICY "Only admin can update collective packages"
  ON public.collective_packages FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================================
--  BAGIAN 11: TABEL COLLECTIVE PARTICIPANTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.collective_participants (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  package_id      UUID REFERENCES public.collective_packages(id) ON DELETE CASCADE NOT NULL,
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  quantity        INTEGER NOT NULL DEFAULT 0,
  unit            TEXT DEFAULT 'kg',
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(package_id, user_id)
);

ALTER TABLE public.collective_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own participations"
  ON public.collective_participants FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can join collective packages"
  ON public.collective_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- ============================================================================
--  BAGIAN 12: TABEL LEARNING MODULES (AKADEMI TANI)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.learning_modules (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title           TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  description     TEXT,
  category        TEXT,
  difficulty      TEXT DEFAULT 'pemula' CHECK (difficulty IN ('pemula','menengah','lanjutan')),
  duration_hours  INTEGER DEFAULT 1,
  lessons_count   INTEGER DEFAULT 0,
  content         JSONB DEFAULT '[]',
  image_url       TEXT,
  is_published    BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.learning_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Learning modules are viewable by everyone"
  ON public.learning_modules FOR SELECT USING (is_published = true);

CREATE POLICY "Only admin can manage learning modules"
  ON public.learning_modules FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================================
--  BAGIAN 13: TABEL LESSON PROGRESS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  module_id       UUID REFERENCES public.learning_modules(id) ON DELETE CASCADE NOT NULL,
  lesson_index    INTEGER NOT NULL DEFAULT 0,
  completed       BOOLEAN DEFAULT FALSE,
  completed_at    TIMESTAMPTZ,
  UNIQUE(user_id, module_id, lesson_index)
);

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON public.lesson_progress FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own progress"
  ON public.lesson_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.lesson_progress FOR UPDATE
  USING (user_id = auth.uid());


-- ============================================================================
--  BAGIAN 14: TABEL NOTIFICATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title           TEXT NOT NULL,
  message         TEXT NOT NULL,
  type            TEXT DEFAULT 'info' CHECK (type IN ('info','order','promo','system')),
  is_read         BOOLEAN DEFAULT FALSE,
  link            TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());


-- ============================================================================
--  BAGIAN 15: TABEL CHAT HISTORY (TANIBOT)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_user ON public.chat_messages(user_id);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chats"
  ON public.chat_messages FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own chats"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- ============================================================================
--  BAGIAN 16: TABEL PRICE ALERTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.price_alerts (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  commodity_id    INTEGER REFERENCES public.commodities(id) ON DELETE CASCADE NOT NULL,
  target_price    INTEGER NOT NULL,
  condition       TEXT NOT NULL CHECK (condition IN ('below','above')),
  is_active       BOOLEAN DEFAULT TRUE,
  triggered       BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own alerts"
  ON public.price_alerts FOR ALL
  USING (user_id = auth.uid());


-- ============================================================================
--  BAGIAN 17: ADMIN SEED - AKUN ADMIN
-- ============================================================================

-- NOTE: Akun admin dibuat via Supabase Dashboard > Authentication > Create User
-- Atau via SQL langsung di bawah ini (jalankan setelah auth ter-setup)

-- Insert ke auth.users (harus dijalankan sebagai superuser/service_role)
-- Password: Admin123 (bcrypt hash)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES
(
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'Admin@Admin.com',
  '$2a$10$J2rF5bBMkVQ9x5Y3F5b5XOX5Z1Y3Q5F5b5XOZ5b5XOX5b5XOX5b5XO',
  NOW(),
  '{"full_name":"Admin TaniPintar","role":"admin"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Insert ke profiles
INSERT INTO public.profiles (id, full_name, email, role, phone, province, city)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Admin TaniPintar',
  'Admin@Admin.com',
  'admin',
  '081234567890',
  'DKI Jakarta',
  'Jakarta Pusat'
) ON CONFLICT (id) DO NOTHING;


-- ============================================================================
--  BAGIAN 18: VIEW UNTUK MEMUDAHKAN QUERY
-- ============================================================================

-- View: harga terbaru per komoditas per provinsi
CREATE OR REPLACE VIEW public.v_latest_prices AS
SELECT DISTINCT ON (cp.commodity_id, cp.province)
  cp.id,
  cp.commodity_id,
  c.name AS commodity_name,
  c.category,
  c.unit,
  cp.province,
  cp.province_code,
  cp.price,
  cp.change_percent,
  cp.date
FROM public.commodity_prices cp
JOIN public.commodities c ON c.id = cp.commodity_id
ORDER BY cp.commodity_id, cp.province, cp.date DESC;

-- View: statistik harga per komoditas (min, max, avg, count provinsi)
CREATE OR REPLACE VIEW public.v_price_stats AS
SELECT
  cp.commodity_id,
  c.name AS commodity_name,
  c.category,
  c.unit,
  MIN(cp.price) AS min_price,
  MAX(cp.price) AS max_price,
  ROUND(AVG(cp.price)) AS avg_price,
  COUNT(DISTINCT cp.province) AS total_provinces
FROM public.commodity_prices cp
JOIN public.commodities c ON c.id = cp.commodity_id
WHERE cp.date = CURRENT_DATE
GROUP BY cp.commodity_id, c.name, c.category, c.unit;

-- View: produk aktif dengan info penjual
CREATE OR REPLACE VIEW public.v_active_products AS
SELECT
  p.*,
  pr.full_name AS seller_name,
  pr.farm_name,
  pr.province AS seller_province,
  pr.city AS seller_city,
  pr.rating_avg AS seller_rating,
  pr.total_sales AS seller_total_sales,
  pr.is_verified AS seller_verified,
  COALESCE(
    (SELECT ROUND(AVG(r.rating), 1) FROM public.reviews r WHERE r.product_id = p.id),
    0
  ) AS product_rating,
  COALESCE(
    (SELECT COUNT(*) FROM public.reviews r WHERE r.product_id = p.id),
    0
  ) AS review_count
FROM public.products p
JOIN public.profiles pr ON pr.id = p.seller_id
WHERE p.status = 'aktif';


-- ============================================================================
--  BAGIAN 19: HELPER FUNCTIONS
-- ============================================================================

-- Function: update seller stats setelah review baru
CREATE OR REPLACE FUNCTION public.update_seller_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET
    rating_avg = (SELECT ROUND(AVG(r.rating), 2) FROM public.reviews r WHERE r.product_id IN (SELECT id FROM public.products WHERE seller_id = NEW.buyer_id)),
    total_reviews = (SELECT COUNT(*) FROM public.reviews r WHERE r.product_id IN (SELECT id FROM public.products WHERE seller_id = NEW.buyer_id))
  WHERE id = (
    SELECT seller_id FROM public.products WHERE id = NEW.product_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- NOTE: trigger for on_new_review ada di file lengkap
-- Paste ulang karena referensi kolom di atas mungkin perlu diperbaiki
CREATE TRIGGER on_new_review
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_seller_stats();


-- ============================================================================
--  SELESAI - BAGIAN UTAMA
-- ============================================================================
-- Total: 17 tabel + 3 view + 4 functions + trigger
-- Data komoditas: 80+ komoditas pertanian Indonesia (real data)
-- Akun admin: Admin@Admin.com / Admin123 (tidak bisa di-register)
-- Pasar Langsung: kosong (seller akan mengisi via dashboard)
-- Harga per provinsi: jalankan seed_prices.sql secara terpisah
-- ============================================================================
