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

  // تنظيف data-print-mode لو المستخدم لغى الطباعة بدون ما يكمل
  useEffect(() => {
    const clearPrintMode = () => document.body.removeAttribute("data-print-mode");
    window.addEventListener("afterprint", clearPrintMode);
    return () => {
      window.removeEventListener("afterprint", clearPrintMode);
      clearPrintMode();
    };
  }, []);

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

  const handlePrintCurrentOrder = () => {
    if (!order) {
      alert("لا توجد طلبية للطباعة");
      return;
    }
    // إلغاء أي وضع تعديل مفتوح، عشان ما تطبع input بدل نص عادي
    if (editingItemId) cancelEditItem();

    document.body.setAttribute("data-print-mode", "order");
    window.print();
    // afterprint listener فوق رح يشيل الـ attribute تلقائياً
  };

  if (loading) {
    return <div className="loading-state1">جاري تحميل بيانات الطلبية...</div>;
  }

  if (!order) {
    return <div className="not-found-state1">الطلبية غير موجودة</div>;
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
    <div className="order-details-container1">
      <div className="order-header-section1">
        <div className="order-title-group1">
          <h1>تفاصيل الطلبية</h1>
          <span className="order-number-badge1">#{order.orderNumber}</span>
        </div>
        <div className="header-actions1">
          <button
            className="btn-print-order1"
            onClick={handlePrintCurrentOrder}
          >
            📄 طباعة الطلبية
          </button>
          <button className="btn-back-action1" onClick={() => navigate(-1)}>
            ← رجوع
          </button>
        </div>
      </div>

      <div className="info-grid-layout1">
        <div className="info-card-component1">
          <h3>معلومات العميل</h3>
          <p><strong>الاسم:</strong> {order.customer?.name}</p>
          <p><strong>الهاتف:</strong> {order.customer?.phone || "---"}</p>
          <p><strong>البريد:</strong> {order.customer?.email || "---"}</p>
        </div>

        <div className="info-card-component1">
          <h3>معلومات الطلبية</h3>
          <p>
            <strong>الحالة:</strong>
            <span className={`status-indicator1 ${order.status?.toLowerCase()}`}>
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

      <div className="items-section-wrapper1">
        <h2>الأصناف</h2>
        <div className="table-scroll-wrapper1">
          <table className="items-data-table1">
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
                      <td>
                        <button
                          className="btn-item-save1"
                          onClick={() => saveEditItem(item._id)}
                          disabled={savingItem}
                        >
                          {savingItem ? "..." : "✔ حفظ"}
                        </button>
                        <button className="btn-item-cancel1" onClick={cancelEditItem}>
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
                    <td className={item.remainingQty > 0 ? "remaining-value-highlight1" : ""}>
                      {item.remainingQty}
                    </td>
                    <td className="item-details-text1">{item.details || "---"}</td>
                    <td>
                      <span className={`item-status-badge1 ${item.remainingQty === 0 ? "completed1" : "pending1"}`}>
                        {item.remainingQty === 0 ? "✓ مكتمل" : "⏳ قيد التنفيذ"}
                      </span>
                    </td>
                    <td>
                      <button className="btn-item-edit1" onClick={() => startEditItem(item)}>
                        ✏️
                      </button>
                      <button
                        className="btn-item-delete1"
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

      <div className="linked-stones-section-wrapper1">
        <h2>🏷️ المشاتيح المرتبطة</h2>

        {loadingStones ? (
          <p className="stones-loading-message1">جاري تحميل المشاتيح...</p>
        ) : stones.length === 0 ? (
          <p className="stones-empty-message1">لا يوجد مشاتيح مرتبطة بهذه الطلبية بعد</p>
        ) : (
          <div className="stones-grid-list1">
            {stones.map((stone) => (
              <div key={stone._id} className="stone-card-item1">
                <svg
                  className="stone-barcode-image1"
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
                  className={`stone-status-badge1 ${
                    stone.status === "In Stock" ? "in-stock1" : "shipped1"
                  }`}
                >
                  {stone.status === "In Stock" ? "متوفر" : "مشحون"}
                </span>
                <div className="stone-types-list1">
                  {stone.items.map((it) => it.stoneType).join("، ")}
                </div>
                <div className="stone-totals-info1">
                  {stone.totalLinearMeter?.toFixed(2)} م.ط ، {stone.totalArea?.toFixed(2)} م²
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="order-summary-section1">
        <h3>ملخص الطلبية</h3>
        <div className="summary-stats-grid1">
          <div className="stat-item-box1">
            <span className="stat-label-text1">إجمالي الأصناف</span>
            <span className="stat-value-number1">{order.items.length}</span>
          </div>
          <div className="stat-item-box1">
            <span className="stat-label-text1">الأصناف المكتملة</span>
            <span className="stat-value-number1 success1">
              {order.items.filter((item: any) => item.remainingQty === 0).length}
            </span>
          </div>
          <div className="stat-item-box1">
            <span className="stat-label-text1">الأصناف قيد التنفيذ</span>
            <span className="stat-value-number1 warning1">
              {order.items.filter((item: any) => item.remainingQty > 0).length}
            </span>
          </div>
          <div className="stat-item-box1">
            <span className="stat-label-text1">إجمالي الكمية المطلوبة</span>
            <span className="stat-value-number1">{totalRequired}</span>
          </div>
          <div className="stat-item-box1">
            <span className="stat-label-text1">إجمالي المنجز</span>
            <span className="stat-value-number1 success1">{totalCompleted}</span>
          </div>
          <div className="stat-item-box1">
            <span className="stat-label-text1">إجمالي الناقص</span>
            <span className="stat-value-number1 warning1">{totalRemaining}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;