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

    // ------- طباعة QR Code و Barcode معاً -------
    const printQRAndBarcode = (barcode: string) => {
        const printWindow = window.open("", "_blank", "width=500,height=600");
        
        if (!printWindow) {
            alert("الرجاء السماح بالنوافذ المنبثقة (Popups) لهذا الموقع للسماح بالطباعة");
            return;
        }

        // الحصول على عنصر QR
        const qrElement = document.getElementById(`qr-${barcode}`);
        if (!qrElement) {
            alert("لم يتم العثور على QR Code");
            return;
        }

        const svgHTML = qrElement.innerHTML;

        // إنشاء Barcode باستخدام jsbarcode
        const barcodeDiv = document.createElement('div');
        barcodeDiv.id = `barcode-container-${barcode}`;
        document.body.appendChild(barcodeDiv);
        
        try {
            // إنشاء عنصر SVG للباركود
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("id", `barcode-${barcode}`);
            document.body.appendChild(svg);
            
            // إنشاء الباركود
            JsBarcode(`#barcode-${barcode}`, barcode, {
                format: "CODE128",
                width: 2,
                height: 80,
                displayValue: true,
                fontSize: 20,
                font: "monospace",
                textAlign: "center",
                textPosition: "bottom",
                textMargin: 10,
                margin: 10,
            });
            
            // الحصول على SVG الناتج
            const barcodeElement = document.getElementById(`barcode-${barcode}`);
            const barcodeHTML = barcodeElement?.outerHTML || '';
            
            // تنظيف
            document.body.removeChild(svg);
            document.body.removeChild(barcodeDiv);

            // إنشاء صفحة الطباعة
            printWindow.document.write(`
                <html>
                    <head>
                        <title>${barcode}</title>
                        <style>
                            body {
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                                font-family: 'Arial', sans-serif;
                                padding: 30px;
                                margin: 0;
                                min-height: 100vh;
                                background: white;
                            }
                            .container {
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                                padding: 20px;
                                border: 2px solid #ddd;
                                border-radius: 10px;
                                background: white;
                                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                            }
                            .title {
                                font-size: 24px;
                                font-weight: bold;
                                margin-bottom: 20px;
                                color: #333;
                            }
                            .qr-section {
                                margin-bottom: 30px;
                                text-align: center;
                            }
                            .qr-section svg {
                                width: 200px;
                                height: 200px;
                                display: block;
                                margin: 0 auto;
                            }
                            .qr-label {
                                margin-top: 10px;
                                font-size: 14px;
                                color: #666;
                            }
                            .barcode-section {
                                margin-top: 20px;
                                text-align: center;
                                width: 100%;
                            }
                            .barcode-section svg {
                                max-width: 400px;
                                display: block;
                                margin: 0 auto;
                            }
                            .barcode-label {
                                margin-top: 5px;
                                font-size: 14px;
                                color: #666;
                            }
                            .barcode-text {
                                font-size: 18px;
                                font-weight: bold;
                                margin-top: 10px;
                                color: #333;
                                letter-spacing: 2px;
                            }
                            .divider {
                                width: 100%;
                                height: 1px;
                                background: #ddd;
                                margin: 20px 0;
                            }
                            .stone-details {
                                text-align: center;
                                margin-top: 15px;
                                font-size: 14px;
                                color: #555;
                            }
                            @media print {
                                body {
                                    padding: 10px;
                                }
                                .container {
                                    border: 1px solid #ccc;
                                    box-shadow: none;
                                }
                                .no-print {
                                    display: none !important;
                                }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="title">📦 بطاقة المنتج</div>
                            
                            <div class="qr-section">
                                ${svgHTML}
                                <div class="qr-label">🔲 QR Code</div>
                            </div>
                            
                            <div class="divider"></div>
                            
                            <div class="barcode-section">
                                ${barcodeHTML}
                                <div class="barcode-label">📊 Barcode</div>
                            </div>
                            
                            <div class="barcode-text">${barcode}</div>
                            
                            <div class="stone-details">
                                <p>📦 الكود: <strong>${barcode}</strong></p>
                                <p style="font-size: 12px; color: #999; margin-top: 10px;">
                                    تم الطباعة في: ${new Date().toLocaleString('ar')}
                                </p>
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
            // تأخير بسيط للتأكد من تحميل جميع العناصر
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
                // لا نغلق النافذة تلقائياً حتى يتمكن المستخدم من رؤية ما يطبعه
                // printWindow.close();
            }, 500);
        };
    };

    // ------- طباعة QR Code فقط (الوظيفة القديمة المحسنة) -------
    const printQRCodeOnly = (barcode: string) => {
        const printWindow = window.open("", "_blank", "width=400,height=500");
        if (!printWindow) {
            alert("الرجاء السماح بالنوافذ المنبثقة (Popups) لهذا الموقع للسماح بالطباعة");
            return;
        }

        const qrElement = document.getElementById(`qr-${barcode}`);
        if (!qrElement) return;

        const svgHTML = qrElement.innerHTML;

        printWindow.document.write(`
            <html>
                <head>
                    <title>${barcode}</title>
                    <style>
                        body {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            font-family: sans-serif;
                            padding: 20px;
                        }
                        svg {
                            width: 250px;
                            height: 250px;
                        }
                        p {
                            margin-top: 10px;
                            font-size: 18px;
                            font-weight: bold;
                        }
                    </style>
                </head>
                <body>
                    ${svgHTML}
                    <p>${barcode}</p>
                </body>
            </html>
        `);

        printWindow.document.close();

        printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
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