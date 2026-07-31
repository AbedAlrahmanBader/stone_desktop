import { Fragment, useEffect, useState } from "react";
import api from "../api/axios";
import "../styles/inventory.css";
import { QRCodeSVG } from "qrcode.react";
import JsBarcode from "jsbarcode";

interface StoneItem {
    _id: string;
    stoneType: string;
    length: number;
    width: number;
    thickness: number;
    linearMeter: number;
    area: number;
    pieces: number;
}

interface Stone {
    _id: string;
    barcode: string;
    items: StoneItem[];
    totalLinearMeter: number;
    totalArea: number;
    status: string;
}

interface StoneEditForm {
    barcode: string;
    status: string;
}

interface ItemEditForm {
    stoneType: string;
    length: string;
    width: string;
    thickness: string;
    pieces: string;
    linearMeter: string;
}

const emptyStoneForm: StoneEditForm = {
    barcode: "",
    status: "In Stock",
};

const emptyItemForm: ItemEditForm = {
    stoneType: "",
    length: "",
    width: "",
    thickness: "",
    pieces: "",
    linearMeter: "",
};

function Inventory() {
    const [stones, setStones] = useState<Stone[]>([]);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("All");

    // تعديل بيانات المشتاح العامة (باركود / حالة)
    const [editingStoneId, setEditingStoneId] = useState<string | null>(null);
    const [editStoneForm, setEditStoneForm] = useState<StoneEditForm>(emptyStoneForm);

    // تعديل نوع حجر واحد جوا مشتاح
    const [editingItem, setEditingItem] = useState<{ stoneId: string; itemId: string } | null>(null);
    const [editItemForm, setEditItemForm] = useState<ItemEditForm>(emptyItemForm);

    // إضافة نوع حجر جديد لمشتاح موجود
    const [addingItemFor, setAddingItemFor] = useState<string | null>(null);
    const [newItemForm, setNewItemForm] = useState<ItemEditForm>(emptyItemForm);

    const loadStones = async () => {
        try {
            const res = await api.get("/stones");
            setStones(res.data);
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        loadStones();
    }, []);

// Inventory.tsx - تعديل دالة الطباعة
const printQRAndBarcode = (barcode: string) => {
    const printWindow = window.open("", "_blank", "width=800,height=900");
    
    if (!printWindow) {
        alert("الرجاء السماح بالنوافذ المنبثقة (Popups) لهذا الموقع للسماح بالطباعة");
        return;
    }

    const qrElement = document.getElementById(`qr-${barcode}`);
    if (!qrElement) {
        alert("لم يتم العثور على QR Code");
        return;
    }

    const svgHTML = qrElement.innerHTML;

    // إنشاء Barcode
    const barcodeDiv = document.createElement('div');
    barcodeDiv.id = `barcode-container-${barcode}`;
    document.body.appendChild(barcodeDiv);
    
    try {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("id", `barcode-${barcode}`);
        document.body.appendChild(svg);
        
        JsBarcode(`#barcode-${barcode}`, barcode, {
            format: "CODE128",
            width: 2.5,
            height: 100,
            displayValue: true,
            fontSize: 22,
            font: "monospace",
            textAlign: "center",
            textPosition: "bottom",
            textMargin: 15,
            margin: 15,
            background: "#ffffff",
            lineColor: "#000000",
        });
        
        const barcodeElement = document.getElementById(`barcode-${barcode}`);
        const barcodeHTML = barcodeElement?.outerHTML || '';
        
        document.body.removeChild(svg);
        document.body.removeChild(barcodeDiv);

        // إنشاء صفحة الطباعة بتصميم احترافي
        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl">
                <head>
                    <title>${barcode}</title>
                    <style>
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }
                        
                        @page {
                            size: A4;
                            margin: 15mm;
                        }
                        
                        body {
                            font-family: 'Arial', 'Segoe UI', sans-serif;
                            background: #f5f5f5;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                            padding: 20px;
                        }
                        
                        .certificate-wrapper {
                            background: white;
                            width: 210mm;
                            max-width: 100%;
                            min-height: 297mm;
                            padding: 15mm 12mm;
                            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                            border-radius: 8px;
                            position: relative;
                        }
                        
                        /* إطار ذهبي */
                        .certificate-wrapper::before {
                            content: '';
                            position: absolute;
                            top: 8mm;
                            left: 8mm;
                            right: 8mm;
                            bottom: 8mm;
                            border: 3px solid #c9a84c;
                            border-radius: 4px;
                            pointer-events: none;
                        }
                        
                        /* خلفية مزخرفة */
                        .certificate-wrapper::after {
                            content: '';
                            position: absolute;
                            top: 10mm;
                            left: 10mm;
                            right: 10mm;
                            bottom: 10mm;
                            border: 1px solid #e8d5b5;
                            border-radius: 2px;
                            pointer-events: none;
                        }
                        
                        .header {
                            text-align: center;
                            margin-bottom: 10mm;
                            border-bottom: 3px double #c9a84c;
                            padding-bottom: 8mm;
                        }
                        
                        .company-name {
                            font-size: 32px;
                            font-weight: bold;
                            color: #1a1a1a;
                            letter-spacing: 3px;
                            text-transform: uppercase;
                            font-family: 'Times New Roman', serif;
                            margin-bottom: 5px;
                        }
                        
                        .company-name span {
                            color: #c9a84c;
                        }
                        
                        .company-info {
                            font-size: 14px;
                            color: #555;
                            margin-top: 5px;
                            line-height: 1.6;
                        }
                        
                        .company-info a {
                            color: #c9a84c;
                            text-decoration: none;
                        }
                        
                        .title-section {
                            text-align: center;
                            margin: 8mm 0 10mm 0;
                        }
                        
                        .title-section h2 {
                            font-size: 26px;
                            color: #1a1a1a;
                            font-weight: bold;
                            letter-spacing: 2px;
                            position: relative;
                            display: inline-block;
                            padding: 0 20px;
                        }
                        
                        .title-section h2::before,
                        .title-section h2::after {
                            content: '';
                            position: absolute;
                            top: 50%;
                            width: 40px;
                            height: 2px;
                            background: #c9a84c;
                        }
                        
                        .title-section h2::before {
                            right: -50px;
                        }
                        
                        .title-section h2::after {
                            left: -50px;
                        }
                        
                        .content {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            padding: 5mm 0;
                        }
                        
                        .qr-container {
                            background: white;
                            padding: 15px;
                            border-radius: 12px;
                            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                            margin-bottom: 10mm;
                            border: 2px solid #f0ebe0;
                            display: inline-block;
                        }
                        
                        .qr-container svg {
                            width: 200px;
                            height: 200px;
                            display: block;
                            margin: 0 auto;
                        }
                        
                        .qr-label {
                            text-align: center;
                            font-size: 12px;
                            color: #888;
                            margin-top: 5px;
                            font-weight: bold;
                            letter-spacing: 2px;
                        }
                        
                        .divider {
                            width: 60%;
                            height: 2px;
                            background: linear-gradient(to right, transparent, #c9a84c, transparent);
                            margin: 8mm auto;
                            position: relative;
                        }
                        
                        .divider::after {
                            content: '✦';
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            background: white;
                            padding: 0 15px;
                            color: #c9a84c;
                            font-size: 18px;
                        }
                        
                        .barcode-container {
                            background: white;
                            padding: 15px 20px;
                            border-radius: 8px;
                            border: 2px solid #f0ebe0;
                            margin: 5mm 0 8mm 0;
                            width: 100%;
                            display: flex;
                            justify-content: center;
                        }
                        
                        .barcode-container svg {
                            max-width: 350px;
                            width: 100%;
                            height: auto;
                        }
                        
                        .product-id {
                            text-align: center;
                            font-size: 18px;
                            font-weight: bold;
                            color: #1a1a1a;
                            letter-spacing: 3px;
                            font-family: 'Courier New', monospace;
                            background: #f8f6f1;
                            padding: 8px 25px;
                            border-radius: 25px;
                            display: inline-block;
                            margin: 5mm 0;
                            border: 1px dashed #c9a84c;
                        }
                        
                        .product-id-label {
                            font-size: 12px;
                            color: #888;
                            font-weight: normal;
                            letter-spacing: 1px;
                            margin-left: 8px;
                        }
                        
                        .footer {
                            text-align: center;
                            margin-top: 10mm;
                            padding-top: 8mm;
                            border-top: 2px solid #f0ebe0;
                            font-size: 13px;
                            color: #777;
                        }
                        
                        .footer .thanks {
                            font-size: 16px;
                            color: #c9a84c;
                            font-weight: bold;
                            margin-bottom: 3px;
                        }
                        
                        .stone-details-grid {
                            display: grid;
                            grid-template-columns: 1fr 1fr 1fr;
                            gap: 10px;
                            margin: 5mm 0;
                            width: 100%;
                            max-width: 400px;
                            background: #faf8f5;
                            padding: 10px;
                            border-radius: 8px;
                        }
                        
                        .stone-detail-item {
                            text-align: center;
                            padding: 5px;
                            border-left: 1px solid #f0ebe0;
                        }
                        
                        .stone-detail-item:last-child {
                            border-left: none;
                        }
                        
                        .stone-detail-item .label {
                            font-size: 10px;
                            color: #999;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                        }
                        
                        .stone-detail-item .value {
                            font-size: 16px;
                            font-weight: bold;
                            color: #1a1a1a;
                            margin-top: 2px;
                        }
                        
                        .barcode-text {
                            font-size: 20px;
                            font-weight: bold;
                            color: #1a1a1a;
                            letter-spacing: 3px;
                            font-family: 'Courier New', monospace;
                            margin: 3mm 0;
                            padding: 5px 20px;
                            background: #f8f6f1;
                            border-radius: 4px;
                            display: inline-block;
                            border: 1px solid #e8d5b5;
                        }
                        
                        .print-date {
                            font-size: 11px;
                            color: #aaa;
                            margin-top: 5mm;
                        }
                        
                        @media print {
                            body {
                                background: white;
                                padding: 0;
                            }
                            
                            .certificate-wrapper {
                                box-shadow: none;
                                border-radius: 0;
                                padding: 12mm 10mm;
                                width: 100%;
                                min-height: 100vh;
                            }
                            
                            .certificate-wrapper::before,
                            .certificate-wrapper::after {
                                display: none;
                            }
                            
                            .no-print {
                                display: none !important;
                            }
                            
                            .qr-container {
                                box-shadow: none;
                                border: 1px solid #ddd;
                            }
                            
                            .barcode-container {
                                border: 1px solid #ddd;
                            }
                        }
                        
                        @media (max-width: 600px) {
                            .certificate-wrapper {
                                padding: 10mm 8mm;
                            }
                            
                            .company-name {
                                font-size: 24px;
                            }
                            
                            .qr-container svg {
                                width: 150px;
                                height: 150px;
                            }
                            
                            .stone-details-grid {
                                grid-template-columns: 1fr 1fr;
                            }
                            
                            .title-section h2 {
                                font-size: 20px;
                            }
                            
                            .title-section h2::before,
                            .title-section h2::after {
                                width: 20px;
                            }
                            
                            .title-section h2::before {
                                right: -30px;
                            }
                            
                            .title-section h2::after {
                                left: -30px;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="certificate-wrapper">
                        <!-- Header -->
                        <div class="header">
                            <div class="company-name">
                                <span>✦</span> ALFAWAGHRA <span>✦</span>
                            </div>
                            <div class="company-info">
                                Bethlehem-Palestine | 📱 050-5574747<br>
                                📧 al-fawaghra@hotmail.com | 🌐 www.alfawaghra.com
                            </div>
                        </div>
                        
                        <!-- Title -->
                        <div class="title-section">
                            <h2>بطاقة المنتج</h2>
                            <p style="color: #888; font-size: 14px; margin-top: 5px;">Product Identification Card</p>
                        </div>
                        
                        <!-- Content -->
                        <div class="content">
                            <!-- QR Code -->
                            <div class="qr-container">
                                ${svgHTML}
                                <div class="qr-label">🔲 QR Code</div>
                            </div>
                            
                            <div class="divider"></div>
                            
                            <!-- Barcode -->
                            <div class="barcode-container">
                                ${barcodeHTML}
                            </div>
                            
                            <!-- Product ID -->
                            <div class="product-id">
                                <span class="product-id-label">📦 رقم المنتج</span>
                                ${barcode}
                            </div>
                            
                            <!-- Barcode Text -->
                            <div class="barcode-text">
                                ${barcode}
                            </div>
                        </div>
                        
                        <!-- Footer -->
                        <div class="footer">
                            <div class="thanks">✦ شكراً لثقتكم بنا ✦</div>
                            <div style="margin-top: 3px; font-size: 12px; color: #999;">
                                جميع الحقوق محفوظة © ${new Date().getFullYear()} - شركة الفواغرة للحجر والرخام
                            </div>
                            <div class="print-date">
                                تاريخ الطباعة: ${new Date().toLocaleString('ar-EG', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </div>
                        </div>
                    </div>
                </body>
            </html>
        `);
    } catch (error) {
        console.error("Error generating barcode:", error);
        alert("حدث خطأ أثناء إنشاء الباركود");
        printWindow.close();
        return;
    }

    printWindow.document.close();

    printWindow.onload = () => {
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 800);
    };
};


    // ------- تعديل بيانات المشتاح العامة (باركود / حالة) -------
    const startEditStone = (stone: Stone) => {
        setEditingStoneId(stone._id);
        setEditStoneForm({
            barcode: stone.barcode,
            status: stone.status,
        });
    };

    const cancelEditStone = () => {
        setEditingStoneId(null);
        setEditStoneForm(emptyStoneForm);
    };

    const saveEditStone = async (id: string) => {
        try {
            await api.put(`/stones/${id}`, {
                barcode: editStoneForm.barcode,
                status: editStoneForm.status,
            });
            cancelEditStone();
            await loadStones();
        } catch (error: any) {
            console.log(error);
            alert(
                error?.response?.data?.message ||
                "حدث خطأ أثناء تعديل المشتاح"
            );
        }
    };

    // حذف مشتاح كامل بكل أنواعه
    const handleDeleteStone = async (id: string) => {
        const confirmed = window.confirm(
            "متأكد إنك بدك تحذف هذا المشتاح بكل أنواع الحجر يلي فيه؟"
        );
        if (!confirmed) return;
        try {
            await api.delete(`/stones/${id}`);
            await loadStones();
        } catch (error: any) {
            console.log(error);
            alert(
                error?.response?.data?.message ||
                "حدث خطأ أثناء الحذف"
            );
        }
    };

    // ------- تعديل نوع حجر واحد -------
    const startEditItem = (stoneId: string, item: StoneItem) => {
        setEditingItem({ stoneId, itemId: item._id });
        setEditItemForm({
            stoneType: item.stoneType,
            length: String(item.length ?? ""),
            width: String(item.width ?? ""),
            thickness: String(item.thickness ?? ""),
            pieces: String(item.pieces ?? ""),
            linearMeter: String(item.linearMeter ?? ""),
        });
    };

    const cancelEditItem = () => {
        setEditingItem(null);
        setEditItemForm(emptyItemForm);
    };

    const saveEditItem = async () => {
        if (!editingItem) return;
        try {
            await api.put(
                `/stones/${editingItem.stoneId}/items/${editingItem.itemId}`,
                {
                    stoneType: editItemForm.stoneType,
                    length: Number(editItemForm.length) || 0,
                    width: Number(editItemForm.width) || 0,
                    thickness: Number(editItemForm.thickness) || 0,
                    pieces: Number(editItemForm.pieces) || 1,
                    linearMeter:
                        editItemForm.linearMeter !== ""
                            ? Number(editItemForm.linearMeter)
                            : undefined,
                }
            );
            cancelEditItem();
            await loadStones();
        } catch (error: any) {
            console.log(error);
            alert(
                error?.response?.data?.message ||
                "حدث خطأ أثناء تعديل نوع الحجر"
            );
        }
    };

    // حذف نوع حجر واحد فقط من المشتاح
    const handleDeleteItem = async (stoneId: string, itemId: string) => {
        const confirmed = window.confirm(
            "متأكد إنك بدك تحذف هذا النوع من المشتاح؟"
        );
        if (!confirmed) return;
        try {
            await api.delete(`/stones/${stoneId}/items/${itemId}`);
            await loadStones();
        } catch (error: any) {
            console.log(error);
            alert(
                error?.response?.data?.message ||
                "حدث خطأ أثناء حذف النوع"
            );
        }
    };

    // ------- إضافة نوع حجر جديد لمشتاح موجود -------
    const startAddItem = (stoneId: string) => {
        setAddingItemFor(stoneId);
        setNewItemForm(emptyItemForm);
    };

    const cancelAddItem = () => {
        setAddingItemFor(null);
        setNewItemForm(emptyItemForm);
    };

    const saveAddItem = async (stoneId: string) => {
        if (!newItemForm.stoneType || !newItemForm.width) {
            alert("الرجاء تعبئة نوع الحجر والعرض");
            return;
        }

        const lengthIsZero = (Number(newItemForm.length) || 0) === 0;
        if (lengthIsZero && (Number(newItemForm.linearMeter) || 0) === 0) {
            alert("الطول = 0، الرجاء إدخال المتر طول يدويًا");
            return;
        }

        try {
            await api.post(`/stones/${stoneId}/items`, {
                stoneType: newItemForm.stoneType,
                length: Number(newItemForm.length) || 0,
                width: Number(newItemForm.width) || 0,
                thickness: Number(newItemForm.thickness) || 0,
                pieces: Number(newItemForm.pieces) || 1,
                linearMeter:
                    newItemForm.linearMeter !== ""
                        ? Number(newItemForm.linearMeter)
                        : undefined,
            });
            cancelAddItem();
            await loadStones();
        } catch (error: any) {
            console.log(error);
            alert(
                error?.response?.data?.message ||
                "حدث خطأ أثناء إضافة النوع"
            );
        }
    };

    const filteredStones = stones.filter((stone) => {
        const matchSearch = stone.barcode
            .toLowerCase()
            .includes(search.toLowerCase());
        const matchStatus = status === "All" || stone.status === status;
        return matchSearch && matchStatus;
    });

    const newItemLengthIsZero = (Number(newItemForm.length) || 0) === 0;
    const editItemLengthIsZero = (Number(editItemForm.length) || 0) === 0;

    return (
        <div className="inventory">
            <h1>📦 المخزون</h1>

            <div className="inventory-tools">
                <input
                    placeholder="بحث بالباركود..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                >
                    <option value="All">الكل</option>
                    <option value="In Stock">موجود</option>
                    <option value="Shipped">مشحون</option>
                </select>
            </div>

            <table className="inventory-table">
                <thead>
                    <tr>
                        <th>QR / باركود</th>
                        <th>نوع الحجر</th>
                        <th>الطول (سم)</th>
                        <th>العرض (سم)</th>
                        <th>السماكة</th>
                        <th>متر طول</th>
                        <th>متر مربع</th>
                        <th>قطعة</th>
                        <th>إجراءات</th>
                    </tr>
                </thead>

                <tbody>
                    {filteredStones.map((stone) => {
                        const isEditingStone = editingStoneId === stone._id;

                        return (
                            <Fragment key={stone._id}>
                                {/* صف رأس المشتاح: باركود + حالة + مجاميع + إجراءات عامة */}
                                <tr className="stone-header-row">
                                    <td colSpan={9}>
                                        <div className="stone-header-content">
                                            <div className="stone-header-info">
                                                {isEditingStone ? (
                                                    <>
                                                        <input
                                                            className="barcode-edit-input"
                                                            value={editStoneForm.barcode}
                                                            onChange={(e) =>
                                                                setEditStoneForm((prev) => ({
                                                                    ...prev,
                                                                    barcode: e.target.value,
                                                                }))
                                                            }
                                                        />
                                                        <select
                                                            value={editStoneForm.status}
                                                            onChange={(e) =>
                                                                setEditStoneForm((prev) => ({
                                                                    ...prev,
                                                                    status: e.target.value,
                                                                }))
                                                            }
                                                        >
                                                            <option value="In Stock">موجود</option>
                                                            <option value="Shipped">مشحون</option>
                                                        </select>
                                                    </>
                                                ) : (
                                                    <>
                                                        <strong>{stone.barcode}</strong>
                                                        <span
                                                            className={
                                                                stone.status === "In Stock"
                                                                    ? "available"
                                                                    : "shipped"
                                                            }
                                                        >
                                                            {stone.status === "In Stock" ? "متوفر" : "مشحون"}
                                                        </span>
                                                    </>
                                                )}
                                                <span className="stone-header-totals">
                                                    إجمالي: {stone.totalLinearMeter?.toFixed(2)} م.ط ،{" "}
                                                    {stone.totalArea?.toFixed(2)} م²
                                                </span>
                                            </div>

                                            <div className="stone-header-actions">
                                                {isEditingStone ? (
                                                    <>
                                                        <button onClick={() => saveEditStone(stone._id)}>
                                                            ✅ حفظ
                                                        </button>
                                                        <button onClick={cancelEditStone}>
                                                            ❌ إلغاء
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => startEditStone(stone)}>
                                                            ✏️ تعديل الباركود/الحالة
                                                        </button>
                                                        <button onClick={() => startAddItem(stone._id)}>
                                                            ➕ إضافة نوع
                                                        </button>
                                                        <button onClick={() => handleDeleteStone(stone._id)}>
                                                            🗑 حذف المشتاح
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>

                                {/* صفوف أنواع الحجر جوا المشتاح */}
                                {stone.items.map((item) => {
                                    const isEditingThisItem =
                                        editingItem?.stoneId === stone._id &&
                                        editingItem?.itemId === item._id;

                                    if (isEditingThisItem) {
                                        return (
                                            <tr key={item._id} className="stone-item-row editing">
                                                <td>
                                                    <input
                                                        value={editItemForm.stoneType}
                                                        onChange={(e) =>
                                                            setEditItemForm((prev) => ({
                                                                ...prev,
                                                                stoneType: e.target.value,
                                                            }))
                                                        }
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        value={editItemForm.length}
                                                        onChange={(e) =>
                                                            setEditItemForm((prev) => ({
                                                                ...prev,
                                                                length: e.target.value,
                                                            }))
                                                        }
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        value={editItemForm.width}
                                                        onChange={(e) =>
                                                            setEditItemForm((prev) => ({
                                                                ...prev,
                                                                width: e.target.value,
                                                            }))
                                                        }
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        value={editItemForm.thickness}
                                                        onChange={(e) =>
                                                            setEditItemForm((prev) => ({
                                                                ...prev,
                                                                thickness: e.target.value,
                                                            }))
                                                        }
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        placeholder={
                                                            editItemLengthIsZero
                                                                ? "إجباري (الطول = 0)"
                                                                : "تلقائي إذا فاضي"
                                                        }
                                                        value={editItemForm.linearMeter}
                                                        onChange={(e) =>
                                                            setEditItemForm((prev) => ({
                                                                ...prev,
                                                                linearMeter: e.target.value,
                                                            }))
                                                        }
                                                        style={
                                                            editItemLengthIsZero
                                                                ? { borderColor: "#B71C1C", borderWidth: 1 }
                                                                : undefined
                                                        }
                                                    />
                                                </td>
                                                <td>{Number(item.area).toFixed(2)} m²</td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        value={editItemForm.pieces}
                                                        onChange={(e) =>
                                                            setEditItemForm((prev) => ({
                                                                ...prev,
                                                                pieces: e.target.value,
                                                            }))
                                                        }
                                                    />
                                                </td>
                                                <td>
                                                    <button onClick={saveEditItem}>✅ حفظ</button>
                                                    <button onClick={cancelEditItem}>❌ إلغاء</button>
                                                </td>
                                            </tr>
                                        );
                                    }

                                    return (
                                        <tr key={item._id} className="stone-item-row">
                                            <td>
                                                <div
                                                    id={`qr-${stone.barcode}`}
                                                    onClick={() => printQRAndBarcode(stone.barcode)}
                                                    style={{ 
                                                        cursor: "pointer", 
                                                        display: "inline-block",
                                                        transition: "transform 0.2s"
                                                    }}
                                                    title="اضغط لطباعة QR Code و Barcode"
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = "scale(1.05)";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = "scale(1)";
                                                    }}
                                                >
                                                    <QRCodeSVG
                                                        size={80}
                                                        value={`https://alfawaghra-stone.vercel.app/stone/${stone.barcode}`}
                                                    />
                                                    <div style={{ 
                                                        fontSize: "10px", 
                                                        textAlign: "center",
                                                        marginTop: "2px",
                                                        color: "#666"
                                                    }}>
                                                        اضغط للطباعة
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{item.stoneType}</td>
                                            <td>{item.length === 0 ? "مفتوح" : item.length}</td>
                                            <td>{item.width}</td>
                                            <td>{item.thickness}</td>
                                            <td>{Number(item.linearMeter).toFixed(2)}</td>
                                            <td>{Number(item.area).toFixed(2)} m²</td>
                                            <td>{item.pieces}</td>
                                            <td>
                                                <button onClick={() => startEditItem(stone._id, item)}>
                                                    ✏️ تعديل
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteItem(stone._id, item._id)}
                                                >
                                                    🗑 حذف
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {/* صف إضافة نوع حجر جديد */}
                                {addingItemFor === stone._id && (
                                    <tr className="stone-item-row add-item-row">
                                        <td>
                                            <input
                                                placeholder="نوع الحجر"
                                                value={newItemForm.stoneType}
                                                onChange={(e) =>
                                                    setNewItemForm((prev) => ({
                                                        ...prev,
                                                        stoneType: e.target.value,
                                                    }))
                                                }
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                placeholder="0 إذا مفتوح"
                                                value={newItemForm.length}
                                                onChange={(e) =>
                                                    setNewItemForm((prev) => ({
                                                        ...prev,
                                                        length: e.target.value,
                                                    }))
                                                }
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                placeholder="العرض"
                                                value={newItemForm.width}
                                                onChange={(e) =>
                                                    setNewItemForm((prev) => ({
                                                        ...prev,
                                                        width: e.target.value,
                                                    }))
                                                }
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                placeholder="السماكة"
                                                value={newItemForm.thickness}
                                                onChange={(e) =>
                                                    setNewItemForm((prev) => ({
                                                        ...prev,
                                                        thickness: e.target.value,
                                                    }))
                                                }
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                placeholder={
                                                    newItemLengthIsZero
                                                        ? "إجباري (الطول = 0)"
                                                        : "تلقائي إذا فاضي"
                                                }
                                                value={newItemForm.linearMeter}
                                                onChange={(e) =>
                                                    setNewItemForm((prev) => ({
                                                        ...prev,
                                                        linearMeter: e.target.value,
                                                    }))
                                                }
                                                style={
                                                    newItemLengthIsZero
                                                        ? { borderColor: "#B71C1C", borderWidth: 1 }
                                                        : undefined
                                                }
                                            />
                                        </td>
                                        <td>—</td>
                                        <td>
                                            <input
                                                type="number"
                                                placeholder="عدد القطع"
                                                value={newItemForm.pieces}
                                                onChange={(e) =>
                                                    setNewItemForm((prev) => ({
                                                        ...prev,
                                                        pieces: e.target.value,
                                                    }))
                                                }
                                            />
                                        </td>
                                        <td>
                                            <button onClick={() => saveAddItem(stone._id)}>
                                                ✅ إضافة
                                            </button>
                                            <button onClick={cancelAddItem}>❌ إلغاء</button>
                                        </td>
                                    </tr>
                                )}
                            </Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default Inventory;