/**
 * 主应用逻辑
 */

const App = {
    // 当前表格行数
    rowCount: 0,

    /**
     * 初始化应用
     */
    init() {
        this.initDate();
        this.generateNoteNumber();
        this.loadSettings();
        this.bindEvents();
        this.addTableRow(); // 添加初始行
        this.updateDisplay();
    },

    /**
     * 初始化日期为今天
     */
    initDate() {
        const dateInput = document.getElementById('delivery-date');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;
        }
    },

    /**
     * 生成出库单编号
     */
    generateNoteNumber() {
        const numberEl = document.getElementById('note-number');
        if (numberEl && typeof Storage !== 'undefined') {
            numberEl.textContent = Storage.generateNoteNumber();
        }
    },

    /**
     * 加载设置
     */
    loadSettings() {
        if (typeof Storage === 'undefined') return;

        const settings = Storage.loadSettings();

        const companyNameInput = document.getElementById('company-name');
        const taxRateInput = document.getElementById('tax-rate');
        const docTitleInput = document.getElementById('doc-title');

        if (companyNameInput) companyNameInput.value = settings.companyName || '';
        if (taxRateInput) taxRateInput.value = settings.taxRate || 13;
        if (docTitleInput) docTitleInput.value = settings.docTitle || '出库单';

        // 加载Logo
        if (settings.logo) {
            this.loadLogoFromStorage(settings.logo);
        }
    },

    /**
     * 从存储加载Logo
     * @param {string} logoData Logo数据
     */
    loadLogoFromStorage(logoData) {
        const displayLogo = document.getElementById('display-logo');
        const logoPreview = document.getElementById('logo-preview');
        const btnRemoveLogo = document.getElementById('btn-remove-logo');

        if (displayLogo) {
            displayLogo.src = logoData;
            displayLogo.style.display = 'block';
        }
        if (logoPreview) {
            logoPreview.src = logoData;
            logoPreview.style.display = 'block';
        }
        if (btnRemoveLogo) {
            btnRemoveLogo.style.display = 'inline-block';
        }
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        // 设置面板
        const btnSettings = document.getElementById('btn-settings');
        const btnCloseSettings = document.getElementById('btn-close-settings');
        const settingsPanel = document.getElementById('settings-panel');

        if (btnSettings && settingsPanel) {
            btnSettings.addEventListener('click', () => {
                settingsPanel.style.display = 'block';
            });
        }

        if (btnCloseSettings && settingsPanel) {
            btnCloseSettings.addEventListener('click', () => {
                settingsPanel.style.display = 'none';
            });
        }

        // 保存设置
        const btnSaveSettings = document.getElementById('btn-save-settings');
        if (btnSaveSettings) {
            btnSaveSettings.addEventListener('click', () => this.saveSettings());
        }

        // Logo上传
        const companyLogoInput = document.getElementById('company-logo');
        if (companyLogoInput) {
            companyLogoInput.addEventListener('change', (e) => this.handleLogoUpload(e));
        }

        // 删除Logo
        const btnRemoveLogo = document.getElementById('btn-remove-logo');
        if (btnRemoveLogo) {
            btnRemoveLogo.addEventListener('click', () => this.removeLogo());
        }

        // 添加行
        const btnAddRow = document.getElementById('btn-add-row');
        if (btnAddRow) {
            btnAddRow.addEventListener('click', () => this.addTableRow());
        }

        // 表格事件委托
        const tableBody = document.getElementById('table-body');
        if (tableBody) {
            tableBody.addEventListener('input', (e) => this.handleTableInput(e));
            tableBody.addEventListener('click', (e) => this.handleTableClick(e));
        }

        // 打印
        const btnPrint = document.getElementById('btn-print');
        if (btnPrint) {
            btnPrint.addEventListener('click', () => this.handlePrint());
        }

        // 导出PDF
        const btnExportPDF = document.getElementById('btn-export-pdf');
        if (btnExportPDF) {
            btnExportPDF.addEventListener('click', () => this.handleExportPDF());
        }

        // 下载模板
        const btnDownloadTemplate = document.getElementById('btn-download-template');
        if (btnDownloadTemplate) {
            btnDownloadTemplate.addEventListener('click', () => this.handleDownloadTemplate());
        }

        // 导入模板
        const btnImportTemplate = document.getElementById('btn-import-template');
        const fileImport = document.getElementById('file-import');

        if (btnImportTemplate && fileImport) {
            btnImportTemplate.addEventListener('click', () => fileImport.click());
            fileImport.addEventListener('change', (e) => this.handleImportTemplate(e));
        }

        // 监听设置变化以更新显示
        ['company-name', 'tax-rate', 'doc-title'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', () => this.updateDisplay());
            }
        });

        // 监听表单变化以更新打印预览
        ['customer-name', 'delivery-address', 'delivery-date', 'maker', 'picker', 'reviewer'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', () => this.updatePrintPreview());
            }
        });
    },

    /**
     * 保存设置
     */
    saveSettings() {
        if (typeof Storage === 'undefined') return;

        const companyName = document.getElementById('company-name')?.value || '';
        const taxRate = parseFloat(document.getElementById('tax-rate')?.value || 13);
        const docTitle = document.getElementById('doc-title')?.value || '出库单';

        const logoPreview = document.getElementById('logo-preview');
        const logo = logoPreview && logoPreview.style.display !== 'none' ? logoPreview.src : null;

        const settings = {
            companyName,
            taxRate,
            docTitle,
            logo
        };

        if (Storage.saveSettings(settings)) {
            alert('设置已保存');
            document.getElementById('settings-panel').style.display = 'none';
            this.updateDisplay();
        } else {
            alert('保存失败');
        }
    },

    /**
     * 处理Logo上传
     * @param {Event} e 事件对象
     */
    handleLogoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const logoPreview = document.getElementById('logo-preview');
            const btnRemoveLogo = document.getElementById('btn-remove-logo');

            if (logoPreview) {
                logoPreview.src = event.target.result;
                logoPreview.style.display = 'block';
            }
            if (btnRemoveLogo) {
                btnRemoveLogo.style.display = 'inline-block';
            }

            this.updateDisplay();
        };
        reader.readAsDataURL(file);
    },

    /**
     * 删除Logo
     */
    removeLogo() {
        const companyLogo = document.getElementById('company-logo');
        const logoPreview = document.getElementById('logo-preview');
        const btnRemoveLogo = document.getElementById('btn-remove-logo');
        const displayLogo = document.getElementById('display-logo');

        if (companyLogo) companyLogo.value = '';
        if (logoPreview) {
            logoPreview.src = '';
            logoPreview.style.display = 'none';
        }
        if (btnRemoveLogo) btnRemoveLogo.style.display = 'none';
        if (displayLogo) displayLogo.style.display = 'none';

        this.updateDisplay();
    },

    /**
     * 添加表格行
     * @param {Object} data 行数据
     */
    addTableRow(data = null) {
        this.rowCount++;
        const tableBody = document.getElementById('table-body');
        if (!tableBody) return;

        const row = document.createElement('tr');
        row.dataset.index = this.rowCount;

        row.innerHTML = `
            <td>${this.rowCount}</td>
            <td><input type="text" placeholder="产品名称" value="${data?.name || ''}"></td>
            <td><input type="text" placeholder="规格" value="${data?.spec || ''}"></td>
            <td><input type="text" placeholder="单位" value="${data?.unit || ''}"></td>
            <td><input type="number" placeholder="数量" value="${data?.quantity || ''}" min="0" step="0.01" class="quantity-input"></td>
            <td><input type="number" placeholder="单价" value="${data?.price || ''}" min="0" step="0.01" class="price-input"></td>
            <td class="amount">0.00</td>
            <td>
                <div class="row-actions">
                    <input type="text" placeholder="备注" value="${data?.remark || ''}" style="width: 80px;">
                    <button class="btn btn-delete btn-delete-row no-print" title="删除">×</button>
                </div>
            </td>
        `;

        tableBody.appendChild(row);

        // 如果有数据，计算金额
        if (data && data.quantity && data.price) {
            this.calculateRowAmount(row);
        }
    },

    /**
     * 删除表格行
     * @param {HTMLElement} row 要删除的行
     */
    deleteTableRow(row) {
        const tableBody = document.getElementById('table-body');
        if (tableBody && tableBody.children.length > 1) {
            row.remove();
            this.renumberRows();
            this.calculateTotals();
        } else {
            alert('至少需要保留一行');
        }
    },

    /**
     * 重新编号行
     */
    renumberRows() {
        const rows = document.querySelectorAll('#table-body tr');
        rows.forEach((row, index) => {
            row.cells[0].textContent = index + 1;
            row.dataset.index = index + 1;
        });
        this.rowCount = rows.length;
    },

    /**
     * 处理表格输入
     * @param {Event} e 事件对象
     */
    handleTableInput(e) {
        if (e.target.tagName === 'INPUT') {
            const row = e.target.closest('tr');
            if (row && (e.target.classList.contains('quantity-input') || e.target.classList.contains('price-input'))) {
                this.calculateRowAmount(row);
            }
        }
    },

    /**
     * 处理表格点击
     * @param {Event} e 事件对象
     */
    handleTableClick(e) {
        if (e.target.classList.contains('btn-delete-row')) {
            const row = e.target.closest('tr');
            if (row) {
                this.deleteTableRow(row);
            }
        }
    },

    /**
     * 计算行金额
     * @param {HTMLElement} row 表格行
     */
    calculateRowAmount(row) {
        const quantityInput = row.querySelector('.quantity-input');
        const priceInput = row.querySelector('.price-input');
        const amountCell = row.querySelector('.amount');

        const quantity = parseFloat(quantityInput?.value) || 0;
        const price = parseFloat(priceInput?.value) || 0;
        const amount = quantity * price;

        if (amountCell) {
            amountCell.textContent = amount.toFixed(2);
        }

        this.calculateTotals();
    },

    /**
     * 计算合计
     */
    calculateTotals() {
        const amountCells = document.querySelectorAll('#table-body .amount');
        let total = 0;

        amountCells.forEach(cell => {
            total += parseFloat(cell.textContent) || 0;
        });

        const taxRateInput = document.getElementById('tax-rate');
        const taxRate = parseFloat(taxRateInput?.value || 13);

        const taxAmount = total * (taxRate / 100);
        const totalWithTax = total + taxAmount;

        // 更新显示
        const totalAmountEl = document.getElementById('total-amount');
        const taxAmountEl = document.getElementById('tax-amount');
        const totalWithTaxEl = document.getElementById('total-with-tax');
        const amountInChineseEl = document.getElementById('amount-in-chinese');
        const displayTaxRateEl = document.getElementById('display-tax-rate');

        if (totalAmountEl) totalAmountEl.textContent = `¥${total.toFixed(2)}`;
        if (taxAmountEl) taxAmountEl.textContent = `¥${taxAmount.toFixed(2)}`;
        if (totalWithTaxEl) totalWithTaxEl.textContent = `¥${totalWithTax.toFixed(2)}`;
        if (amountInChineseEl) amountInChineseEl.textContent = this.numberToChinese(totalWithTax);
        if (displayTaxRateEl) displayTaxRateEl.textContent = `${taxRate}%`;
    },

    /**
     * 数字转中文大写
     * @param {number} num 数字
     * @returns {string} 中文大写
     */
    numberToChinese(num) {
        const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
        const units = ['', '拾', '佰', '仟', '万', '拾', '佰', '仟', '亿'];
        const decimalUnits = ['角', '分'];

        if (num === 0) return '零元整';

        const numStr = num.toFixed(2);
        const [integerPart, decimalPart] = numStr.split('.');

        let result = '';

        // 整数部分
        if (integerPart !== '0') {
            const intArr = integerPart.split('').reverse();
            let zeroCount = 0;

            for (let i = 0; i < intArr.length; i++) {
                const digit = parseInt(intArr[i]);
                const unit = units[i];

                if (digit === 0) {
                    zeroCount++;
                    if (unit === '万' || unit === '亿') {
                        result = unit + result;
                        zeroCount = 0;
                    }
                } else {
                    if (zeroCount > 0) {
                        result = digits[0] + result;
                        zeroCount = 0;
                    }
                    result = digits[digit] + unit + result;
                }
            }

            result += '元';
        } else {
            result = '零元';
        }

        // 小数部分
        const jiao = parseInt(decimalPart[0]);
        const fen = parseInt(decimalPart[1]);

        if (jiao === 0 && fen === 0) {
            result += '整';
        } else {
            if (jiao > 0) {
                result += digits[jiao] + '角';
            }
            if (fen > 0) {
                result += digits[fen] + '分';
            }
        }

        return result;
    },

    /**
     * 更新显示
     */
    updateDisplay() {
        const companyName = document.getElementById('company-name')?.value || '';
        const taxRate = document.getElementById('tax-rate')?.value || '13';
        const docTitle = document.getElementById('doc-title')?.value || '出库单';
        const logoPreview = document.getElementById('logo-preview');

        const displayCompany = document.getElementById('display-company');
        const displayTitle = document.getElementById('display-title');
        const displayLogo = document.getElementById('display-logo');
        const displayTaxRate = document.getElementById('display-tax-rate');

        if (displayCompany) displayCompany.textContent = companyName;
        if (displayTitle) displayTitle.textContent = docTitle;
        if (displayTaxRate) displayTaxRate.textContent = `${taxRate}%`;

        if (displayLogo && logoPreview && logoPreview.style.display !== 'none') {
            displayLogo.src = logoPreview.src;
            displayLogo.style.display = 'block';
        }

        this.calculateTotals();
        this.updatePrintPreview();
    },

    /**
     * 更新打印预览
     */
    updatePrintPreview() {
        const customerName = document.getElementById('customer-name')?.value || '';
        const deliveryAddress = document.getElementById('delivery-address')?.value || '';
        const deliveryDate = document.getElementById('delivery-date')?.value || '';
        const maker = document.getElementById('maker')?.value || '';
        const picker = document.getElementById('picker')?.value || '';
        const reviewer = document.getElementById('reviewer')?.value || '';

        const printCustomerName = document.getElementById('print-customer-name');
        const printDeliveryAddress = document.getElementById('print-delivery-address');
        const printDeliveryDate = document.getElementById('print-delivery-date');
        const printMaker = document.getElementById('print-maker');
        const printPicker = document.getElementById('print-picker');
        const printReviewer = document.getElementById('print-reviewer');

        if (printCustomerName) printCustomerName.textContent = customerName;
        if (printDeliveryAddress) printDeliveryAddress.textContent = deliveryAddress;
        if (printDeliveryDate) printDeliveryDate.textContent = deliveryDate;
        if (printMaker) printMaker.textContent = maker;
        if (printPicker) printPicker.textContent = picker;
        if (printReviewer) printReviewer.textContent = reviewer;
    },

    /**
     * 处理打印
     */
    handlePrint() {
        const deliveryNote = document.getElementById('delivery-note');
        if (deliveryNote && typeof PDFExport !== 'undefined') {
            PDFExport.print(deliveryNote);
        }
    },

    /**
     * 处理导出PDF
     */
    handleExportPDF() {
        const deliveryNote = document.getElementById('delivery-note');
        if (deliveryNote && typeof PDFExport !== 'undefined') {
            const noteNumber = document.getElementById('note-number')?.textContent || '';
            PDFExport.exportToPDF(deliveryNote, `出库单_${noteNumber}.pdf`);
        }
    },

    /**
     * 处理下载模板
     */
    handleDownloadTemplate() {
        if (typeof Template !== 'undefined') {
            Template.exportTemplate();
        }
    },

    /**
     * 处理导入模板
     * @param {Event} e 事件对象
     */
    async handleImportTemplate(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (typeof Template !== 'undefined') {
            try {
                const data = await Template.importTemplate(file);
                Template.applyTemplate(data);
                alert('模板导入成功');
            } catch (err) {
                alert(err.message);
            }
        }

        // 清空文件输入以允许再次选择同一文件
        e.target.value = '';
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}
