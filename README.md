# Self Tracker - Personal Habit & Finance Tracker

Self Tracker adalah aplikasi web mobile-first untuk tracking habit harian, mingguan, dan bulanan dengan integrasi Google Sheets. Aplikasi ini menyediakan fitur tracking komprehensif termasuk checklist harian, target mingguan, target bulanan, manajemen keuangan, dan tracking bisnis dengan sinkronisasi real-time ke Google Sheets.

## 🚀 Fitur Utama

- ✅ **Daily/Weekly/Monthly Checklists** dengan CRUD operations
- ✅ **Finance Tracker** dengan transaksi income/outcome
- ✅ **Business Tracker** dengan profit/loss analysis  
- ✅ **Dashboard** dengan visualisasi Chart.js
- ✅ **Real-time Google Sheets sync** - semua data tersimpan otomatis
- ✅ **Online-only mode** - tidak ada konflik data offline
- ✅ **Mobile-first responsive design** - optimal untuk semua perangkat

## 📱 Demo & Login

**Login Credentials:**
- Username: `jundi`
- Password: `jundi123`

## 🛠️ Setup & Deployment

### 1. Deploy Google Apps Script Backend

1. Buka [Google Apps Script](https://script.google.com)
2. Buat project baru
3. Copy isi file `google-apps-script.js` ke editor
4. Deploy sebagai Web App dengan pengaturan:
   - **Execute as:** Me
   - **Who has access:** Anyone (required untuk cross-origin requests)
5. Copy URL deployment yang diberikan

### 2. Konfigurasi Aplikasi

1. Login ke aplikasi
2. Masuk ke menu **Pengaturan**
3. Paste URL Google Apps Script ke field **Apps Script URL**
4. Klik **Simpan Pengaturan**
5. Klik **Test Koneksi** untuk memastikan koneksi berhasil

### 3. Deploy ke Replit

Aplikasi sudah dikonfigurasi untuk deployment otomatis:
- Deployment target: `autoscale` (cocok untuk website statis)
- Server: Node.js dengan port 5000
- Siap publish langsung dari Replit

## 🔧 Struktur Project

```
/
├── assets/
│   ├── css/style.css          # Styling utama
│   └── js/
│       ├── app.js             # Controller utama
│       ├── api.js             # API client untuk Google Sheets
│       ├── charts.js          # Chart.js visualizations
│       └── renderers.js       # UI rendering helpers
├── index.html                 # Halaman utama
├── server.js                  # Development server
├── google-apps-script.js      # Backend Google Apps Script
└── package.json              # Dependencies
```

## 📊 Cara Penggunaan

### Dashboard
- Lihat overview keuangan dan progress habit
- Chart interaktif untuk analisis data

### Tracking Harian
- Tambah habit baru
- Check/uncheck completion per hari
- View progress bulanan

### Tracking Mingguan & Bulanan
- Set target mingguan dan bulanan
- Track completion rate

### Keuangan
- Catat transaksi income/outcome
- Kategorisasi pengeluaran
- Budget tracking

### Bisnis
- Track transaksi bisnis
- Analisis profit/loss
- Monitoring performa bisnis

## 🔄 Sinkronisasi Data

- **Otomatis**: Semua perubahan langsung disimpan ke Google Sheets
- **Real-time**: Tidak perlu sync manual
- **Persistent**: API settings tersimpan di browser
- **Refresh**: Tombol refresh untuk load data terbaru dari server

## 🚨 Troubleshooting

### "Harap konfigurasi Google Apps Script URL"
- Pastikan URL Google Apps Script sudah dimasukkan di Pengaturan
- Test koneksi untuk memastikan URL valid

### "API tidak tersedia"
- Periksa URL Google Apps Script
- Pastikan deployment Web App masih aktif
- Cek pengaturan "Who has access" harus "Anyone"

### Data tidak tersimpan
- Refresh halaman dan cek koneksi
- Pastikan tidak ada error di console browser
- Test koneksi di Pengaturan

## 💡 Tips Penggunaan

1. **Setup awal**: Konfigurasi Google Apps Script terlebih dahulu
2. **Mobile**: Aplikasi dioptimalkan untuk mobile, gunakan di smartphone
3. **Categories**: Atur kategori budget sesuai kebutuhan
4. **Backup**: Data tersimpan di Google Sheets sebagai backup otomatis
5. **Deployment**: Gunakan Replit publish untuk deployment production

## 🔒 Keamanan

- Login sederhana untuk demo
- Data tersimpan di Google Sheets pribadi user
- Tidak ada penyimpanan data eksternal
- API authentication melalui Google Apps Script

---

**Self Tracker** - Track your habits, manage your finances, all in one place! 🎯