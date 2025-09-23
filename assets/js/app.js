// Main Application Controller
import { StorageManager } from './storage.js';
import { APIClient } from './api.js';
import { ChartManager } from './charts.js';
import { GridRenderer } from './renderers.js';

class SelfTrackerApp {
    constructor() {
        this.storage = new StorageManager();
        this.api = new APIClient();
        this.charts = new ChartManager();
        this.renderer = new GridRenderer();
        
        this.currentPage = 'daily';
        this.isOnline = true;
        this.data = {
            daily: [],
            weekly: [],
            monthly: [],
            finance: [],
            business: [],
            settings: {
                activeMonth: new Date().toISOString().slice(0, 7),
                monthlyBudget: 5000000,
                categories: ['Makanan', 'Transport', 'Hiburan', 'Belanja', 'Tagihan'],
                storageMode: 'offline',
                apiToken: '',
                apiBase: ''
            }
        };
        
        this.init();
    }

    async init() {
        await this.loadSettings();
        await this.initializeData();
        this.bindEvents();
        this.renderCurrentPage();
        await this.checkConnection();
    }

    async loadSettings() {
        const settings = await this.storage.get('settings');
        if (settings) {
            this.data.settings = { ...this.data.settings, ...settings };
        }
        await this.storage.set('settings', this.data.settings);
    }

    async initializeData() {
        // Load data from storage
        for (const key of ['daily', 'weekly', 'monthly', 'finance', 'business']) {
            const data = await this.storage.get(key);
            if (data) {
                this.data[key] = data;
            } else {
                // Initialize with sample data
                this.data[key] = this.getSampleData(key);
                await this.storage.set(key, this.data[key]);
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
        // Navigation events
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchPage(e.target.dataset.page);
            });
        });

        // Sync button
        document.getElementById('syncBtn').addEventListener('click', () => {
            this.syncData();
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
        const tableHtml = this.renderer.renderBusinessTable(filteredData);
        document.getElementById('businessTable').innerHTML = tableHtml;
        
        this.updateBusinessSummary(filteredData);
        this.bindBusinessEvents();
    }

    renderDashboard() {
        this.charts.renderDailyChart(this.data.daily, this.data.settings.activeMonth);
        this.charts.renderWeeklyMonthlyChart(this.data.weekly, this.data.monthly);
        this.charts.renderCategoryChart(this.data.finance);
        this.charts.renderBudgetChart(this.data.finance, this.data.settings);
        this.charts.renderBusinessChart(this.data.business);
    }

    renderSettingsPage() {
        document.getElementById('activeMonth').value = this.data.settings.activeMonth;
        document.getElementById('storageMode').value = this.data.settings.storageMode;
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
            if (this.data.settings.storageMode === 'online' && this.data.settings.apiBase && this.data.settings.apiToken) {
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

    async syncData() {
        if (!this.isOnline) {
            alert('Tidak dapat sinkronisasi dalam mode offline');
            return;
        }

        try {
            const syncBtn = document.getElementById('syncBtn');
            syncBtn.disabled = true;
            syncBtn.innerHTML = '<span class="spinner"></span> Sync...';

            // Push local changes
            await this.api.push(this.data);
            
            // Pull remote changes
            const remoteData = await this.api.pull();
            if (remoteData) {
                this.data = { ...this.data, ...remoteData };
                await this.storage.setAll(this.data);
            }

            this.renderCurrentPage();
            alert('Sinkronisasi berhasil!');
        } catch (error) {
            console.error('Sync failed:', error);
            alert('Sinkronisasi gagal: ' + error.message);
        } finally {
            const syncBtn = document.getElementById('syncBtn');
            syncBtn.disabled = false;
            syncBtn.innerHTML = 'Sync';
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
        const formHtml = this.renderer.renderTransactionForm(null, this.data.settings.categories);
        this.showModal('Tambah Transaksi', formHtml);
        
        document.getElementById('transactionForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.addTransaction();
        });
    }
    
    showEditTransactionModal(transaction) {
        const formHtml = this.renderer.renderTransactionForm(transaction, this.data.settings.categories);
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
            storageMode: document.getElementById('storageMode').value,
            monthlyBudget: parseInt(document.getElementById('monthlyBudget').value) || 0,
            apiToken: document.getElementById('apiToken').value,
            apiBase: document.getElementById('apiBase').value,
            categories: this.data.settings.categories
        };
        
        this.data.settings = { ...this.data.settings, ...newSettings };
        await this.storage.set('settings', this.data.settings);
        
        // Update API configuration
        this.api.configure(newSettings.apiBase, newSettings.apiToken);
        
        // Check connection after updating settings
        await this.checkConnection();
        
        alert('Pengaturan berhasil disimpan!');
    }

    async testConnection() {
        const apiBase = document.getElementById('apiBase').value;
        const apiToken = document.getElementById('apiToken').value;
        
        if (!apiBase || !apiToken) {
            alert('Harap masukkan URL dan token API!');
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
        let html = '';
        
        this.data.settings.categories.forEach((category, index) => {
            html += `
                <div class="category-item">
                    <input type="text" value="${category}" data-index="${index}">
                    <button type="button" onclick="selfTracker.removeBudgetCategory(${index})">Hapus</button>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // Bind input events
        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.data.settings.categories[index] = e.target.value;
            });
        });
    }

    addBudgetCategory() {
        const newCategory = prompt('Nama kategori baru:');
        if (newCategory && newCategory.trim()) {
            this.data.settings.categories.push(newCategory.trim());
            this.renderBudgetCategories();
        }
    }
    
    removeBudgetCategory(index) {
        if (confirm('Yakin ingin menghapus kategori ini?')) {
            this.data.settings.categories.splice(index, 1);
            this.renderBudgetCategories();
        }
    }

    exportData() {
        const exportData = this.storage.exportData();
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
                
                const result = await this.storage.importData(importData);
                if (result.success) {
                    // Reload data
                    await this.initializeData();
                    this.renderCurrentPage();
                    alert(`Import berhasil! ${result.imported} tipe data diimport.`);
                } else {
                    throw new Error(result.error);
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
        await this.storage.set('daily', this.data.daily);
        
        if (this.isOnline) {
            try {
                await this.api.create('daily', newItem);
            } catch (error) {
                console.warn('Failed to sync new daily item:', error);
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
            
            await this.storage.set('daily', this.data.daily);
            
            if (this.isOnline) {
                try {
                    await this.api.update('daily', id, { name });
                } catch (error) {
                    console.warn('Failed to sync daily item update:', error);
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
            await this.storage.set('daily', this.data.daily);
            
            if (this.isOnline) {
                try {
                    await this.api.delete('daily', id);
                } catch (error) {
                    console.warn('Failed to sync daily item deletion:', error);
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
            await this.storage.set('daily', this.data.daily);
            
            if (this.isOnline) {
                try {
                    await this.api.update('daily', itemId, { days: item.days });
                } catch (error) {
                    console.warn('Failed to sync daily checkbox update:', error);
                }
            }
        }
    }

    // Similar CRUD operations for Weekly, Monthly, Finance, and Business
    // (implementing the core ones - others follow same pattern)
    
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