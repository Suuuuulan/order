/**
 * 模板管理模块
 * 支持模板的导入和导出
 */

const Template = {
    /**
     * 收集当前表单数据
     * @returns {Object} 表单数据对象
     */
    collectFormData() {
        const items = [];
        const rows = document.querySelectorAll('#table-body tr');

        rows.forEach((row, index) => {
            const inputs = row.querySelectorAll('input');
            items.push({
                seq: index + 1,
                name: inputs[0]?.value || '',
                spec: inputs[1]?.value || '',
                unit: inputs[2]?.value || '',
                quantity: inputs[3]?.value || '',
                price: inputs[4]?.value || '',
                remark: inputs[5]?.value || ''
            });
        });

        return {
            version: '1.0',
            exportTime: new Date().toISOString(),
            settings: {
                companyName: document.getElementById('company-name')?.value || '',
                taxRate: document.getElementById('tax-rate')?.value || '13',
                docTitle: document.getElementById('doc-title')?.value || '出库单'
            },
            formData: {
                customerName: document.getElementById('customer-name')?.value || '',
                deliveryAddress: document.getElementById('delivery-address')?.value || '',
                deliveryDate: document.getElementById('delivery-date')?.value || '',
                maker: document.getElementById('maker')?.value || '',
                picker: document.getElementById('picker')?.value || '',
                reviewer: document.getElementById('reviewer')?.value || ''
            },
            items: items
        };
    },

    /**
     * 下载模板文件
     * @param {Object} data 要下载的数据
     * @param {string} filename 文件名
     */
    downloadTemplate(data, filename) {
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `出库单模板_${new Date().toLocaleDateString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * 导出当前为模板
     */
    exportTemplate() {
        const data = this.collectFormData();
        const dateStr = new Date().toLocaleDateString().replace(/\//g, '-');
        this.downloadTemplate(data, `出库单模板_${dateStr}.json`);
    },

    /**
     * 导入模板文件
     * @param {File} file 要导入的文件
     * @returns {Promise<Object>} 导入的数据
     */
    importTemplate(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('请选择文件'));
                return;
            }

            if (!file.name.endsWith('.json')) {
                reject(new Error('请选择 JSON 格式的模板文件'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);

                    // 验证数据格式
                    if (!this.validateTemplate(data)) {
                        reject(new Error('模板文件格式不正确'));
                        return;
                    }

                    resolve(data);
                } catch (err) {
                    reject(new Error('解析模板文件失败：' + err.message));
                }
            };

            reader.onerror = () => {
                reject(new Error('读取文件失败'));
            };

            reader.readAsText(file);
        });
    },

    /**
     * 验证模板数据格式
     * @param {Object} data 要验证的数据
     * @returns {boolean} 是否有效
     */
    validateTemplate(data) {
        // 基础结构验证
        if (!data || typeof data !== 'object') {
            return false;
        }

        // 检查必需的字段
        if (!data.settings || !data.formData || !Array.isArray(data.items)) {
            return false;
        }

        return true;
    },

    /**
     * 应用模板数据到表单
     * @param {Object} data 模板数据
     */
    applyTemplate(data) {
        // 应用设置
        if (data.settings) {
            const companyNameInput = document.getElementById('company-name');
            const taxRateInput = document.getElementById('tax-rate');
            const docTitleInput = document.getElementById('doc-title');

            if (companyNameInput && data.settings.companyName) {
                companyNameInput.value = data.settings.companyName;
            }
            if (taxRateInput && data.settings.taxRate) {
                taxRateInput.value = data.settings.taxRate;
            }
            if (docTitleInput && data.settings.docTitle) {
                docTitleInput.value = data.settings.docTitle;
            }

            // 保存设置
            if (typeof Storage !== 'undefined') {
                Storage.saveSettings({
                    companyName: data.settings.companyName || '',
                    taxRate: data.settings.taxRate || 13,
                    docTitle: data.settings.docTitle || '出库单',
                    logo: null
                });
            }
        }

        // 应用表单数据
        if (data.formData) {
            const customerNameInput = document.getElementById('customer-name');
            const deliveryAddressInput = document.getElementById('delivery-address');
            const deliveryDateInput = document.getElementById('delivery-date');
            const makerInput = document.getElementById('maker');
            const pickerInput = document.getElementById('picker');
            const reviewerInput = document.getElementById('reviewer');

            if (customerNameInput) customerNameInput.value = data.formData.customerName || '';
            if (deliveryAddressInput) deliveryAddressInput.value = data.formData.deliveryAddress || '';
            if (deliveryDateInput) deliveryDateInput.value = data.formData.deliveryDate || '';
            if (makerInput) makerInput.value = data.formData.maker || '';
            if (pickerInput) pickerInput.value = data.formData.picker || '';
            if (reviewerInput) reviewerInput.value = data.formData.reviewer || '';
        }

        // 应用表格数据
        if (data.items && Array.isArray(data.items)) {
            const tableBody = document.getElementById('table-body');
            if (tableBody) {
                tableBody.innerHTML = '';

                data.items.forEach(item => {
                    if (typeof App !== 'undefined' && App.addTableRow) {
                        App.addTableRow(item);
                    }
                });

                // 如果没有数据，添加一行空的
                if (data.items.length === 0 && typeof App !== 'undefined' && App.addTableRow) {
                    App.addTableRow();
                }
            }
        }

        // 更新显示
        if (typeof App !== 'undefined' && App.updateDisplay) {
            App.updateDisplay();
            App.calculateTotals();
        }
    }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Template;
}
