import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import JsBarcode from "jsbarcode";
import styles from "../styles/OrderDetails.module.css";

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
  const printRef = useRef<HTMLDivElement>(null);

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
      alert(error.response?.data?.message || "حدث خطأ أثناء حذف الصنف");
    } finally {
      setDeletingItemId(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className={styles.loadingState}>جاري تحميل بيانات الطلبية...</div>;
  }

  if (!order) {
    return <div className={styles.notFoundState}>الطلبية غير موجودة</div>;
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
    <div className={styles.container} ref={printRef}>
      {/* رأس الصفحة */}
      <div className={styles.headerSection}>
        <div className={styles.titleGroup}>
          <h1 className={styles.pageTitle}>📋 تفاصيل الطلبية</h1>
          <span className={styles.orderNumberBadge}>#{order.orderNumber}</span>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnPrint} onClick={handlePrint}>
            🖨️ طباعة
          </button>
          <button className={styles.btnBack} onClick={() => navigate(-1)}>
            ← رجوع
          </button>
        </div>
      </div>

      {/* معلومات العميل والطلب */}
      <div className={styles.infoGrid}>
        <div className={styles.infoCard}>
          <h3>👤 معلومات العميل</h3>
          <p>
            <span className={styles.label}>الاسم</span>
            <span className={styles.value}>{order.customer?.name || "---"}</span>
          </p>
          <p>
            <span className={styles.label}>الهاتف</span>
            <span className={styles.value}>{order.customer?.phone || "---"}</span>
          </p>
          <p>
            <span className={styles.label}>البريد الإلكتروني</span>
            <span className={styles.value}>{order.customer?.email || "---"}</span>
          </p>
        </div>

        <div className={styles.infoCard}>
          <h3>📦 معلومات الطلبية</h3>
          <p>
            <span className={styles.label}>الحالة</span>
            <span className={`${styles.statusBadge} ${order.status === "Open" ? styles.open : styles.completed}`}>
              {order.status === "Open" ? "🟢 مفتوحة" : "✅ مكتملة"}
            </span>
          </p>
          {order.description && (
            <p>
              <span className={styles.label}>الوصف</span>
              <span className={styles.value}>{order.description}</span>
            </p>
          )}
          <p>
            <span className={styles.label}>تاريخ الإنشاء</span>
            <span className={styles.value}>{new Date(order.createdAt).toLocaleDateString("ar")}</span>
          </p>
          <p>
            <span className={styles.label}>آخر تحديث</span>
            <span className={styles.value}>{new Date(order.updatedAt).toLocaleDateString("ar")}</span>
          </p>
        </div>
      </div>

      {/* الأصناف */}
      <div className={styles.itemsSection}>
        <div className={styles.sectionHeader}>
          <h2>📊 الأصناف</h2>
          <span className={styles.itemsCount}>{order.items.length} صنف</span>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
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
                <th>التفاصيل</th>
                <th>الحالة</th>
                <th className={styles.noPrint}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item: any, index: number) => {
                const isEditing = editingItemId === item._id;

                if (isEditing && editItem) {
                  return (
                    <tr key={item._id} className={styles.editingRow}>
                      <td>{index + 1}</td>
                      <td>
                        <input
                          type="text"
                          className={styles.inputField}
                          value={editItem.stoneType}
                          onChange={(e) => setEditItem({ ...editItem, stoneType: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className={styles.inputField}
                          value={editItem.length || ""}
                          onChange={(e) => setEditItem({ ...editItem, length: Number(e.target.value) })}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className={styles.inputField}
                          value={editItem.width || ""}
                          onChange={(e) => setEditItem({ ...editItem, width: Number(e.target.value) })}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className={styles.inputField}
                          value={editItem.thickness || ""}
                          onChange={(e) => setEditItem({ ...editItem, thickness: Number(e.target.value) })}
                        />
                      </td>
                      <td>
                        <select
                          className={styles.selectField}
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
                          className={styles.inputField}
                          value={editItem.requiredQty || ""}
                          onChange={(e) => setEditItem({ ...editItem, requiredQty: Number(e.target.value) })}
                        />
                      </td>
                      <td>{item.remainingQty}</td>
                      <td>
                        <input
                          type="text"
                          className={styles.inputField}
                          placeholder="تفاصيل إضافية..."
                          value={editItem.details}
                          onChange={(e) => setEditItem({ ...editItem, details: e.target.value })}
                        />
                      </td>
                      <td>---</td>
                      <td className={styles.noPrint}>
                        <button className={styles.btnSave} onClick={() => saveEditItem(item._id)} disabled={savingItem}>
                          {savingItem ? "⏳" : "💾"}
                        </button>
                        <button className={styles.btnCancel} onClick={cancelEditItem}>
                          ✖
                        </button>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={item._id}>
                    <td>{index + 1}</td>
                    <td><span className={styles.stoneType}>{item.stoneType}</span></td>
                    <td>{item.length || "---"}</td>
                    <td>{item.width || "---"}</td>
                    <td>{item.thickness || "---"}</td>
                    <td>
                      {item.unit === "pieces" && "قطع"}
                      {item.unit === "linearMeter" && "متر طولي"}
                      {item.unit === "area" && "مساحة"}
                    </td>
                    <td>{item.requiredQty}</td>
                    <td className={item.remainingQty > 0 ? styles.remaining : ""}>
                      {item.remainingQty}
                    </td>
                    <td className={styles.details}>{item.details || "---"}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${item.remainingQty === 0 ? styles.completed : styles.pending}`}>
                        {item.remainingQty === 0 ? "✅" : "⏳"}
                      </span>
                    </td>
                    <td className={styles.noPrint}>
                      <button className={styles.btnEdit} onClick={() => startEditItem(item)}>
                        ✏️
                      </button>
                      <button
                        className={styles.btnDelete}
                        onClick={() => deleteItem(item._id)}
                        disabled={deletingItemId === item._id}
                      >
                        {deletingItemId === item._id ? "⏳" : "🗑️"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* المشاتيح */}
      <div className={`${styles.stonesSection} ${styles.noPrint}`}>
        <div className={styles.sectionHeader}>
          <h2>🏷️ المشاتيح المرتبطة</h2>
          <span className={styles.itemsCount}>{stones.length} مفتاح</span>
        </div>

        {loadingStones ? (
          <p className={styles.loadingMessage}>جاري تحميل المشاتيح...</p>
        ) : stones.length === 0 ? (
          <p className={styles.emptyMessage}>لا يوجد مشاتيح مرتبطة بهذه الطلبية</p>
        ) : (
          <div className={styles.stonesGrid}>
            {stones.map((stone) => (
              <div key={stone._id} className={styles.stoneCard}>
                <svg
                  className={styles.barcodeImage}
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
                    } catch (err) {}
                  }}
                />
                <span className={`${styles.stoneStatus} ${stone.status === "In Stock" ? styles.inStock : styles.shipped}`}>
                  {stone.status === "In Stock" ? "📦 متوفر" : "🚚 مشحون"}
                </span>
                <div className={styles.stoneTypes}>
                  {stone.items.map((it) => it.stoneType).join("، ")}
                </div>
                <div className={styles.stoneMeasurements}>
                  {stone.totalLinearMeter?.toFixed(2)} م.ط | {stone.totalArea?.toFixed(2)} م²
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* الملخص */}
      <div className={styles.summarySection}>
        <h3>📈 ملخص الطلبية</h3>
        <div className={styles.summaryGrid}>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📦</span>
            <span className={styles.statLabel}>إجمالي الأصناف</span>
            <span className={styles.statValue}>{order.items.length}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>✅</span>
            <span className={styles.statLabel}>الأصناف المكتملة</span>
            <span className={`${styles.statValue} ${styles.success}`}>
              {order.items.filter((item: any) => item.remainingQty === 0).length}
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>⏳</span>
            <span className={styles.statLabel}>الأصناف قيد التنفيذ</span>
            <span className={`${styles.statValue} ${styles.warning}`}>
              {order.items.filter((item: any) => item.remainingQty > 0).length}
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📊</span>
            <span className={styles.statLabel}>إجمالي الكمية المطلوبة</span>
            <span className={styles.statValue}>{totalRequired}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>✔️</span>
            <span className={styles.statLabel}>إجمالي المنجز</span>
            <span className={`${styles.statValue} ${styles.success}`}>{totalCompleted}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>⚠️</span>
            <span className={styles.statLabel}>إجمالي الناقص</span>
            <span className={`${styles.statValue} ${styles.warning}`}>{totalRemaining}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;