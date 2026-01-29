/**
 * PDF导出模块
 * 支持导出为标准A4尺寸，300ppi
 */

const PDFExport = {
    // A4 纸张尺寸 (300ppi)
    // A4: 210mm x 297mm
    // 300ppi: 2480 x 3508 像素
    A4_WIDTH_PX: 2480,
    A4_HEIGHT_PX: 3508,
    A4_WIDTH_MM: 210,
    A4_HEIGHT_MM: 297,

    /**
     * 将 HTML 元素转换为 PDF
     * @param {HTMLElement} element 要转换的元素
     * @param {string} filename 文件名
     * @returns {Promise<boolean>} 是否成功
     */
    async exportToPDF(element, filename) {
        try {
            // 检查依赖库
            if (typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
                throw new Error('缺少必要的库：html2canvas 或 jspdf');
            }

            // 显示加载提示
            this.showLoading(true);

            // 增加导出计数
            if (typeof Storage !== 'undefined') {
                Storage.incrementExportCount();
            }

            // 克隆元素以避免影响原页面
            const clone = element.cloneNode(true);
            clone.style.position = 'fixed';
            clone.style.left = '-9999px';
            clone.style.top = '0';
            clone.style.width = '190mm';
            clone.style.background = '#fff';
            document.body.appendChild(clone);

            // 准备打印版本
            this.preparePrintVersion(clone);

            // 使用 html2canvas 转换 - 使用更高的scale以获得更清晰的图像
            const canvas = await html2canvas(clone, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false,
                width: clone.offsetWidth,
                height: clone.offsetHeight
            });

            // 移除克隆元素
            document.body.removeChild(clone);

            // 创建 PDF
            const { jsPDF } = jspdf;
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true
            });

            // 计算缩放以适应 A4 - 保持原始宽高比
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const margin = 10; // 边距 10mm

            // 计算可用区域
            const availableWidth = pdfWidth - (margin * 2);
            const availableHeight = pdfHeight - (margin * 2);

            // 计算缩放比例以保持宽高比
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);

            const finalWidth = imgWidth * ratio;
            const finalHeight = imgHeight * ratio;

            // 居中放置
            const x = (pdfWidth - finalWidth) / 2;
            const y = margin;

            const imgData = canvas.toDataURL('image/png', 1.0);

            // 添加图像到 PDF
            pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);

            // 保存 PDF
            pdf.save(filename || `出库单_${new Date().toLocaleDateString()}.pdf`);

            this.showLoading(false);
            return true;

        } catch (error) {
            this.showLoading(false);
            console.error('PDF导出失败:', error);
            alert('PDF导出失败：' + error.message);
            return false;
        }
    },

    /**
     * 准备打印版本
     * @param {HTMLElement} element 要准备的元素
     */
    preparePrintVersion(element) {
        // 移除所有 no-print 元素
        const noPrintElements = element.querySelectorAll('.no-print');
        noPrintElements.forEach(el => el.remove());

        // 显示 print-only 元素
        const printOnlyElements = element.querySelectorAll('.print-only');
        printOnlyElements.forEach(el => {
            el.style.display = 'block';
        });

        // 同步表单值到打印显示
        const customerName = document.getElementById('customer-name')?.value || '';
        const deliveryAddress = document.getElementById('delivery-address')?.value || '';
        const deliveryDate = document.getElementById('delivery-date')?.value || '';
        const maker = document.getElementById('maker')?.value || '';
        const picker = document.getElementById('picker')?.value || '';
        const reviewer = document.getElementById('reviewer')?.value || '';

        const printCustomerName = element.querySelector('#print-customer-name');
        const printDeliveryAddress = element.querySelector('#print-delivery-address');
        const printDeliveryDate = element.querySelector('#print-delivery-date');
        const printMaker = element.querySelector('#print-maker');
        const printPicker = element.querySelector('#print-picker');
        const printReviewer = element.querySelector('#print-reviewer');

        if (printCustomerName) printCustomerName.textContent = customerName;
        if (printDeliveryAddress) printDeliveryAddress.textContent = deliveryAddress;
        if (printDeliveryDate) printDeliveryDate.textContent = deliveryDate;
        if (printMaker) printMaker.textContent = maker;
        if (printPicker) printPicker.textContent = picker;
        if (printReviewer) printReviewer.textContent = reviewer;

        // 将 input 值转换为文本显示
        const inputs = element.querySelectorAll('input');
        inputs.forEach(input => {
            const span = document.createElement('span');
            span.textContent = input.value;
            span.style.display = 'inline-block';
            span.style.minHeight = '20px';
            span.style.width = '100%';
            span.style.textAlign = input.style.textAlign || 'center';
            input.parentNode.replaceChild(span, input);
        });

        // 设置样式以确保正确打印
        element.style.padding = '20px';
        element.style.fontFamily = 'SimHei, Microsoft YaHei, sans-serif';
    },

    /**
     * 显示/隐藏加载状态
     * @param {boolean} show 是否显示
     */
    showLoading(show) {
        let loadingEl = document.getElementById('pdf-loading');

        if (show) {
            if (!loadingEl) {
                loadingEl = document.createElement('div');
                loadingEl.id = 'pdf-loading';
                loadingEl.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                `;
                loadingEl.innerHTML = `
                    <div style="
                        background: #fff;
                        padding: 30px 50px;
                        border-radius: 8px;
                        text-align: center;
                    ">
                        <div style="
                            width: 40px;
                            height: 40px;
                            border: 4px solid #f3f3f3;
                            border-top: 4px solid #1890ff;
                            border-radius: 50%;
                            animation: spin 1s linear infinite;
                            margin: 0 auto 15px;
                        "></div>
                        <p style="color: #333; font-size: 14px;">正在生成PDF...</p>
                    </div>
                    <style>
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    </style>
                `;
                document.body.appendChild(loadingEl);
            }
            loadingEl.style.display = 'flex';
        } else if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    },

    /**
     * 打印功能
     * @param {HTMLElement} element 要打印的元素
     */
    print(element) {
        // 增加导出计数
        if (typeof Storage !== 'undefined') {
            Storage.incrementExportCount();
        }

        // 创建打印窗口
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('请允许弹出窗口以进行打印');
            return;
        }

        // 克隆元素
        const clone = element.cloneNode(true);
        this.preparePrintVersion(clone);

        // 写入打印窗口
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>出库单</title>
                <style>
                    @page {
                        size: A4;
                        margin: 10mm;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: SimHei, Microsoft YaHei, sans-serif;
                    }
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    .delivery-note {
                        width: 190mm;
                        margin: 0 auto;
                        padding: 10mm;
                    }
                    .note-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 20px;
                        padding-bottom: 15px;
                        border-bottom: 2px solid #333;
                    }
                    .title-section {
                        flex: 1;
                        text-align: center;
                    }
                    .title-section h2 {
                        font-size: 28px;
                        font-weight: bold;
                        letter-spacing: 8px;
                    }
                    .company-name {
                        font-size: 12px;
                        color: #666;
                        margin-top: 5px;
                    }
                    .number-section {
                        text-align: right;
                        font-size: 12px;
                    }
                    .info-row {
                        display: flex;
                        gap: 30px;
                        margin-bottom: 8px;
                        font-size: 13px;
                    }
                    .info-label {
                        color: #666;
                    }
                    .info-value {
                        color: #333;
                        border-bottom: 1px solid #999;
                        min-width: 100px;
                        padding: 0 5px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 15px 0;
                        font-size: 12px;
                    }
                    th, td {
                        border: 1px solid #333;
                        padding: 8px 6px;
                        text-align: center;
                    }
                    th {
                        background: #f5f5f5;
                        font-weight: bold;
                    }
                    .summary-section {
                        margin: 15px 0;
                        padding: 10px;
                        background: #fafafa;
                        border: 1px solid #e8e8e8;
                    }
                    .summary-row {
                        display: flex;
                        justify-content: flex-end;
                        align-items: center;
                        gap: 10px;
                        margin-bottom: 5px;
                        font-size: 12px;
                    }
                    .summary-row.total {
                        font-size: 14px;
                        font-weight: bold;
                        border-top: 1px solid #d9d9d9;
                        padding-top: 5px;
                        margin-top: 5px;
                    }
                    .summary-value {
                        min-width: 100px;
                        text-align: right;
                    }
                    .signature-section {
                        margin-top: 30px;
                    }
                    .signature-row {
                        display: flex;
                        gap: 40px;
                        margin-bottom: 20px;
                    }
                    .signature-item {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        font-size: 13px;
                    }
                    .signature-item.full-width {
                        flex: 1;
                    }
                    .signature-label {
                        color: #666;
                        white-space: nowrap;
                    }
                    .signature-value {
                        border-bottom: 1px solid #333;
                        min-width: 80px;
                        padding: 0 8px;
                    }
                    .signature-line {
                        flex: 1;
                        border-bottom: 1px solid #333;
                        height: 25px;
                    }
                    .no-print, .btn-delete-row, .row-actions .btn-delete {
                        display: none !important;
                    }
                    .print-only {
                        display: block !important;
                    }
                    .row-actions {
                        display: block !important;
                    }
                    .row-actions input {
                        width: 100% !important;
                    }
                </style>
            </head>
            <body>
                ${clone.outerHTML}
            </body>
            </html>
        `);

        printWindow.document.close();

        // 等待资源加载完成后打印
        printWindow.onload = function() {
            setTimeout(() => {
                printWindow.print();
                // printWindow.close();
            }, 500);
        };
    }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PDFExport;
}
