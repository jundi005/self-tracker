// Chart.js Manager for dashboard visualizations
export class ChartManager {
    constructor() {
        this.charts = {};
        this.colors = {
            primary: '#8b5cf6',
            secondary: '#7c3aed',
            success: '#10b981',
            danger: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6',
            background: 'rgba(31, 41, 55, 0.9)',
            text: '#f3f4f6',
            grid: 'rgba(139, 92, 246, 0.2)'
        };
    }

    // Render daily cash flow chart
    renderDailyCashFlowChart(financeData, businessData, month, openingBalance = 0) {
        console.log('Rendering daily cash flow chart with data:', { financeData, businessData, month });
        const ctx = document.getElementById('dailyCashFlowChart');
        if (!ctx) {
            console.error('Canvas element dailyCashFlowChart not found');
            return;
        }

        // Ensure data arrays exist
        financeData = financeData || [];
        businessData = businessData || [];
        
        // Set default month if not provided or convert ISO date
        if (!month || month === undefined || month === null) {
            const now = new Date();
            month = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
            console.log('No month provided for cash flow chart, using current month:', month);
        } else if (month.includes('T')) {
            // Convert ISO timestamp to YYYY-MM format
            const date = new Date(month);
            month = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            console.log('Converted ISO month to YYYY-MM format:', month);
        }
        console.log('Active month for cash flow chart:', month);
        
        // Destroy existing chart
        if (this.charts.dailyCashFlow) {
            this.charts.dailyCashFlow.destroy();
        }

        // Calculate daily cash flow for the month
        let daysInMonth;
        try {
            if (!month || typeof month !== 'string') {
                throw new Error('Invalid month parameter');
            }
            const monthParts = month.split('-');
            if (monthParts.length !== 2) {
                throw new Error('Month should be in YYYY-MM format');
            }
            const year = parseInt(monthParts[0]);
            const monthNum = parseInt(monthParts[1]);
            daysInMonth = new Date(year, monthNum, 0).getDate();
        } catch (error) {
            console.error('Error calculating days in month for cash flow:', error, 'month:', month);
            daysInMonth = 31; // fallback
        }
        console.log('Days in month for cash flow:', daysInMonth, 'for month:', month);
        
        // Combine all transactions
        const allTransactions = [...financeData, ...businessData];
        
        const labels = [];
        const netData = [];
        let lastKnownTotal = 0;

        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = `${month}-${day.toString().padStart(2, '0')}`;
            labels.push(day);
            
            // Find all transactions for this specific day
            const dayTransactions = allTransactions.filter(transaction => {
                if (!transaction || !transaction.date) return false;
                const txDate = new Date(transaction.date);
                const transactionDate = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}-${String(txDate.getDate()).padStart(2, '0')}`;
                return transactionDate === dateKey;
            });
            
            // If there are transactions on this day, use the total from the last transaction
            if (dayTransactions.length > 0) {
                // Sort by created_at or updated_at to get the most recent transaction
                dayTransactions.sort((a, b) => {
                    const dateA = new Date(a.updated_at || a.created_at);
                    const dateB = new Date(b.updated_at || b.created_at);
                    return dateB - dateA; // Most recent first
                });
                
                // Get the total from the most recent transaction
                const mostRecentTransaction = dayTransactions[0];
                if (mostRecentTransaction.total !== undefined && mostRecentTransaction.total !== null) {
                    lastKnownTotal = mostRecentTransaction.total;
                }
            }
            
            // Use the last known total for this day
            netData.push(lastKnownTotal);
        }
        
        console.log('Chart data prepared:', { labels: labels.length, netData: netData.length });

        try {
            this.charts.dailyCashFlow = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Uang',
                    data: netData,
                    borderColor: this.colors.primary,
                    backgroundColor: this.colors.primary + '20',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        ticks: {
                            color: this.colors.text
                        },
                        grid: {
                            color: this.colors.grid
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: this.colors.text,
                            callback: function(value) {
                                return new Intl.NumberFormat('id-ID', {
                                    style: 'currency',
                                    currency: 'IDR',
                                    minimumFractionDigits: 0
                                }).format(value);
                            }
                        },
                        grid: {
                            color: this.colors.grid
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: this.colors.text
                        }
                    },
                    tooltip: {
                        titleColor: this.colors.text,
                        bodyColor: this.colors.text,
                        backgroundColor: this.colors.background,
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = new Intl.NumberFormat('id-ID', {
                                    style: 'currency',
                                    currency: 'IDR',
                                    minimumFractionDigits: 0
                                }).format(context.parsed.y);
                                return label + ': ' + value;
                            }
                        }
                    }
                }
            }
        });
        } catch (error) {
            console.error('Error creating daily cash flow chart:', error);
        }
    }

    // Render daily progress line chart
    renderDailyChart(dailyData, month) {
        console.log('Rendering daily progress chart with data:', { dailyData, month });
        const ctx = document.getElementById('dailyChart');
        if (!ctx) {
            console.error('Canvas element dailyChart not found');
            return;
        }

        // Ensure data exists
        dailyData = dailyData || [];
        
        // Set default month if not provided or convert ISO date
        if (!month || month === undefined || month === null) {
            const now = new Date();
            month = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
            console.log('No month provided for daily chart, using current month:', month);
        } else if (month.includes('T')) {
            // Convert ISO timestamp to YYYY-MM format
            const date = new Date(month);
            month = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            console.log('Converted ISO month to YYYY-MM format for daily chart:', month);
        }
        console.log('Active month for daily chart:', month);
        
        // Destroy existing chart
        if (this.charts.daily) {
            this.charts.daily.destroy();
        }

        // Calculate daily completion percentages for the month
        let daysInMonth;
        try {
            if (!month || typeof month !== 'string') {
                throw new Error('Invalid month parameter');
            }
            const monthParts = month.split('-');
            if (monthParts.length !== 2) {
                throw new Error('Month should be in YYYY-MM format');
            }
            const year = parseInt(monthParts[0]);
            const monthNum = parseInt(monthParts[1]);
            daysInMonth = new Date(year, monthNum, 0).getDate();
        } catch (error) {
            console.error('Error calculating days in month for daily chart:', error, 'month:', month);
            daysInMonth = 31; // fallback
        }
        console.log('Days in month for daily chart:', daysInMonth, 'for month:', month);
        
        const labels = [];
        const data = [];

        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = `${month}-${day.toString().padStart(2, '0')}`;
            labels.push(day);
            
            let completed = 0;
            let total = Array.isArray(dailyData) ? dailyData.length : 0;
            
            if (Array.isArray(dailyData)) {
                dailyData.forEach(item => {
                    if (item && item.days) {
                        // Check if any variant of the date exists in the days object
                        const dayChecked = item.days[dateKey] || 
                                         item.days[`${month}-${day.toString().padStart(2, '0')}`] ||
                                         false;
                        if (dayChecked) {
                            completed++;
                        }
                    }
                });
            }
            
            const percentage = total > 0 ? (completed / total) * 100 : 0;
            data.push(percentage);
        }
        
        console.log('Daily chart data prepared:', { labels: labels.length, data: data.length, sampleData: data.slice(0, 5) });

        try {
            this.charts.daily = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Progress Harian (%)',
                    data: data,
                    borderColor: this.colors.primary,
                    backgroundColor: this.colors.primary + '20',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
        } catch (error) {
            console.error('Error creating daily progress chart:', error);
        }
    }

    // Render weekly vs monthly comparison bar chart
    renderWeeklyMonthlyChart(weeklyData, monthlyData) {
        console.log('Rendering weekly vs monthly chart with data:', { weeklyData, monthlyData });
        const ctx = document.getElementById('weeklyMonthlyChart');
        if (!ctx) {
            console.error('Canvas element weeklyMonthlyChart not found');
            return;
        }

        // Ensure data exists
        weeklyData = weeklyData || [];
        monthlyData = monthlyData || [];
        
        if (this.charts.weeklyMonthly) {
            this.charts.weeklyMonthly.destroy();
        }

        // Calculate average completion for weekly and monthly
        const weeklyCompletion = this.calculateAverageCompletion(weeklyData, 'weeks');
        const monthlyCompletion = this.calculateAverageCompletion(monthlyData, 'months');
        
        console.log('Weekly vs Monthly completion data:', { weeklyCompletion, monthlyCompletion });

        try {
            this.charts.weeklyMonthly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Mingguan', 'Bulanan'],
                datasets: [{
                    label: 'Rata-rata Completion (%)',
                    data: [weeklyCompletion, monthlyCompletion],
                    backgroundColor: [this.colors.primary, this.colors.secondary],
                    borderColor: [this.colors.primary, this.colors.secondary],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
        } catch (error) {
            console.error('Error creating weekly vs monthly chart:', error);
        }
    }

    // Render spending by category donut chart
    renderCategoryChart(financeData) {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;

        // Ensure data exists
        financeData = financeData || [];
        
        if (this.charts.category) {
            this.charts.category.destroy();
        }

        // Calculate spending by category
        const categoryTotals = {};
        if (Array.isArray(financeData)) {
            financeData.forEach(transaction => {
                if (transaction && transaction.outcome > 0) {
                    if (!categoryTotals[transaction.category]) {
                        categoryTotals[transaction.category] = 0;
                    }
                    categoryTotals[transaction.category] += transaction.outcome;
                }
            });
        }

        const labels = Object.keys(categoryTotals);
        const data = Object.values(categoryTotals);
        const backgroundColors = labels.map((_, index) => {
            const colors = [this.colors.primary, this.colors.secondary, this.colors.success, this.colors.warning, this.colors.info, this.colors.danger];
            return colors[index % colors.length];
        });

        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${context.label}: Rp ${value.toLocaleString('id-ID')} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Render budget vs actual spending chart
    renderBudgetChart(financeData, settings) {
        const ctx = document.getElementById('budgetChart');
        if (!ctx) return;

        // Ensure data exists
        financeData = financeData || [];
        settings = settings || { categories: [] };
        
        if (this.charts.budget) {
            this.charts.budget.destroy();
        }

        // Calculate actual spending by category
        // Note: financeData is already filtered to current month in renderDashboard()
        const actualSpending = {};
        
        if (Array.isArray(financeData)) {
            financeData
                .filter(transaction => transaction && transaction.outcome > 0)
                .forEach(transaction => {
                    if (!actualSpending[transaction.category]) {
                        actualSpending[transaction.category] = 0;
                    }
                    actualSpending[transaction.category] += transaction.outcome;
                });
        }

        // Use individual category limits
        const spendingCategories = Array.isArray(settings.categories) ? 
            settings.categories.filter(cat => cat && cat.type === 'spending') : [];
        
        const labels = spendingCategories.map(cat => cat.name);
        const budgetData = spendingCategories.map(cat => cat.limit);
        const actualData = spendingCategories.map(cat => actualSpending[cat.name] || 0);

        this.charts.budget = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Budget',
                        data: budgetData,
                        backgroundColor: this.colors.success + '80',
                        borderColor: this.colors.success,
                        borderWidth: 1
                    },
                    {
                        label: 'Realisasi',
                        data: actualData,
                        backgroundColor: this.colors.danger + '80',
                        borderColor: this.colors.danger,
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'Rp ' + value.toLocaleString('id-ID');
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: Rp ${context.raw.toLocaleString('id-ID')}`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Render business summary chart
    renderBusinessChart(businessData) {
        const ctx = document.getElementById('businessChart');
        if (!ctx) return;

        // Ensure data exists
        businessData = businessData || [];
        
        if (this.charts.business) {
            this.charts.business.destroy();
        }

        // Group by business type
        const businessSummary = {};
        if (Array.isArray(businessData)) {
            businessData.forEach(transaction => {
                if (transaction && transaction.type) {
                    if (!businessSummary[transaction.type]) {
                        businessSummary[transaction.type] = { income: 0, outcome: 0 };
                    }
                    businessSummary[transaction.type].income += transaction.income || 0;
                    businessSummary[transaction.type].outcome += transaction.outcome || 0;
                }
            });
        }

        const labels = Object.keys(businessSummary);
        const incomeData = labels.map(type => businessSummary[type].income);
        const outcomeData = labels.map(type => businessSummary[type].outcome);

        this.charts.business = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Pendapatan',
                        data: incomeData,
                        backgroundColor: this.colors.success + '80',
                        borderColor: this.colors.success,
                        borderWidth: 1
                    },
                    {
                        label: 'Pengeluaran',
                        data: outcomeData,
                        backgroundColor: this.colors.danger + '80',
                        borderColor: this.colors.danger,
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'Rp ' + value.toLocaleString('id-ID');
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: Rp ${context.raw.toLocaleString('id-ID')}`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Helper function to calculate average completion percentage
    calculateAverageCompletion(data, timeKey) {
        if (!Array.isArray(data) || data.length === 0) return 0;

        let totalItems = 0;
        let completedItems = 0;

        data.forEach(item => {
            if (item && item[timeKey]) {
                const timeData = item[timeKey] || {};
                const timeKeys = Object.keys(timeData);
                
                totalItems += timeKeys.length;
                completedItems += timeKeys.filter(key => timeData[key]).length;
            }
        });

        return totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    }

    // Destroy all charts
    destroyAll() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
    }

    // Resize all charts
    resizeAll() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.resize();
        });
    }
}