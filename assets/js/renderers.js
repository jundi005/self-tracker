// Grid and Table Renderers
export class GridRenderer {
    constructor() {
        this.formatCurrency = (amount) => {
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
            }).format(amount);
        };

        this.formatDate = (dateString) => {
            return new Date(dateString).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        };
    }

    // Render daily checklist grid (30 days x agenda items)
    renderDailyGrid(dailyData, month) {
        if (!month) return '<p class="text-center">Pilih bulan untuk melihat checklist harian</p>';

        const year = new Date(month + '-01').getFullYear();
        const monthNum = new Date(month + '-01').getMonth();
        const daysInMonth = new Date(year, monthNum + 1, 0).getDate();
        
        let html = '<table class="grid-table"><thead><tr>';
        html += '<th class="agenda-cell">Agenda</th>';
        
        // Day headers
        for (let day = 1; day <= daysInMonth; day++) {
            html += `<th>${day}</th>`;
        }
        html += '<th>%</th><th>Actions</th></tr></thead><tbody>';

        // Data rows
        dailyData.forEach(item => {
            html += '<tr>';
            html += `<td class="agenda-cell">
                <div class="agenda-item">
                    <span class="agenda-name" data-id="${item.id}">${item.name}</span>
                </div>
            </td>`;
            
            let completed = 0;
            
            // Day checkboxes
            for (let day = 1; day <= daysInMonth; day++) {
                const dateKey = `${month}-${day.toString().padStart(2, '0')}`;
                const isChecked = item.days && item.days[dateKey] ? 'checked' : '';
                if (isChecked) completed++;
                
                html += `<td>
                    <input type="checkbox" class="checkbox daily-checkbox" 
                           data-id="${item.id}" data-date="${dateKey}" ${isChecked}>
                </td>`;
            }
            
            // Percentage
            const percentage = daysInMonth > 0 ? Math.round((completed / daysInMonth) * 100) : 0;
            html += `<td class="text-center">${percentage}%</td>`;
            
            // Actions
            html += `<td class="agenda-actions">
                <button class="action-btn edit-btn" data-id="${item.id}" title="Edit">✏️</button>
                <button class="action-btn delete-btn" data-id="${item.id}" title="Delete">🗑️</button>
            </td>`;
            
            html += '</tr>';
        });

        html += '</tbody></table>';
        return html;
    }

    // Render weekly checklist grid (4 weeks x agenda items)
    renderWeeklyGrid(weeklyData, month) {
        if (!month) return '<p class="text-center">Pilih bulan untuk melihat checklist mingguan</p>';

        let html = '<table class="grid-table"><thead><tr>';
        html += '<th class="agenda-cell">Agenda Mingguan</th>';
        
        // Week headers
        for (let week = 1; week <= 4; week++) {
            html += `<th>Minggu ${week}</th>`;
        }
        html += '<th>%</th><th>Actions</th></tr></thead><tbody>';

        // Data rows
        weeklyData.forEach(item => {
            html += '<tr>';
            html += `<td class="agenda-cell">
                <div class="agenda-item">
                    <span class="agenda-name" data-id="${item.id}">${item.name}</span>
                </div>
            </td>`;
            
            let completed = 0;
            
            // Week checkboxes
            for (let week = 1; week <= 4; week++) {
                const weekKey = `${month}-W${week}`;
                const isChecked = item.weeks && item.weeks[weekKey] ? 'checked' : '';
                if (isChecked) completed++;
                
                html += `<td>
                    <input type="checkbox" class="checkbox weekly-checkbox" 
                           data-id="${item.id}" data-week="${weekKey}" ${isChecked}>
                </td>`;
            }
            
            // Percentage
            const percentage = Math.round((completed / 4) * 100);
            html += `<td class="text-center">${percentage}%</td>`;
            
            // Actions
            html += `<td class="agenda-actions">
                <button class="action-btn edit-btn" data-id="${item.id}" title="Edit">✏️</button>
                <button class="action-btn delete-btn" data-id="${item.id}" title="Delete">🗑️</button>
            </td>`;
            
            html += '</tr>';
        });

        html += '</tbody></table>';
        return html;
    }

    // Render monthly checklist grid (4 months x targets)
    renderMonthlyGrid(monthlyData, year) {
        if (!year) return '<p class="text-center">Pilih tahun untuk melihat checklist bulanan</p>';

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const selectedYear = parseInt(year);
        
        let html = '<table class="grid-table"><thead><tr>';
        html += '<th class="agenda-cell">Target Bulanan</th>';
        
        // Month headers (4 months from current or selected year)
        const months = [];
        for (let i = 0; i < 4; i++) {
            const monthIndex = selectedYear === currentYear ? (currentMonth + i) % 12 : i;
            const monthYear = selectedYear === currentYear && currentMonth + i >= 12 ? selectedYear + 1 : selectedYear;
            const monthName = new Date(monthYear, monthIndex, 1).toLocaleDateString('id-ID', { month: 'long' });
            const monthKey = `${monthYear}-${(monthIndex + 1).toString().padStart(2, '0')}`;
            months.push({ name: monthName, key: monthKey });
            html += `<th>${monthName}</th>`;
        }
        html += '<th>%</th><th>Actions</th></tr></thead><tbody>';

        // Data rows
        monthlyData.forEach(item => {
            html += '<tr>';
            html += `<td class="agenda-cell">
                <div class="agenda-item">
                    <span class="agenda-name" data-id="${item.id}">${item.name}</span>
                </div>
            </td>`;
            
            let completed = 0;
            
            // Month checkboxes
            months.forEach(month => {
                const isChecked = item.months && item.months[month.key] ? 'checked' : '';
                if (isChecked) completed++;
                
                html += `<td>
                    <input type="checkbox" class="checkbox monthly-checkbox" 
                           data-id="${item.id}" data-month="${month.key}" ${isChecked}>
                </td>`;
            });
            
            // Percentage
            const percentage = Math.round((completed / months.length) * 100);
            html += `<td class="text-center">${percentage}%</td>`;
            
            // Actions
            html += `<td class="agenda-actions">
                <button class="action-btn edit-btn" data-id="${item.id}" title="Edit">✏️</button>
                <button class="action-btn delete-btn" data-id="${item.id}" title="Delete">🗑️</button>
            </td>`;
            
            html += '</tr>';
        });

        html += '</tbody></table>';
        return html;
    }

    // Render finance transaction table
    renderTransactionTable(transactionData) {
        if (!transactionData || transactionData.length === 0) {
            return '<p class="text-center">Tidak ada transaksi yang ditemukan</p>';
        }

        let html = '<table class="data-table"><thead><tr>';
        html += '<th>Tanggal</th><th>Kategori</th><th>Deskripsi</th>';
        html += '<th>Pemasukan</th><th>Pengeluaran</th><th>Saldo</th><th>Actions</th>';
        html += '</tr></thead><tbody>';

        let runningBalance = 0;
        
        // Calculate running balance (from oldest to newest)
        const sortedData = [...transactionData].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        sortedData.forEach(transaction => {
            runningBalance += transaction.income - transaction.outcome;
            
            html += '<tr>';
            html += `<td>${this.formatDate(transaction.date)}</td>`;
            html += `<td><span class="category-tag">${transaction.category}</span></td>`;
            html += `<td>${transaction.description}</td>`;
            html += `<td class="amount-cell ${transaction.income > 0 ? 'positive' : ''}">${transaction.income > 0 ? this.formatCurrency(transaction.income) : '-'}</td>`;
            html += `<td class="amount-cell ${transaction.outcome > 0 ? 'negative' : ''}">${transaction.outcome > 0 ? this.formatCurrency(transaction.outcome) : '-'}</td>`;
            html += `<td class="amount-cell ${runningBalance >= 0 ? 'positive' : 'negative'}">${this.formatCurrency(runningBalance)}</td>`;
            html += `<td>
                <button class="action-btn edit-btn" data-id="${transaction.id}" title="Edit">✏️</button>
                <button class="action-btn delete-btn" data-id="${transaction.id}" title="Delete">🗑️</button>
            </td>`;
            html += '</tr>';
        });

        html += '</tbody></table>';
        return html;
    }

    // Render business transaction table
    renderBusinessTable(businessData) {
        if (!businessData || businessData.length === 0) {
            return '<p class="text-center">Tidak ada transaksi bisnis yang ditemukan</p>';
        }

        let html = '<table class="data-table"><thead><tr>';
        html += '<th>Tanggal</th><th>Jenis Bisnis</th><th>Pendapatan</th>';
        html += '<th>Pengeluaran</th><th>Profit</th><th>Catatan</th><th>Actions</th>';
        html += '</tr></thead><tbody>';

        businessData.forEach(transaction => {
            const profit = transaction.income - transaction.outcome;
            
            html += '<tr>';
            html += `<td>${this.formatDate(transaction.date)}</td>`;
            html += `<td><span class="business-type-tag">${transaction.type}</span></td>`;
            html += `<td class="amount-cell ${transaction.income > 0 ? 'positive' : ''}">${transaction.income > 0 ? this.formatCurrency(transaction.income) : '-'}</td>`;
            html += `<td class="amount-cell ${transaction.outcome > 0 ? 'negative' : ''}">${transaction.outcome > 0 ? this.formatCurrency(transaction.outcome) : '-'}</td>`;
            html += `<td class="amount-cell ${profit >= 0 ? 'positive' : 'negative'}">${this.formatCurrency(profit)}</td>`;
            html += `<td class="note-cell">${transaction.note || '-'}</td>`;
            html += `<td>
                <button class="action-btn edit-btn" data-id="${transaction.id}" title="Edit">✏️</button>
                <button class="action-btn delete-btn" data-id="${transaction.id}" title="Delete">🗑️</button>
            </td>`;
            html += '</tr>';
        });

        html += '</tbody></table>';
        return html;
    }

    // Render form for adding/editing daily items
    renderDailyItemForm(item = null) {
        const isEdit = !!item;
        return `
            <form id="dailyItemForm">
                <div class="form-group">
                    <label>Nama Agenda</label>
                    <input type="text" id="dailyItemName" class="input" 
                           value="${item ? item.name : ''}" 
                           placeholder="Masukkan nama agenda harian" required>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">
                        ${isEdit ? 'Update' : 'Tambah'} Agenda
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="selfTracker.closeModal()">
                        Batal
                    </button>
                </div>
                ${item ? `<input type="hidden" id="itemId" value="${item.id}">` : ''}
            </form>
        `;
    }

    // Render form for adding/editing weekly items
    renderWeeklyItemForm(item = null) {
        const isEdit = !!item;
        return `
            <form id="weeklyItemForm">
                <div class="form-group">
                    <label>Nama Agenda Mingguan</label>
                    <input type="text" id="weeklyItemName" class="input" 
                           value="${item ? item.name : ''}" 
                           placeholder="Masukkan nama agenda mingguan" required>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">
                        ${isEdit ? 'Update' : 'Tambah'} Agenda
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="selfTracker.closeModal()">
                        Batal
                    </button>
                </div>
                ${item ? `<input type="hidden" id="itemId" value="${item.id}">` : ''}
            </form>
        `;
    }

    // Render form for adding/editing monthly items
    renderMonthlyItemForm(item = null) {
        const isEdit = !!item;
        return `
            <form id="monthlyItemForm">
                <div class="form-group">
                    <label>Nama Target Bulanan</label>
                    <input type="text" id="monthlyItemName" class="input" 
                           value="${item ? item.name : ''}" 
                           placeholder="Masukkan nama target bulanan" required>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">
                        ${isEdit ? 'Update' : 'Tambah'} Target
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="selfTracker.closeModal()">
                        Batal
                    </button>
                </div>
                ${item ? `<input type="hidden" id="itemId" value="${item.id}">` : ''}
            </form>
        `;
    }

    // Render form for adding/editing finance transactions
    renderTransactionForm(transaction = null, categories = []) {
        const isEdit = !!transaction;
        const today = new Date().toISOString().slice(0, 10);
        
        return `
            <form id="transactionForm">
                <div class="form-group">
                    <label>Tanggal</label>
                    <input type="date" id="transactionDate" class="input" 
                           value="${transaction ? transaction.date : today}" required>
                </div>
                <div class="form-group">
                    <label>Kategori</label>
                    <select id="transactionCategory" class="select" required>
                        <option value="">Pilih kategori</option>
                        ${categories.map(cat => 
                            `<option value="${cat}" ${transaction && transaction.category === cat ? 'selected' : ''}>${cat}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Deskripsi</label>
                    <input type="text" id="transactionDescription" class="input" 
                           value="${transaction ? transaction.description : ''}" 
                           placeholder="Deskripsi transaksi" required>
                </div>
                <div class="form-group">
                    <label>Pemasukan (Rp)</label>
                    <input type="number" id="transactionIncome" class="input" 
                           value="${transaction ? transaction.income : 0}" 
                           min="0" step="1000">
                </div>
                <div class="form-group">
                    <label>Pengeluaran (Rp)</label>
                    <input type="number" id="transactionOutcome" class="input" 
                           value="${transaction ? transaction.outcome : 0}" 
                           min="0" step="1000">
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">
                        ${isEdit ? 'Update' : 'Tambah'} Transaksi
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="selfTracker.closeModal()">
                        Batal
                    </button>
                </div>
                ${transaction ? `<input type="hidden" id="transactionId" value="${transaction.id}">` : ''}
            </form>
        `;
    }

    // Render form for adding/editing business transactions
    renderBusinessTransactionForm(transaction = null, types = []) {
        const isEdit = !!transaction;
        const today = new Date().toISOString().slice(0, 10);
        
        return `
            <form id="businessTransactionForm">
                <div class="form-group">
                    <label>Tanggal</label>
                    <input type="date" id="businessDate" class="input" 
                           value="${transaction ? transaction.date : today}" required>
                </div>
                <div class="form-group">
                    <label>Jenis Bisnis</label>
                    <input type="text" id="businessType" class="input" list="businessTypes"
                           value="${transaction ? transaction.type : ''}" 
                           placeholder="Masukkan jenis bisnis" required>
                    <datalist id="businessTypes">
                        ${types.map(type => `<option value="${type}">`).join('')}
                    </datalist>
                </div>
                <div class="form-group">
                    <label>Pendapatan (Rp)</label>
                    <input type="number" id="businessIncome" class="input" 
                           value="${transaction ? transaction.income : 0}" 
                           min="0" step="1000">
                </div>
                <div class="form-group">
                    <label>Pengeluaran (Rp)</label>
                    <input type="number" id="businessOutcome" class="input" 
                           value="${transaction ? transaction.outcome : 0}" 
                           min="0" step="1000">
                </div>
                <div class="form-group">
                    <label>Catatan</label>
                    <textarea id="businessNote" class="input" rows="3" 
                              placeholder="Catatan tambahan">${transaction ? transaction.note || '' : ''}</textarea>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">
                        ${isEdit ? 'Update' : 'Tambah'} Transaksi
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="selfTracker.closeModal()">
                        Batal
                    </button>
                </div>
                ${transaction ? `<input type="hidden" id="businessTransactionId" value="${transaction.id}">` : ''}
            </form>
        `;
    }
}