// Main Application Controller
import { APIClient } from './api.js';
import { ChartManager } from './charts.js';
import { GridRenderer } from './renderers.js';

class SelfTrackerApp {
    constructor() {
        this.api = new APIClient();
        this.charts = new ChartManager();
        this.renderer = new GridRenderer();
        
        this.currentPage = 'dashboard';
        this.isOnline = false;
        this.data = {
            daily: [],
            weekly: [],
            monthly: [],
            finance: [],
            business: [],
            settings: {
                activeMonth: new Date().toISOString().slice(0, 7),
                monthlyBudget: 5000000,
                categories: [
                    { id: 1, name: 'Makanan', type: 'spending', limit: 1500000 },
                    { id: 2, name: 'Transport', type: 'spending', limit: 800000 },
                    { id: 3, name: 'Hiburan', type: 'spending', limit: 500000 },
                    { id: 4, name: 'Belanja', type: 'spending', limit: 700000 },
                    { id: 5, name: 'Tagihan', type: 'spending', limit: 1000000 },
                    { id: 6, name: 'Gaji', type: 'income', limit: 8000000 },
                    { id: 7, name: 'Bonus', type: 'income', limit: 2000000 }
                ],
                storageMode: 'online',
                apiToken: '',
                apiBase: ''
            }
        };
        
        this.isAuthenticated = false;
        this.init();
    }

    async init() {
        // Check authentication first
        if (!this.checkAuthentication()) {
            this.showLoginPage();
            this.bindLoginEvents();
            return;
        }
        
        await this.loadSettings();
        await this.initializeData();
        this.bindEvents();
        this.renderCurrentPage();
        await this.checkConnection();
    }

    checkAuthentication() {
        const isLoggedIn = localStorage.getItem('selftracker_auth');
        this.isAuthenticated = isLoggedIn === 'true';
        return this.isAuthenticated;
    }

    showLoginPage() {
        const loginPage = document.getElementById('login-page');
        const appPage = document.getElementById('app');
        
        loginPage.classList.remove('hidden');
        appPage.classList.add('hidden');
    }

    showAppPage() {
        const loginPage = document.getElementById('login-page');
        const appPage = document.getElementById('app');
        
        loginPage.classList.add('hidden');
        appPage.classList.remove('hidden');
    }

