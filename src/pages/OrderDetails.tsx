import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import JsBarcode from "jsbarcode";
import "../styles/orderDetails.css";

// Interfaces
interface OrderItem {
  _id: string;
  stoneType: string;
  unit: string;
  length?: number;
  width?: number;
  thickness?: number;
  requiredQty: number;
  remainingQty: number;
  details?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    name: string;
    phone?: string;
    email?: string;
  };
  items: OrderItem[];
}

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
  const [order, setOrder] = useState<Order | null>(null);
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

  const startEditItem = (item: OrderItem) => {
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
      const res = await api.put(`/orders/${order?._id}/items/${itemId}`, editItem);
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
      const res = await api.delete(`/orders/${order?._id}/items/${itemId}`);
      setOrder(res.data);
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "حدث خطأ أثناء حذف الصنف");
    } finally {
      setDeletingItemId(null);
    }
  };

  const handlePrint = () => {
    document.body.classList.remove('printing-shipments');
    document.body.classList.add('printing-order');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-order');
    }, 1000);
  };

  if (loading) {
    return <div className="loading-state">جاري تحميل بيانات الطلبية...</div>;
  }

  if (!order) {
    return <div className="not-found-state">الطلبية غير موجودة</div>;
  }

  const totalRequired = order.items.reduce(
    (sum: number, item: OrderItem) => sum + (item.requiredQty || 0),
    0
  );
  const totalRemaining = order.items.reduce(
    (sum: number, item: OrderItem) => sum + (item.remainingQty || 0),
    0
  );
  const totalCompleted = totalRequired - totalRemaining;

  return (
    <div className="order-details-container">
      <div className="order-header-section">
        <div className="order-title-group">
          <h1>تفاصيل الطلبية</h1>
          <span className="order-number-badge">#{order.orderNumber}</span>
        </div>
        <div className="header-actions">
          <button className="btn-print-action" onClick={handlePrint}>
            🖨️ طباعة
          </button>
          <button className="btn-back-action" onClick={() => navigate(-1)}>
            ← رجوع
          </button>
        </div>
      </div>

      <div className="info-grid-layout">
        <div className="info-card-component">
          <h3>معلومات العميل</h3>
          <p><strong>الاسم:</strong> {order.customer?.name}</p>
          <p><strong>الهاتف:</strong> {order.customer?.phone || "---"}</p>
          <p><strong>البريد:</strong> {order.customer?.email || "---"}</p>
        </div>

        <div className="info-card-component">
          <h3>معلومات الطلبية</h3>
          <p>
            <strong>الحالة:</strong>
            <span className={`status-indicator ${order.status?.toLowerCase()}`}>
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

      <div className="items-section-wrapper">
        <h2>الأصناف</h2>
        <div className="table-scroll-wrapper">
          <table className="items-data-table">
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
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item: OrderItem, index: number) => {
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
                      <td>
                        <button
                          className="btn-item-save"
                          onClick={() => saveEditItem(item._id)}
                          disabled={savingItem}
                        >
                          {savingItem ? "..." : "✔ حفظ"}
                        </button>
                        <button className="btn-item-cancel" onClick={cancelEditItem}>
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
                    <td className={item.remainingQty > 0 ? "remaining-value-highlight" : ""}>
                      {item.remainingQty}
                    </td>
                    <td className="item-details-text">{item.details || "---"}</td>
                    <td>
                      <span className={`item-status-badge ${item.remainingQty === 0 ? "completed" : "pending"}`}>
                        {item.remainingQty === 0 ? "✓ مكتمل" : "⏳ قيد التنفيذ"}
                      </span>
                    </td>
                    <td>
                      <button className="btn-item-edit" onClick={() => startEditItem(item)}>
                        ✏️
                      </button>
                      <button
                        className="btn-item-delete"
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

      <div className="linked-stones-section-wrapper">
        <h2>🏷️ المشاتيح المرتبطة</h2>

        {loadingStones ? (
          <p className="stones-loading-message">جاري تحميل المشاتيح...</p>
        ) : stones.length === 0 ? (
          <p className="stones-empty-message">لا يوجد مشاتيح مرتبطة بهذه الطلبية بعد</p>
        ) : (
          <div className="stones-grid-list">
            {stones.map((stone) => (
              <div key={stone._id} className="stone-card-item">
                <svg
                  className="stone-barcode-image"
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
                  className={`stone-status-badge ${
                    stone.status === "In Stock" ? "in-stock" : "shipped"
                  }`}
                >
                  {stone.status === "In Stock" ? "متوفر" : "مشحون"}
                </span>
                <div className="stone-types-list">
                  {stone.items.map((it) => it.stoneType).join("، ")}
                </div>
                <div className="stone-totals-info">
                  {stone.totalLinearMeter?.toFixed(2)} م.ط ، {stone.totalArea?.toFixed(2)} م²
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="order-summary-section">
        <h3>ملخص الطلبية</h3>
        <div className="summary-stats-grid">
          <div className="stat-item-box">
            <span className="stat-label-text">إجمالي الأصناف</span>
            <span className="stat-value-number">{order.items.length}</span>
          </div>
          <div className="stat-item-box">
            <span className="stat-label-text">الأصناف المكتملة</span>
            <span className="stat-value-number success">
              {order.items.filter((item: OrderItem) => item.remainingQty === 0).length}
            </span>
          </div>
          <div className="stat-item-box">
            <span className="stat-label-text">الأصناف قيد التنفيذ</span>
            <span className="stat-value-number warning">
              {order.items.filter((item: OrderItem) => item.remainingQty > 0).length}
            </span>
          </div>
          <div className="stat-item-box">
            <span className="stat-label-text">إجمالي الكمية المطلوبة</span>
            <span className="stat-value-number">{totalRequired}</span>
          </div>
          <div className="stat-item-box">
            <span className="stat-label-text">إجمالي المنجز</span>
            <span className="stat-value-number success">{totalCompleted}</span>
          </div>
          <div className="stat-item-box">
            <span className="stat-label-text">إجمالي الناقص</span>
            <span className="stat-value-number warning">{totalRemaining}</span>
          </div>
        </div>
      </div>

      {/* مكون الطباعة المخفي */}
      <div className="print-content">
        <div className="print-header">
          <h1>تفاصيل الطلبية</h1>
          <div className="print-order-number">رقم الطلبية: #{order.orderNumber}</div>
          <div style={{ marginTop: '5px', fontSize: '14px', color: '#666' }}>
            تاريخ الطباعة: {new Date().toLocaleDateString('ar')}
          </div>
        </div>

        <div className="print-order-info">
          <div className="info-group">
            <strong>معلومات العميل</strong>
            <p><strong>الاسم:</strong> {order.customer?.name}</p>
            <p><strong>الهاتف:</strong> {order.customer?.phone || "---"}</p>
            <p><strong>البريد:</strong> {order.customer?.email || "---"}</p>
          </div>
          <div className="info-group">
            <strong>معلومات الطلبية</strong>
            <p><strong>الحالة:</strong> {order.status === "Open" ? "مفتوحة" : "مكتملة"}</p>
            {order.description && (
              <p><strong>الوصف:</strong> {order.description}</p>
            )}
            <p><strong>تاريخ الإنشاء:</strong> {new Date(order.createdAt).toLocaleDateString("ar")}</p>
          </div>
        </div>

        <div className="print-items-table">
          <h3 style={{ marginBottom: '10px' }}>قائمة الأصناف</h3>
          <table>
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
                <th>تفاصيل</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item: OrderItem, index: number) => (
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
                  <td>{item.remainingQty}</td>
                  <td>{item.details || "---"}</td>
                  <td>
                    {item.remainingQty === 0 ? "✓ مكتمل" : "⏳ قيد التنفيذ"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="print-summary">
          <h3 style={{ marginBottom: '10px' }}>ملخص الطلبية</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <div className="label">إجمالي الأصناف</div>
              <div className="value">{order.items.length}</div>
            </div>
            <div className="summary-item">
              <div className="label">الأصناف المكتملة</div>
              <div className="value" style={{ color: '#28a745' }}>
                {order.items.filter((item: OrderItem) => item.remainingQty === 0).length}
              </div>
            </div>
            <div className="summary-item">
              <div className="label">الأصناف قيد التنفيذ</div>
              <div className="value" style={{ color: '#ffc107' }}>
                {order.items.filter((item: OrderItem) => item.remainingQty > 0).length}
              </div>
            </div>
            <div className="summary-item">
              <div className="label">إجمالي الكمية المطلوبة</div>
              <div className="value">{totalRequired}</div>
            </div>
            <div className="summary-item">
              <div className="label">إجمالي المنجز</div>
              <div className="value" style={{ color: '#28a745' }}>{totalCompleted}</div>
            </div>
            <div className="summary-item">
              <div className="label">إجمالي الناقص</div>
              <div className="value" style={{ color: '#dc3545' }}>{totalRemaining}</div>
            </div>
          </div>
        </div>

        <div className="print-footer">
          <p>تم الطباعة من نظام إدارة الطلبيات</p>
          <p style={{ marginTop: '5px', fontSize: '10px' }}>
            {new Date().toLocaleString('ar')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;