const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 5000;

// MIME types mapping
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

function serveStatic(req, res, filePath) {
    // Add cache control for development
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.error(`Error reading file ${filePath}:`, err);
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'text/plain';

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}

const server = http.createServer((req, res) => {
    // Enable CORS for development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    let filePath = parsedUrl.pathname;

    // Default to index.html for root path
    if (filePath === '/') {
        filePath = '/index.html';
    }

    // Remove leading slash and construct full path
    const fullPath = path.join(__dirname, filePath.substring(1));

    // Check if file exists
    fs.stat(fullPath, (err, stats) => {
        if (err || !stats.isFile()) {
            console.log(`File not found: ${fullPath}`);
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
            return;
        }

        serveStatic(req, res, fullPath);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Self Tracker development server running on http://0.0.0.0:${PORT}`);
    console.log('Available endpoints:');
    console.log(`  - Main app: http://0.0.0.0:${PORT}`);
    console.log(`  - Assets: http://0.0.0.0:${PORT}/assets/`);
    console.log('');
    console.log('Features:');
    console.log('  ✅ Daily/Weekly/Monthly Checklists with CRUD');
    console.log('  ✅ Finance Tracker with transactions');
    console.log('  ✅ Business Tracker with profit/loss');
    console.log('  ✅ Dashboard with Chart.js visualizations');
    console.log('  ✅ Settings with Google Sheets integration');
    console.log('  ✅ Offline-first with LocalStorage');
    console.log('  ✅ Mobile-first responsive design');
    console.log('');
    console.log('To deploy Google Apps Script backend:');
    console.log('  1. Open https://script.google.com');
    console.log('  2. Create new project and paste google-apps-script.js content');
    console.log('  3. Deploy as Web App with:');
    console.log('     - Execute as: Me');
    console.log('     - Who has access: Anyone (required for cross-origin requests)');
    console.log('  4. Copy deployment URL to app settings');
    console.log('  5. No API tokens or spreadsheet setup needed - auto-created!');
    console.log('  6. Your spreadsheet will be created automatically on first use');
});

server.on('error', (err) => {
    console.error('Server error:', err);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});