# Self Tracker

Aplikasi web mobile-first untuk tracking harian, mingguan, dan bulanan dengan integrasi Google Sheets.

## Fitur

- ✅ **Checklist Harian**: 10 agenda default dengan grid 30 hari, checkbox tracking, progress %
- ✅ **Checklist Mingguan**: Agenda mingguan dengan tracking 4 minggu, progress %  
- ✅ **Checklist Bulanan**: Target bulanan dengan tracking 4 bulan, progress %
- ✅ **Finance Tracker**: Transaksi income/outcome, kategori, saldo berjalan
- ✅ **Business Tracker**: Transaksi bisnis, profit/loss per jenis
- ✅ **Dashboard**: Grafik Chart.js (line, bar, donut, clustered)
- ✅ **Settings**: Budget management, kategori, sync mode
- ✅ **Offline-First**: LocalStorage dengan sync Google Sheets
- ✅ **Mobile Responsive**: Design mobile-first, responsive ≥360px

## CRUD Operations

Setiap halaman memiliki operasi CRUD lengkap:
- **Create**: Tambah agenda/transaksi via modal forms
- **Read**: Tampilkan data dalam grid/tabel
- **Update**: Edit data via modal forms, toggle checkbox
- **Delete**: Hapus data dengan konfirmasi

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6 modules)
- **Backend**: Google Apps Script Web App
- **Storage**: Google Sheets (primary), LocalStorage (offline)
- **Charts**: Chart.js
- **Server**: Node.js development server

## Quick Start

1. **Start Development Server**:
   ```bash
   npm start
   ```
   Aplikasi akan berjalan di `http://localhost:5000`

2. **Setup Google Apps Script Backend**:
   - Buka [Google Apps Script](https://script.google.com)
   - Buat project baru
   - Copy isi file `google-apps-script.js`
   - Update `CONFIG.TOKEN` dan `CONFIG.SPREADSHEET_ID`
   - Deploy sebagai Web App dengan akses "Anyone with link"
   - Copy Deployment URL

3. **Konfigurasi Frontend**:
   - Buka aplikasi dan masuk ke halaman "Pengaturan"
   - Paste Bearer Token dan Apps Script URL
   - Klik "Test Koneksi" untuk verifikasi
   - Ubah mode storage ke "Online" jika berhasil

## Google Sheets Integration

### Deploy Backend

1. **Buat Google Sheet**:
   - Buat spreadsheet baru di Google Sheets
   - Copy Spreadsheet ID dari URL

2. **Deploy Apps Script**:
   ```javascript
   // Update konfigurasi di google-apps-script.js
   const CONFIG = {
     TOKEN: 'your-secure-token-123',           // Ganti dengan token rahasia
     SPREADSHEET_ID: 'your-spreadsheet-id',   // Ganti dengan ID spreadsheet
   };
   ```

3. **Deploy Web App**:
   - Execute as: Me
   - Who has access: Anyone with link
   - Copy deployment URL

### API Endpoints

- `GET ?action=health` - Health check
- `POST ?action=init` - Initialize sheets
- `POST ?action=pull` - Pull semua data
- `POST ?action=push` - Push semua data
- `POST ?action=create` - Create item
- `POST ?action=update` - Update item
- `POST ?action=delete` - Delete item

## Storage Strategy

- **Default**: Offline mode (LocalStorage)
- **Online Mode**: Sync dengan Google Sheets
- **Fallback**: Auto fallback ke offline jika sync gagal
- **Export/Import**: JSON backup/restore

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Server akan running di port 5000 dengan:
# - CORS enabled
# - Cache disabled untuk development
# - Auto reload pada perubahan file
```

## Architecture

```
/
├── index.html              # Main HTML structure
├── assets/
│   ├── css/
│   │   └── style.css       # Mobile-first CSS, utility classes
│   └── js/
│       ├── app.js          # Main app controller, CRUD operations
│       ├── storage.js      # LocalStorage manager dengan sync
│       ├── api.js          # Google Apps Script API client
│       ├── charts.js       # Chart.js wrapper dan rendering  
│       └── renderers.js    # Grid dan form renderers
├── google-apps-script.js   # Backend script untuk Google Apps Script
├── server.js              # Development server Node.js
├── package.json           # Node.js project config
└── README.md              # Dokumentasi ini
```

## Mobile-First Design

- **Breakpoints**: 360px+, 768px+, 1024px+
- **Navigation**: Horizontal scrollable tabs
- **Grids**: Responsive table dengan horizontal scroll
- **Forms**: Modal-based dengan validasi
- **Touch-Friendly**: Button size ≥44px, proper spacing

## Security

- **Token Authentication**: Bearer token untuk API
- **CORS**: Configured untuk cross-origin requests  
- **Input Validation**: Form validation dan sanitization
- **No XSS**: Safe DOM manipulation
- **Local Storage**: Data encrypted di browser

## Production Deployment

1. **Build Static Files**: Semua file sudah production-ready
2. **Deploy ke CDN/Hosting**: Upload semua file ke web hosting
3. **Configure Domain**: Setup custom domain jika perlu
4. **SSL Certificate**: Pastikan HTTPS untuk security
5. **Google Apps Script**: Deploy dengan production settings

---

**Dibuat dengan ❤️ menggunakan HTML, CSS, dan JavaScript murni - tanpa framework!**