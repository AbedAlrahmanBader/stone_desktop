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

  // دالة الطباعة
  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const originalContent = document.body.innerHTML;

      // إضافة أنماط الطباعة
      const printStyles = `
        <style>
          @media print {
            body * {
              visibility: hidden;
            }
            .print-area, .print-area * {
              visibility: visible;
            }
            .print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 20px;
              background: white;
            }
            .print-area .no-print {
              display: none !important;
            }
            .print-area table {
              width: 100%;
              border-collapse: collapse;
            }
            .print-area th {
              background: #2563eb !important;
              color: white !important;
              padding: 10px !important;
              text-align: right !important;
            }
            .print-area td {
              padding: 8px !important;
              border: 1px solid #ddd !important;
            }
            .print-area .print-header {
              text-align: center;
              margin-bottom: 20px;
            }
            .print-area .print-header h1 {
              font-size: 24px;
              margin: 0;
            }
            .print-area .print-header h2 {
              font-size: 18px;
              color: #666;
              margin: 5px 0;
            }
            .print-area .print-info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 20px;
            }
            .print-area .print-info-box {
              border: 1px solid #ddd;
              padding: 15px;
              border-radius: 8px;
            }
            .print-area .print-info-box h3 {
              margin: 0 0 10px 0;
              font-size: 16px;
            }
            .print-area .print-info-box p {
              margin: 5px 0;
              font-size: 14px;
            }
            .print-area .print-summary {
              margin-top: 20px;
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
            }
            .print-area .print-stat {
              border: 1px solid #ddd;
              padding: 15px;
              text-align: center;
              border-radius: 8px;
            }
            .print-area .print-stat .label {
              font-size: 14px;
              color: #666;
            }
            .print-area .print-stat .value {
              font-size: 22px;
              font-weight: bold;
              margin-top: 5px;
            }
            .print-area .print-footer {
              margin-top: 30px;
              text-align: center;
              color: #999;
              font-size: 12px;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }
            .print-area .status-badge {
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
            }
            .print-area .status-badge.completed {
              background: #d1fae5;
              color: #065f46;
            }
            .print-area .status-badge.pending {
              background: #fef3c7;
              color: #92400e;
            }
            .print-area .status-badge.open {
              background: #dbeafe;
              color: #1e40af;
            }
          }
        </style>
      `;

      // إنشاء محتوى الطباعة
      const printHtml = `
        <div class="print-area">
          ${printStyles}
          ${printContent}
        </div>
      `;

      document.body.innerHTML = printHtml;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload();
    }
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
    <div className={styles.container}>
      {/* منطقة الطباعة */}
      <div ref={printRef} className="print-area-content">
        {/* رأس الصفحة */}
        <div className={styles.headerSection}>
          <div className={styles.titleGroup}>
            <h1 className={styles.pageTitle}>تفاصيل الطلبية</h1>
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
            <h3>معلومات العميل</h3>
            <p><strong>الاسم:</strong> {order.customer?.name}</p>
            <p><strong>الهاتف:</strong> {order.customer?.phone || "---"}</p>
            <p><strong>البريد:</strong> {order.customer?.email || "---"}</p>
          </div>

          <div className={styles.infoCard}>
            <h3>معلومات الطلبية</h3>
            <p>
              <strong>الحالة:</strong>
              <span className={`${styles.statusIndicator} ${styles[order.status?.toLowerCase()]}`}>
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

        {/* الأصناف */}
        <div className={styles.itemsSection}>
          <h2>الأصناف</h2>
          <div className={styles.tableScrollWrapper}>
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
                  <th>الحالة</th>
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
                            className={styles.tableInput}
                            value={editItem.stoneType}
                            onChange={(e) => setEditItem({ ...editItem, stoneType: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className={styles.tableInput}
                            value={editItem.length || ""}
                            onChange={(e) => setEditItem({ ...editItem, length: Number(e.target.value) })}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className={styles.tableInput}
                            value={editItem.width || ""}
                            onChange={(e) => setEditItem({ ...editItem, width: Number(e.target.value) })}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className={styles.tableInput}
                            value={editItem.thickness || ""}
                            onChange={(e) => setEditItem({ ...editItem, thickness: Number(e.target.value) })}
                          />
                        </td>
                        <td>
                          <select
                            className={styles.tableSelect}
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
                            className={styles.tableInput}
                            value={editItem.requiredQty || ""}
                            onChange={(e) => setEditItem({ ...editItem, requiredQty: Number(e.target.value) })}
                          />
                        </td>
                        <td>{item.remainingQty}</td>
                        <td>
                          <span className={`${styles.itemStatusBadge} ${item.remainingQty === 0 ? styles.completed : styles.pending}`}>
                            {item.remainingQty === 0 ? "✓ مكتمل" : "⏳ قيد التنفيذ"}
                          </span>
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
                      <td className={item.remainingQty > 0 ? styles.remainingHighlight : ""}>
                        {item.remainingQty}
                      </td>
                      <td>
                        <span className={`${styles.itemStatusBadge} ${item.remainingQty === 0 ? styles.completed : styles.pending}`}>
                          {item.remainingQty === 0 ? "✓ مكتمل" : "⏳ قيد التنفيذ"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* المشاتيح - مخفية في الطباعة */}
        <div className={`${styles.stonesSection} no-print`}>
          <h2>🏷️ المشاتيح المرتبطة</h2>

          {loadingStones ? (
            <p className={styles.stonesLoadingMessage}>جاري تحميل المشاتيح...</p>
          ) : stones.length === 0 ? (
            <p className={styles.stonesEmptyMessage}>لا يوجد مشاتيح مرتبطة بهذه الطلبية بعد</p>
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
                      } catch (err) {
                        // Silently handle barcode errors
                      }
                    }}
                  />
                  <span
                    className={`${styles.stoneStatusBadge} ${
                      stone.status === "In Stock" ? styles.inStock : styles.shipped
                    }`}
                  >
                    {stone.status === "In Stock" ? "متوفر" : "مشحون"}
                  </span>
                  <div className={styles.stoneTypesList}>
                    {stone.items.map((it) => it.stoneType).join("، ")}
                  </div>
                  <div className={styles.stoneTotals}>
                    {stone.totalLinearMeter?.toFixed(2)} م.ط ، {stone.totalArea?.toFixed(2)} م²
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* الملخص */}
        <div className={styles.summarySection}>
          <h3>ملخص الطلبية</h3>
          <div className={styles.summaryGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>إجمالي الأصناف</span>
              <span className={styles.statValue}>{order.items.length}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>الأصناف المكتملة</span>
              <span className={`${styles.statValue} ${styles.success}`}>
                {order.items.filter((item: any) => item.remainingQty === 0).length}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>الأصناف قيد التنفيذ</span>
              <span className={`${styles.statValue} ${styles.warning}`}>
                {order.items.filter((item: any) => item.remainingQty > 0).length}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>إجمالي الكمية المطلوبة</span>
              <span className={styles.statValue}>{totalRequired}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>إجمالي المنجز</span>
              <span className={`${styles.statValue} ${styles.success}`}>{totalCompleted}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>إجمالي الناقص</span>
              <span className={`${styles.statValue} ${styles.warning}`}>{totalRemaining}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;