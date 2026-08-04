import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import JsBarcode from "jsbarcode";
import "../styles/OrderDetails.css";

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

  // ===== وظيفة طباعة تفاصيل الطلبية =====
  const handlePrintOrderDetails = () => {
    if (!order) {
      alert("لا توجد طلبية للطباعة");
      return;
    }

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    const totalRequired = order.items.reduce(
      (sum: number, item: any) => sum + (item.requiredQty || 0), 0
    );
    const totalRemaining = order.items.reduce(
      (sum: number, item: any) => sum + (item.remainingQty || 0), 0
    );
    const totalCompleted = totalRequired - totalRemaining;

    let itemsRows = '';
    order.items.forEach((item: any, index: number) => {
      itemsRows += `
        <tr>
          <td>${index + 1}</td>
          <td>${item.stoneType}</td>
          <td>${item.length || '---'}</td>
          <td>${item.width || '---'}</td>
          <td>${item.thickness || '---'}</td>
          <td>${item.unit === "pieces" ? "قطع" : item.unit === "linearMeter" ? "متر طولي" : "مساحة"}</td>
          <td>${item.requiredQty}</td>
          <td>${item.remainingQty}</td>
          <td>${item.details || '---'}</td>
          <td>${item.remainingQty <= 0 ? '✅ مكتمل' : '⏳ قيد التنفيذ'}</td>
        </tr>
      `;
    });

    let stonesHTML = '';
    if (stones.length > 0) {
      stonesHTML = `
        <div class="stones-section">
          <h3>🏷️ المشاتيح المرتبطة</h3>
          <div class="stones-grid">
            ${stones.map((stone) => `
              <div class="stone-item">
                <div class="stone-barcode">${stone.barcode}</div>
                <div class="stone-status ${stone.status === 'In Stock' ? 'in-stock' : 'shipped'}">
                  ${stone.status === 'In Stock' ? '✅ متوفر' : '📤 مشحون'}
                </div>
                <div class="stone-types">${stone.items.map((it) => it.stoneType).join('، ')}</div>
                <div class="stone-totals">${stone.totalLinearMeter?.toFixed(2) || 0} م.ط | ${stone.totalArea?.toFixed(2) || 0} م²</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <title>تفاصيل الطلبية #${order.orderNumber}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: "Arial", "Tahoma", sans-serif;
              padding: 20px;
              background: white;
              direction: rtl;
              font-size: 14px;
              line-height: 1.6;
            }
            .print-header {
              text-align: center;
              border-bottom: 3px solid #333;
              padding-bottom: 20px;
              margin-bottom: 25px;
            }
            .print-header h1 {
              font-size: 26px;
              color: #000;
              margin-bottom: 5px;
            }
            .print-header .order-number {
              font-size: 20px;
              color: #555;
            }
            .print-header .print-date {
              font-size: 12px;
              color: #888;
              margin-top: 5px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 25px;
              padding: 15px;
              background: #f9f9f9;
              border-radius: 8px;
            }
            .info-group h4 {
              margin-bottom: 10px;
              color: #333;
            }
            .info-group p {
              margin: 5px 0;
              color: #555;
            }
            .info-group p strong {
              color: #333;
            }
            .items-table {
              margin: 20px 0;
            }
            .items-table h3 {
              margin-bottom: 10px;
              color: #333;
            }
            .items-table table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
            }
            .items-table th {
              background: #333;
              color: white;
              padding: 10px;
              text-align: center;
              border: 1px solid #333;
            }
            .items-table td {
              padding: 8px 10px;
              border: 1px solid #ddd;
              text-align: center;
            }
            .items-table tr:nth-child(even) {
              background: #f9f9f9;
            }
            .items-table tfoot td {
              background: #f8f9fa;
              font-weight: bold;
              border-top: 2px solid #333;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
              margin: 20px 0;
              padding: 15px;
              background: #f9f9f9;
              border-radius: 8px;
            }
            .summary-item {
              text-align: center;
              padding: 12px;
              background: white;
              border-radius: 5px;
              border-right: 3px solid #007bff;
            }
            .summary-item .label {
              font-size: 12px;
              color: #666;
            }
            .summary-item .value {
              font-size: 20px;
              font-weight: bold;
              margin-top: 5px;
            }
            .summary-item .value.success { color: #28a745; }
            .summary-item .value.warning { color: #ffc107; }
            .summary-item .value.danger { color: #dc3545; }
            .summary-item .value.primary { color: #007bff; }
            
            .stones-section {
              margin-top: 25px;
              padding-top: 20px;
              border-top: 2px solid #eee;
            }
            .stones-section h3 {
              margin-bottom: 15px;
              color: #333;
            }
            .stones-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
              gap: 15px;
            }
            .stone-item {
              background: #f8f9fa;
              padding: 12px;
              border-radius: 5px;
              text-align: center;
              border: 1px solid #dee2e6;
            }
            .stone-item .stone-barcode {
              font-size: 14px;
              font-weight: bold;
              font-family: monospace;
              margin-bottom: 5px;
            }
            .stone-item .stone-status {
              font-size: 12px;
              font-weight: bold;
              margin: 5px 0;
            }
            .stone-item .stone-status.in-stock { color: #28a745; }
            .stone-item .stone-status.shipped { color: #0056b3; }
            .stone-item .stone-types {
              font-size: 12px;
              color: #555;
              margin: 5px 0;
            }
            .stone-item .stone-totals {
              font-size: 11px;
              color: #888;
            }
            
            .print-footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 2px solid #ddd;
              text-align: center;
              font-size: 11px;
              color: #888;
            }
            .print-footer p {
              margin: 3px 0;
            }
            
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
              .info-grid { background: #f9f9f9 !important; }
              .items-table th { background: #333 !important; color: white !important; }
              .summary-item { background: white !important; }
              .stone-item { background: #f8f9fa !important; }
            }
            
            @media (max-width: 768px) {
              .info-grid { grid-template-columns: 1fr; }
              .summary-grid { grid-template-columns: 1fr 1fr; }
              .stones-grid { grid-template-columns: 1fr 1fr; }
            }
            @media (max-width: 480px) {
              .summary-grid { grid-template-columns: 1fr; }
              .stones-grid { grid-template-columns: 1fr; }
              .items-table table { font-size: 10px; }
              .items-table th, .items-table td { padding: 5px; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom:15px;">
            <button onclick="window.print()" style="padding:10px 20px;background:#007bff;color:white;border:none;border-radius:5px;cursor:pointer;font-size:16px;margin-left:10px;">
              🖨️ طباعة
            </button>
            <button onclick="window.close()" style="padding:10px 20px;background:#dc3545;color:white;border:none;border-radius:5px;cursor:pointer;font-size:16px;">
              ✕ إغلاق
            </button>
          </div>

          <div class="print-header">
            <h1>📋 تفاصيل الطلبية</h1>
            <div class="order-number">رقم الطلبية: #${order.orderNumber}</div>
            <div class="print-date">تاريخ الطباعة: ${new Date().toLocaleDateString("ar")} - ${new Date().toLocaleTimeString("ar")}</div>
          </div>

          <div class="info-grid">
            <div class="info-group">
              <h4>👤 معلومات العميل</h4>
              <p><strong>الاسم:</strong> ${order.customer?.name || '---'}</p>
              <p><strong>الهاتف:</strong> ${order.customer?.phone || '---'}</p>
              <p><strong>البريد:</strong> ${order.customer?.email || '---'}</p>
              <p><strong>العنوان:</strong> ${order.customer?.address || '---'}</p>
            </div>
            <div class="info-group">
              <h4>📦 معلومات الطلبية</h4>
              <p><strong>الحالة:</strong> ${order.status === "Open" ? "🟡 مفتوحة" : "🟢 مكتملة"}</p>
              ${order.description ? `<p><strong>الوصف:</strong> ${order.description}</p>` : ''}
              <p><strong>تاريخ الإنشاء:</strong> ${new Date(order.createdAt).toLocaleDateString("ar")}</p>
              <p><strong>آخر تحديث:</strong> ${new Date(order.updatedAt).toLocaleDateString("ar")}</p>
            </div>
          </div>

          <div class="items-table">
            <h3>📊 قائمة الأصناف</h3>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>نوع الحجر</th>
                  <th>الطول (سم)</th>
                  <th>العرض (سم)</th>
                  <th>السمك (سم)</th>
                  <th>الوحدة</th>
                  <th>الكمية المطلوبة</th>
                  <th>الكمية المتبقية</th>
                  <th>التفاصيل</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="6" style="text-align:left;">المجموع</td>
                  <td>${totalRequired}</td>
                  <td>${totalRemaining}</td>
                  <td colspan="2">${totalCompleted} مكتمل</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div class="summary-grid">
            <div class="summary-item">
              <div class="label">📦 إجمالي الأصناف</div>
              <div class="value primary">${order.items.length}</div>
            </div>
            <div class="summary-item">
              <div class="label">✅ الأصناف المكتملة</div>
              <div class="value success">${order.items.filter((item: any) => item.remainingQty <= 0).length}</div>
            </div>
            <div class="summary-item">
              <div class="label">⏳ قيد التنفيذ</div>
              <div class="value warning">${order.items.filter((item: any) => item.remainingQty > 0).length}</div>
            </div>
            <div class="summary-item">
              <div class="label">📊 إجمالي الكمية</div>
              <div class="value primary">${totalRequired}</div>
            </div>
            <div class="summary-item">
              <div class="label">✅ المنجز</div>
              <div class="value success">${totalCompleted}</div>
            </div>
            <div class="summary-item">
              <div class="label">⚠️ الناقص</div>
              <div class="value danger">${totalRemaining}</div>
            </div>
          </div>

          ${stonesHTML}

          <div class="print-footer">
            <p>تم إنشاء هذا التقرير بواسطة نظام إدارة الطلبيات</p>
            <p>© ${new Date().getFullYear()} - جميع الحقوق محفوظة</p>
          </div>

          <script>
            setTimeout(() => {
              window.print();
            }, 1000);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return <div className="loading-state1">جاري تحميل بيانات الطلبية...</div>;
  }

  if (!order) {
    return <div className="not-found-state1">الطلبية غير موجودة</div>;
  }

  const totalRequired = order.items.reduce(
    (sum: number, item: any) => sum + (item.requiredQty || 0), 0
  );
  const totalRemaining = order.items.reduce(
    (sum: number, item: any) => sum + (item.remainingQty || 0), 0
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
            className="btn-print-details1" 
            onClick={handlePrintOrderDetails}
          >
            🖨️ طباعة التفاصيل
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
            <p><strong>الوصف:</strong> {order.description}</p>
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
                      <span className={`item-status-badge1 ${item.remainingQty <= 0 ? "completed1" : "pending1"}`}>
                        {item.remainingQty <= 0 ? "✓ مكتمل" : "⏳ قيد التنفيذ"}
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
              {order.items.filter((item: any) => item.remainingQty <= 0).length}
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