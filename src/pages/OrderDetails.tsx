// OrderDetails.tsx - نسخة معدلة بأسماء التنسيقات الجديدة
import { useEffect, useState } from "react";
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    return <div className="loading-screen">جاري تحميل بيانات الطلبية...</div>;
  }

  if (!order) {
    return <div className="not-found-screen">الطلبية غير موجودة</div>;
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
    <div className="page-wrapper" id="print-area">
      {/* رأس الصفحة - يظهر في الشاشة فقط */}
      <div className="page-header hide-on-print">
        <div className="header-title-wrapper">
          <h1>تفاصيل الطلبية</h1>
          <span className="order-id-tag">#{order.orderNumber}</span>
        </div>
        <div className="header-controls-group">
          <button className="control-btn-print" onClick={handlePrint}>
            🖨 طباعة
          </button>
          <button className="control-btn-back" onClick={() => navigate(-1)}>
            ← رجوع
          </button>
        </div>
      </div>

      {/* رأس مخصص للطباعة فقط */}
      <div className="print-header">
        <h1>تفاصيل الطلبية #{order.orderNumber}</h1>
        <p className="print-date">تاريخ الطباعة: {new Date().toLocaleDateString("ar")}</p>
      </div>

      {/* بطاقات المعلومات */}
      <div className="info-cards-grid">
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
            <span className={`status-badge type-${order.status?.toLowerCase()}`}>
              {order.status === "Open" ? "مفتوحة" : "مكتملة"}
            </span>
          </p>
          {order.description && (
            <p>
              <strong>الوصف:</strong> {order.description}
            </p>
          )}
          <p><strong>تاريخ الإنشاء:</strong> {new Date(order.createdAt).toLocaleDateString("ar")}</p>
          <p><strong>آخر تحديث:</strong> {new Date(order.updatedAt).toLocaleDateString("ar")}</p>
        </div>
      </div>

      {/* قسم الأصناف */}
      <div className="items-section">
        <h2>الأصناف</h2>
        <div className="table-responsive-wrap">
          <table className="items-table">
            <thead>
              <tr>
                <th>#</th>
                <th>نوع الحجر</th>
                <th>الطول</th>
                <th>العرض</th>
                <th>السمك</th>
                <th>الوحدة</th>
                <th>الكمية المطلوبة</th>
                <th>الكمية المتبقية (الناقص)</th>
                <th>تفاصيل الصنف</th>
                <th>الحالة</th>
                <th className="hide-on-print">الإجراءات</th>
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
                      <td className="hide-on-print">
                        <button
                          className="item-action-btn action-save"
                          onClick={() => saveEditItem(item._id)}
                          disabled={savingItem}
                        >
                          {savingItem ? "..." : "✔ حفظ"}
                        </button>
                        <button className="item-action-btn action-cancel" onClick={cancelEditItem}>
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
                    <td className={item.remainingQty > 0 ? "remaining-value" : ""}>
                      {item.remainingQty}
                    </td>
                    <td className="item-notes-cell">{item.details || "---"}</td>
                    <td>
                      <span className={`item-status-tag state-${item.remainingQty === 0 ? "completed" : "pending"}`}>
                        {item.remainingQty === 0 ? "✓ مكتمل" : "⏳ قيد التنفيذ"}
                      </span>
                    </td>
                    <td className="hide-on-print">
                      <button className="item-action-btn action-edit" onClick={() => startEditItem(item)}>
                        ✏️
                      </button>
                      <button
                        className="item-action-btn action-delete"
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

      {/* قسم المشاتيح المرتبطة */}
      <div className="stones-section hide-on-print">
        <h2>🏷️ المشاتيح المرتبطة</h2>

        {loadingStones ? (
          <p className="stones-loading-text">جاري تحميل المشاتيح...</p>
        ) : stones.length === 0 ? (
          <p className="stones-empty-text">لا يوجد مشاتيح مرتبطة بهذه الطلبية بعد</p>
        ) : (
          <div className="stones-grid">
            {stones.map((stone) => (
              <div key={stone._id} className="stone-card">
                <svg
                  className="stone-barcode-svg"
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
                  className={`stone-status-tag tag-${stone.status === "In Stock" ? "in-stock" : "shipped"}`}
                >
                  {stone.status === "In Stock" ? "متوفر" : "مشحون"}
                </span>
                <div className="stone-types-text">
                  {stone.items.map((it) => it.stoneType).join("، ")}
                </div>
                <div className="stone-measurements">
                  {stone.totalLinearMeter?.toFixed(2)} م.ط ، {stone.totalArea?.toFixed(2)} م²
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ملخص الطلبية */}
      <div className="summary-section">
        <h3>ملخص الطلبية</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">إجمالي الأصناف</span>
            <span className="summary-value">{order.items.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">الأصناف المكتملة</span>
            <span className="summary-value value-success">
              {order.items.filter((item: any) => item.remainingQty === 0).length}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">الأصناف قيد التنفيذ</span>
            <span className="summary-value value-warning">
              {order.items.filter((item: any) => item.remainingQty > 0).length}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">إجمالي الكمية المطلوبة</span>
            <span className="summary-value">{totalRequired}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">إجمالي المنجز</span>
            <span className="summary-value value-success">{totalCompleted}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">إجمالي الناقص</span>
            <span className="summary-value value-warning">{totalRemaining}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;