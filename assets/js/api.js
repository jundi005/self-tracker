// API Client for Google Apps Script integration
export class APIClient {
    constructor() {
        this.baseURL = '';
        this.token = '';
        this.maxRetries = 3;
        this.retryDelay = 1000;
    }

    configure(baseURL, token = '') {
        this.baseURL = baseURL;
        this.token = token; // Keep for backward compatibility but not required
    }

    async request(endpoint, method = 'GET', data = null) {
        if (!this.baseURL) {
            throw new Error('API tidak dikonfigurasi. Silakan atur URL di pengaturan.');
        }

        const url = `${this.baseURL}?action=${endpoint}`;
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        // Pass data without token (Google Apps Script handles authentication)
        const requestData = data || {};
        
        if (method === 'POST' || method === 'PUT') {
            options.body = JSON.stringify(requestData);
        }

        let lastError = null;
        
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const response = await fetch(url, options);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const result = await response.json();
                
                if (result.error) {
                    throw new Error(result.error);
                }

                return result;
            } catch (error) {
                lastError = error;
                console.warn(`API request attempt ${attempt} failed:`, error.message);
                
                if (attempt < this.maxRetries) {
                    await this.delay(this.retryDelay * attempt);
                }
            }
        }

        throw lastError;
    }

    async health() {
        try {
            const result = await this.request('health');
            return {
                success: true,
                data: result
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async init() {
        return await this.request('init', 'POST');
    }

    async pull() {
        const result = await this.request('pull');
        return result.data;
    }

    async push(data) {
        return await this.request('push', 'POST', data);
    }

    async create(type, item) {
        return await this.request('create', 'POST', { type, item });
    }

    async update(type, id, updates) {
        return await this.request('update', 'POST', { type, id, updates });
    }

    async delete(type, id) {
        return await this.request('delete', 'POST', { type, id });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Batch operations for efficiency
    async batchCreate(type, items) {
        return await this.request('batch_create', 'POST', { type, items });
    }

    async batchUpdate(type, updates) {
        return await this.request('batch_update', 'POST', { type, updates });
    }

    async batchDelete(type, ids) {
        return await this.request('batch_delete', 'POST', { type, ids });
    }

    // Specific methods for different data types
    async getDailyData(month) {
        return await this.request('get_daily', 'POST', { month });
    }

    async getWeeklyData(month) {
        return await this.request('get_weekly', 'POST', { month });
    }

    async getMonthlyData(year) {
        return await this.request('get_monthly', 'POST', { year });
    }

    async getFinanceData(filters = {}) {
        return await this.request('get_finance', 'POST', filters);
    }

    async getBusinessData(filters = {}) {
        return await this.request('get_business', 'POST', filters);
    }

    // Sync specific operations
    async syncDaily(items) {
        return await this.request('sync_daily', 'POST', { items });
    }

    async syncWeekly(items) {
        return await this.request('sync_weekly', 'POST', { items });
    }

    async syncMonthly(items) {
        return await this.request('sync_monthly', 'POST', { items });
    }

    async syncFinance(items) {
        return await this.request('sync_finance', 'POST', { items });
    }

    async syncBusiness(items) {
        return await this.request('sync_business', 'POST', { items });
    }

    async syncSettings(settings) {
        return await this.request('sync_settings', 'POST', { settings });
    }

    // Helper method to check if API is configured
    isConfigured() {
        return !!this.baseURL;
    }

    // Get API status
    getStatus() {
        return {
            configured: this.isConfigured(),
            baseURL: this.baseURL,
            hasToken: !!this.token
        };
    }
}