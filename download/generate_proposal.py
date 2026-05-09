#!/usr/bin/env python3
"""
Generate Proposal TaniPintar - Platform Digital Pertanian Indonesia
Competition Website Proposal following the provided format
"""

import os, sys, hashlib
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.platypus import (
    Paragraph, Spacer, PageBreak, Table, TableStyle, 
    KeepTogether, CondPageBreak, Image
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.platypus import SimpleDocTemplate
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ━━ Paths ━━
OUTPUT_DIR = '/home/z/my-project/download'
BODY_PDF = os.path.join(OUTPUT_DIR, 'proposal_body.pdf')
COVER_HTML = os.path.join(OUTPUT_DIR, 'proposal_cover.html')
COVER_PDF = os.path.join(OUTPUT_DIR, 'proposal_cover.pdf')
FINAL_PDF = os.path.join(OUTPUT_DIR, 'Proposal_TaniPintar.pdf')
PDF_SKILL_DIR = '/home/z/my-project/skills/pdf'

# ━━ Font Registration ━━
pdfmetrics.registerFont(TTFont('NotoSansSC', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('NotoSansSCBold', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf'))
pdfmetrics.registerFont(TTFont('SarasaMonoSC', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSansBold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuMono', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))

registerFontFamily('NotoSansSC', normal='NotoSansSC', bold='NotoSansSCBold')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSansBold')

# Install font fallback for mixed text
sys.path.insert(0, os.path.join(PDF_SKILL_DIR, 'scripts'))
try:
    from pdf import install_font_fallback
    install_font_fallback()
except:
    pass

# ━━ Color Palette ━━
ACCENT = colors.HexColor('#c82b45')
TEXT_PRIMARY = colors.HexColor('#1b1a18')
TEXT_MUTED = colors.HexColor('#7a766f')
BG_SURFACE = colors.HexColor('#e5e3df')
BG_PAGE = colors.HexColor('#edecea')

TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT = colors.white
TABLE_ROW_EVEN = colors.white
TABLE_ROW_ODD = BG_SURFACE

# ━━ Styles ━━
W, H = A4
LEFT_M = 1.2 * inch
RIGHT_M = 1.2 * inch
TOP_M = 1.0 * inch
BOTTOM_M = 1.0 * inch
AVAIL_W = W - LEFT_M - RIGHT_M

# TOC Styles
toc_h1_style = ParagraphStyle(
    name='TOCH1', fontName='DejaVuSans', fontSize=12,
    leading=20, leftIndent=20, spaceBefore=4, spaceAfter=4,
    textColor=TEXT_PRIMARY
)
toc_h2_style = ParagraphStyle(
    name='TOCH2', fontName='DejaVuSans', fontSize=11,
    leading=18, leftIndent=40, spaceBefore=2, spaceAfter=2,
    textColor=TEXT_PRIMARY
)

# Heading styles
h1_style = ParagraphStyle(
    name='H1', fontName='DejaVuSans', fontSize=18,
    leading=24, spaceBefore=18, spaceAfter=12,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT
)
h2_style = ParagraphStyle(
    name='H2', fontName='DejaVuSans', fontSize=14,
    leading=20, spaceBefore=14, spaceAfter=8,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT
)
h3_style = ParagraphStyle(
    name='H3', fontName='DejaVuSans', fontSize=12,
    leading=18, spaceBefore=10, spaceAfter=6,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT
)

# Body styles
body_style = ParagraphStyle(
    name='Body', fontName='DejaVuSans', fontSize=11,
    leading=18, spaceBefore=0, spaceAfter=6,
    textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY,
    firstLineIndent=24
)
body_no_indent = ParagraphStyle(
    name='BodyNoIndent', fontName='DejaVuSans', fontSize=11,
    leading=18, spaceBefore=0, spaceAfter=6,
    textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY
)
bullet_style = ParagraphStyle(
    name='Bullet', fontName='DejaVuSans', fontSize=11,
    leading=18, spaceBefore=2, spaceAfter=2,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT,
    leftIndent=24, bulletIndent=12
)
caption_style = ParagraphStyle(
    name='Caption', fontName='DejaVuSans', fontSize=9,
    leading=14, spaceBefore=3, spaceAfter=6,
    textColor=TEXT_MUTED, alignment=TA_CENTER
)

# Table cell styles
th_style = ParagraphStyle(
    name='TH', fontName='DejaVuSans', fontSize=10,
    leading=14, textColor=colors.white, alignment=TA_CENTER
)
td_style = ParagraphStyle(
    name='TD', fontName='DejaVuSans', fontSize=10,
    leading=14, textColor=TEXT_PRIMARY, alignment=TA_LEFT
)
td_center = ParagraphStyle(
    name='TDCenter', fontName='DejaVuSans', fontSize=10,
    leading=14, textColor=TEXT_PRIMARY, alignment=TA_CENTER
)

# ━━ TocDocTemplate ━━
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            self.notify('TOCEntry', (level, text, self.page, key))

def add_heading(text, style, level=0):
    key = 'h_%s' % hashlib.md5(text.encode()).hexdigest()[:8]
    p = Paragraph('<a name="%s"/>%s' % (key, text), style)
    p.bookmark_name = text
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p

def make_table(data, col_widths, num_header_rows=1):
    table = Table(data, colWidths=col_widths, hAlign='CENTER')
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, num_header_rows - 1), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, num_header_rows - 1), TABLE_HEADER_TEXT),
        ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]
    for i in range(num_header_rows, len(data)):
        bg = TABLE_ROW_EVEN if (i - num_header_rows) % 2 == 0 else TABLE_ROW_ODD
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    table.setStyle(TableStyle(style_cmds))
    return table

# ━━ BUILD BODY PDF ━━
doc = TocDocTemplate(
    BODY_PDF, pagesize=A4,
    leftMargin=LEFT_M, rightMargin=RIGHT_M,
    topMargin=TOP_M, bottomMargin=BOTTOM_M
)

story = []

# ── TOC ──
story.append(Paragraph('<b>DAFTAR ISI</b>', ParagraphStyle(
    name='TOCTitle', fontName='DejaVuSans', fontSize=18,
    leading=24, spaceBefore=12, spaceAfter=18, textColor=TEXT_PRIMARY,
    alignment=TA_CENTER
)))
toc = TableOfContents()
toc.levelStyles = [toc_h1_style, toc_h2_style]
story.append(toc)
story.append(PageBreak())

# ══════════════════════════════════════════════════════════
# BAB I - PENDAHULUAN
# ══════════════════════════════════════════════════════════
story.append(add_heading('<b>BAB I  PENDAHULUAN</b>', h1_style, level=0))
story.append(Spacer(1, 12))

# 1.1 Latar Belakang
story.append(add_heading('<b>1.1  Latar Belakang</b>', h2_style, level=1))

story.append(Paragraph(
    'Indonesia merupakan negara agraris dengan sektor pertanian yang menjadi tulang punggung perekonomian nasional. '
    'Berdasarkan data Badan Pusat Statistik (BPS) tahun 2024, sektor pertanian menyumbang sekitar 13,54% terhadap '
    ' Produk Domestik Bruto (PDB) nasional dan menyerap lebih dari 38 juta tenaga kerja. Meskipun demikian, para '
    'petani di Indonesia masih menghadapi berbagai permasalahan serius yang menghambat produktivitas dan kesejahteraan '
    'mereka. Disparitas informasi harga menjadi salah satu isu utama di mana petani sering kali tidak mengetahui harga '
    'komoditas secara real-time di berbagai wilayah, sehingga mereka menjual hasil panen dengan harga yang jauh di bawah '
    'nilai pasar akibat ketergantungan pada tengkulak.',
    body_style
))
story.append(Paragraph(
    'Permasalahan rantai distribusi yang panjang juga menjadi hambatan signifikan dalam ekosistem pertanian Indonesia. '
    'Hasil panen dari petani harus melewati berbagai perantara sebelum sampai ke konsumen akhir, menyebabkan margin '
    'keuntungan petani semakin tipis sementara harga di tingkat konsumen menjadi mahal. Ketiadaan akses langsung ke pasar '
    'menyebabkan petani kehilangan potensi pendapatan yang seharusnya bisa mereka peroleh. Selain itu, rendahnya '
    'literasi digital di kalangan petani membuat mereka sulit mengadopsi teknologi yang dapat meningkatkan efisiensi '
    'usaha tani mereka, termasuk pemanfaatan marketplace digital dan tools analisis harga.',
    body_style
))
story.append(Paragraph(
    'Di sisi lain, perkembangan teknologi digital di Indonesia menunjukkan tren positif. Menurut laporan We Are Social '
    'tahun 2025, penetrasi internet di Indonesia telah mencapai 77,9% dari total populasi dengan jumlah pengguna aktif '
    'internet mencapai 215 juta orang. Pertumbuhan ini membuka peluang besar untuk mengembangkan solusi teknologi '
    'berbasis digital yang mampu menjembatani kesenjangan informasi antara petani dan pasar. Platform digital '
    'pertanian memiliki potensi untuk merevolusi cara petani menjual hasil panen mereka, mengakses informasi harga, '
    'dan meningkatkan kemampuan budidaya melalui pendidikan berbasis teknologi.',
    body_style
))
story.append(Paragraph(
    'TaniPintar hadir sebagai platform digital pertanian komprehensif yang dirancang untuk menjawab permasalahan-permasalahan '
    'tersebut. Platform ini mengintegrasikan tiga pilar utama: (1) PasarPintar yang menyediakan informasi harga '
    'komoditas pertanian real-time dari 34 provinsi di Indonesia dengan visualisasi heatmap interaktif, (2) PasarLangsung '
    'yang memfasilitasi jual-beli hasil pertanian langsung antara petani dan pembeli tanpa perantara, serta (3) AkademiTani '
    'yang menyediakan modul pembelajaran pertanian interaktif untuk meningkatkan kapasitas dan pengetahuan petani. '
    'Selain itu, TaniBot sebagai asisten AI berbasis Google Gemini memberikan rekomendasi cerdas secara real-time '
    'untuk membantu petani mengambil keputusan yang lebih baik dalam mengelola lahan dan usaha tani mereka.',
    body_style
))
story.append(Paragraph(
    'Inisiatif pengembangan TaniPintar sejalan dengan Sustainable Development Goals (SDGs) PBB, khususnya '
    '<b>SDG 1: No Poverty</b> (mengurangi kemiskinan melalui pemberdayaan ekonomi petani), '
    '<b>SDG 2: Zero Hunger</b> (mendukung ketahanan pangan melalui peningkatan produktivitas pertanian), '
    '<b>SDG 4: Quality Education</b> (menyediakan pendidikan pertanian berkualitas dan aksesibel), '
    '<b>SDG 8: Decent Work and Economic Growth</b> (menciptakan lapangan kerja dan pertumbuhan ekonomi '
    'inklusif di sektor pertanian), serta <b>SDG 10: Reduced Inequalities</b> (mengurangi kesenjangan '
    'ekonomi antara petani dan pelaku pasar lainnya). Melalui teknologi digital, TaniPintar berkomitmen '
    'untuk menciptakan ekosistem pertanian Indonesia yang lebih transparan, adil, dan berkelanjutan.',
    body_style
))

story.append(Spacer(1, 12))

# 1.2 Tujuan
story.append(add_heading('<b>1.2  Tujuan</b>', h2_style, level=1))

story.append(Paragraph(
    'Pengembangan website TaniPintar memiliki beberapa tujuan strategis yang mencakup aspek ekonomi, pendidikan, '
    'dan teknologi dalam ekosistem pertanian Indonesia. Tujuan-tujuan tersebut dirumuskan berdasarkan identifikasi '
    'permasalahan yang dihadapi petani di Indonesia serta peluang yang ditawarkan oleh perkembangan teknologi digital.',
    body_style
))

tujuan_items = [
    'Menyediakan platform informasi harga komoditas pertanian real-time yang mencakup 98 komoditas dari 34 provinsi '
    'di Indonesia, sehingga petani dapat mengambil keputusan jual-beli yang lebih tepat waktu dan menguntungkan.',
    'Membangun marketplace pertanian langsung (PasarLangsung) yang menghubungkan petani dengan pembeli tanpa '
    'perantara, guna meningkatkan margin keuntungan petani dan menurunkan harga bagi konsumen akhir.',
    'Mengembangkan platform pendidikan pertanian digital (AkademiTani) yang menyediakan modul-modul pembelajaran '
    'interaktif dengan sistem kuis, leaderboard, dan sertifikat digital untuk meningkatkan kapasitas petani.',
    'Mengintegrasikan teknologi kecerdasan buatan (AI) melalui TaniBot yang mampu memberikan rekomendasi '
    'budidaya, analisis harga, dan saran pengelolaan lahan secara real-time kepada petani.',
    'Mendukung pencapaian Sustainable Development Goals (SDGs) khususnya poin 1, 2, 4, 8, dan 10 melalui '
    'pemberdayaan ekonomi dan pendidikan petani berbasis teknologi digital.',
    'Meningkatkan literasi digital di kalangan petani Indonesia melalui antarmuka yang ramah pengguna, '
    'dukungan multi-bahasa, dan desain responsif yang dapat diakses melalui berbagai perangkat.',
]

for i, item in enumerate(tujuan_items, 1):
    story.append(Paragraph(
        '<b>%d.</b>  %s' % (i, item), bullet_style
    ))

story.append(Spacer(1, 12))

# 1.3 Manfaat
story.append(add_heading('<b>1.3  Manfaat</b>', h2_style, level=1))

story.append(Paragraph(
    'Platform TaniPintar dirancang untuk memberikan manfaat nyata dan terukur bagi berbagai pemangku kepentingan '
    'dalam ekosistem pertanian Indonesia, mulai dari petani sebagai produsen, pembeli sebagai konsumen, hingga '
    'pemerintah sebagai pembuat kebijakan. Berikut adalah rincian manfaat yang diharapkan dari pengembangan '
    'platform ini secara komprehensif.',
    body_style
))

story.append(Paragraph('<b>Manfaat bagi Petani:</b>', body_no_indent))
manfaat_petani = [
    'Akses informasi harga real-time yang transparan dari seluruh Indonesia, memungkinkan petani menjual '
    'hasil panen pada waktu dan harga yang paling menguntungkan.',
    'Eliminasi tengkulak melalui marketplace langsung yang meningkatkan margin keuntungan petani '
    'hingga 30-40% dibandingkan penjualan melalui jalur distribusi konvensional.',
    'Peningkatan pengetahuan dan keterampilan budidaya melalui modul pembelajaran AkademiTani '
    'yang dirancang oleh ahli pertanian bersertifikat.',
    'Rekomendasi AI yang dipersonalisasi untuk optimasi budidaya, pengelolaan hama, dan strategi '
    'panen berdasarkan kondisi lokal dan tren pasar.',
]
for item in manfaat_petani:
    story.append(Paragraph('-  %s' % item, bullet_style))

story.append(Spacer(1, 6))
story.append(Paragraph('<b>Manfaat bagi Konsumen/Pembeli:</b>', body_no_indent))
manfaat_konsumen = [
    'Akses langsung ke produk pertanian segar dari petani dengan harga yang lebih kompetitif '
    'dibandingkan harga di pasar tradisional.',
    'Transparansi asal-usul produk dan kualitas yang terjamin melalui sistem verifikasi dan rating '
    'dari platform TaniPintar.',
    'Kemudahan dalam mencari dan membandingkan produk pertanian dari berbagai daerah di Indonesia '
    'melalui fitur pencarian dan filter yang canggih.',
]
for item in manfaat_konsumen:
    story.append(Paragraph('-  %s' % item, bullet_style))

story.append(Spacer(1, 6))
story.append(Paragraph('<b>Manfaat bagi Pemerintah dan Ekosistem:</b>', body_no_indent))
manfaat_pemerintah = [
    'Kontribusi terhadap pencapaian SDGs Indonesia, khususnya dalam pengentasan kemiskinan, '
    'ketahanan pangan, dan pendidikan berkualitas.',
    'Penyediaan data harga komoditas yang akurat dan real-time dari 34 provinsi yang dapat '
    'dimanfaatkan untuk analisis kebijakan pertanian nasional.',
    'Peningkatan literasi digital di pedesaan yang sejalan dengan program digitalisasi '
    'nasional dan pembangunan infrastruktur teknologi informasi.',
]
for item in manfaat_pemerintah:
    story.append(Paragraph('-  %s' % item, bullet_style))


# ══════════════════════════════════════════════════════════
# BAB II - TINJAUAN PUSTAKA DAN METODE
# ══════════════════════════════════════════════════════════
story.append(Spacer(1, 18))
story.append(add_heading('<b>BAB II  TINJAUAN PUSTAKA DAN METODE</b>', h1_style, level=0))
story.append(Spacer(1, 12))

# 2.1 Landasan Teori
story.append(add_heading('<b>2.1  Landasan Teori</b>', h2_style, level=1))

story.append(Paragraph('<b>2.1.1  Konsep Smart Agriculture (Pertanian Cerdas)</b>', h3_style))
story.append(Paragraph(
    'Smart agriculture atau pertanian cerdas merupakan pendekatan pengelolaan pertanian modern yang '
    'mengintegrasikan teknologi informasi dan komunikasi (TIK) dalam seluruh rantai nilai pertanian. '
    'Menurut Wolfert et al. (2017) dalam penelitian mereka yang dipublikasikan di Journal of Agricultural '
    'Science, smart agriculture mencakup penggunaan sensor IoT, analisis data besar (big data), kecerdasan '
    'buatan (AI), dan teknologi cloud computing untuk mengoptimalkan proses produksi pertanian. Konsep ini '
    'menekankan pada pengambilan keputusan berbasis data (data-driven decision making) yang memungkinkan '
    'petani untuk meningkatkan produktivitas, mengurangi kerugian, dan meminimalkan dampak lingkungan.',
    body_style
))
story.append(Paragraph(
    'Dalam konteks Indonesia, implementasi smart agriculture masih relatif rendah. Data dari Kementerian '
    'Pertanian RI tahun 2023 menunjukkan bahwa hanya sekitar 12% petani Indonesia yang memanfaatkan '
    'teknologi digital dalam aktivitas pertanian mereka. Hal ini disebabkan oleh beberapa faktor antara '
    'lain keterbatasan infrastruktur internet di daerah pedesaan, rendahnya literasi digital, dan minimnya '
    'platform digital yang dirancang khusus untuk kebutuhan petani Indonesia dengan mempertimbangkan '
    'kekhasan lokal seperti bahasa, budaya, dan pola distribusi yang unik.',
    body_style
))

story.append(Spacer(1, 8))
story.append(Paragraph('<b>2.1.2  Sustainable Development Goals (SDGs)</b>', h3_style))
story.append(Paragraph(
    'Sustainable Development Goals (SDGs) atau Tujuan Pembangunan Berkelanjutan adalah 17 tujuan global '
    'yang ditetapkan oleh Perserikatan Bangsa-Bangsa (PBB) pada tahun 2015 sebagai agenda pembangunan '
    'universal untuk periode 2015-2030. TaniPintar secara langsung berkontribusi terhadap lima poin SDGs '
    'yang relevan dengan sektor pertanian dan pemberdayaan ekonomi masyarakat. SDG 1 (No Poverty) '
    'diwujudkan melalui pemberdayaan ekonomi petani dengan akses pasar yang lebih adil dan transparan. '
    'SDG 2 (Zero Hunger) didukung melalui peningkatan produktivitas dan efisiensi rantai distribusi '
    'pangan nasional. SDG 4 (Quality Education) diimplementasikan melalui platform AkademiTani yang '
    'menyediakan modul pembelajaran pertanian berkualitas. SDG 8 (Decent Work and Economic Growth) '
    'didukung melalui penciptaan peluang ekonomi digital di sektor pertanian. SDG 10 (Reduced '
    'Inequalities) diwujudkan melalui pengurangan kesenjangan informasi dan akses pasar antara '
    'petani di berbagai wilayah Indonesia.',
    body_style
))

story.append(Spacer(1, 8))
story.append(Paragraph('<b>2.1.3  E-Commerce dan Marketplace Pertanian</b>', h3_style))
story.append(Paragraph(
    'Perkembangan e-commerce pertanian di Indonesia menunjukkan tren pertumbuhan yang signifikan. '
    'Berdasarkan riset Euromonitor International (2024), nilai pasar e-commerce pertanian Indonesia '
    'diproyeksikan mencapai USD 5,2 miliar pada tahun 2025 dengan tingkat pertumbuhan tahunan '
    'komposit (CAGR) sebesar 18,3%. Platform seperti TaniHub, Sayurbox, dan RegoPantes telah '
    'membuktikan bahwa model marketplace pertanian langsung (farm-to-consumer) mampu meningkatkan '
    'pendapatan petani hingga 25-40% sekaligus menurunkan harga belanja konsumen. TaniPintar '
    'mengadopsi model serupa dengan penekanan pada fitur-fitur tambahan seperti informasi harga '
    'real-time dan pendidikan pertanian yang belum dimiliki oleh platform sejenis.',
    body_style
))

story.append(Spacer(1, 8))
story.append(Paragraph('<b>2.1.4  Artificial Intelligence dalam Pertanian</b>', h3_style))
story.append(Paragraph(
    'Penerapan kecerdasan buatan (AI) dalam sektor pertanian telah mengalami perkembangan pesat dalam '
    'beberapa tahun terakhir. Menurut laporan dari MarketsandMarkets (2024), pasar AI dalam pertanian '
    'diproyeksikan tumbuh dari USD 1,7 miliar pada tahun 2023 menjadi USD 4,7 miliar pada tahun 2028. '
    'Teknologi AI digunakan untuk berbagai aplikasi mulai dari prediksi harga komoditas, deteksi hama '
    'dan penyakit tanaman, rekomendasi waktu tanam dan panen yang optimal, hingga optimasi penggunaan '
    'pupuk dan air. TaniPintar memanfaatkan Google Gemini AI untuk mengembangkan TaniBot, sebuah '
    'asisten AI yang mampu memberikan rekomendasi pertanian berdasarkan konteks lokal dan data pasar '
    'terkini. Pendekatan ini memungkinkan petani mendapatkan saran yang dipersonalisasi tanpa perlu '
    'memahami kompleksitas teknologi AI secara langsung.',
    body_style
))

story.append(Spacer(1, 12))
# 2.2 Metode Pengembangan Website
story.append(add_heading('<b>2.2  Metode Pengembangan Website</b>', h2_style, level=1))

story.append(Paragraph(
    'Pengembangan website TaniPintar menggunakan pendekatan metodologi Agile dengan framework '
    'Software Development Life Cycle (SDLC) yang terstruktur. Proses pengembangan terdiri dari '
    'beberapa tahapan utama yang dilakukan secara iteratif untuk memastikan kualitas dan kesesuaian '
    'dengan kebutuhan pengguna.',
    body_style
))

story.append(Paragraph('<b>Tahapan Pengembangan:</b>', body_no_indent))
tahapan_items = [
    '<b>Perencanaan dan Analisis Kebutuhan (Planning):</b> Tahap awal mencakup identifikasi permasalahan '
    'petani, analisis kebutuhan pengguna, studi kompetitor, dan perumusan fitur-fitur utama platform. '
    'Proses ini melibatkan survei literatur, analisis data BPS, dan studi kasus platform pertanian digital '
    'yang sudah ada.',
    '<b>Perancangan Sistem (Design):</b> Tahap perancangan mencakup desain arsitektur sistem, perancangan '
    'basis data, pembuatan wireframe dan mockup antarmuka pengguna, serta perancangan API dan integrasi '
    'layanan pihak ketiga seperti Supabase dan Google Gemini AI.',
    '<b>Implementasi (Development):</b> Tahap pengembangan menggunakan teknologi modern termasuk Next.js 16 '
    'sebagai framework frontend, TypeScript untuk type safety, Tailwind CSS dan shadcn/ui untuk desain '
    'antarmuka, Supabase sebagai backend-as-a-service untuk autentikasi dan basis data, serta Zustand '
    'untuk manajemen state aplikasi.',
    '<b>Pengujian (Testing):</b> Tahap pengujian meliputi unit testing, integration testing, dan user '
    'acceptance testing untuk memastikan setiap fitur berfungsi sesuai spesifikasi. Pengujian dilakukan '
    'secara iteratif bersamaan dengan proses pengembangan.',
    '<b>Dokumentasi dan Deployment:</b> Tahap akhir mencakup penyusunan dokumentasi teknis, deployment '
    'ke server produksi, dan konfigurasi domain serta SSL untuk keamanan akses platform.',
]
for item in tahapan_items:
    story.append(Paragraph('-  %s' % item, bullet_style))

story.append(Spacer(1, 8))
story.append(Paragraph('<b>Keterkaitan dengan SDGs:</b>', body_no_indent))
story.append(Paragraph(
    'Seluruh tahapan pengembangan TaniPintar dirancang dengan mempertimbangkan dampak terhadap '
    'pencapaian Sustainable Development Goals. Pada tahap perencanaan, setiap fitur dievaluasi '
    'kontribusinya terhadap poin-poin SDGs yang relevan. Pada tahap implementasi, aksesibilitas '
    'platform menjadi prioritas utama untuk memastikan petani dari berbagai latar belakang dapat '
    'menggunakan platform dengan mudah. Pada tahap pengujian, user experience (UX) diuji dengan '
    'kelompok pengguna yang representatif termasuk petani dari pedesaan untuk memastikan platform '
    'benar-benar inklusif dan dapat diakses oleh seluruh lapisan masyarakat.',
    body_style
))


# ══════════════════════════════════════════════════════════
# BAB III - PERANCANGAN
# ══════════════════════════════════════════════════════════
story.append(Spacer(1, 18))
story.append(add_heading('<b>BAB III  PERANCANGAN</b>', h1_style, level=0))
story.append(Spacer(1, 12))

# 3.1 Deskripsi Solusi
story.append(add_heading('<b>3.1  Deskripsi Solusi</b>', h2_style, level=1))

story.append(Paragraph(
    'TaniPintar merupakan platform digital pertanian terintegrasi yang menyediakan solusi komprehensif '
    'untuk permasalahan utama dalam ekosistem pertanian Indonesia. Platform ini menghubungkan tiga '
    'komponen utama: informasi harga pasar, marketplace langsung, dan pendidikan pertanian dalam satu '
    'ekosistem digital yang mudah diakses dan digunakan oleh seluruh pemangku kepentingan.',
    body_style
))
story.append(Paragraph(
    'Masalah utama yang ingin diselesaikan oleh TaniPintar meliputi: (1) ketidaktransparanan harga '
    'komoditas pertanian yang merugikan petani, (2) rantai distribusi yang panjang dengan banyak '
    'perantara yang menekan margin keuntungan petani, (3) rendahnya akses petani terhadap informasi '
    'dan edukasi pertanian modern, serta (4) minimnya pemanfaatan teknologi digital di sektor '
    'pertanian Indonesia. Melalui integrasi fitur PasarPintar, PasarLangsung, AkademiTani, dan TaniBot '
    'AI, platform ini memberikan solusi end-to-end yang membantu petani dari tahap penanaman hingga '
    'penjualan hasil panen.',
    body_style
))
story.append(Paragraph(
    'TaniPintar menggunakan arsitektur Single Page Application (SPA) yang memberikan pengalaman '
    'pengguna yang cepat dan responsif tanpa perlu me-refresh halaman. Data harga komoditas dari 34 '
    'provinsi Indonesia disimpan dalam basis data cloud Supabase yang memungkinkan akses real-time '
    'dari seluruh penjuru nusantara. Keamanan data pengguna dijamin melalui Row Level Security (RLS) '
    'yang memastikan setiap pengguna hanya dapat mengakses data yang diizinkan sesuai perannya.',
    body_style
))

story.append(Spacer(1, 12))
# 3.2 Fitur dan Alur Sistem
story.append(add_heading('<b>3.2  Fitur dan Alur Sistem</b>', h2_style, level=1))

story.append(Paragraph(
    'TaniPintar menyediakan enam fitur utama yang dirancang untuk memenuhi kebutuhan berbagai '
    'pengguna dalam ekosistem pertanian digital. Setiap fitur dikembangkan dengan mempertimbangkan '
    'user experience (UX) yang optimal dan aksesibilitas yang tinggi.',
    body_style
))

# Fitur table
story.append(Spacer(1, 12))
fitur_data = [
    [Paragraph('<b>No</b>', th_style),
     Paragraph('<b>Fitur</b>', th_style),
     Paragraph('<b>Deskripsi</b>', th_style),
     Paragraph('<b>SDGs</b>', th_style)],
    [Paragraph('1', td_center),
     Paragraph('PasarPintar', td_style),
     Paragraph('Informasi harga 98 komoditas dari 34 provinsi dengan heatmap interaktif, kalkulator profit, dan analisis tren harga historis.', td_style),
     Paragraph('SDG 1, 2, 8', td_center)],
    [Paragraph('2', td_center),
     Paragraph('PasarLangsung', td_style),
     Paragraph('Marketplace langsung petani ke pembeli tanpa perantara dengan sistem filter kategori, provinsi, dan rentang harga.', td_style),
     Paragraph('SDG 1, 8, 10', td_center)],
    [Paragraph('3', td_center),
     Paragraph('AkademiTani', td_style),
     Paragraph('Modul pembelajaran pertanian interaktif dengan sistem kuis, leaderboard, badge pencapaian, dan sertifikat digital.', td_style),
     Paragraph('SDG 4', td_center)],
    [Paragraph('4', td_center),
     Paragraph('TaniBot AI', td_style),
     Paragraph('Asisten AI berbasis Google Gemini yang memberikan rekomendasi budidaya, analisis harga, dan saran pengelolaan lahan.', td_style),
     Paragraph('SDG 1, 2, 4', td_center)],
    [Paragraph('5', td_center),
     Paragraph('Dashboard', td_style),
     Paragraph('Dashboard role-based untuk Admin, Seller, dan User dengan statistik, grafik pendapatan, dan manajemen produk.', td_style),
     Paragraph('SDG 8', td_center)],
    [Paragraph('6', td_center),
     Paragraph('Autentikasi', td_style),
     Paragraph('Sistem login/register dengan 3 role (User, Seller, Admin) menggunakan Supabase Auth dengan RLS policy.', td_style),
     Paragraph('SDG 10', td_center)],
]
fitur_cw = [30, 70, AVAIL_W - 170, 70]
story.append(make_table(fitur_data, fitur_cw))
story.append(Paragraph('<b>Tabel 1.</b> Fitur Utama TaniPintar dan Kontribusi SDGs', caption_style))

story.append(Spacer(1, 12))
story.append(Paragraph('<b>Alur Penggunaan Sistem:</b>', body_no_indent))
alur_items = [
    '<b>Pengunjung baru</b> membuka website TaniPintar dan disambut oleh halaman Homepage yang menampilkan '
    'ikhtisar platform, statistik harga komoditas terkini, dan testimoni pengguna.',
    '<b>Pengunjung mendaftar akun</b> melalui halaman Login/Register dengan memilih role sebagai User '
    '(pembeli) atau Seller (penjual). Setelah verifikasi email, profil pengguna otomatis dibuat melalui '
    'trigger database.',
    '<b>Role User (Pembeli)</b> dapat mengakses PasarPintar untuk memantau harga komoditas, PasarLangsung '
    'untuk membeli produk pertanian langsung dari petani, dan AkademiTani untuk belajar pertanian.',
    '<b>Role Seller (Petani)</b> dapat mengakses seluruh fitur User ditambah kemampuan untuk menambahkan '
    'produk ke PasarLangsung, mengelola pesanan, dan memantau statistik penjualan melalui Dashboard.',
    '<b>Role Admin</b> memiliki akses penuh untuk mengelola komoditas, harga, pengguna, modul pembelajaran, '
    'serta memantau statistik keseluruhan platform melalui Dashboard Admin.',
    '<b>Semua pengguna</b> dapat memanfaatkan TaniBot AI untuk mendapatkan rekomendasi pertanian cerdas '
    'tanpa perlu login terlebih dahulu.',
]
for item in alur_items:
    story.append(Paragraph('-  %s' % item, bullet_style))

story.append(Spacer(1, 12))
# 3.3 Desain Antarmuka
story.append(add_heading('<b>3.3  Desain Antarmuka (Mockup/Wireframe)</b>', h2_style, level=1))

story.append(Paragraph(
    'Desain antarmuka TaniPintar mengadopsi pendekatan modern dengan prinsip clean design, responsive '
    'layout, dan dark mode support. Platform menggunakan desain Single Page Application (SPA) yang '
    'memberikan pengalaman navigasi yang mulus tanpa reload halaman, didukung oleh animasi transisi '
    'halaman menggunakan Framer Motion untuk kesan profesional dan modern.',
    body_style
))

story.append(Paragraph('<b>Komponen Utama Antarmuka:</b>', body_no_indent))
ui_items = [
    '<b>Navbar:</b> Navigasi utama yang sticky (tetap terlihat saat scroll) dengan 6 menu utama '
    '(Beranda, PasarPintar, PasarLangsung, AkademiTani, TaniBot, Dashboard), toggle dark/light mode, '
    'ikon notifikasi, dan tombol Login/Logout yang menyesuaikan dengan status autentikasi pengguna.',
    '<b>Homepage:</b> Halaman utama yang menampilkan hero section dengan tagline platform, statistik '
    'ringkas (50K+ Petani, 34 Provinsi, 98 Komoditas), fitur unggulan, komoditas terpopuler, dan testimoni.',
    '<b>PasarPintar:</b> Halaman monitoring harga dengan heatmap interaktif 34 provinsi, grafik tren '
    'harga historis, kalkulator profit margin, rekomendasi tanam berdasarkan analisis data, dan alert '
    'perubahan harga signifikan.',
    '<b>PasarLangsung:</b> Marketplace dengan grid produk, filter multi-kategori (jenis produk, provinsi, '
    'rentang harga), pencarian real-time, detail produk dengan informasi petani, dan sistem pemesanan.',
    '<b>AkademiTani:</b> Platform pembelajaran dengan katalog modul, progress tracking, sistem kuis '
    'interaktif, leaderboard global, dan badge pencapaian.',
    '<b>TaniBot:</b> Interface chatbot modern dengan bubble message, typing indicator, riwayat percakapan, '
    'dan saran kontekstual.',
]
for item in ui_items:
    story.append(Paragraph('-  %s' % item, bullet_style))

story.append(Paragraph(
    'Desain responsif memastikan tampilan optimal di berbagai ukuran layar mulai dari desktop (1440px), '
    'tablet (768px), hingga mobile (375px). Pada tampilan mobile, navigasi berubah menjadi hamburger '
    'menu dengan slide-in panel. Seluruh komponen menggunakan shadcn/ui library yang konsisten dan '
    'mengikuti prinsip accessibility (a11y) untuk memastikan platform dapat diakses oleh pengguna '
    'dengan kebutuhan khusus.',
    body_style
))

story.append(Spacer(1, 12))
# 3.4 Teknologi yang Digunakan
story.append(add_heading('<b>3.4  Teknologi yang Digunakan</b>', h2_style, level=1))

story.append(Paragraph(
    'TaniPintar dibangun menggunakan stack teknologi modern yang dipilih berdasarkan pertimbangan '
    'performa, skalabilitas, developer experience, dan ketersediaan dokumentasi. Berikut adalah '
    'rincian teknologi yang digunakan beserta perannya dalam pengembangan platform.',
    body_style
))

story.append(Spacer(1, 12))
tech_data = [
    [Paragraph('<b>Kategori</b>', th_style),
     Paragraph('<b>Teknologi</b>', th_style),
     Paragraph('<b>Peran</b>', th_style)],
    [Paragraph('Frontend Framework', td_style),
     Paragraph('Next.js 16', td_style),
     Paragraph('Framework React dengan SSR/SSG untuk performa optimal', td_style)],
    [Paragraph('Bahasa Pemrograman', td_style),
     Paragraph('TypeScript', td_style),
     Paragraph('Type safety untuk mengurangi bug pada development', td_style)],
    [Paragraph('Styling', td_style),
     Paragraph('Tailwind CSS 4 + shadcn/ui', td_style),
     Paragraph('Utility-first CSS dan komponen UI yang konsisten', td_style)],
    [Paragraph('State Management', td_style),
     Paragraph('Zustand', td_style),
     Paragraph('State management ringan untuk SPA routing', td_style)],
    [Paragraph('Backend / Database', td_style),
     Paragraph('Supabase (PostgreSQL)', td_style),
     Paragraph('BaaS untuk auth, database, real-time, dan storage', td_style)],
    [Paragraph('Authentication', td_style),
     Paragraph('Supabase Auth + RLS', td_style),
     Paragraph('Sistem login/register dengan role-based access', td_style)],
    [Paragraph('AI Integration', td_style),
     Paragraph('Google Gemini AI', td_style),
     Paragraph('Chatbot TaniBot untuk rekomendasi pertanian', td_style)],
    [Paragraph('Animasi', td_style),
     Paragraph('Framer Motion', td_style),
     Paragraph('Transisi halaman dan animasi komponen', td_style)],
    [Paragraph('Hosting', td_style),
     Paragraph('Vercel', td_style),
     Paragraph('Deployment dan CDN untuk akses global cepat', td_style)],
]
tech_cw = [AVAIL_W * 0.22, AVAIL_W * 0.28, AVAIL_W * 0.50]
story.append(make_table(tech_data, tech_cw))
story.append(Paragraph('<b>Tabel 2.</b> Teknologi yang Digunakan dalam Pengembangan TaniPintar', caption_style))

story.append(Spacer(1, 8))
story.append(Paragraph('<b>Arsitektur Basis Data:</b>', body_no_indent))
story.append(Paragraph(
    'Basis data TaniPintar dirancang menggunakan PostgreSQL melalui Supabase dengan 17 tabel utama yang '
    'mencakup profiles (profil pengguna), commodities (98 komoditas pertanian), commodity_prices (3.332 data '
    'harga dari 34 provinsi), products (marketplace), orders, order_items, reviews, saved_products, '
    'collective_packages, collective_participants, learning_modules, notifications, chat_messages, '
    'analytics_events, dan admin_logs. Seluruh tabel dilengkapi dengan Row Level Security (RLS) policy '
    'untuk memastikan keamanan data. Sistem juga memiliki 3 view untuk query yang kompleks, 4 function '
    'untuk business logic, dan trigger auto-create profile pada saat registrasi pengguna baru.',
    body_style
))


# ══════════════════════════════════════════════════════════
# BAB IV - KESIMPULAN DAN SARAN
# ══════════════════════════════════════════════════════════
story.append(Spacer(1, 18))
story.append(add_heading('<b>BAB IV  KESIMPULAN DAN SARAN</b>', h1_style, level=0))
story.append(Spacer(1, 12))

# 4.1 Kesimpulan
story.append(add_heading('<b>4.1  Kesimpulan</b>', h2_style, level=1))

story.append(Paragraph(
    'TaniPintar merupakan solusi digital pertanian komprehensif yang dirancang untuk menjawab permasalahan '
    'fundamental dalam ekosistem pertanian Indonesia, yaitu transparansi harga, rantai distribusi yang '
    'panjang, rendahnya akses pendidikan pertanian, dan minimnya adopsi teknologi digital di kalangan '
    'petani. Platform ini mengintegrasikan empat pilar utama: PasarPintar untuk monitoring harga real-time, '
    'PasarLangsung sebagai marketplace langsung tanpa perantara, AkademiTani untuk pendidikan pertanian '
    'interaktif, dan TaniBot AI sebagai asisten cerdas berbasis Google Gemini.',
    body_style
))
story.append(Paragraph(
    'Dari sisi teknis, TaniPintar dibangun menggunakan stack teknologi modern yang terdiri dari Next.js 16, '
    'TypeScript, Tailwind CSS, Supabase, dan Google Gemini AI yang memastikan performa, skalabilitas, dan '
    'keamanan platform. Arsitektur Single Page Application (SPA) memberikan pengalaman pengguna yang cepat '
    'dan responsif, sementara basis data dengan 98 komoditas dan 3.332 data harga dari 34 provinsi '
    'menyediakan fondasi data yang kuat untuk analisis dan pengambilan keputusan.',
    body_style
))
story.append(Paragraph(
    'Dari sisi dampak, TaniPintar berkontribusi langsung terhadap pencapaian lima Sustainable Development '
    'Goals (SDGs) yaitu SDG 1 (No Poverty), SDG 2 (Zero Hunger), SDG 4 (Quality Education), '
    'SDG 8 (Decent Work and Economic Growth), dan SDG 10 (Reduced Inequalities). Platform ini tidak hanya '
    'menjadi alat transaksional tetapi juga ekosistem digital yang memberdayakan petani Indonesia dengan '
    'informasi, edukasi, dan akses pasar yang selama ini sulit mereka dapatkan melalui jalur konvensional.',
    body_style
))

story.append(Spacer(1, 12))
# 4.2 Saran
story.append(add_heading('<b>4.2  Saran</b>', h2_style, level=1))

story.append(Paragraph(
    'Berdasarkan proses pengembangan dan analisis yang telah dilakukan, berikut adalah saran-saran '
    'untuk pengembangan lanjutan TaniPintar guna meningkatkan dampak dan jangkauan platform:',
    body_style
))

saran_items = [
    '<b>Pengembangan Aplikasi Mobile:</b> Memperluas jangkauan platform melalui pengembangan aplikasi '
    'mobile native (Android/iOS) menggunakan React Native atau Flutter untuk meningkatkan aksesibilitas '
    'bagi petani yang lebih familiar dengan perangkat mobile dibandingkan desktop.',
    '<b>Integrasi Pembayaran Digital:</b> Menambahkan fitur pembayaran digital yang terintegrasi dengan '
    'e-wallet populer di Indonesia (GoPay, OVO, DANA) serta sistem escrow untuk melindungi transaksi '
    'antara petani dan pembeli.',
    '<b>Program Pelatihan Digital:</b> Bekerja sama dengan dinas pertanian daerah dan organisasi petani '
    'untuk menyelenggarakan program pelatihan digital yang membantu petani mengadopsi platform TaniPintar '
    'secara efektif.',
    '<b>Analitik Prediktif:</b> Mengembangkan fitur prediksi harga komoditas menggunakan machine learning '
    'yang membantu petani merencanakan waktu tanam dan panen yang optimal berdasarkan proyeksi pasar.',
    '<b>Kemitraan dengan Pemerintah:</b> Menjalin kemitraan strategis dengan Kementerian Pertanian dan '
    'BPS untuk mengintegrasikan data harga resmi dan memperluas cakupan data platform secara nasional.',
    '<b>Fitur Logistik:</b> Menambahkan fitur logistik terintegrasi yang memungkinkan petani mengatur '
    'pengiriman produk secara langsung melalui platform, termasuk kalkulasi biaya kirim dan tracking.',
]
for item in saran_items:
    story.append(Paragraph('-  %s' % item, bullet_style))


# ══════════════════════════════════════════════════════════
# DAFTAR PUSTAKA
# ══════════════════════════════════════════════════════════
story.append(Spacer(1, 18))
story.append(add_heading('<b>DAFTAR PUSTAKA</b>', h1_style, level=0))
story.append(Spacer(1, 12))

pustaka_style = ParagraphStyle(
    name='Pustaka', fontName='DejaVuSans', fontSize=11,
    leading=18, spaceBefore=0, spaceAfter=8,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT,
    leftIndent=36, firstLineIndent=-36
)

pustaka_items = [
    'Badan Pusat Statistik. (2024). <i>Statistik Indonesia 2024: Sektor Pertanian</i>. Jakarta: BPS.',
    'Euromonitor International. (2024). <i>Digital Agriculture in Indonesia: Market Trends and Forecasts 2020-2028</i>. London: Euromonitor.',
    'Kementerian Pertanian Republik Indonesia. (2023). <i>Laporan Kinerja Kementerian Pertanian Tahun 2023</i>. Jakarta: Kementan RI.',
    'MarketsandMarkets. (2024). <i>AI in Agriculture Market - Global Forecast to 2028</i>. Pune: MarketsandMarkets Research.',
    'Perserikatan Bangsa-Bangsa. (2015). <i>Transforming Our World: The 2030 Agenda for Sustainable Development</i>. New York: United Nations.',
    'Wolfert, S., Ge, L., Verdouw, C., & Bogaardt, M. J. (2017). Big data in smart farming: A review. <i>Agricultural Systems</i>, 153, 69-80. https://doi.org/10.1016/j.agsy.2017.01.023',
    'We Are Social. (2025). <i>Digital 2025: Indonesia</i>. Singapore: We Are Social and Meltwater.',
    'Supabase. (2025). <i>Supabase Documentation: Authentication, Database, and Row Level Security</i>. https://supabase.com/docs',
    'Vercel. (2025). <i>Next.js 16 Documentation</i>. https://nextjs.org/docs',
    'Google. (2025). <i>Gemini API Documentation</i>. https://ai.google.dev/docs',
]
for item in pustaka_items:
    story.append(Paragraph(item, pustaka_style))


# ══════════════════════════════════════════════════════════
# LAMPIRAN
# ══════════════════════════════════════════════════════════
story.append(Spacer(1, 18))
story.append(add_heading('<b>LAMPIRAN</b>', h1_style, level=0))
story.append(Spacer(1, 12))

story.append(Paragraph(
    '<b>Lampiran 1: Dokumentasi Screenshot Website TaniPintar</b>',
    body_no_indent
))
story.append(Spacer(1, 6))
story.append(Paragraph(
    'Berikut adalah dokumentasi tampilan website TaniPintar yang telah dikembangkan. Website dapat '
    'diakses melalui link: <b>[URL Website Akan Ditambahkan Setelah Deployment]</b>',
    body_style
))
story.append(Spacer(1, 6))
story.append(Paragraph(
    'Halaman yang telah dikembangkan meliputi:',
    body_no_indent
))
lampiran_items = [
    'Homepage - Halaman utama dengan hero section, statistik platform, dan fitur unggulan',
    'PasarPintar - Monitoring harga komoditas real-time dengan heatmap 34 provinsi Indonesia',
    'PasarLangsung - Marketplace langsung dengan filter produk dan sistem pemesanan',
    'AkademiTani - Platform pembelajaran dengan modul, kuis, dan leaderboard',
    'TaniBot - Chatbot AI berbasis Google Gemini untuk konsultasi pertanian',
    'Dashboard - Panel kontrol role-based (Admin, Seller, User)',
    'Halaman Login/Register - Sistem autentikasi dengan 3 role (User, Seller, Admin)',
]
for item in lampiran_items:
    story.append(Paragraph('-  %s' % item, bullet_style))

story.append(Spacer(1, 12))
story.append(Paragraph(
    '<b>Lampiran 2: Struktur Basis Data</b>',
    body_no_indent
))
story.append(Spacer(1, 6))
story.append(Paragraph(
    'Basis data TaniPintar terdiri dari 17 tabel utama, 3 view, 4 function, dan berbagai '
    'trigger untuk menjalankan business logic. Data mencakup 98 komoditas pertanian Indonesia '
    'dan 3.332 data harga komoditas dari 34 provinsi. Seluruh tabel dilindungi oleh Row Level '
    'Security (RLS) policy untuk menjamin keamanan data pengguna.',
    body_style
))


# ── BUILD ──
doc.multiBuild(story)
print(f"Body PDF generated: {BODY_PDF}")
