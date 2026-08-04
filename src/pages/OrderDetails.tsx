import { useEffect, useState, useRef } from "react";
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
  const [isPrinting, setIsPrinting] = useState(false);
  
  // Ref للحاوية المطبوعة
  const printContainerRef = useRef<HTMLDivElement>(null);

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

  // ===== وظيفة الطباعة =====
  const handlePrintOrder = () => {
    if (!order) {
      alert("لا توجد طلبية للطباعة");
      return;
    }

    setIsPrinting(true);
    
    // نستخدم setTimeout للتأكد من تحديث DOM
    setTimeout(() => {
      if (printContainerRef.current) {
        // جعل الحاوية مرئية
        printContainerRef.current.style.display = 'block';
        printContainerRef.current.classList.add('active1');
        
        // نمرر الأمر للطباعة بعد ظهور المحتوى
        setTimeout(() => {
          window.print();
        }, 500);
        
        // إعادة إخفاء الحاوية بعد الطباعة
        setTimeout(() => {
          if (printContainerRef.current) {
            printContainerRef.current.style.display = 'none';
            printContainerRef.current.classList.remove('active1');
          }
          setIsPrinting(false);
        }, 3000);
      }
    }, 100);
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
            className="btn-print-order1" 
            onClick={handlePrintOrder}
            disabled={isPrinting}
          >
            {isPrinting ? '⏳ جاري الطباعة...' : '🖨️ طباعة الطلبية'}
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

      {/* ===== حاوية الطباعة ===== */}
      <div 
        className="print-order-container1" 
        ref={printContainerRef}
        style={{ display: 'none' }}
      >
        <div className="print-order-item1">
          <div className="print-page1">
            <div className="print-header1">
              <h1>📋 تفاصيل الطلبية</h1>
              <div className="print-order-number1">رقم الطلبية: #{order.orderNumber}</div>
              <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
                تاريخ الطباعة: {new Date().toLocaleDateString("ar")} - {new Date().toLocaleTimeString("ar")}
              </div>
            </div>

            <div className="print-order-info1">
              <div className="info-group1">
                <h4 style={{ marginBottom: '10px', color: '#333' }}>👤 معلومات العميل</h4>
                <p><strong>الاسم:</strong> {order.customer?.name || '---'}</p>
                <p><strong>الهاتف:</strong> {order.customer?.phone || '---'}</p>
                <p><strong>البريد:</strong> {order.customer?.email || '---'}</p>
                <p><strong>العنوان:</strong> {order.customer?.address || '---'}</p>
              </div>
              <div className="info-group1">
                <h4 style={{ marginBottom: '10px', color: '#333' }}>📦 معلومات الطلبية</h4>
                <p><strong>الحالة:</strong> 
                  <span style={{ color: order.status === "Open" ? '#856404' : '#155724' }}>
                    {order.status === "Open" ? "🟡 مفتوحة" : "🟢 مكتملة"}
                  </span>
                </p>
                {order.description && <p><strong>الوصف:</strong> {order.description}</p>}
                <p><strong>تاريخ الإنشاء:</strong> {new Date(order.createdAt).toLocaleDateString("ar")}</p>
                <p><strong>آخر تحديث:</strong> {new Date(order.updatedAt).toLocaleDateString("ar")}</p>
              </div>
            </div>

            <div className="print-items-table1">
              <h3 style={{ marginBottom: '10px' }}>📊 قائمة الأصناف</h3>
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
                  {order.items.map((item: any, index: number) => (
                    <tr key={item._id}>
                      <td>{index + 1}</td>
                      <td><strong>{item.stoneType}</strong></td>
                      <td>{item.length || '---'}</td>
                      <td>{item.width || '---'}</td>
                      <td>{item.thickness || '---'}</td>
                      <td>
                        {item.unit === "pieces" ? "قطع" : 
                         item.unit === "linearMeter" ? "متر طولي" : "مساحة"}
                      </td>
                      <td>{item.requiredQty}</td>
                      <td style={{ 
                        color: item.remainingQty > 0 ? '#dc3545' : '#28a745', 
                        fontWeight: 'bold' 
                      }}>
                        {item.remainingQty}
                      </td>
                      <td>{item.details || '---'}</td>
                      <td>
                        <span style={{ 
                          color: item.remainingQty === 0 ? '#28a745' : '#ffc107' 
                        }}>
                          {item.remainingQty === 0 ? '✅ مكتمل' : '⏳ قيد التنفيذ'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f8f9fa', fontWeight: 'bold' }}>
                    <td colSpan={6} style={{ textAlign: 'left' }}>المجموع</td>
                    <td>{totalRequired}</td>
                    <td>{totalRemaining}</td>
                    <td colSpan={2}>{totalCompleted} مكتمل</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="print-summary1">
              <h3 style={{ marginBottom: '10px' }}>📈 ملخص الطلبية</h3>
              <div className="summary-grid1">
                <div className="summary-item1">
                  <div className="label1">📦 إجمالي الأصناف</div>
                  <div className="value1" style={{ color: '#007bff' }}>{order.items.length}</div>
                </div>
                <div className="summary-item1">
                  <div className="label1">✅ الأصناف المكتملة</div>
                  <div className="value1" style={{ color: '#28a745' }}>
                    {order.items.filter((item: any) => item.remainingQty === 0).length}
                  </div>
                </div>
                <div className="summary-item1">
                  <div className="label1">⏳ قيد التنفيذ</div>
                  <div className="value1" style={{ color: '#ffc107' }}>
                    {order.items.filter((item: any) => item.remainingQty > 0).length}
                  </div>
                </div>
                <div className="summary-item1">
                  <div className="label1">📊 إجمالي الكمية</div>
                  <div className="value1" style={{ color: '#17a2b8' }}>{totalRequired}</div>
                </div>
                <div className="summary-item1">
                  <div className="label1">✅ المنجز</div>
                  <div className="value1" style={{ color: '#28a745' }}>{totalCompleted}</div>
                </div>
                <div className="summary-item1">
                  <div className="label1">⚠️ الناقص</div>
                  <div className="value1" style={{ color: '#dc3545' }}>{totalRemaining}</div>
                </div>
              </div>
            </div>

            {stones.length > 0 && (
              <div className="print-stones-section1">
                <h3 style={{ marginBottom: '10px' }}>🏷️ المشاتيح المرتبطة</h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                  gap: '15px' 
                }}>
                  {stones.map((stone) => (
                    <div key={stone._id} style={{ 
                      background: '#f8f9fa', 
                      padding: '10px', 
                      borderRadius: '5px', 
                      textAlign: 'center', 
                      border: '1px solid #dee2e6' 
                    }}>
                      <div style={{ fontSize: '11px', color: '#666', marginBottom: '5px' }}>باركود</div>
                      <div style={{ 
                        fontSize: '16px', 
                        fontWeight: 'bold', 
                        fontFamily: 'monospace', 
                        margin: '5px 0' 
                      }}>
                        {stone.barcode}
                      </div>
                      <div style={{ fontSize: '12px', color: '#555' }}>
                        <span style={{ 
                          color: stone.status === 'In Stock' ? '#28a745' : '#0056b3' 
                        }}>
                          {stone.status === 'In Stock' ? '✅ متوفر' : '📤 مشحون'}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#888', marginTop: '5px' }}>
                        {stone.items.map((it) => it.stoneType).join('، ')}
                      </div>
                      <div style={{ fontSize: '10px', color: '#999', marginTop: '3px' }}>
                        {stone.totalLinearMeter?.toFixed(2) || 0} م.ط | {stone.totalArea?.toFixed(2) || 0} م²
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="print-footer1">
              <p>تم إنشاء هذا التقرير بواسطة نظام إدارة الطلبيات</p>
              <p style={{ fontSize: '10px', color: '#aaa' }}>
                © {new Date().getFullYear()} - جميع الحقوق محفوظة
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;