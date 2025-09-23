// LocalStorage Manager with sync capabilities
export class StorageManager {
    constructor() {
        this.prefix = 'selftracker_';
        this.keys = ['daily', 'weekly', 'monthly', 'finance', 'business', 'settings'];
    }

    async get(key) {
        try {
            const data = localStorage.getItem(this.prefix + key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Storage get error for ${key}:`, error);
            return null;
        }
    }

    async set(key, data) {
        try {
            const serialized = JSON.stringify(data);
            localStorage.setItem(this.prefix + key, serialized);
            return true;
        } catch (error) {
            console.error(`Storage set error for ${key}:`, error);
            return false;
        }
    }

    async setAll(data) {
        const results = {};
        for (const key of this.keys) {
            if (data[key] !== undefined) {
                results[key] = await this.set(key, data[key]);
            }
        }
        return results;
    }

    async getAll() {
        const data = {};
        for (const key of this.keys) {
            const value = await this.get(key);
            if (value !== null) {
                data[key] = value;
            }
        }
        return data;
    }

    async clear() {
        try {
            for (const key of this.keys) {
                localStorage.removeItem(this.prefix + key);
            }
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }

    // Merge strategies for sync conflicts
    mergeData(local, remote, type) {
        if (!local || !remote) {
            return remote || local || [];
        }

        switch (type) {
            case 'daily':
            case 'weekly':
            case 'monthly':
                return this.mergeChecklistData(local, remote);
            
            case 'finance':
            case 'business':
                return this.mergeTransactionData(local, remote);
            
            case 'settings':
                return this.mergeSettings(local, remote);
            
            default:
                return remote; // Remote wins by default
        }
    }

    mergeChecklistData(local, remote) {
        const merged = [];
        const remoteIds = new Set(remote.map(item => item.id));
        const localIds = new Set(local.map(item => item.id));

        // Add all remote items (they have priority)
        remote.forEach(remoteItem => {
            const localItem = local.find(item => item.id === remoteItem.id);
            if (localItem) {
                // Merge completion data
                const mergedDays = { ...localItem.days, ...remoteItem.days };
                const mergedWeeks = { ...localItem.weeks, ...remoteItem.weeks };
                const mergedMonths = { ...localItem.months, ...remoteItem.months };
                
                merged.push({
                    ...remoteItem,
                    days: mergedDays,
                    weeks: mergedWeeks,
                    months: mergedMonths
                });
            } else {
                merged.push(remoteItem);
            }
        });

        // Add local-only items
        local.forEach(localItem => {
            if (!remoteIds.has(localItem.id)) {
                merged.push(localItem);
            }
        });

        return merged;
    }

    mergeTransactionData(local, remote) {
        const merged = [];
        const seenIds = new Set();

        // Combine and deduplicate by ID
        [...remote, ...local].forEach(item => {
            if (!seenIds.has(item.id)) {
                seenIds.add(item.id);
                merged.push(item);
            }
        });

        // Sort by date descending
        return merged.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    mergeSettings(local, remote) {
        // Remote settings take priority, but preserve local-only keys
        return {
            ...local,
            ...remote,
            // Keep local API credentials if remote doesn't have them
            apiToken: remote.apiToken || local.apiToken || '',
            apiBase: remote.apiBase || local.apiBase || ''
        };
    }

    // Export data as JSON
    exportData() {
        const data = {};
        for (const key of this.keys) {
            const value = localStorage.getItem(this.prefix + key);
            if (value) {
                try {
                    data[key] = JSON.parse(value);
                } catch (error) {
                    console.error(`Export error for ${key}:`, error);
                }
            }
        }
        
        return {
            data,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
    }

    // Import data from JSON
    async importData(importData) {
        try {
            if (!importData.data) {
                throw new Error('Invalid import data format');
            }

            const results = {};
            for (const key of this.keys) {
                if (importData.data[key]) {
                    results[key] = await this.set(key, importData.data[key]);
                }
            }

            return {
                success: true,
                results,
                imported: Object.keys(results).length
            };
        } catch (error) {
            console.error('Import error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get storage usage info
    getStorageInfo() {
        let totalSize = 0;
        const itemSizes = {};

        for (const key of this.keys) {
            const item = localStorage.getItem(this.prefix + key);
            if (item) {
                const size = new Blob([item]).size;
                itemSizes[key] = size;
                totalSize += size;
            }
        }

        // Estimate available space (5MB typical limit)
        const estimatedLimit = 5 * 1024 * 1024;
        const usagePercentage = (totalSize / estimatedLimit) * 100;

        return {
            totalSize,
            itemSizes,
            usagePercentage: Math.min(usagePercentage, 100),
            estimatedLimit
        };
    }

    // Clean up old data
    cleanup(daysToKeep = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        ['finance', 'business'].forEach(async (key) => {
            const data = await this.get(key);
            if (data && Array.isArray(data)) {
                const filtered = data.filter(item => {
                    const itemDate = new Date(item.created_at || item.date);
                    return itemDate >= cutoffDate;
                });
                
                if (filtered.length !== data.length) {
                    await this.set(key, filtered);
                    console.log(`Cleaned up ${data.length - filtered.length} old ${key} records`);
                }
            }
        });
    }
}