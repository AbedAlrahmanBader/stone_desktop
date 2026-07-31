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

        // إنشاء صفحة الطباعة بتصميم مطابق لصورة WAGERA
        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl">
                <head>
                    <title>WAGERA - ${barcode}</title>
                    <style>
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }
                        
                        @page {
                            size: A4;
                            margin: 10mm;
                        }
                        
                        body {
                            font-family: 'Arial', 'Segoe UI', sans-serif;
                            background: #f0ede8;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                            padding: 20px;
                        }
                        
                        /* البطاقة الرئيسية - تصميم أنيق مثل الصورة */
                        .wagera-card {
                            background: white;
                            width: 180mm;
                            max-width: 100%;
                            min-height: 120mm;
                            padding: 12mm 10mm 10mm 10mm;
                            box-shadow: 0 8px 40px rgba(0,0,0,0.12);
                            border-radius: 4px;
                            position: relative;
                            border: 1px solid #d4c5a0;
                        }
                        
                        /* الإطار الذهبي المزدوج */
                        .wagera-card::before {
                            content: '';
                            position: absolute;
                            top: 5mm;
                            left: 5mm;
                            right: 5mm;
                            bottom: 5mm;
                            border: 2px solid #c9a84c;
                            border-radius: 2px;
                            pointer-events: none;
                        }
                        
                        .wagera-card::after {
                            content: '';
                            position: absolute;
                            top: 7mm;
                            left: 7mm;
                            right: 7mm;
                            bottom: 7mm;
                            border: 1px solid #e8dcc8;
                            border-radius: 1px;
                            pointer-events: none;
                        }
                        
                        /* الهيدر - شعار WAGERA */
                        .header-wagera {
                            text-align: center;
                            border-bottom: 2px solid #c9a84c;
                            padding-bottom: 6mm;
                            margin-bottom: 5mm;
                            position: relative;
                        }
                        
                        .logo-text {
                            font-size: 38px;
                            font-weight: 900;
                            color: #1a1a1a;
                            letter-spacing: 6px;
                            font-family: 'Times New Roman', 'Arial', serif;
                            text-shadow: 1px 1px 2px rgba(0,0,0,0.05);
                        }
                        
                        .logo-text .gold {
                            color: #c9a84c;
                            font-weight: 700;
                        }
                        
                        .logo-text .gold-star {
                            color: #c9a84c;
                            font-size: 28px;
                            margin: 0 5px;
                        }
                        
                        .sub-header {
                            display: flex;
                            justify-content: center;
                            gap: 20px;
                            flex-wrap: wrap;
                            font-size: 12px;
                            color: #555;
                            margin-top: 3px;
                            letter-spacing: 0.5px;
                        }
                        
                        .sub-header span {
                            display: inline-flex;
                            align-items: center;
                            gap: 4px;
                        }
                        
                        .sub-header .divider-line {
                            color: #c9a84c;
                            font-weight: bold;
                        }
                        
                        /* محتوى البطاقة - توزيع QR والباركود */
                        .card-content {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            padding: 2mm 0;
                        }
                        
                        .top-section {
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            gap: 15mm;
                            width: 100%;
                            padding: 3mm 0;
                            flex-wrap: wrap;
                        }
                        
                        /* جهة اليمين - QR Code */
                        .qr-side {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            background: #faf8f5;
                            padding: 8px 12px 5px 12px;
                            border-radius: 6px;
                            border: 1px solid #e8dcc8;
                        }
                        
                        .qr-side svg {
                            width: 120px;
                            height: 120px;
                            display: block;
                        }
                        
                        .qr-label-text {
                            font-size: 10px;
                            color: #999;
                            font-weight: bold;
                            letter-spacing: 2px;
                            margin-top: 3px;
                            text-transform: uppercase;
                        }
                        
                        /* جهة اليسار - معلومات المنتج */
                        .info-side {
                            display: flex;
                            flex-direction: column;
                            align-items: flex-start;
                            padding: 5px 0;
                        }
                        
                        .info-side .product-title {
                            font-size: 14px;
                            color: #888;
                            font-weight: bold;
                            letter-spacing: 1px;
                            margin-bottom: 3px;
                        }
                        
                        .info-side .product-id-big {
                            font-size: 28px;
                            font-weight: 900;
                            color: #1a1a1a;
                            font-family: 'Courier New', monospace;
                            letter-spacing: 4px;
                            background: #f5f2ec;
                            padding: 2px 15px;
                            border-radius: 4px;
                            border: 1px dashed #c9a84c;
                            direction: ltr;
                        }
                        
                        .info-side .product-sub {
                            font-size: 11px;
                            color: #aaa;
                            margin-top: 4px;
                            letter-spacing: 1px;
                        }
                        
                        /* الفاصل المزخرف */
                        .divider-gold {
                            width: 70%;
                            height: 1px;
                            background: linear-gradient(to right, transparent, #c9a84c, transparent);
                            margin: 4mm auto;
                            position: relative;
                        }
                        
                        .divider-gold::after {
                            content: '◆';
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            background: white;
                            padding: 0 12px;
                            color: #c9a84c;
                            font-size: 14px;
                        }
                        
                        /* الباركود */
                        .barcode-section {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            width: 100%;
                            padding: 2mm 0;
                            background: #faf8f5;
                            border-radius: 4px;
                            border: 1px solid #e8dcc8;
                            margin: 2mm 0;
                        }
                        
                        .barcode-section svg {
                            max-width: 320px;
                            width: 100%;
                            height: auto;
                        }
                        
                        .barcode-number {
                            font-size: 18px;
                            font-weight: bold;
                            color: #1a1a1a;
                            font-family: 'Courier New', monospace;
                            letter-spacing: 3px;
                            margin-top: 2px;
                            background: #f5f2ec;
                            padding: 2px 20px;
                            border-radius: 3px;
                            direction: ltr;
                        }
                        
                        /* الفوتر */
                        .footer-wagera {
                            text-align: center;
                            margin-top: 4mm;
                            padding-top: 4mm;
                            border-top: 1px solid #e8dcc8;
                            font-size: 11px;
                            color: #999;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            flex-wrap: wrap;
                        }
                        
                        .footer-wagera .brand {
                            font-weight: bold;
                            color: #c9a84c;
                            font-size: 13px;
                            letter-spacing: 1px;
                        }
                        
                        .footer-wagera .brand span {
                            font-weight: 900;
                            color: #1a1a1a;
                        }
                        
                        .footer-wagera .date {
                            font-size: 10px;
                            color: #bbb;
                        }
                        
                        /* زر الطباعة - يظهر فقط على الشاشة */
                        .print-btn {
                            display: inline-block;
                            margin-top: 10mm;
                            padding: 10px 30px;
                            background: #c9a84c;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            font-size: 16px;
                            font-weight: bold;
                            cursor: pointer;
                            transition: all 0.3s;
                        }
                        
                        .print-btn:hover {
                            background: #b8973a;
                            transform: translateY(-2px);
                            box-shadow: 0 4px 15px rgba(201, 168, 76, 0.3);
                        }
                        
                        @media print {
                            body {
                                background: white;
                                padding: 0;
                            }
                            
                            .wagera-card {
                                box-shadow: none;
                                border-radius: 0;
                                padding: 10mm 8mm;
                                width: 100%;
                                min-height: 100vh;
                                border: none;
                            }
                            
                            .wagera-card::before,
                            .wagera-card::after {
                                display: none;
                            }
                            
                            .print-btn {
                                display: none !important;
                            }
                            
                            .qr-side {
                                border: 1px solid #ddd;
                                background: white;
                            }
                            
                            .barcode-section {
                                border: 1px solid #ddd;
                                background: white;
                            }
                            
                            .info-side .product-id-big {
                                background: #f5f2ec;
                            }
                        }
                        
                        @media (max-width: 700px) {
                            .top-section {
                                flex-direction: column;
                                gap: 5mm;
                            }
                            
                            .info-side {
                                align-items: center;
                            }
                            
                            .info-side .product-id-big {
                                font-size: 22px;
                            }
                            
                            .qr-side svg {
                                width: 100px;
                                height: 100px;
                            }
                            
                            .logo-text {
                                font-size: 28px;
                                letter-spacing: 3px;
                            }
                            
                            .sub-header {
                                font-size: 10px;
                                gap: 8px;
                            }
                            
                            .footer-wagera {
                                flex-direction: column;
                                gap: 3px;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="wagera-card">
                        <!-- الهيدر - مثل الصورة -->
                        <div class="header-wagera">
                            <div class="logo-text">
                                <span class="gold-star">✦</span>
                                <span class="gold">WA</span>GERA
                                <span class="gold-star">✦</span>
                            </div>
                            <div class="sub-header">
                                <span>🏛️ Bethlehem-Palestine</span>
                                <span class="divider-line">|</span>
                                <span>📱 050-5574747</span>
                                <span class="divider-line">|</span>
                                <span>📧 alfawagra@yahoo.com</span>
                                <span class="divider-line">|</span>
                                <span>🌐 www.fwagerastones.com</span>
                            </div>
                        </div>
                        
                        <!-- المحتوى -->
                        <div class="card-content">
                            <div class="top-section">
                                <!-- جهة اليمين: QR Code -->
                                <div class="qr-side">
                                    ${svgHTML}
                                    <div class="qr-label-text">🔲 QR Code</div>
                                </div>
                                
                                <!-- جهة اليسار: معلومات المنتج -->
                                <div class="info-side">
                                    <div class="product-title">📦 رقم المنتج</div>
                                    <div class="product-id-big" style="direction: ltr; text-align: center;">
                                        ${barcode}
                                    </div>
                                    <div class="product-sub">• Product ID •</div>
                                </div>
                            </div>
                            
                            <!-- الفاصل المزخرف -->
                            <div class="divider-gold"></div>
                            
                            <!-- الباركود -->
                            <div class="barcode-section">
                                ${barcodeHTML}
                                <div class="barcode-number" style="direction: ltr;">
                                    ${barcode}
                                </div>
                            </div>
                        </div>
                        
                        <!-- الفوتر -->
                        <div class="footer-wagera">
                            <div class="brand">
                                <span>✦</span> ALFAWAGHRA <span>✦</span>
                            </div>
                            <div style="font-size: 11px; color: #888;">
                                جميع الحقوق محفوظة © ${new Date().getFullYear()}
                            </div>
                            <div class="date">
                                📅 ${new Date().toLocaleString('ar-EG', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric'
                                })}
                            </div>
                        </div>
                    </div>
                    
                    <!-- زر الطباعة (يظهر فقط على الشاشة) -->
                    <div style="text-align: center; margin-top: 15px; width: 100%;" class="no-print">
                        <button onclick="window.print()" class="print-btn">
                            🖨️ طباعة البطاقة
                        </button>
                        <br>
                        <button onclick="window.close()" style="margin-top: 8px; padding: 8px 25px; background: #eee; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; font-size: 14px; color: #666;">
                            ✖ إغلاق
                        </button>
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