    bindLoginEvents() {
        const loginForm = document.getElementById('loginForm');
        console.log('Binding login events...', loginForm);
        
        if (!loginForm) {
            console.error('Login form not found!');
            return;
        }
        
        // Remove any existing event listeners to avoid conflicts
        const newForm = loginForm.cloneNode(true);
        loginForm.parentNode.replaceChild(newForm, loginForm);
        
        // Add new event listener
        newForm.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Login form submitted');
            this.handleLogin();
            return false;
        });
        
        // Also add click handler to submit button as backup
        const submitBtn = newForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Login button clicked');
                this.handleLogin();
                return false;
            });
        }
        
        console.log('Login events bound successfully');
    }

    async handleLogin() {
        console.log('handleLogin called');
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');
        
        console.log('Username:', username, 'Password length:', password.length);
        
        // Clear previous error
        errorDiv.classList.add('hidden');
        errorDiv.textContent = '';
        
        // Get stored credentials or use defaults (for demo purposes)
        const storedUsername = localStorage.getItem('selftracker_username') || 'jundi';
        const storedPassword = localStorage.getItem('selftracker_password') || 'jundi123';
        
        // Check credentials
        if (username === storedUsername && password === storedPassword) {
            console.log('Login successful');
            localStorage.setItem('selftracker_auth', 'true');
            this.isAuthenticated = true;
            
            this.showAppPage();
            await this.loadSettings();
            await this.initializeData();
            this.bindEvents();
            this.renderCurrentPage();
            await this.checkConnection();
        } else {
            console.log('Login failed - invalid credentials');
            errorDiv.textContent = 'Username atau password salah!';
            errorDiv.classList.remove('hidden');
        }
    }

    logout() {
        // Bersihkan auto refresh interval sebelum logout
        this.cleanup();
        // Use the global logout function from index.html
        if (window.logout) {
            window.logout();
        }
        this.isAuthenticated = false;
    }

    toggleSidebar() {
        const app = document.getElementById('app');
        const sidebar = document.getElementById('sidebar');
        const toggle = document.getElementById('sidebarToggle');
        const overlay = document.getElementById('mobileOverlay');
        
        // Check if we're in mobile view
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            sidebar.classList.toggle('show-mobile');
            toggle.classList.toggle('active');
            overlay.classList.toggle('active');
            
            // Prevent body scroll when sidebar is open on mobile
            if (sidebar.classList.contains('show-mobile')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        } else {
            app.classList.toggle('sidebar-hidden');
            sidebar.classList.toggle('hidden');
            toggle.classList.toggle('active');
        }
    }
    
    closeMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        const toggle = document.getElementById('sidebarToggle');
        const overlay = document.getElementById('mobileOverlay');
        
        sidebar.classList.remove('show-mobile');
        toggle.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    updateFinancialOverview() {
        let totalIncome = 0;
        let totalSpending = 0;
        
        // Calculate from finance data
        this.data.finance.forEach(transaction => {
            totalIncome += transaction.income || 0;
            totalSpending += transaction.outcome || 0;
        });
        
        // Calculate from business data
        this.data.business.forEach(transaction => {
            totalIncome += transaction.income || 0;
            totalSpending += transaction.outcome || 0;
        });
        
        const totalMoney = totalIncome - totalSpending;
        
        // Update display
        document.getElementById('totalMoney').textContent = this.formatCurrency(totalMoney);
        document.getElementById('totalIncomeOverall').textContent = this.formatCurrency(totalIncome);
        document.getElementById('totalSpendingOverall').textContent = this.formatCurrency(totalSpending);
        
        // Update colors
        const totalMoneyEl = document.getElementById('totalMoney');
        totalMoneyEl.className = 'amount ' + (totalMoney >= 0 ? 'positive' : 'negative');
    }

    async loadSettings() {
        // First, load API settings from localStorage to persist across reloads
        const savedApiBase = localStorage.getItem('selftracker_apiBase');
        const savedApiToken = localStorage.getItem('selftracker_apiToken');
        
        if (savedApiBase) {
            this.data.settings.apiBase = savedApiBase;
        }
        if (savedApiToken) {
            this.data.settings.apiToken = savedApiToken;
        }
        
        // Try to load settings from API if configured
        if (this.data.settings.apiBase) {
            try {
                this.api.configure(this.data.settings.apiBase, this.data.settings.apiToken);
                const remoteData = await this.api.pull();
                if (remoteData && remoteData.settings) {
                    this.data.settings = { ...this.data.settings, ...remoteData.settings };
                }
            } catch (error) {
                console.warn('Failed to load settings from API:', error);
                // Continue with default settings
            }
        }
    }

    async initializeData() {
        // Try to load data from API if configured
        if (this.data.settings.apiBase) {
            try {
                this.api.configure(this.data.settings.apiBase, this.data.settings.apiToken);
                const remoteData = await this.api.pull();
                
                if (remoteData) {
                    // Load data from API
                    for (const key of ['daily', 'weekly', 'monthly', 'finance', 'business']) {
                        if (remoteData[key]) {
                            this.data[key] = remoteData[key];
                        } else {
                            // Initialize with sample data if API has no data for this key
                            this.data[key] = this.getSampleData(key);
                        }
                    }
                } else {
                    // Initialize with sample data if API returns null
                    for (const key of ['daily', 'weekly', 'monthly', 'finance', 'business']) {
                        this.data[key] = this.getSampleData(key);
                    }
                    // Push initial data to API
                    await this.api.push(this.data);
                }
            } catch (error) {
                console.warn('Failed to load data from API, using sample data:', error);
                // Initialize with sample data if API fails
                for (const key of ['daily', 'weekly', 'monthly', 'finance', 'business']) {
                    this.data[key] = this.getSampleData(key);
                }
            }
        } else {
            // Initialize with sample data if API is not configured
            for (const key of ['daily', 'weekly', 'monthly', 'finance', 'business']) {
                this.data[key] = this.getSampleData(key);
            }
        }
        
        // Run migration for legacy category format
        await this.migrateLegacyCategories();
    }

    async migrateLegacyCategories() {
        // Check if categories are in legacy string format
        const settings = this.data.settings;
        
        if (!settings.categories || settings.categories.length === 0) {
            return; // No categories to migrate
        }

        // Check if first category is a string (legacy format)
        const firstCategory = settings.categories[0];
        if (typeof firstCategory === 'string') {
            console.log('Migrating legacy string categories to object format...');
            
            // Create category mapping for transaction migration
            const categoryMapping = new Map();
            
            // Convert string categories to object format
            const newCategories = settings.categories.map((categoryName, index) => {
                const categoryId = 'cat_' + Date.now() + '_' + index;
                categoryMapping.set(categoryName, categoryId);
                
                return {
                    id: categoryId,
                    name: categoryName,
                    type: 'spending', // Default to spending for legacy categories
                    limit: 1000000 // Default limit of 1M
                };
            });
            
            // Update settings with new category format
            settings.categories = newCategories;
            
            // Migrate transaction category references
            await this.migrateTransactionCategories(categoryMapping);
            
            console.log('Category migration completed.');
        }
    }

    async migrateTransactionCategories(categoryMapping) {
        // Migrate finance transactions
        let migrated = false;
        
        this.data.finance.forEach(transaction => {
            if (transaction.category && typeof transaction.category === 'string') {
                const newCategoryId = categoryMapping.get(transaction.category);
                if (newCategoryId) {
                    transaction.category = newCategoryId;
                    migrated = true;
                } else {
                    // Create fallback category for unmapped categories
                    const fallbackId = 'cat_fallback_' + Date.now();
                    this.data.settings.categories.push({
                        id: fallbackId,
                        name: transaction.category,
                        type: 'spending',
                        limit: 1000000
                    });
                    transaction.category = fallbackId;
                    migrated = true;
                }
            }
        });
        
        // Migrate business transactions
        this.data.business.forEach(transaction => {
            if (transaction.category && typeof transaction.category === 'string') {
                const newCategoryId = categoryMapping.get(transaction.category);
                if (newCategoryId) {
                    transaction.category = newCategoryId;
                    migrated = true;
                } else {
                    // Create fallback category for unmapped categories
                    const fallbackId = 'cat_fallback_' + Date.now();
                    this.data.settings.categories.push({
                        id: fallbackId,
                        name: transaction.category,
                        type: 'spending',
                        limit: 1000000
                    });
                    transaction.category = fallbackId;
                    migrated = true;
                }
            }
        });
        
        if (migrated) {
            // Save migrated data to API if configured
            if (this.data.settings.apiBase && this.api.isConfigured()) {
                try {
                    await this.api.push(this.data);
                } catch (error) {
                    console.warn('Failed to push migrated data to API:', error);
                }
            }
        }
    }

    getSampleData(type) {
        const now = new Date();
        const currentMonth = now.toISOString().slice(0, 7);
        
        switch (type) {
            case 'daily':
                return [
                    { id: 1, name: 'Olahraga pagi', days: {}, created_at: now.toISOString(), updated_at: now.toISOString() },
                    { id: 2, name: 'Minum air 8 gelas', days: {}, created_at: now.toISOString(), updated_at: now.toISOString() },
                    { id: 3, name: 'Baca buku 30 menit', days: {}, created_at: now.toISOString(), updated_at: now.toISOString() },
                    { id: 4, name: 'Meditasi 10 menit', days: {}, created_at: now.toISOString(), updated_at: now.toISOString() },
                    { id: 5, name: 'Tulis jurnal', days: {}, created_at: now.toISOString(), updated_at: now.toISOString() },
                ];
                
            case 'weekly':
                return [
                    { id: 1, name: 'Belanja kebutuhan rumah', weeks: {}, created_at: now.toISOString(), updated_at: now.toISOString() },
                    { id: 2, name: 'Bersih-bersih rumah', weeks: {}, created_at: now.toISOString(), updated_at: now.toISOString() },
                    { id: 3, name: 'Backup data komputer', weeks: {}, created_at: now.toISOString(), updated_at: now.toISOString() },
                ];
                
            case 'monthly':
                return [
                    { id: 1, name: 'Bayar tagihan bulanan', months: {}, created_at: now.toISOString(), updated_at: now.toISOString() },
                    { id: 2, name: 'Evaluasi keuangan', months: {}, created_at: now.toISOString(), updated_at: now.toISOString() },
                    { id: 3, name: 'Cek kesehatan rutin', months: {}, created_at: now.toISOString(), updated_at: now.toISOString() },
                ];
                
            case 'finance':
                return [
                    { id: 1, date: currentMonth + '-01', category: 'Gaji', description: 'Gaji bulanan', income: 8000000, outcome: 0, created_at: now.toISOString(), updated_at: now.toISOString() },
                    { id: 2, date: currentMonth + '-03', category: 'Makanan', description: 'Belanja groceries', income: 0, outcome: 750000, created_at: now.toISOString(), updated_at: now.toISOString() },
                    { id: 3, date: currentMonth + '-05', category: 'Transport', description: 'Bensin motor', income: 0, outcome: 150000, created_at: now.toISOString(), updated_at: now.toISOString() },
                    { id: 4, date: currentMonth + '-07', category: 'Hiburan', description: 'Nonton bioskop', income: 0, outcome: 100000, created_at: now.toISOString(), updated_at: now.toISOString() },
                    { id: 5, date: currentMonth + '-10', category: 'Tagihan', description: 'Listrik & air', income: 0, outcome: 300000, created_at: now.toISOString(), updated_at: now.toISOString() },
                ];
                
            case 'business':
                return [
                    { id: 1, date: currentMonth + '-02', type: 'Jasa Design', income: 2500000, outcome: 0, note: 'Logo untuk klien A', created_at: now.toISOString(), updated_at: now.toISOString() },
                    { id: 2, date: currentMonth + '-04', type: 'Jasa Design', income: 0, outcome: 200000, note: 'Beli software design', created_at: now.toISOString(), updated_at: now.toISOString() },
                    { id: 3, date: currentMonth + '-08', type: 'Konsultasi', income: 1500000, outcome: 0, note: 'Konsultasi IT 3 jam', created_at: now.toISOString(), updated_at: now.toISOString() },
                ];
                
            default:
                return [];
        }
    }

    bindEvents() {
        // Sidebar toggle
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Navigation events dengan auto-hide sidebar
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchPage(e.target.dataset.page);
                // Auto-hide sidebar setelah navigasi (untuk mobile dan desktop)
                this.autoHideSidebar();
            });
        });

        // Auto-refresh setup (menggantikan tombol refresh manual)
        this.setupAutoRefresh();

        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Daily checklist events
        document.getElementById('addDailyItem').addEventListener('click', () => {
            this.showAddDailyItemModal();
        });

        // Weekly checklist events
        document.getElementById('addWeeklyItem').addEventListener('click', () => {
            this.showAddWeeklyItemModal();
        });

        // Monthly checklist events
        document.getElementById('addMonthlyItem').addEventListener('click', () => {
            this.showAddMonthlyItemModal();
        });

        // Finance events
        document.getElementById('addTransaction').addEventListener('click', () => {
            this.showAddTransactionModal();
        });

        // Business events
        document.getElementById('addBusinessTransaction').addEventListener('click', () => {
            this.showAddBusinessTransactionModal();
        });

        // Settings events
        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveSettings();
        });

        document.getElementById('testConnection').addEventListener('click', () => {
            this.testConnection();
        });

        document.getElementById('exportData').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('importData').addEventListener('click', () => {
            this.importData();
        });

        document.getElementById('addBudgetCategory').addEventListener('click', () => {
            this.addBudgetCategory();
        });

        // Modal events
        document.querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('modal').addEventListener('click', (e) => {
            if (e.target.id === 'modal') {
                this.closeModal();
            }
        });
        
        // Mobile overlay click to close sidebar
        document.getElementById('mobileOverlay').addEventListener('click', () => {
            this.closeMobileSidebar();
        });
        
        // Close mobile sidebar when window is resized to desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                this.closeMobileSidebar();
            }
        });

        // Month selection events
        ['dailyMonth', 'weeklyMonth', 'monthlyYear', 'financeMonth', 'businessMonth'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => {
                    this.renderCurrentPage();
                });
            }
        });
    }

    switchPage(page) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`).classList.add('active');

        // Update pages
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });
        document.getElementById(`${page}-page`).classList.add('active');

        this.currentPage = page;
        this.renderCurrentPage();
    }

    renderCurrentPage() {
        switch (this.currentPage) {
            case 'daily':
                this.renderDailyPage();
                break;
            case 'weekly':
                this.renderWeeklyPage();
                break;
            case 'monthly':
                this.renderMonthlyPage();
                break;
            case 'finance':
                this.renderFinancePage();
                break;
            case 'business':
                this.renderBusinessPage();
                break;
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'settings':
                this.renderSettingsPage();
                break;
        }
    }

    renderDailyPage() {
        const selectedMonth = document.getElementById('dailyMonth').value || this.data.settings.activeMonth;
        this.populateMonthOptions('dailyMonth', selectedMonth);
        
        const gridHtml = this.renderer.renderDailyGrid(this.data.daily, selectedMonth);
        document.getElementById('dailyGrid').innerHTML = gridHtml;
        
        this.bindDailyEvents();
        this.updateDailyProgress(selectedMonth);
    }

    renderWeeklyPage() {
        const selectedMonth = document.getElementById('weeklyMonth').value || this.data.settings.activeMonth;
        this.populateMonthOptions('weeklyMonth', selectedMonth);
        
        const gridHtml = this.renderer.renderWeeklyGrid(this.data.weekly, selectedMonth);
        document.getElementById('weeklyGrid').innerHTML = gridHtml;
        
        this.bindWeeklyEvents();
        this.updateWeeklyProgress(selectedMonth);
    }

    renderMonthlyPage() {
        const selectedYear = document.getElementById('monthlyYear').value || new Date().getFullYear().toString();
        this.populateYearOptions('monthlyYear', selectedYear);
        
        const gridHtml = this.renderer.renderMonthlyGrid(this.data.monthly, selectedYear);
        document.getElementById('monthlyGrid').innerHTML = gridHtml;
        
        this.bindMonthlyEvents();
        this.updateMonthlyProgress(selectedYear);
    }

    renderFinancePage() {
        this.populateMonthOptions('financeMonth', '');
        this.populateCategoryOptions('financeCategory', '');
        
        const selectedMonth = document.getElementById('financeMonth').value;
        const selectedCategory = document.getElementById('financeCategory').value;
        
        const filteredData = this.filterFinanceData(selectedMonth, selectedCategory);
        this.renderer.setCategoriesData(this.data.settings.categories);
        const tableHtml = this.renderer.renderTransactionTable(filteredData);
        document.getElementById('transactionTable').innerHTML = tableHtml;
        
        this.updateFinanceSummary(filteredData);
        this.bindFinanceEvents();
    }

    renderBusinessPage() {
        this.populateMonthOptions('businessMonth', '');
        this.populateBusinessTypeOptions('businessType', '');
        
        const selectedMonth = document.getElementById('businessMonth').value;
        const selectedType = document.getElementById('businessType').value;
        
        const filteredData = this.filterBusinessData(selectedMonth, selectedType);
        this.renderer.setCategoriesData(this.data.settings.categories);
        const tableHtml = this.renderer.renderBusinessTable(filteredData);
        document.getElementById('businessTable').innerHTML = tableHtml;
        
        this.updateBusinessSummary(filteredData);
        this.bindBusinessEvents();
    }

    renderDashboard() {
        this.updateFinancialOverview();
        this.charts.renderDailyCashFlowChart(this.data.finance, this.data.business, this.data.settings.activeMonth);
        this.charts.renderDailyChart(this.data.daily, this.data.settings.activeMonth);
        this.charts.renderWeeklyMonthlyChart(this.data.weekly, this.data.monthly);
        this.charts.renderCategoryChart(this.data.finance);
        this.charts.renderBudgetChart(this.data.finance, this.data.settings);
        this.charts.renderBusinessChart(this.data.business);
    }

    renderSettingsPage() {
        document.getElementById('activeMonth').value = this.data.settings.activeMonth;
        document.getElementById('monthlyBudget').value = this.data.settings.monthlyBudget;
        document.getElementById('apiToken').value = this.data.settings.apiToken;
        document.getElementById('apiBase').value = this.data.settings.apiBase;
        
        this.renderBudgetCategories();
    }

    // Modal functions
    showModal(title, content) {
        document.getElementById('modalBody').innerHTML = `<h3>${title}</h3>${content}`;
        document.getElementById('modal').classList.add('active');
    }

    closeModal() {
        document.getElementById('modal').classList.remove('active');
    }

    // Connection and sync functions
    async checkConnection() {
        try {
            if (this.data.settings.apiBase) {
                this.api.configure(this.data.settings.apiBase, this.data.settings.apiToken);
                const response = await this.api.health();
                this.isOnline = response.success;
            } else {
                this.isOnline = false;
            }
        } catch (error) {
            console.warn('Connection check failed:', error);
            this.isOnline = false;
        }
        
        this.updateConnectionStatus();
    }

    updateConnectionStatus() {
        const statusElement = document.getElementById('connectionStatus');
        if (this.isOnline) {
            statusElement.textContent = 'Online';
            statusElement.className = 'status-online';
        } else {
            statusElement.textContent = 'Offline';
            statusElement.className = 'status-offline';
        }
    }

    // Setup auto-refresh dengan interval
    setupAutoRefresh() {
        // Cleanup existing intervals untuk mencegah duplikasi
        this.cleanup();
        
        // Auto refresh data setiap 30 detik
        this.autoRefreshInterval = setInterval(() => {
            this.refreshData(true); // true = silent refresh
        }, 30000);
        
        // Initial refresh setelah 5 detik
        this.initialRefreshTimeout = setTimeout(() => {
            this.refreshData(true);
        }, 5000);
    }

    async refreshData(silent = false) {
        // Refresh data from API
        if (!this.data.settings.apiBase || this.data.settings.apiBase.trim() === '') {
            if (!silent) {
                alert('Harap konfigurasi Google Apps Script URL di pengaturan terlebih dahulu!');
            }
            return;
        }

        try {
            if (!silent) {
                // Hanya tampilkan loading jika bukan silent refresh
                const syncBtn = document.getElementById('syncBtn');
                if (syncBtn) {
                    syncBtn.disabled = true;
                    syncBtn.innerHTML = '<span class="spinner"></span> Refresh...';
                }
            }

            // Check connection first
            await this.checkConnection();
            
            if (!this.isOnline) {
                alert('Tidak dapat refresh data. API tidak tersedia. Periksa URL Google Apps Script di pengaturan.');
                return;
            }

            // Pull latest data from API
            const remoteData = await this.api.pull();
            if (remoteData) {
                // Merge remote data with current data structure
                for (const key of ['daily', 'weekly', 'monthly', 'finance', 'business', 'settings']) {
                    if (remoteData[key]) {
                        this.data[key] = remoteData[key];
                    }
                }
            }

            this.renderCurrentPage();
            alert('Data berhasil direfresh!');
        } catch (error) {
            console.warn('Refresh failed:', error);
            if (!silent) {
                if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
                    alert('Refresh gagal: Tidak dapat terhubung ke server. Pastikan URL Google Apps Script sudah benar dan dapat diakses.');
                } else {
                    alert('Refresh gagal: ' + error.message);
                }
            } else {
                // Silent refresh failed - log to console untuk debugging
                console.warn('Auto-refresh failed:', error.message);
                // Update status indicator untuk memberikan feedback visual
                const statusElement = document.getElementById('connectionStatus');
                if (statusElement) {
                    statusElement.textContent = 'Sync Error';
                    statusElement.className = 'status-offline';
                    // Reset status setelah 10 detik
                    setTimeout(() => {
                        statusElement.textContent = 'Auto-Sync';
                        statusElement.className = 'status-online';
                    }, 10000);
                }
            }
        } finally {
            if (!silent) {
                const syncBtn = document.getElementById('syncBtn');
                if (syncBtn) {
                    syncBtn.disabled = false;
                    syncBtn.innerHTML = 'Refresh';
                }
            }
        }
    }

    // Auto-hide sidebar setelah navigasi
    autoHideSidebar() {
        const app = document.getElementById('app');
        const sidebar = document.getElementById('sidebar');
        const toggle = document.getElementById('sidebarToggle');
        const overlay = document.getElementById('mobileOverlay');
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // Untuk mobile: tutup sidebar
            if (sidebar.classList.contains('show-mobile')) {
                sidebar.classList.remove('show-mobile');
                toggle.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        } else {
            // Untuk desktop: sembunyikan sidebar jika sedang terbuka
            if (!sidebar.classList.contains('hidden')) {
                app.classList.add('sidebar-hidden');
                sidebar.classList.add('hidden');
                toggle.classList.add('active');
            }
        }
    }

    // Cleanup function untuk auto refresh dan timeouts
    cleanup() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
        if (this.initialRefreshTimeout) {
            clearTimeout(this.initialRefreshTimeout);
            this.initialRefreshTimeout = null;
        }
    }

    // Utility functions
    populateMonthOptions(elementId, selectedValue) {
        const element = document.getElementById(elementId);
        const currentDate = new Date();
        const months = [];
        
        for (let i = -6; i <= 6; i++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
            const monthStr = date.toISOString().slice(0, 7);
            const monthName = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
            months.push({ value: monthStr, text: monthName });
        }
        
        let optionsHtml = elementId.includes('finance') || elementId.includes('business') 
            ? '<option value="">Semua Bulan</option>' 
            : '<option value="">Pilih Bulan</option>';
        
        months.forEach(month => {
            const selected = month.value === selectedValue ? 'selected' : '';
            optionsHtml += `<option value="${month.value}" ${selected}>${month.text}</option>`;
        });
        
        element.innerHTML = optionsHtml;
    }

    populateYearOptions(elementId, selectedValue) {
        const element = document.getElementById(elementId);
        const currentYear = new Date().getFullYear();
        let optionsHtml = '<option value="">Pilih Tahun</option>';
        
        for (let year = currentYear - 2; year <= currentYear + 3; year++) {
            const selected = year.toString() === selectedValue ? 'selected' : '';
            optionsHtml += `<option value="${year}" ${selected}>${year}</option>`;
        }
        
        element.innerHTML = optionsHtml;
    }

    populateCategoryOptions(elementId, selectedValue) {
        const element = document.getElementById(elementId);
        let optionsHtml = '<option value="">Semua Kategori</option>';
        
        this.data.settings.categories.forEach(category => {
            const selected = category === selectedValue ? 'selected' : '';
            optionsHtml += `<option value="${category}" ${selected}>${category}</option>`;
        });
        
        element.innerHTML = optionsHtml;
    }

    populateBusinessTypeOptions(elementId, selectedValue) {
        const element = document.getElementById(elementId);
        const types = [...new Set(this.data.business.map(item => item.type))];
        let optionsHtml = '<option value="">Semua Jenis</option>';
        
        types.forEach(type => {
            const selected = type === selectedValue ? 'selected' : '';
            optionsHtml += `<option value="${type}" ${selected}>${type}</option>`;
        });
        
        element.innerHTML = optionsHtml;
    }

    // Event binding functions
    bindDailyEvents() {
        // Checkbox events
        document.querySelectorAll('.daily-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', async (e) => {
                const itemId = parseInt(e.target.dataset.id);
                const dateKey = e.target.dataset.date;
                const isChecked = e.target.checked;
                
                await this.updateDailyCheckbox(itemId, dateKey, isChecked);
                this.updateDailyProgress(document.getElementById('dailyMonth').value);
            });
        });
        
        // Edit/Delete buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = parseInt(e.target.dataset.id);
                const item = this.data.daily.find(item => item.id === itemId);
                this.showEditDailyItemModal(item);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const itemId = parseInt(e.target.dataset.id);
                if (confirm('Yakin ingin menghapus agenda ini?')) {
                    await this.deleteDailyItem(itemId);
                }
            });
        });
    }

    bindWeeklyEvents() {
        // Checkbox events
        document.querySelectorAll('.weekly-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', async (e) => {
                const itemId = parseInt(e.target.dataset.id);
                const weekKey = e.target.dataset.week;
                const isChecked = e.target.checked;
                
                await this.updateWeeklyCheckbox(itemId, weekKey, isChecked);
                this.updateWeeklyProgress(document.getElementById('weeklyMonth').value);
            });
        });
        
        // Edit/Delete buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = parseInt(e.target.dataset.id);
                const item = this.data.weekly.find(item => item.id === itemId);
                this.showEditWeeklyItemModal(item);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const itemId = parseInt(e.target.dataset.id);
                if (confirm('Yakin ingin menghapus agenda ini?')) {
                    await this.deleteWeeklyItem(itemId);
                }
            });
        });
    }

    bindMonthlyEvents() {
        // Checkbox events
        document.querySelectorAll('.monthly-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', async (e) => {
                const itemId = parseInt(e.target.dataset.id);
                const monthKey = e.target.dataset.month;
                const isChecked = e.target.checked;
                
                await this.updateMonthlyCheckbox(itemId, monthKey, isChecked);
                this.updateMonthlyProgress(document.getElementById('monthlyYear').value);
            });
        });
        
        // Edit/Delete buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = parseInt(e.target.dataset.id);
                const item = this.data.monthly.find(item => item.id === itemId);
                this.showEditMonthlyItemModal(item);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const itemId = parseInt(e.target.dataset.id);
                if (confirm('Yakin ingin menghapus target ini?')) {
                    await this.deleteMonthlyItem(itemId);
                }
            });
        });
    }

    bindFinanceEvents() {
        // Edit/Delete buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = parseInt(e.target.dataset.id);
                const transaction = this.data.finance.find(item => item.id === itemId);
                this.showEditTransactionModal(transaction);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const itemId = parseInt(e.target.dataset.id);
                if (confirm('Yakin ingin menghapus transaksi ini?')) {
                    await this.deleteTransaction(itemId);
                }
            });
        });
    }

    bindBusinessEvents() {
        // Edit/Delete buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = parseInt(e.target.dataset.id);
                const transaction = this.data.business.find(item => item.id === itemId);
                this.showEditBusinessTransactionModal(transaction);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const itemId = parseInt(e.target.dataset.id);
                if (confirm('Yakin ingin menghapus transaksi ini?')) {
                    await this.deleteBusinessTransaction(itemId);
                }
            });
        });
    }

    // Progress calculation functions
    updateDailyProgress(month) {
        if (!month) return;
        
        const year = new Date(month + '-01').getFullYear();
        const monthNum = new Date(month + '-01').getMonth();
        const daysInMonth = new Date(year, monthNum + 1, 0).getDate();
        
        let totalCompleted = 0;
        let totalPossible = this.data.daily.length * daysInMonth;
        
        this.data.daily.forEach(item => {
            for (let day = 1; day <= daysInMonth; day++) {
                const dateKey = `${month}-${day.toString().padStart(2, '0')}`;
                if (item.days && item.days[dateKey]) {
                    totalCompleted++;
                }
            }
        });
        
        const percentage = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
        document.getElementById('dailyProgress').textContent = percentage + '%';
    }

    updateWeeklyProgress(month) {
        if (!month) return;
        
        let totalCompleted = 0;
        let totalPossible = this.data.weekly.length * 4;
        
        this.data.weekly.forEach(item => {
            for (let week = 1; week <= 4; week++) {
                const weekKey = `${month}-W${week}`;
                if (item.weeks && item.weeks[weekKey]) {
                    totalCompleted++;
                }
            }
        });
        
        const percentage = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
        document.getElementById('weeklyProgress').textContent = percentage + '%';
    }

    updateMonthlyProgress(year) {
        if (!year) return;
        
        let totalCompleted = 0;
        let totalPossible = this.data.monthly.length * 4;
        
        this.data.monthly.forEach(item => {
            for (let i = 0; i < 4; i++) {
                const currentMonth = new Date().getMonth();
                const monthIndex = parseInt(year) === new Date().getFullYear() ? (currentMonth + i) % 12 : i;
                const monthYear = parseInt(year) === new Date().getFullYear() && currentMonth + i >= 12 ? parseInt(year) + 1 : parseInt(year);
                const monthKey = `${monthYear}-${(monthIndex + 1).toString().padStart(2, '0')}`;
                
                if (item.months && item.months[monthKey]) {
                    totalCompleted++;
                }
            }
        });
        
        const percentage = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
        document.getElementById('monthlyProgress').textContent = percentage + '%';
    }

    // Summary calculation functions
    updateFinanceSummary(data) {
        const totalIncome = data.reduce((sum, transaction) => sum + transaction.income, 0);
        const totalOutcome = data.reduce((sum, transaction) => sum + transaction.outcome, 0);
        const balance = totalIncome - totalOutcome;
        
        document.getElementById('totalIncome').textContent = this.formatCurrency(totalIncome);
        document.getElementById('totalOutcome').textContent = this.formatCurrency(totalOutcome);
        document.getElementById('currentBalance').textContent = this.formatCurrency(balance);
        document.getElementById('currentBalance').className = balance >= 0 ? 'amount positive' : 'amount negative';
    }

    updateBusinessSummary(data) {
        const totalIncome = data.reduce((sum, transaction) => sum + transaction.income, 0);
        const totalOutcome = data.reduce((sum, transaction) => sum + transaction.outcome, 0);
        const profit = totalIncome - totalOutcome;
        
        document.getElementById('businessIncome').textContent = this.formatCurrency(totalIncome);
        document.getElementById('businessOutcome').textContent = this.formatCurrency(totalOutcome);
        document.getElementById('businessProfit').textContent = this.formatCurrency(profit);
        document.getElementById('businessProfit').className = profit >= 0 ? 'amount positive' : 'amount negative';
    }

    // Data filtering functions
    filterFinanceData(month, category) {
        let filtered = [...this.data.finance];
        
        if (month) {
            filtered = filtered.filter(item => item.date.startsWith(month));
        }
        
        if (category) {
            filtered = filtered.filter(item => item.category === category);
        }
        
        return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    filterBusinessData(month, type) {
        let filtered = [...this.data.business];
        
        if (month) {
            filtered = filtered.filter(item => item.date.startsWith(month));
        }
        
        if (type) {
            filtered = filtered.filter(item => item.type === type);
        }
        
        return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // Modal functions for CRUD operations
    showAddDailyItemModal() {
        const formHtml = this.renderer.renderDailyItemForm();
        this.showModal('Tambah Agenda Harian', formHtml);
        
        document.getElementById('dailyItemForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.addDailyItem();
        });
    }
    
    showEditDailyItemModal(item) {
        const formHtml = this.renderer.renderDailyItemForm(item);
        this.showModal('Edit Agenda Harian', formHtml);
        
        document.getElementById('dailyItemForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updateDailyItem();
        });
    }

    showAddWeeklyItemModal() {
        const formHtml = this.renderer.renderWeeklyItemForm();
        this.showModal('Tambah Agenda Mingguan', formHtml);
        
        document.getElementById('weeklyItemForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.addWeeklyItem();
        });
    }
    
    showEditWeeklyItemModal(item) {
        const formHtml = this.renderer.renderWeeklyItemForm(item);
        this.showModal('Edit Agenda Mingguan', formHtml);
        
        document.getElementById('weeklyItemForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updateWeeklyItem();
        });
    }

    showAddMonthlyItemModal() {
        const formHtml = this.renderer.renderMonthlyItemForm();
        this.showModal('Tambah Target Bulanan', formHtml);
        
        document.getElementById('monthlyItemForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.addMonthlyItem();
        });
    }
    
    showEditMonthlyItemModal(item) {
        const formHtml = this.renderer.renderMonthlyItemForm(item);
        this.showModal('Edit Target Bulanan', formHtml);
        
        document.getElementById('monthlyItemForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updateMonthlyItem();
        });
    }

    showAddTransactionModal() {
        // Only show spending categories for regular transactions
        const spendingCategories = this.data.settings.categories.filter(cat => cat.type === 'spending');
        const formHtml = this.renderer.renderTransactionForm(null, spendingCategories);
        this.showModal('Tambah Transaksi', formHtml);
        
        document.getElementById('transactionForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.addTransaction();
        });
    }
    
    showEditTransactionModal(transaction) {
        // Only show spending categories for regular transactions
        const spendingCategories = this.data.settings.categories.filter(cat => cat.type === 'spending');
        const formHtml = this.renderer.renderTransactionForm(transaction, spendingCategories);
        this.showModal('Edit Transaksi', formHtml);
        
        document.getElementById('transactionForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updateTransaction();
        });
    }

    showAddBusinessTransactionModal() {
        const types = [...new Set(this.data.business.map(item => item.type))].filter(Boolean);
        const formHtml = this.renderer.renderBusinessTransactionForm(null, types);
        this.showModal('Tambah Transaksi Bisnis', formHtml);
        
        document.getElementById('businessTransactionForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.addBusinessTransaction();
        });
    }
    
    showEditBusinessTransactionModal(transaction) {
        const types = [...new Set(this.data.business.map(item => item.type))].filter(Boolean);
        const formHtml = this.renderer.renderBusinessTransactionForm(transaction, types);
        this.showModal('Edit Transaksi Bisnis', formHtml);
        
        document.getElementById('businessTransactionForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updateBusinessTransaction();
        });
    }

    // Settings functions
    async saveSettings() {
        const newSettings = {
            activeMonth: document.getElementById('activeMonth').value,
            storageMode: 'online', // Always online mode
            monthlyBudget: parseInt(document.getElementById('monthlyBudget').value) || 0,
            apiToken: document.getElementById('apiToken').value,
            apiBase: document.getElementById('apiBase').value,
            categories: this.data.settings.categories
        };
        
        this.data.settings = { ...this.data.settings, ...newSettings };
        
        // Save API settings to localStorage for persistence across reloads
        localStorage.setItem('selftracker_apiBase', newSettings.apiBase || '');
        localStorage.setItem('selftracker_apiToken', newSettings.apiToken || '');
        
        // Save settings to API if configured
        if (newSettings.apiBase) {
            try {
                await this.api.push(this.data);
                alert('Pengaturan berhasil disimpan!');
            } catch (error) {
                console.warn('Failed to save settings to API:', error);
                alert('Pengaturan disimpan, tapi gagal sync ke server. Pastikan URL Google Apps Script sudah benar.');
            }
        } else {
            alert('Pengaturan disimpan. Harap konfigurasi URL Google Apps Script untuk sync data.');
        }
        
        // Check connection after updating settings
        await this.checkConnection();
        
        alert('Pengaturan berhasil disimpan!');
    }

    async testConnection() {
        const apiBase = document.getElementById('apiBase').value;
        const apiToken = document.getElementById('apiToken').value;
        
        if (!apiBase) {
            alert('Harap masukkan URL API!');
            return;
        }
        
        const oldConfig = { baseURL: this.api.baseURL, token: this.api.token };
        this.api.configure(apiBase, apiToken);
        
        try {
            const result = await this.api.health();
            if (result.success) {
                alert('Koneksi berhasil! ✅');
            } else {
                throw new Error(result.error || 'Koneksi gagal');
            }
        } catch (error) {
            alert('Koneksi gagal: ' + error.message);
            this.api.configure(oldConfig.baseURL, oldConfig.token);
        }
    }

    renderBudgetCategories() {
        const container = document.getElementById('budgetCategories');
        let html = '<div class="categories-section">';
        
        // Ensure categories exist and are initialized
        if (!this.data.settings.categories) {
            this.data.settings.categories = [];
        }
        
        // Spending Categories
        html += '<div class="category-group"><h4>Kategori Pengeluaran</h4>';
        const spendingCategories = this.data.settings.categories.filter(cat => cat.type === 'spending');
        spendingCategories.forEach(category => {
            html += `
                <div class="category-item" data-id="${category.id}">
                    <div class="category-info">
                        <input type="text" value="${category.name}" data-field="name" data-id="${category.id}" class="category-input">
                        <input type="number" value="${category.limit}" data-field="limit" data-id="${category.id}" class="category-limit" min="0" step="1000" placeholder="Limit">
                        <span class="category-type">Pengeluaran</span>
                    </div>
                    <div class="category-actions">
                        <button type="button" class="btn-edit" onclick="selfTracker.showEditCategoryModal(${category.id})">Edit</button>
                        <button type="button" class="btn-delete" onclick="selfTracker.removeBudgetCategory(${category.id})">Hapus</button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        // Income Categories
        html += '<div class="category-group"><h4>Kategori Pemasukan</h4>';
        const incomeCategories = this.data.settings.categories.filter(cat => cat.type === 'income');
        incomeCategories.forEach(category => {
            html += `
                <div class="category-item" data-id="${category.id}">
                    <div class="category-info">
                        <input type="text" value="${category.name}" data-field="name" data-id="${category.id}" class="category-input">
                        <input type="number" value="${category.limit}" data-field="limit" data-id="${category.id}" class="category-limit" min="0" step="1000" placeholder="Limit">
                        <span class="category-type">Pemasukan</span>
                    </div>
                    <div class="category-actions">
                        <button type="button" class="btn-edit" onclick="selfTracker.showEditCategoryModal(${category.id})">Edit</button>
                        <button type="button" class="btn-delete" onclick="selfTracker.removeBudgetCategory(${category.id})">Hapus</button>
                    </div>
                </div>
            `;
        });
        html += '</div></div>';
        
        container.innerHTML = html;
        
        // Bind input events for real-time updates
        container.querySelectorAll('.category-input, .category-limit').forEach(input => {
            input.addEventListener('change', (e) => {
                const id = parseInt(e.target.dataset.id);
                const field = e.target.dataset.field;
                const value = field === 'limit' ? parseInt(e.target.value) || 0 : e.target.value.trim();
                
                const category = this.data.settings.categories.find(cat => cat.id === id);
                if (category) {
                    category[field] = value;
                    this.saveSettings();
                }
            });
        });
    }

    addBudgetCategory() {
        this.showAddCategoryModal();
    }
    
    showAddCategoryModal() {
        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <h3>Tambah Kategori Baru</h3>
            <form id="categoryForm">
                <div class="form-group">
                    <label>Nama Kategori</label>
                    <input type="text" id="categoryName" class="input" required placeholder="Contoh: Makanan">
                </div>
                <div class="form-group">
                    <label>Tipe</label>
                    <select id="categoryType" class="select" required>
                        <option value="">Pilih tipe</option>
                        <option value="spending">Pengeluaran</option>
                        <option value="income">Pemasukan</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Limit (Rp)</label>
                    <input type="number" id="categoryLimit" class="input" min="0" step="1000" required placeholder="0">
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Tambah Kategori</button>
                    <button type="button" class="btn btn-secondary" onclick="selfTracker.closeModal()">Batal</button>
                </div>
            </form>
        `;
        
        document.getElementById('modal').classList.add('active');
        
        document.getElementById('categoryForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveCategoryFromModal();
        });
    }
    
    showEditCategoryModal(categoryId) {
        const category = this.data.settings.categories.find(cat => cat.id === categoryId);
        if (!category) return;
        
        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <h3>Edit Kategori</h3>
            <form id="categoryForm">
                <div class="form-group">
                    <label>Nama Kategori</label>
                    <input type="text" id="categoryName" class="input" required value="${category.name}">
                </div>
                <div class="form-group">
                    <label>Tipe</label>
                    <select id="categoryType" class="select" required>
                        <option value="spending" ${category.type === 'spending' ? 'selected' : ''}>Pengeluaran</option>
                        <option value="income" ${category.type === 'income' ? 'selected' : ''}>Pemasukan</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Limit (Rp)</label>
                    <input type="number" id="categoryLimit" class="input" min="0" step="1000" required value="${category.limit}">
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Update Kategori</button>
                    <button type="button" class="btn btn-secondary" onclick="selfTracker.closeModal()">Batal</button>
                </div>
                <input type="hidden" id="categoryId" value="${category.id}">
            </form>
        `;
        
        document.getElementById('modal').classList.add('active');
        
        document.getElementById('categoryForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updateCategoryFromModal();
        });
    }
    
    async saveCategoryFromModal() {
        const name = document.getElementById('categoryName').value.trim();
        const type = document.getElementById('categoryType').value;
        const limit = parseInt(document.getElementById('categoryLimit').value) || 0;
        
        if (!name || !type) {
            alert('Harap isi semua field!');
            return;
        }
        
        // Check if category name already exists
        const exists = this.data.settings.categories.some(cat => 
            cat.name.toLowerCase() === name.toLowerCase() && cat.type === type
        );
        
        if (exists) {
            alert('Kategori dengan nama dan tipe yang sama sudah ada!');
            return;
        }
        
        const newCategory = {
            id: Math.max(...this.data.settings.categories.map(cat => cat.id), 0) + 1,
            name,
            type,
            limit
        };
        
        this.data.settings.categories.push(newCategory);
        
        // Push to API if configured
        if (this.data.settings.apiBase && this.api.isConfigured()) {
            try {
                await this.api.push(this.data);
            } catch (error) {
                console.warn('Failed to save category to API:', error);
            }
        }
        
        this.closeModal();
        this.renderBudgetCategories();
        this.renderCurrentPage(); // Refresh current page to update dropdowns
    }
    
    async updateCategoryFromModal() {
        const id = parseInt(document.getElementById('categoryId').value);
        const name = document.getElementById('categoryName').value.trim();
        const type = document.getElementById('categoryType').value;
        const limit = parseInt(document.getElementById('categoryLimit').value) || 0;
        
        if (!name || !type) {
            alert('Harap isi semua field!');
            return;
        }
        
        // Check if category name already exists (excluding current category)
        const exists = this.data.settings.categories.some(cat => 
            cat.id !== id && cat.name.toLowerCase() === name.toLowerCase() && cat.type === type
        );
        
        if (exists) {
            alert('Kategori dengan nama dan tipe yang sama sudah ada!');
            return;
        }
        
        const categoryIndex = this.data.settings.categories.findIndex(cat => cat.id === id);
        if (categoryIndex >= 0) {
            this.data.settings.categories[categoryIndex] = { id, name, type, limit };
            
            // Push to API if configured
            if (this.data.settings.apiBase && this.api.isConfigured()) {
                try {
                    await this.api.push(this.data);
                } catch (error) {
                    console.warn('Failed to update category to API:', error);
                }
            }
            
            this.closeModal();
            this.renderBudgetCategories();
            this.renderCurrentPage(); // Refresh current page to update dropdowns
        }
    }
    
    removeBudgetCategory(categoryId) {
        if (confirm('Yakin ingin menghapus kategori ini?')) {
            const categoryIndex = this.data.settings.categories.findIndex(cat => cat.id === categoryId);
            if (categoryIndex >= 0) {
                this.data.settings.categories.splice(categoryIndex, 1);
                this.renderBudgetCategories();
                this.renderCurrentPage(); // Refresh current page to update dropdowns
                this.saveSettings();
            }
        }
    }

    exportData() {
        const exportData = {
            data: this.data,
            timestamp: new Date().toISOString(),
            version: '2.0'
        };
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `selftracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const importData = JSON.parse(text);
                
                if (importData.data) {
                    this.data = { ...this.data, ...importData.data };
                    
                    // Push imported data to API if configured
                    if (this.data.settings.apiBase && this.api.isConfigured()) {
                        try {
                            await this.api.push(this.data);
                            alert('Import berhasil dan data telah disinkronkan ke Google Sheets!');
                        } catch (error) {
                            console.warn('Failed to push imported data to API:', error);
                            alert('Data berhasil diimport, tapi gagal sinkronisasi ke Google Sheets.');
                        }
                    } else {
                        alert('Data berhasil diimport. Konfigurasi Google Apps Script URL untuk sinkronisasi.');
                    }
                    
                    this.renderCurrentPage();
                } else {
                    throw new Error('Format file import tidak valid');
                }
            } catch (error) {
                alert('Import gagal: ' + error.message);
            }
        });
        
        input.click();
    }
    
    // CRUD Operations for Daily Items
    async addDailyItem() {
        const name = document.getElementById('dailyItemName').value.trim();
        if (!name) return;
        
        const newItem = {
            id: Date.now(),
            name: name,
            days: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        this.data.daily.push(newItem);
        
        // Push to API if configured
        if (this.data.settings.apiBase && this.api.isConfigured()) {
            try {
                await this.api.create('daily', newItem);
            } catch (error) {
                console.warn('Failed to save new daily item:', error);
            }
        }
        
        this.closeModal();
        this.renderCurrentPage();
    }
    
    async updateDailyItem() {
        const id = parseInt(document.getElementById('itemId').value);
        const name = document.getElementById('dailyItemName').value.trim();
        if (!name) return;
        
        const itemIndex = this.data.daily.findIndex(item => item.id === id);
        if (itemIndex >= 0) {
            this.data.daily[itemIndex].name = name;
            this.data.daily[itemIndex].updated_at = new Date().toISOString();
            
            // Push to API if configured
            if (this.data.settings.apiBase && this.api.isConfigured()) {
                try {
                    await this.api.update('daily', id, { name });
                } catch (error) {
                    console.warn('Failed to update daily item:', error);
                }
            }
        }
        
        this.closeModal();
        this.renderCurrentPage();
    }
    
    async deleteDailyItem(id) {
        const itemIndex = this.data.daily.findIndex(item => item.id === id);
        if (itemIndex >= 0) {
            this.data.daily.splice(itemIndex, 1);
            
            // Push to API if configured
            if (this.data.settings.apiBase && this.api.isConfigured()) {
                try {
                    await this.api.delete('daily', id);
                } catch (error) {
                    console.warn('Failed to delete daily item:', error);
                }
            }
        }
        
        this.renderCurrentPage();
    }
    
    async updateDailyCheckbox(itemId, dateKey, isChecked) {
        const item = this.data.daily.find(item => item.id === itemId);
        if (item) {
            if (!item.days) item.days = {};
            
            if (isChecked) {
                item.days[dateKey] = true;
            } else {
                delete item.days[dateKey];
            }
            
            item.updated_at = new Date().toISOString();
            
            // Push to API if configured
            if (this.data.settings.apiBase && this.api.isConfigured()) {
                try {
                    await this.api.update('daily', itemId, { days: item.days });
                } catch (error) {
                    console.warn('Failed to update daily checkbox:', error);
                }
            }
        }
    }

    async updateWeeklyCheckbox(itemId, weekKey, isChecked) {
        const item = this.data.weekly.find(item => item.id === itemId);
        if (item) {
            if (!item.weeks) item.weeks = {};
            
            if (isChecked) {
                item.weeks[weekKey] = true;
            } else {
                delete item.weeks[weekKey];
            }
            
            item.updated_at = new Date().toISOString();
            
            // Push to API if configured
            if (this.data.settings.apiBase && this.api.isConfigured()) {
                try {
                    await this.api.update('weekly', itemId, { weeks: item.weeks });
                } catch (error) {
                    console.warn('Failed to update weekly checkbox:', error);
                }
            }
        }
    }

    // Finance Transaction CRUD operations
    async addTransaction() {
        const date = document.getElementById('transactionDate').value;
        const category = document.getElementById('transactionCategory').value;
        const description = document.getElementById('transactionDescription').value.trim();
        const income = parseInt(document.getElementById('transactionIncome').value) || 0;
        const outcome = parseInt(document.getElementById('transactionOutcome').value) || 0;
        
        if (!date || !category || !description) return;
        
        const newTransaction = {
            id: Math.max(...this.data.finance.map(t => t.id), 0) + 1,
            date,
            category,
            description,
            income,
            outcome,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        this.data.finance.push(newTransaction);
        
        // Push to API if configured
        if (this.data.settings.apiBase && this.api.isConfigured()) {
            try {
                await this.api.create('finance', newTransaction);
            } catch (error) {
                console.warn('Failed to save new transaction:', error);
            }
        }
        
        this.closeModal();
        this.renderCurrentPage();
    }
    
    async updateTransaction() {
        const id = parseInt(document.getElementById('transactionId').value);
        const date = document.getElementById('transactionDate').value;
        const category = document.getElementById('transactionCategory').value;
        const description = document.getElementById('transactionDescription').value.trim();
        const income = parseInt(document.getElementById('transactionIncome').value) || 0;
        const outcome = parseInt(document.getElementById('transactionOutcome').value) || 0;
        
        if (!date || !category || !description) return;
        
        const transactionIndex = this.data.finance.findIndex(t => t.id === id);
        if (transactionIndex >= 0) {
            this.data.finance[transactionIndex] = {
                ...this.data.finance[transactionIndex],
                date,
                category,
                description,
                income,
                outcome,
                updated_at: new Date().toISOString()
            };
            
            // Push to API if configured
            if (this.data.settings.apiBase && this.api.isConfigured()) {
                try {
                    await this.api.update('finance', id, { date, category, description, income, outcome });
                } catch (error) {
                    console.warn('Failed to update transaction:', error);
                }
            }
        }
        
        this.closeModal();
        this.renderCurrentPage();
    }
    
    async deleteTransaction(id) {
        const transactionIndex = this.data.finance.findIndex(t => t.id === id);
        if (transactionIndex >= 0) {
            this.data.finance.splice(transactionIndex, 1);
            
            // Push to API if configured
            if (this.data.settings.apiBase && this.api.isConfigured()) {
                try {
                    await this.api.delete('finance', id);
                } catch (error) {
                    console.warn('Failed to delete transaction:', error);
                }
            }
        }
        
        this.renderCurrentPage();
    }
    
    // Business Transaction CRUD operations
    async addBusinessTransaction() {
        const date = document.getElementById('businessDate').value;
        const type = document.getElementById('businessType').value.trim();
        const income = parseInt(document.getElementById('businessIncome').value) || 0;
        const outcome = parseInt(document.getElementById('businessOutcome').value) || 0;
        const note = document.getElementById('businessNote').value.trim();
        
        if (!date || !type) return;
        
        const newTransaction = {
            id: Math.max(...this.data.business.map(t => t.id), 0) + 1,
            date,
            type,
            income,
            outcome,
            note,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        this.data.business.push(newTransaction);
        
        // Push to API if configured
        if (this.data.settings.apiBase && this.api.isConfigured()) {
            try {
                await this.api.create('business', newTransaction);
            } catch (error) {
                console.warn('Failed to save new business transaction:', error);
            }
        }
        
        this.closeModal();
        this.renderCurrentPage();
    }
    
    async updateBusinessTransaction() {
        const id = parseInt(document.getElementById('businessId').value);
        const date = document.getElementById('businessDate').value;
        const type = document.getElementById('businessType').value.trim();
        const income = parseInt(document.getElementById('businessIncome').value) || 0;
        const outcome = parseInt(document.getElementById('businessOutcome').value) || 0;
        const note = document.getElementById('businessNote').value.trim();
        
        if (!date || !type) return;
        
        const transactionIndex = this.data.business.findIndex(t => t.id === id);
        if (transactionIndex >= 0) {
            this.data.business[transactionIndex] = {
                ...this.data.business[transactionIndex],
                date,
                type,
                income,
                outcome,
                note,
                updated_at: new Date().toISOString()
            };
            
            // Push to API if configured
            if (this.data.settings.apiBase && this.api.isConfigured()) {
                try {
                    await this.api.update('business', id, { date, type, income, outcome, note });
                } catch (error) {
                    console.warn('Failed to update business transaction:', error);
                }
            }
        }
        
        this.closeModal();
        this.renderCurrentPage();
    }
    
    async deleteBusinessTransaction(id) {
        const transactionIndex = this.data.business.findIndex(t => t.id === id);
        if (transactionIndex >= 0) {
            this.data.business.splice(transactionIndex, 1);
            
            // Push to API if configured
            if (this.data.settings.apiBase && this.api.isConfigured()) {
                try {
                    await this.api.delete('business', id);
                } catch (error) {
                    console.warn('Failed to delete business transaction:', error);
                }
            }
        }
        
        this.renderCurrentPage();
    }
    
    // Utility functions
    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.selfTracker = new SelfTrackerApp();
});