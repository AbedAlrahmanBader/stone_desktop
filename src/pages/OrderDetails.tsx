// OrderDetails.tsx - الجزء المعدل للطباعة
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import JsBarcode from "jsbarcode";
import "../styles/orderDetails.css";

interface EditItemState {
  stoneType: string;
  unit: string;
  length: number;
  width: number;
  thickness: number;
  requiredQty: number;
  details: string;
}

interface OrderStone {
  _id: string;
  barcode: string;
  status: string;
  totalLinearMeter: number;
  totalArea: number;
  items: { stoneType: string }[];
}

function OrderDetails() {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<EditItemState | null>(null);
  const [savingItem, setSavingItem] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  const [stones, setStones] = useState<OrderStone[]>([]);
  const [loadingStones, setLoadingStones] = useState(true);

  const loadOrder = async () => {
    try {
      const res = await api.get(`/orders/number/${orderNumber}`);
      setOrder(res.data);
      await loadStones(res.data._id);
    } catch (error) {
      console.error(error);
      alert("تعذر تحميل بيانات الطلبية");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const loadStones = async (orderId: string) => {
    setLoadingStones(true);
    try {
      const res = await api.get(`/stones/order/${orderId}`);
      setStones(res.data);
    } catch (error) {
      console.error(error);
      setStones([]);
    } finally {
      setLoadingStones(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [orderNumber]);

  const startEditItem = (item: any) => {
    setEditingItemId(item._id);
    setEditItem({
      stoneType: item.stoneType,
      unit: item.unit,
      length: item.length || 0,
      width: item.width || 0,
      thickness: item.thickness || 0,
      requiredQty: item.requiredQty,
      details: item.details || "",
    });
  };

  const cancelEditItem = () => {
    setEditingItemId(null);
    setEditItem(null);
  };

  const saveEditItem = async (itemId: string) => {
    if (!editItem) return;
    if (!editItem.stoneType.trim() || editItem.requiredQty <= 0) {
      alert("يرجى تعبئة نوع الحجر والكمية بشكل صحيح");
      return;
    }

    setSavingItem(true);
    try {
      const res = await api.put(`/orders/${order._id}/items/${itemId}`, editItem);
      setOrder(res.data);
      cancelEditItem();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "حدث خطأ أثناء تعديل الصنف");
    } finally {
      setSavingItem(false);
    }
  };

  const deleteItem = async (itemId: string) => {
    const confirmed = window.confirm("متأكد إنك بدك تحذف هذا الصنف؟");
    if (!confirmed) return;

    setDeletingItemId(itemId);
    try {
      const res = await api.delete(`/orders/${order._id}/items/${itemId}`);
      setOrder(res.data);
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "حدث خطأ أثناء حذف الصنف");
    } finally {
      setDeletingItemId(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="loading">جاري تحميل بيانات الطلبية...</div>;
  }

  if (!order) {
    return <div className="not-found">الطلبية غير موجودة</div>;
  }

  const totalRequired = order.items.reduce(
    (sum: number, item: any) => sum + (item.requiredQty || 0),
    0
  );
  const totalRemaining = order.items.reduce(
    (sum: number, item: any) => sum + (item.remainingQty || 0),
    0
  );
  const totalCompleted = totalRequired - totalRemaining;

  return (
    <div className="order-details">
      {/* رأس الصفحة للشاشة */}
      <div className="order-header no-print">
        <div className="order-title">
          <h1>تفاصيل الطلبية</h1>
          <span className="order-number">#{order.orderNumber}</span>
        </div>
        <div className="order-header-actions">
          <button className="btn-print" onClick={handlePrint}>
            🖨 طباعة
          </button>
          <button className="btn-back" onClick={() => navigate(-1)}>
            ← رجوع
          </button>
        </div>
      </div>

      {/* ====== محتوى الطباعة ====== */}
      <div className="print-only">
        {/* رأس الطباعة */}
        <div className="print-header">
          <h1>تفاصيل الطلبية</h1>
          <h2>رقم الطلبية: #{order.orderNumber}</h2>
          <p className="print-date">تاريخ الطباعة: {new Date().toLocaleDateString("ar-SA")}</p>
          <hr className="print-divider" />
        </div>

        {/* معلومات العميل والطلب */}
        <div className="print-info-grid">
          <div className="print-info-section">
            <h3>معلومات العميل</h3>
            <div className="print-info-row">
              <span className="print-label">الاسم:</span>
              <span className="print-value">{order.customer?.name}</span>
            </div>
            <div className="print-info-row">
              <span className="print-label">الهاتف:</span>
              <span className="print-value">{order.customer?.phone || "---"}</span>
            </div>
            <div className="print-info-row">
              <span className="print-label">البريد:</span>
              <span className="print-value">{order.customer?.email || "---"}</span>
            </div>
          </div>

          <div className="print-info-section">
            <h3>معلومات الطلبية</h3>
            <div className="print-info-row">
              <span className="print-label">الحالة:</span>
              <span className="print-value">
                <span className={`status-badge ${order.status?.toLowerCase()}`}>
                  {order.status === "Open" ? "مفتوحة" : "مكتملة"}
                </span>
              </span>
            </div>
            {order.description && (
              <div className="print-info-row">
                <span className="print-label">الوصف:</span>
                <span className="print-value">{order.description}</span>
              </div>
            )}
            <div className="print-info-row">
              <span className="print-label">تاريخ الإنشاء:</span>
              <span className="print-value">{new Date(order.createdAt).toLocaleDateString("ar-SA")}</span>
            </div>
          </div>
        </div>

        {/* ====== جدول الأصناف للطباعة ====== */}
        <div className="print-items-section">
          <h3>قائمة الأصناف</h3>
          <table className="print-items-table">
            <thead>
              <tr>
                <th>#</th>
                <th>نوع الحجر</th>
                <th>الطول</th>
                <th>العرض</th>
                <th>السمك</th>
                <th>الوحدة</th>
                <th>الكمية المطلوبة</th>
                <th>الكمية المتبقية</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {order.items && order.items.length > 0 ? (
                order.items.map((item: any, index: number) => (
                  <tr key={item._id || index}>
                    <td>{index + 1}</td>
                    <td>{item.stoneType}</td>
                    <td>{item.length || "---"}</td>
                    <td>{item.width || "---"}</td>
                    <td>{item.thickness || "---"}</td>
                    <td>
                      {item.unit === "pieces" && "قطع"}
                      {item.unit === "linearMeter" && "متر طولي"}
                      {item.unit === "area" && "مساحة"}
                    </td>
                    <td>{item.requiredQty}</td>
                    <td>{item.remainingQty}</td>
                    <td>
                      <span className={`item-status ${item.remainingQty === 0 ? "completed" : "pending"}`}>
                        {item.remainingQty === 0 ? "مكتمل" : "قيد التنفيذ"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} style={{textAlign: 'center', padding: '20px'}}>
                    لا توجد أصناف
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ملخص الطلبية */}
        <div className="print-summary">
          <h3>ملخص الطلبية</h3>
          <div className="print-summary-grid">
            <div className="print-stat">
              <span className="print-stat-label">إجمالي الأصناف</span>
              <span className="print-stat-value">{order.items?.length || 0}</span>
            </div>
            <div className="print-stat">
              <span className="print-stat-label">المكتملة</span>
              <span className="print-stat-value success">
                {order.items?.filter((item: any) => item.remainingQty === 0).length || 0}
              </span>
            </div>
            <div className="print-stat">
              <span className="print-stat-label">قيد التنفيذ</span>
              <span className="print-stat-value warning">
                {order.items?.filter((item: any) => item.remainingQty > 0).length || 0}
              </span>
            </div>
            <div className="print-stat">
              <span className="print-stat-label">إجمالي الكمية</span>
              <span className="print-stat-value">{totalRequired}</span>
            </div>
            <div className="print-stat">
              <span className="print-stat-label">المنجز</span>
              <span className="print-stat-value success">{totalCompleted}</span>
            </div>
            <div className="print-stat">
              <span className="print-stat-label">الناقص</span>
              <span className="print-stat-value warning">{totalRemaining}</span>
            </div>
          </div>
        </div>

        {/* المشاتيح */}
        {stones && stones.length > 0 && (
          <div className="print-stones-section">
            <h3>🏷️ المشاتيح المرتبطة</h3>
            <div className="print-stones-grid">
              {stones.map((stone) => (
                <div key={stone._id} className="print-stone-card">
                  <svg
                    className="print-barcode-svg"
                    ref={(el) => {
                      if (!el) return;
                      try {
                        JsBarcode(el, stone.barcode, {
                          format: "CODE128",
                          width: 1.2,
                          height: 35,
                          displayValue: true,
                          fontSize: 10,
                          font: "monospace",
                          textMargin: 2,
                          margin: 2,
                          background: "transparent",
                          lineColor: "#000000",
                        });
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                  />
                  <div className="print-stone-info">
                    <span className={`stone-status ${stone.status === "In Stock" ? "in-stock" : "shipped"}`}>
                      {stone.status === "In Stock" ? "متوفر" : "مشحون"}
                    </span>
                    <div className="stone-types">
                      {stone.items.map((it) => it.stoneType).join("، ")}
                    </div>
                    <div className="stone-totals">
                      {stone.totalLinearMeter?.toFixed(2)} م.ط ، {stone.totalArea?.toFixed(2)} م²
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ====== محتوى الشاشة ====== */}
      <div className="screen-content">
        <div className="order-info-grid no-print">
          <div className="info-card">
            <h3>معلومات العميل</h3>
            <p><strong>الاسم:</strong> {order.customer?.name}</p>
            <p><strong>الهاتف:</strong> {order.customer?.phone || "---"}</p>
            <p><strong>البريد:</strong> {order.customer?.email || "---"}</p>
          </div>

          <div className="info-card">
            <h3>معلومات الطلبية</h3>
            <p>
              <strong>الحالة:</strong>
              <span className={`status-badge ${order.status?.toLowerCase()}`}>
                {order.status === "Open" ? "مفتوحة" : "مكتملة"}
              </span>
            </p>
            {order.description && (
              <p><strong>الوصف:</strong> {order.description}</p>
            )}
            <p><strong>تاريخ الإنشاء:</strong> {new Date(order.createdAt).toLocaleDateString("ar")}</p>
            <p><strong>آخر تحديث:</strong> {new Date(order.updatedAt).toLocaleDateString("ar")}</p>
          </div>
        </div>

        <div className="items-section no-print">
          <h2>الأصناف</h2>
          <div className="table-responsive">
            <table className="order-items-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>نوع الحجر</th>
                  <th>الطول</th>
                  <th>العرض</th>
                  <th>السمك</th>
                  <th>الوحدة</th>
                  <th>الكمية المطلوبة</th>
                  <th>الكمية المتبقية</th>
                  <th>تفاصيل الصنف</th>
                  <th>الحالة</th>
                  <th className="no-print">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item: any, index: number) => {
                  const isEditing = editingItemId === item._id;

                  if (isEditing && editItem) {
                    return (
                      <tr key={item._id}>
                        <td>{index + 1}</td>
                        <td>
                          <input
                            type="text"
                            value={editItem.stoneType}
                            onChange={(e) => setEditItem({ ...editItem, stoneType: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={editItem.length || ""}
                            onChange={(e) => setEditItem({ ...editItem, length: Number(e.target.value) })}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={editItem.width || ""}
                            onChange={(e) => setEditItem({ ...editItem, width: Number(e.target.value) })}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={editItem.thickness || ""}
                            onChange={(e) => setEditItem({ ...editItem, thickness: Number(e.target.value) })}
                          />
                        </td>
                        <td>
                          <select
                            value={editItem.unit}
                            onChange={(e) => setEditItem({ ...editItem, unit: e.target.value })}
                          >
                            <option value="pieces">قطع</option>
                            <option value="linearMeter">متر طولي</option>
                            <option value="area">مساحة</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            value={editItem.requiredQty || ""}
                            onChange={(e) => setEditItem({ ...editItem, requiredQty: Number(e.target.value) })}
                          />
                        </td>
                        <td>{item.remainingQty}</td>
                        <td>
                          <input
                            type="text"
                            placeholder="تفاصيل إضافية..."
                            value={editItem.details}
                            onChange={(e) => setEditItem({ ...editItem, details: e.target.value })}
                          />
                        </td>
                        <td>---</td>
                        <td className="no-print">
                          <button
                            className="btn-save-item"
                            onClick={() => saveEditItem(item._id)}
                            disabled={savingItem}
                          >
                            {savingItem ? "..." : "✔ حفظ"}
                          </button>
                          <button className="btn-cancel-item" onClick={cancelEditItem}>
                            ✕ إلغاء
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={item._id}>
                      <td>{index + 1}</td>
                      <td>{item.stoneType}</td>
                      <td>{item.length || "---"}</td>
                      <td>{item.width || "---"}</td>
                      <td>{item.thickness || "---"}</td>
                      <td>
                        {item.unit === "pieces" && "قطع"}
                        {item.unit === "linearMeter" && "متر طولي"}
                        {item.unit === "area" && "مساحة"}
                      </td>
                      <td>{item.requiredQty}</td>
                      <td className={item.remainingQty > 0 ? "remaining-highlight" : ""}>
                        {item.remainingQty}
                      </td>
                      <td className="item-details-cell">{item.details || "---"}</td>
                      <td>
                        <span className={`item-status ${item.remainingQty === 0 ? "completed" : "pending"}`}>
                          {item.remainingQty === 0 ? "✓ مكتمل" : "⏳ قيد التنفيذ"}
                        </span>
                      </td>
                      <td className="no-print">
                        <button className="btn-edit-item" onClick={() => startEditItem(item)}>
                          ✏️
                        </button>
                        <button
                          className="btn-delete-item"
                          onClick={() => deleteItem(item._id)}
                          disabled={deletingItemId === item._id}
                        >
                          {deletingItemId === item._id ? "..." : "🗑"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="linked-stones-section no-print">
          <h2>🏷️ المشاتيح المرتبطة</h2>
          {loadingStones ? (
            <p className="stones-loading">جاري تحميل المشاتيح...</p>
          ) : stones.length === 0 ? (
            <p className="stones-empty">لا يوجد مشاتيح مرتبطة بهذه الطلبية بعد</p>
          ) : (
            <div className="linked-stones-list">
              {stones.map((stone) => (
                <div key={stone._id} className="linked-stone-card">
                  <svg
                    className="linked-stone-barcode-svg"
                    ref={(el) => {
                      if (!el) return;
                      try {
                        JsBarcode(el, stone.barcode, {
                          format: "CODE128",
                          width: 1.4,
                          height: 40,
                          displayValue: true,
                          fontSize: 12,
                          font: "monospace",
                          textMargin: 3,
                          margin: 4,
                          background: "transparent",
                          lineColor: "#000000",
                        });
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                  />
                  <span
                    className={`linked-stone-status ${
                      stone.status === "In Stock" ? "in-stock" : "shipped"
                    }`}
                  >
                    {stone.status === "In Stock" ? "متوفر" : "مشحون"}
                  </span>
                  <div className="linked-stone-types">
                    {stone.items.map((it) => it.stoneType).join("، ")}
                  </div>
                  <div className="linked-stone-totals">
                    {stone.totalLinearMeter?.toFixed(2)} م.ط ، {stone.totalArea?.toFixed(2)} م²
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="order-summary no-print">
          <h3>ملخص الطلبية</h3>
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-label">إجمالي الأصناف</span>
              <span className="stat-value">{order.items.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">الأصناف المكتملة</span>
              <span className="stat-value success">
                {order.items.filter((item: any) => item.remainingQty === 0).length}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">الأصناف قيد التنفيذ</span>
              <span className="stat-value warning">
                {order.items.filter((item: any) => item.remainingQty > 0).length}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">إجمالي الكمية المطلوبة</span>
              <span className="stat-value">{totalRequired}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">إجمالي المنجز</span>
              <span className="stat-value success">{totalCompleted}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">إجمالي الناقص</span>
              <span className="stat-value warning">{totalRemaining}</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* ====== تنسيقات الطباعة ====== */
        .print-only {
          display: none;
        }

        @media print {
          /* إخفاء عناصر الشاشة */
          .no-print,
          .screen-content,
          .screen-content .no-print,
          .order-header,
          .btn-print,
          .btn-back,
          .linked-stones-section.no-print,
          .order-summary.no-print {
            display: none !important;
          }

          /* إظهار محتوى الطباعة */
          .print-only {
            display: block !important;
            padding: 20px;
            font-family: Arial, sans-serif;
            direction: rtl;
            background: white;
          }

          /* تنسيق رأس الطباعة */
          .print-header {
            text-align: center;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 2px solid #333;
          }

          .print-header h1 {
            margin: 0;
            font-size: 24px;
            color: #000;
          }

          .print-header h2 {
            margin: 5px 0;
            font-size: 18px;
            color: #333;
          }

          .print-date {
            margin: 5px 0 0 0;
            font-size: 12px;
            color: #666;
          }

          .print-divider {
            border: none;
            border-top: 2px solid #333;
            margin: 15px 0;
          }

          /* شبكة المعلومات */
          .print-info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 25px;
          }

          .print-info-section {
            padding: 15px;
            border: 1px solid #ccc;
            border-radius: 5px;
            background: #f9f9f9;
          }

          .print-info-section h3 {
            margin: 0 0 12px 0;
            font-size: 16px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 8px;
            color: #333;
          }

          .print-info-row {
            display: flex;
            padding: 4px 0;
            font-size: 13px;
          }

          .print-label {
            font-weight: bold;
            color: #555;
            min-width: 80px;
          }

          .print-value {
            color: #333;
          }

          /* ====== جدول الأصناف للطباعة ====== */
          .print-items-section {
            margin-bottom: 25px;
            page-break-inside: avoid;
          }

          .print-items-section h3 {
            margin: 0 0 12px 0;
            font-size: 16px;
            color: #333;
          }

          .print-items-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }

          .print-items-table th {
            background: #333 !important;
            color: white !important;
            padding: 10px 8px;
            text-align: center;
            border: 1px solid #000;
            font-weight: bold;
          }

          .print-items-table td {
            padding: 8px 6px;
            text-align: center;
            border: 1px solid #999;
            color: #333;
          }

          .print-items-table tr:nth-child(even) {
            background: #f5f5f5;
          }

          .print-items-table .item-status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: bold;
          }

          .print-items-table .item-status.completed {
            background: #d4edda !important;
            color: #155724 !important;
          }

          .print-items-table .item-status.pending {
            background: #fff3cd !important;
            color: #856404 !important;
          }

          /* ملخص الطباعة */
          .print-summary {
            margin-bottom: 25px;
            page-break-inside: avoid;
          }

          .print-summary h3 {
            margin: 0 0 12px 0;
            font-size: 16px;
            color: #333;
          }

          .print-summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }

          .print-stat {
            background: #f5f5f5;
            padding: 12px;
            border-radius: 5px;
            text-align: center;
            border: 1px solid #ddd;
          }

          .print-stat-label {
            display: block;
            font-size: 11px;
            color: #666;
            margin-bottom: 4px;
          }

          .print-stat-value {
            display: block;
            font-size: 20px;
            font-weight: bold;
          }

          .print-stat-value.success {
            color: #28a745;
          }

          .print-stat-value.warning {
            color: #ffc107;
          }

          /* المشاتيح */
          .print-stones-section {
            margin-top: 20px;
            page-break-inside: avoid;
          }

          .print-stones-section h3 {
            margin: 0 0 12px 0;
            font-size: 16px;
            color: #333;
          }

          .print-stones-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px;
          }

          .print-stone-card {
            border: 1px solid #ccc;
            border-radius: 5px;
            padding: 10px;
            background: #f9f9f9;
            text-align: center;
          }

          .print-barcode-svg {
            width: 100%;
            height: auto;
            max-height: 50px;
          }

          .print-stone-info {
            margin-top: 5px;
          }

          .stone-status {
            display: inline-block;
            padding: 2px 10px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
            margin-bottom: 3px;
          }

          .stone-status.in-stock {
            background: #d4edda;
            color: #155724;
          }

          .stone-status.shipped {
            background: #cce5ff;
            color: #004085;
          }

          .stone-types {
            font-size: 12px;
            color: #333;
            margin: 3px 0;
          }

          .stone-totals {
            font-size: 11px;
            color: #666;
          }

          /* إعدادات الصفحة */
          @page {
            size: A4;
            margin: 15mm;
          }

          /* تنسيق الجدول */
          .print-items-table {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print-items-table th {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }

        /* إخفاء محتوى الطباعة في الشاشة */
        .print-only {
          display: none;
        }

        /* إظهار محتوى الشاشة */
        .screen-content {
          display: block;
        }
      `}</style>
    </div>
  );
}

export default OrderDetails;