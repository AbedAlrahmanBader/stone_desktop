import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../styles/orderDetails.css";

interface EditItemState {
  stoneType: string;
  unit: string;
  length: number;
  width: number;
  thickness: number;
  requiredQty: number;
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

  // المشاتيح المرتبطة بهذه الطلبية
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

  if (loading) {
    return <div className="loading">جاري تحميل بيانات الطلبية...</div>;
  }

  if (!order) {
    return <div className="not-found">الطلبية غير موجودة</div>;
  }

  return (
    <div className="order-details">
      <div className="order-header">
        <div className="order-title">
          <h1>تفاصيل الطلبية</h1>
          <span className="order-number">#{order.orderNumber}</span>
        </div>
        <button className="btn-back" onClick={() => navigate(-1)}>
          ← رجوع
        </button>
      </div>

      <div className="order-info-grid">
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
          <p><strong>تاريخ الإنشاء:</strong> {new Date(order.createdAt).toLocaleDateString("ar")}</p>
          <p><strong>آخر تحديث:</strong> {new Date(order.updatedAt).toLocaleDateString("ar")}</p>
        </div>
      </div>

      <div className="items-section">
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
                <th>الحالة</th>
                <th>الإجراءات</th>
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
                      <td>---</td>
                      <td>
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
                    <td>{item.remainingQty}</td>
                    <td>
                      <span className={`item-status ${item.remainingQty === 0 ? "completed" : "pending"}`}>
                        {item.remainingQty === 0 ? "✓ مكتمل" : "⏳ قيد التنفيذ"}
                      </span>
                    </td>
                    <td>
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

      <div className="linked-stones-section">
        <h2>🏷️ المشاتيح المرتبطة</h2>

        {loadingStones ? (
          <p className="stones-loading">جاري تحميل المشاتيح...</p>
        ) : stones.length === 0 ? (
          <p className="stones-empty">لا يوجد مشاتيح مرتبطة بهذه الطلبية بعد</p>
        ) : (
          <div className="linked-stones-list">
            {stones.map((stone) => (
              <div key={stone._id} className="linked-stone-card">
                <div className="linked-stone-barcode">{stone.barcode}</div>
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

      <div className="order-summary">
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
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;
