import { Fragment, useEffect, useState } from "react";
import api from "../api/axios";
import "../styles/inventory.css";
import { QRCodeSVG } from "qrcode.react";
import JsBarcode from "jsbarcode";
import AAA from "../assets/AAA.jpg";


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

interface StoneOrder {
    orderNumber: string;
    customer?: {
        name: string;
        phone?: string;
    };
}

interface Stone {
    _id: string;
    barcode: string;
    items: StoneItem[];
    totalLinearMeter: number;
    totalArea: number;
    status: string;
    order?: StoneOrder | null;
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

    // Inventory.tsx - دالة الطباعة (بتصميم الورقة الرسمية - لوجو صورة - مقاس A6 للطابعة الحرارية)
 // Inventory.tsx - دالة الطباعة المحسنة (صفحة كاملة بتصميم احترافي)
const printQRAndBarcode = (
    barcode: string,
    customerName?: string,
    orderNumber?: string
) => {
    // نافذة طباعة بحجم مناسب
    const printWindow = window.open("", "_blank", "width=500,height=700");

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
            width: 2,
            height: 60,
            displayValue: true,
            fontSize: 14,
            font: "monospace",
            textAlign: "center",
            textPosition: "bottom",
            textMargin: 6,
            margin: 10,
            background: "#ffffff",
            lineColor: "#000000",
        });

        const barcodeElement = document.getElementById(`barcode-${barcode}`);
        const barcodeHTML = barcodeElement?.outerHTML || '';

        // تنظيف
        document.body.removeChild(svg);
        document.body.removeChild(barcodeDiv);

        // تنسيق معلومات العميل والطلب
        const orderInfoHTML = `
            <div class="order-info">
               
                ${orderNumber ? `
                <div class="order-info-row">
                    <span class="order-info-label">رقم الطلبية</span>
                    <span class="order-info-value">${orderNumber}</span>
                </div>` : ''}
            </div>
        `;

        // الحصول على تاريخ اليوم
        const today = new Date();
        const dateStr = today.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl">
                <head>
                    <title>${barcode}</title>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }

                        @page {
                            size: 105mm 148mm;
                            margin: 0;
                        }

                        body {
                            font-family: 'Arial', 'Segoe UI', sans-serif;
                            background: #f0f0f0;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                            padding: 5px;
                        }

                        .print-card {
                            background: white;
                            width: 105mm;
                            height: 148mm;
                            padding: 6mm 5mm 5mm 5mm;
                            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                            display: flex;
                            flex-direction: column;
                            border-radius: 4px;
                            position: relative;
                            overflow: hidden;
                        }

                        /* خلفية مزخرفة خفيفة */
                        .print-card::before {
                            content: '';
                            position: absolute;
                            top: -50%;
                            right: -50%;
                            width: 100%;
                            height: 100%;
                            background: radial-gradient(circle at 80% 20%, rgba(200,180,160,0.03) 0%, transparent 70%);
                            pointer-events: none;
                        }

                        /* الهيدر: اللوجو + خط فاصل */
                        .header {
                            text-align: center;
                            padding-bottom: 3mm;
                            border-bottom: 2px solid #1a1a1a;
                            position: relative;
                            z-index: 1;
                        }

                        .header img {
                            width: 85mm;
                            height: 30mm;
                            object-fit: contain;
                            filter: brightness(1.05);
                        }

                        /* المحتوى الرئيسي */
                        .content {
                            flex: 1;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            padding: 4mm 0;
                            position: relative;
                            z-index: 1;
                            gap: 3mm;
                        }

                        /* حاوية الـ QR */
                        .qr-wrapper {
                            background: white;
                            padding: 3mm;
                            border-radius: 8px;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
                            border: 1px solid #eee;
                        }

                        .qr-wrapper svg {
                            width: 100px;
                            height: 100px;
                            display: block;
                        }

                        /* حاوية الباركود */
                        .barcode-wrapper {
                            background: white;
                            padding: 2mm 3mm;
                            border-radius: 6px;
                            border: 1px solid #eee;
                            width: 100%;
                            display: flex;
                            justify-content: center;
                        }

                        .barcode-wrapper svg {
                            max-width: 85%;
                            height: auto;
                        }

                        /* رقم المنتج */
                        .product-id {
                            text-align: center;
                            font-size: 13px;
                            font-weight: bold;
                            color: #1a1a1a;
                            letter-spacing: 2px;
                            font-family: 'Courier New', monospace;
                            background: #f8f8f8;
                            padding: 1mm 4mm;
                            border-radius: 4px;
                            border: 1px dashed #ccc;
                        }

                        /* معلومات العميل والطلب */
                        .order-info {
                            width: 100%;
                            margin-top: 1mm;
                            padding: 2mm 3mm;
                            background: #fafafa;
                            border-radius: 6px;
                            border: 1px solid #e8e8e8;
                        }

                        .order-info-row {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            font-size: 10px;
                            padding: 1mm 0;
                        }

                        .order-info-row:not(:last-child) {
                            border-bottom: 1px dashed #e8e8e8;
                        }

                        .order-info-label {
                            color: #888;
                            font-weight: 600;
                            font-size: 9px;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                        }

                        .order-info-value {
                            color: #1a1a1a;
                            font-weight: bold;
                            font-size: 12px;
                        }

                        /* الفوتر */
                        .footer {
                            text-align: center;
                            padding-top: 3mm;
                            border-top: 2px solid #1a1a1a;
                            font-size: 8px;
                            color: #333;
                            font-weight: bold;
                            line-height: 1.8;
                            position: relative;
                            z-index: 1;
                        }

                        .footer .company-name {
                            font-size: 9px;
                            color: #1a1a1a;
                            letter-spacing: 0.5px;
                        }

                        .footer .contact-info {
                            display: flex;
                            justify-content: center;
                            gap: 8px;
                            flex-wrap: wrap;
                            font-weight: normal;
                            color: #555;
                            font-size: 8px;
                        }

                        .footer .contact-info span {
                            padding: 0 4px;
                        }

                        .footer .contact-info .separator {
                            color: #ccc;
                        }

                        /* علامة مائية خفيفة في الخلفية */
                        .watermark {
                            position: absolute;
                            bottom: 20mm;
                            right: 5mm;
                            font-size: 60px;
                            color: rgba(0,0,0,0.02);
                            font-weight: bold;
                            transform: rotate(-15deg);
                            pointer-events: none;
                            font-family: 'Arial', sans-serif;
                            letter-spacing: 5px;
                        }

                        /* تذييل التاريخ */
                        .print-date {
                            text-align: center;
                            font-size: 7px;
                            color: #aaa;
                            margin-top: 1mm;
                            position: relative;
                            z-index: 1;
                        }

                        @media print {
                            body {
                                background: white;
                                padding: 0;
                                min-height: 100vh;
                            }

                            .print-card {
                                box-shadow: none;
                                border-radius: 0;
                                width: 105mm;
                                height: 148mm;
                                padding: 6mm 5mm 5mm 5mm;
                            }

                            .print-card::before {
                                display: none;
                            }

                            .watermark {
                                color: rgba(0,0,0,0.015);
                            }
                        }

                        @media screen and (max-width: 500px) {
                            .print-card {
                                width: 100%;
                                height: auto;
                                min-height: 148mm;
                                padding: 4mm;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="print-card">
                        <!-- علامة مائية -->
                        <div class="watermark">${barcode}</div>


                        <!-- Content -->
                        <div class="content">
                            <div class="qr-wrapper">
                                ${svgHTML}
                            </div>

                            <div class="barcode-wrapper">
                                ${barcodeHTML}
                            </div>

                            <div class="product-id">
                                ${barcode}
                            </div>

                            ${(customerName || orderNumber) ? orderInfoHTML : ''}
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

    // تحسين الطباعة: انتظار تحميل الصور والخطوط
    printWindow.onload = () => {
        // انتظار إضافي للصور
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 1000);
    };

    // إغلاق النافذة بعد الطباعة (اختياري)
    printWindow.onafterprint = () => {
        // يمكن إغلاق النافذة أو تركها مفتوحة
        // printWindow.close();
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
                                                        {stone.order && (
                                                            <span className="stone-header-order">
                                                                📋 {stone.order.orderNumber}
                                                                {stone.order.customer?.name
                                                                    ? ` — ${stone.order.customer.name}`
                                                                    : ""}
                                                            </span>
                                                        )}
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
                                                    onClick={() =>
                                                        printQRAndBarcode(
                                                            stone.barcode,
                                                            stone.order?.customer?.name,
                                                            stone.order?.orderNumber
                                                        )
                                                    }
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
