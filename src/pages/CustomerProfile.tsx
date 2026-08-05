// CustomerProfile.tsx - الجزء المتعلق بالطلب
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../api/axios";
import ShipmentPrint from "../components/ShipmentPrint";

import "../styles/customerProfile.css";

interface NewOrderItem {
  stoneType: string;
  unit: string;
  requiredQty: number;
  length: number;
  width: number;
  thickness: number;
  details: string;
}

interface EditOrderItem extends NewOrderItem {
  _id?: string;
}

function CustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [loadingShipment, setLoadingShipment] = useState(false);
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [newOrder, setNewOrder] = useState<{ 
    orderNumber: string; 
    description: string;
    items: NewOrderItem[] 
  }>({
    orderNumber: "",
    description: "",
    items: [{ stoneType: "", unit: "pieces", requiredQty: 0, length: 0, width: 0, thickness: 0, details: "" }]
  });
  const [loading, setLoading] = useState(false);

  // ------- تعديل طلبية موجودة -------
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editOrder, setEditOrder] = useState<{ 
    orderNumber: string; 
    description: string;
    items: EditOrderItem[] 
  }>({
    orderNumber: "",
    description: "",
    items: []
  });
  const [editLoading, setEditLoading] = useState(false);

  // ------- طباعة الإرساليات -------
  const [printBatch, setPrintBatch] = useState<any[]>([]);
  const [autoPrint, setAutoPrint] = useState(false);

  // ------- فلاتر الإرساليات -------
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterConsignmentNumber, setFilterConsignmentNumber] = useState("");

  const loadCustomer = async () => {
    try {
      const res = await api.get(`/customers/profile/${id}`);
      setData(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadCustomer();
  }, [id]);

  const openShipment = async (shipmentId: string) => {
    setLoadingShipment(true);
    try {
      const res = await api.get(`/shipments/${shipmentId}`);
      setSelectedShipment(res.data);
    } catch (error) {
      console.error(error);
      alert("تعذر تحميل بيانات الإرسالية");
    } finally {
      setLoadingShipment(false);
    }
  };

  const closeShipment = () => {
    setSelectedShipment(null);
  };

  // إعادة تعيين فلاتر الإرساليات
  const resetShipmentFilters = () => {
    setFilterStatus("All");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterConsignmentNumber("");
  };

  // قائمة حالات الإرساليات الموجودة فعليًا لهذا العميل (لتعبئة الفلتر تلقائيًا)
  const availableShipmentStatuses = useMemo(() => {
    const set = new Set((data?.shipments || []).map((s: any) => s.status));
    return Array.from(set);
  }, [data?.shipments]);

  // إرساليات العميل بعد تطبيق الفلاتر
  const filteredShipments = useMemo(() => {
    const shipments = data?.shipments || [];

    return shipments.filter((shipment: any) => {
      const matchStatus =
        filterStatus === "All" || shipment.status === filterStatus;

      const matchConsignmentNumber =
        filterConsignmentNumber === "" ||
        String(shipment.consignmentNumber ?? "").includes(filterConsignmentNumber);

      const shipmentDate = new Date(shipment.createdAt);

      let matchFrom = true;
      if (filterDateFrom) {
        const fromDate = new Date(filterDateFrom);
        fromDate.setHours(0, 0, 0, 0);
        matchFrom = shipmentDate >= fromDate;
      }

      let matchTo = true;
      if (filterDateTo) {
        const toDate = new Date(filterDateTo);
        toDate.setHours(23, 59, 59, 999);
        matchTo = shipmentDate <= toDate;
      }

      return matchStatus && matchConsignmentNumber && matchFrom && matchTo;
    });
  }, [data?.shipments, filterStatus, filterConsignmentNumber, filterDateFrom, filterDateTo]);

  // فتح إرسالية وطباعتها فورًا (زر الطباعة بجانب كل سطر)
  const openShipmentAndPrint = async (shipmentId: string) => {
    setAutoPrint(true);
    await openShipment(shipmentId);
  };

  // طباعة إرسالية واحدة تلقائيًا بعد فتحها بالمودال
  useEffect(() => {
    if (selectedShipment && autoPrint) {
      const timer = setTimeout(() => {
        window.print();
        setAutoPrint(false);
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [selectedShipment, autoPrint]);

  // طباعة كل الإرساليات المفلترة دفعة وحدة
  const printAllShipments = () => {
    if (filteredShipments.length === 0) {
      alert("لا يوجد إرساليات لطباعتها");
      return;
    }
    setSelectedShipment(null);
    setPrintBatch(filteredShipments);
  };

  // لما تنجهز دفعة الطباعة، افتح نافذة الطباعة تلقائيًا
  useEffect(() => {
    if (printBatch.length > 0) {
      const timer = setTimeout(() => {
        window.print();
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [printBatch]);

  const handleAddOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validItems = newOrder.items.filter(
        item => item.stoneType.trim() && item.requiredQty > 0
      );

      if (validItems.length === 0) {
        alert("يرجى إضافة على الأقل صنف واحد صحيح");
        setLoading(false);
        return;
      }

      const orderData = {
        orderNumber: newOrder.orderNumber,
        description: newOrder.description,
        customer: id,
        items: validItems
      };

      await api.post("/orders", orderData);

      setShowAddOrder(false);
      setNewOrder({
        orderNumber: "",
        description: "",
        items: [{ stoneType: "", unit: "pieces", requiredQty: 0, length: 0, width: 0, thickness: 0, details: "" }]
      });
      await loadCustomer();

      alert("تم إضافة الطلبية بنجاح");
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "حدث خطأ أثناء إضافة الطلبية");
    } finally {
      setLoading(false);
    }
  };

  const addOrderItem = () => {
    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, { stoneType: "", unit: "pieces", requiredQty: 0, length: 0, width: 0, thickness: 0, details: "" }]
    });
  };

  const removeOrderItem = (index: number) => {
    if (newOrder.items.length === 1) {
      alert("لا يمكن حذف الصنف الوحيد");
      return;
    }
    const updatedItems = newOrder.items.filter((_, i) => i !== index);
    setNewOrder({ ...newOrder, items: updatedItems });
  };

  const updateOrderItem = (index: number, field: keyof NewOrderItem, value: any) => {
    const updatedItems = newOrder.items.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setNewOrder({ ...newOrder, items: updatedItems });
  };

  // ------- إجراءات تعديل الطلبية -------
  const startEditOrder = (order: any) => {
    setEditingOrderId(order._id);
    setEditOrder({
      orderNumber: order.orderNumber,
      description: order.description || "",
      items: (order.items || []).map((item: any) => ({
        _id: item._id,
        stoneType: item.stoneType,
        unit: item.unit,
        requiredQty: item.requiredQty,
        length: item.length || 0,
        width: item.width || 0,
        thickness: item.thickness || 0,
        details: item.details || "",
      }))
    });
  };

  const cancelEditOrder = () => {
    setEditingOrderId(null);
    setEditOrder({ orderNumber: "", description: "", items: [] });
  };

  const addEditOrderItem = () => {
    setEditOrder({
      ...editOrder,
      items: [...editOrder.items, { stoneType: "", unit: "pieces", requiredQty: 0, length: 0, width: 0, thickness: 0, details: "" }]
    });
  };

  const removeEditOrderItem = (index: number) => {
    if (editOrder.items.length === 1) {
      alert("لا يمكن حذف الصنف الوحيد");
      return;
    }
    setEditOrder({
      ...editOrder,
      items: editOrder.items.filter((_, i) => i !== index)
    });
  };

  const updateEditOrderItem = (index: number, field: keyof EditOrderItem, value: any) => {
    setEditOrder({
      ...editOrder,
      items: editOrder.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    });
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrderId) return;

    setEditLoading(true);

    try {
      const validItems = editOrder.items.filter(
        item => item.stoneType.trim() && item.requiredQty > 0
      );

      if (validItems.length === 0) {
        alert("يرجى إضافة على الأقل صنف واحد صحيح");
        setEditLoading(false);
        return;
      }

      await api.put(`/orders/${editingOrderId}`, {
        orderNumber: editOrder.orderNumber,
        description: editOrder.description,
        items: validItems
      });

      cancelEditOrder();
      await loadCustomer();

      alert("تم تعديل الطلبية بنجاح");
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "حدث خطأ أثناء تعديل الطلبية");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    const confirmed = window.confirm(
      "متأكد إنك بدك تحذف هذه الطلبية؟ هاد الإجراء ما بينرجع."
    );
    if (!confirmed) return;

    try {
      await api.delete(`/orders/${orderId}`);
      await loadCustomer();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "حدث خطأ أثناء حذف الطلبية");
    }
  };

  if (!data) {
    return <h2>جاري تحميل بيانات العميل...</h2>;
  }

  return (
    <div className="customer-profile">
      <h1>{data.customer?.name}</h1>

      <div className="customer-info">
        <h3>معلومات العميل</h3>
        <p>📞 الهاتف: {data.customer?.phone || "---"}</p>
        <p>📧 البريد: {data.customer?.email || "---"}</p>
        <p>📍 العنوان: {data.customer?.address || "---"}</p>
        <p>📦 الطلبات المتبقية: <strong>{data.remainingOrders || 0}</strong></p>
        <p>📦 إجمالي الإرساليات: <strong>{data.count || 0}</strong></p>
      </div>

      <div className="orders-section">
        <div className="section-header">
          <h2>📋 الطلبيات</h2>
          <button
            className="btn-add-order"
            onClick={() => setShowAddOrder(true)}
          >
            + إضافة طلبية
          </button>
        </div>

        {data.orders?.length === 0 ? (
          <h3>لا يوجد طلبيات لهذا العميل</h3>
        ) : (
          <table className="orders-table">
            <thead>
              <tr>
                <th>رقم الطلبية</th>
                <th>الوصف</th>
                <th>عدد الأصناف</th>
                <th>الحالة</th>
                <th>تاريخ الإنشاء</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {data.orders?.map((order: any) => (
                <tr key={order._id}>
                  <td>{order.orderNumber}</td>
                  <td>{order.description || "---"}</td>
                  <td>{order.items?.length || 0}</td>
                  <td>
                    <span className={`order-status ${order.status?.toLowerCase()}`}>
                      {order.status === "Open" ? "مفتوحة" : "مكتملة"}
                    </span>
                  </td>
                  <td>
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString("ar")
                      : "---"}
                  </td>
                  <td>
                    <button
                      className="btn-view-order"
                      onClick={() => navigate(`/orders/${order.orderNumber}`)}
                    >
                      عرض التفاصيل
                    </button>
                    <button
                      className="btn-edit-order"
                      onClick={() => startEditOrder(order)}
                    >
                      ✏️ تعديل
                    </button>
                    <button
                      className="btn-delete-order"
                      onClick={() => handleDeleteOrder(order._id)}
                    >
                      🗑 حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="section-header">
        <h2>🚚 الإرساليات</h2>
        <button
          type="button"
          className="btn-print-all"
          onClick={printAllShipments}
        >
          🖨 طباعة الكل ({filteredShipments.length})
        </button>
      </div>

      {data.shipments?.length === 0 ? (
        <h3>لا يوجد إرساليات لهذا العميل</h3>
      ) : (
        <>
          {/* شريط فلاتر الإرساليات */}
          <div className="shipments-filters">
            <div className="filter-field">
              <label>رقم الإرسالية</label>
              <input
                type="text"
                value={filterConsignmentNumber}
                onChange={(e) => setFilterConsignmentNumber(e.target.value)}
                placeholder="ابحث بالرقم..."
                dir="ltr"
              />
            </div>

            <div className="filter-field">
              <label>الحالة</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">الكل</option>
                {availableShipmentStatuses.map((status: any) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label>من تاريخ</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
              />
            </div>

            <div className="filter-field">
              <label>إلى تاريخ</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="btn-reset-filters"
              onClick={resetShipmentFilters}
            >
              ✕ إعادة تعيين
            </button>
          </div>

          <div className="filters-summary">
            عرض {filteredShipments.length} من أصل {data.shipments.length} إرسالية
          </div>

          <table>
            <thead>
              <tr>
                <th>رقم الإرسالية</th>
                <th>التاريخ</th>
                <th>عدد القطع</th>
                <th>المساحة الإجمالية</th>
                <th>الحالة</th>
                <th>عرض</th>
              </tr>
            </thead>

            <tbody>
              {filteredShipments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="no-results">
                    لا يوجد إرساليات مطابقة لهذا البحث
                  </td>
                </tr>
              ) : (
                filteredShipments.map((s: any) => (
                  <tr key={s._id}>
                    <td dir="ltr">{s.consignmentNumber ?? "---"}</td>
                    <td>
                      {s.createdAt
                        ? new Date(s.createdAt).toLocaleDateString("ar")
                        : "---"}
                    </td>

                    <td>{s.stones?.length ?? 0}</td>

                    <td>{s.totalArea ?? 0}</td>

                    <td>{s.status || "---"}</td>

                    <td>
                      <button
                        onClick={() => openShipment(s._id)}
                        disabled={loadingShipment}
                      >
                        فتح
                      </button>
                      <button
                        onClick={() => openShipmentAndPrint(s._id)}
                        disabled={loadingShipment}
                      >
                        🖨 طباعة
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </>
      )}

      {/* مودال إضافة طلبية */}
      {showAddOrder && (
        <div className="modal-overlay" onClick={() => setShowAddOrder(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>إضافة طلبية جديدة</h2>
              <button
                className="modal-close"
                onClick={() => setShowAddOrder(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddOrder}>
              <div className="form-group">
                <label>رقم الطلبية *</label>
                <input
                  type="text"
                  value={newOrder.orderNumber}
                  onChange={(e) => setNewOrder({ ...newOrder, orderNumber: e.target.value })}
                  required
                  placeholder="مثال: ORD-2024-001"
                />
              </div>

              <div className="form-group">
                <label>وصف الطلبية</label>
                <textarea
                  value={newOrder.description}
                  onChange={(e) => setNewOrder({ ...newOrder, description: e.target.value })}
                  placeholder="أدخل وصفاً للطلبية (اختياري)"
                  rows={3}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>

              <div className="form-group">
                <label>الأصناف</label>
                {newOrder.items.map((item, index) => (
                  <div key={index} className="order-item-row">
                    <input
                      type="text"
                      placeholder="نوع الحجر"
                      value={item.stoneType}
                      onChange={(e) => updateOrderItem(index, "stoneType", e.target.value)}
                      required
                    />
                    <select
                      value={item.unit}
                      onChange={(e) => updateOrderItem(index, "unit", e.target.value)}
                    >
                      <option value="pieces">قطع</option>
                      <option value="linearMeter">متر طولي</option>
                      <option value="area">مساحة</option>
                    </select>
                    <input
                      type="number"
                      placeholder="الطول (سم)"
                      value={item.length || ""}
                      onChange={(e) => updateOrderItem(index, "length", Number(e.target.value))}
                    />
                    <input
                      type="number"
                      placeholder="العرض (سم)"
                      value={item.width || ""}
                      onChange={(e) => updateOrderItem(index, "width", Number(e.target.value))}
                    />
                    <input
                      type="number"
                      placeholder="السمك (سم)"
                      value={item.thickness || ""}
                      onChange={(e) => updateOrderItem(index, "thickness", Number(e.target.value))}
                    />
                    <input
                      type="number"
                      placeholder="الكمية"
                      value={item.requiredQty || ""}
                      onChange={(e) => updateOrderItem(index, "requiredQty", Number(e.target.value))}
                      required
                      min="1"
                    />
                    <input
                      type="text"
                      placeholder="تفاصيل الصنف (اختياري)"
                      value={item.details}
                      onChange={(e) => updateOrderItem(index, "details", e.target.value)}
                    />
                    {newOrder.items.length > 1 && (
                      <button
                        type="button"
                        className="btn-remove-item"
                        onClick={() => removeOrderItem(index)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-add-item"
                  onClick={addOrderItem}
                >
                  + إضافة صنف
                </button>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={loading}
                >
                  {loading ? "جاري الإضافة..." : "إضافة الطلبية"}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowAddOrder(false)}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال تعديل طلبية */}
      {editingOrderId && (
        <div className="modal-overlay" onClick={cancelEditOrder}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>تعديل الطلبية</h2>
              <button
                className="modal-close"
                onClick={cancelEditOrder}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateOrder}>
              <div className="form-group">
                <label>رقم الطلبية *</label>
                <input
                  type="text"
                  value={editOrder.orderNumber}
                  onChange={(e) => setEditOrder({ ...editOrder, orderNumber: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>وصف الطلبية</label>
                <textarea
                  value={editOrder.description}
                  onChange={(e) => setEditOrder({ ...editOrder, description: e.target.value })}
                  placeholder="أدخل وصفاً للطلبية (اختياري)"
                  rows={3}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>

              <div className="form-group">
                <label>الأصناف</label>
                {editOrder.items.map((item, index) => (
                  <div key={item._id ?? index} className="order-item-row">
                    <input
                      type="text"
                      placeholder="نوع الحجر"
                      value={item.stoneType}
                      onChange={(e) => updateEditOrderItem(index, "stoneType", e.target.value)}
                      required
                    />
                    <select
                      value={item.unit}
                      onChange={(e) => updateEditOrderItem(index, "unit", e.target.value)}
                    >
                      <option value="pieces">قطع</option>
                      <option value="linearMeter">متر طولي</option>
                      <option value="area">مساحة</option>
                    </select>
                    <input
                      type="number"
                      placeholder="الطول (سم)"
                      value={item.length || ""}
                      onChange={(e) => updateEditOrderItem(index, "length", Number(e.target.value))}
                    />
                    <input
                      type="number"
                      placeholder="العرض (سم)"
                      value={item.width || ""}
                      onChange={(e) => updateEditOrderItem(index, "width", Number(e.target.value))}
                    />
                    <input
                      type="number"
                      placeholder="السمك (سم)"
                      value={item.thickness || ""}
                      onChange={(e) => updateEditOrderItem(index, "thickness", Number(e.target.value))}
                    />
                    <input
                      type="number"
                      placeholder="الكمية"
                      value={item.requiredQty || ""}
                      onChange={(e) => updateEditOrderItem(index, "requiredQty", Number(e.target.value))}
                      required
                      min="1"
                    />
                    <input
                      type="text"
                      placeholder="تفاصيل الصنف (اختياري)"
                      value={item.details}
                      onChange={(e) => updateEditOrderItem(index, "details", e.target.value)}
                    />
                    {editOrder.items.length > 1 && (
                      <button
                        type="button"
                        className="btn-remove-item"
                        onClick={() => removeEditOrderItem(index)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-add-item"
                  onClick={addEditOrderItem}
                >
                  + إضافة صنف
                </button>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={editLoading}
                >
                  {editLoading ? "جاري الحفظ..." : "حفظ التعديل"}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={cancelEditOrder}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال عرض/طباعة إرسالية واحدة */}
      {selectedShipment && (
        <div className="shipment-modal-overlay" onClick={closeShipment}>
          <div
            className="shipment-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shipment-modal-actions">
              <button onClick={() => window.print()}>
                🖨 طباعة
              </button>
              <button className="shipment-modal-close" onClick={closeShipment}>
                ✕ إغلاق
              </button>
            </div>

            <ShipmentPrint shipment={selectedShipment} />
          </div>
        </div>
      )}

      {/* منطقة طباعة كل إرساليات العميل دفعة وحدة */}
      {printBatch.length > 0 && (
        <div className="print-batch-container">
          {printBatch.map((shipment, index) => (
            <div
              key={shipment._id}
              className="print-batch-item"
              style={{
                pageBreakAfter:
                  index < printBatch.length - 1 ? "always" : "auto",
              }}
            >
              <ShipmentPrint shipment={shipment} />
            </div>
          ))}
        </div>
      )}

      {printBatch.length > 0 && (
        <style>{`
          @media print {
            .customer-profile > *:not(.print-batch-container) {
              display: none !important;
            }
            .print-batch-container {
              display: block !important;
            }
          }
        `}</style>
      )}
    </div>
  );
}

export default CustomerProfile;