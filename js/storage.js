/**
 * 数据存储模块
 * 使用 localStorage 保存配置和导出计数
 */

const Storage = {
    // 键名常量
    KEYS: {
        SETTINGS: 'delivery_note_settings',
        EXPORT_COUNT: 'delivery_note_export_count',
        EXPORT_DATE: 'delivery_note_export_date'
    },

    /**
     * 保存设置
     * @param {Object} settings 设置对象
     */
    saveSettings(settings) {
        try {
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (e) {
            console.error('保存设置失败:', e);
            return false;
        }
    },

    /**
     * 读取设置
     * @returns {Object} 设置对象
     */
    loadSettings() {
        try {
            const data = localStorage.getItem(this.KEYS.SETTINGS);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.error('读取设置失败:', e);
        }
        return this.getDefaultSettings();
    },

    /**
     * 获取默认设置
     * @returns {Object} 默认设置
     */
    getDefaultSettings() {
        return {
            companyName: '',
            logo: null,
            taxRate: 13,
            docTitle: '出库单'
        };
    },

    /**
     * 获取今日导出计数
     * @returns {number} 今日导出次数
     */
    getTodayExportCount() {
        try {
            const savedDate = localStorage.getItem(this.KEYS.EXPORT_DATE);
            const today = new Date().toDateString();

            if (savedDate === today) {
                const count = localStorage.getItem(this.KEYS.EXPORT_COUNT);
                return parseInt(count || '0', 10);
            } else {
                // 日期变化，重置计数
                localStorage.setItem(this.KEYS.EXPORT_DATE, today);
                localStorage.setItem(this.KEYS.EXPORT_COUNT, '0');
                return 0;
            }
        } catch (e) {
            console.error('读取导出计数失败:', e);
            return 0;
        }
    },

    /**
     * 增加导出计数
     * @returns {number} 新的计数
     */
    incrementExportCount() {
        try {
            const today = new Date().toDateString();
            const savedDate = localStorage.getItem(this.KEYS.EXPORT_DATE);

            let count = 0;
            if (savedDate === today) {
                count = parseInt(localStorage.getItem(this.KEYS.EXPORT_COUNT) || '0', 10);
            }

            count++;
            localStorage.setItem(this.KEYS.EXPORT_DATE, today);
            localStorage.setItem(this.KEYS.EXPORT_COUNT, count.toString());

            return count;
        } catch (e) {
            console.error('增加导出计数失败:', e);
            return 1;
        }
    },

    /**
     * 生成出库单编号
     * 格式：年月日时分秒 + 3位序号
     * 例如：202601292055001
     * @returns {string} 编号
     */
    generateNoteNumber() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        // 获取今日已导出数量 + 1
        const count = this.getTodayExportCount() + 1;
        const serialNumber = String(count).padStart(3, '0');

        return `${year}${month}${day}${hours}${minutes}${seconds}${serialNumber}`;
    },

    /**
     * 清除所有数据
     */
    clearAll() {
        try {
            localStorage.removeItem(this.KEYS.SETTINGS);
            localStorage.removeItem(this.KEYS.EXPORT_COUNT);
            localStorage.removeItem(this.KEYS.EXPORT_DATE);
            return true;
        } catch (e) {
            console.error('清除数据失败:', e);
            return false;
        }
    }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
}
