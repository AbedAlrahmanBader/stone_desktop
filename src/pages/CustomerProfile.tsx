// CustomerProfile.tsx - الجزء المتعلق بالطلب
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../api/axios";
import ShipmentPrint from "../components/ShipmentPrint";
import OrderPrint from "../components/OrderPrint";

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

  // ------- فلاتر الطلبيات -------
  const [filterOrderStatus, setFilterOrderStatus] = useState("All");
  const [searchOrder, setSearchOrder] = useState("");

  // ------- فلاتر الإرساليات -------
  const [filterShipmentStatus, setFilterShipmentStatus] = useState("All");
  const [filterShipmentDateFrom, setFilterShipmentDateFrom] = useState("");
  const [filterShipmentDateTo, setFilterShipmentDateTo] = useState("");

  // ------- تحديد وطباعة عدة طلبيات مع بعض -------
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [orderPrintBatch, setOrderPrintBatch] = useState<any[]>([]);

  // ------- تحديد وطباعة عدة إرساليات مع بعض -------
  const [selectedShipmentIds, setSelectedShipmentIds] = useState<Set<string>>(new Set());
  const [shipmentPrintBatch, setShipmentPrintBatch] = useState<any[]>([]);
  const [preparingShipmentPrint, setPreparingShipmentPrint] = useState(false);

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

  // ================= فلاتر الطلبيات =================

  const filteredOrders = useMemo(() => {
    const list = data?.orders || [];

    return list.filter((order: any) => {
      const matchStatus =
        filterOrderStatus === "All" || order.status === filterOrderStatus;

      const search = searchOrder.trim().toLowerCase();
      const matchSearch =
        !search ||
        order.orderNumber?.toLowerCase().includes(search) ||
        order.description?.toLowerCase().includes(search);

      return matchStatus && matchSearch;
    });
  }, [data?.orders, filterOrderStatus, searchOrder]);

  const resetOrderFilters = () => {
    setFilterOrderStatus("All");
    setSearchOrder("");
  };

  // ================= فلاتر الإرساليات =================

  const availableShipmentStatuses = useMemo(() => {
    const list = data?.shipments || [];
    const set = new Set(list.map((s: any) => s.status).filter(Boolean));
    return Array.from(set) as string[];
  }, [data?.shipments]);

  const filteredShipments = useMemo(() => {
    const list = data?.shipments || [];

    return list.filter((shipment: any) => {
      const matchStatus =
        filterShipmentStatus === "All" || shipment.status === filterShipmentStatus;

      const shipmentDate = shipment.createdAt ? new Date(shipment.createdAt) : null;

      let matchFrom = true;
      if (filterShipmentDateFrom && shipmentDate) {
        const fromDate = new Date(filterShipmentDateFrom);
        fromDate.setHours(0, 0, 0, 0);
        matchFrom = shipmentDate >= fromDate;
      }

      let matchTo = true;
      if (filterShipmentDateTo && shipmentDate) {
        const toDate = new Date(filterShipmentDateTo);
        toDate.setHours(23, 59, 59, 999);
        matchTo = shipmentDate <= toDate;
      }

      return matchStatus && matchFrom && matchTo;
    });
  }, [data?.shipments, filterShipmentStatus, filterShipmentDateFrom, filterShipmentDateTo]);

  const resetShipmentFilters = () => {
    setFilterShipmentStatus("All");
    setFilterShipmentDateFrom("");
    setFilterShipmentDateTo("");
  };

  // ================= تحديد وطباعة عدة طلبيات =================

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const allFilteredOrdersSelected =
    filteredOrders.length > 0 &&
    filteredOrders.every((o: any) => selectedOrderIds.has(o._id));

  const toggleSelectAllOrders = () => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (allFilteredOrdersSelected) {
        filteredOrders.forEach((o: any) => next.delete(o._id));
      } else {
        filteredOrders.forEach((o: any) => next.add(o._id));
      }
      return next;
    });
  };

  const printSelectedOrders = () => {
    const selected = filteredOrders.filter((o: any) => selectedOrderIds.has(o._id));

    if (selected.length === 0) {
      alert("الرجاء اختيار طلبية واحدة على الأقل للطباعة");
      return;
    }

    // إلغاء أي دفعة طباعة إرساليات نشطة تجنبًا للتعارض
    setShipmentPrintBatch([]);
    setOrderPrintBatch(selected);
  };

  useEffect(() => {
    if (orderPrintBatch.length > 0) {
      const timer = setTimeout(() => {
        window.print();
      }, 200);

      const handleAfterPrint = () => {
        setOrderPrintBatch([]);
      };

      window.addEventListener("afterprint", handleAfterPrint);

      return () => {
        clearTimeout(timer);
        window.removeEventListener("afterprint", handleAfterPrint);
      };
    }
  }, [orderPrintBatch]);

  // ================= تحديد وطباعة عدة إرساليات =================

  const toggleShipmentSelection = (shipmentId: string) => {
    setSelectedShipmentIds((prev) => {
      const next = new Set(prev);
      if (next.has(shipmentId)) next.delete(shipmentId);
      else next.add(shipmentId);
      return next;
    });
  };

  const allFilteredShipmentsSelected =
    filteredShipments.length > 0 &&
    filteredShipments.every((s: any) => selectedShipmentIds.has(s._id));

  const toggleSelectAllShipments = () => {
    setSelectedShipmentIds((prev) => {
      const next = new Set(prev);
      if (allFilteredShipmentsSelected) {
        filteredShipments.forEach((s: any) => next.delete(s._id));
      } else {
        filteredShipments.forEach((s: any) => next.add(s._id));
      }
      return next;
    });
  };

  // بيانات data.shipments مختصرة (بدون تفاصيل المشاتيح الكاملة)،
  // فلازم نجيب كل إرسالية بتفاصيلها الكاملة قبل الطباعة
  const printSelectedShipments = async () => {
    const ids = filteredShipments
      .filter((s: any) => selectedShipmentIds.has(s._id))
      .map((s: any) => s._id);

    if (ids.length === 0) {
      alert("الرجاء اختيار إرسالية واحدة على الأقل للطباعة");
      return;
    }

    // إلغاء أي دفعة طباعة طلبيات نشطة تجنبًا للتعارض
    setOrderPrintBatch([]);
    setPreparingShipmentPrint(true);

    try {
      const results = await Promise.all(
        ids.map((sid: string) => api.get(`/shipments/${sid}`))
      );
      setShipmentPrintBatch(results.map((r) => r.data));
    } catch (error) {
      console.error(error);
      alert("تعذر تحميل بيانات بعض الإرساليات");
    } finally {
      setPreparingShipmentPrint(false);
    }
  };

  useEffect(() => {
    if (shipmentPrintBatch.length > 0) {
      const timer = setTimeout(() => {
        window.print();
      }, 200);

      const handleAfterPrint = () => {
        setShipmentPrintBatch([]);
      };

      window.addEventListener("afterprint", handleAfterPrint);

      return () => {
        clearTimeout(timer);
        window.removeEventListener("afterprint", handleAfterPrint);
      };
    }
  }, [shipmentPrintBatch]);

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

        {/* فلاتر الطلبيات */}
        <div className="cp-filters">
          <div className="cp-filter-field">
            <label>الحالة</label>
            <select
              value={filterOrderStatus}
              onChange={(e) => setFilterOrderStatus(e.target.value)}
            >
              <option value="All">الكل</option>
              <option value="Open">مفتوحة</option>
              <option value="Completed">مكتملة</option>
            </select>
          </div>

          <div className="cp-filter-field cp-filter-grow">
            <label>بحث</label>
            <input
              type="text"
              placeholder="رقم الطلبية أو الوصف..."
              value={searchOrder}
              onChange={(e) => setSearchOrder(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="cp-btn-reset"
            onClick={resetOrderFilters}
          >
            ✕ إعادة تعيين
          </button>

          <button
            type="button"
            className="cp-btn-print"
            onClick={printSelectedOrders}
            disabled={selectedOrderIds.size === 0}
          >
            🖨 طباعة المحدد ({selectedOrderIds.size})
          </button>
        </div>

        <div className="cp-filters-summary">
          عرض {filteredOrders.length} من أصل {data.orders?.length || 0} طلبية
        </div>

        {filteredOrders.length === 0 ? (
          <h3>لا يوجد طلبيات مطابقة</h3>
        ) : (
          <table className="orders-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={allFilteredOrdersSelected}
                    onChange={toggleSelectAllOrders}
                  />
                </th>
                <th>رقم الطلبية</th>
                <th>الوصف</th>
                <th>عدد الأصناف</th>
                <th>الحالة</th>
                <th>تاريخ الإنشاء</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order: any) => (
                <tr key={order._id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedOrderIds.has(order._id)}
                      onChange={() => toggleOrderSelection(order._id)}
                    />
                  </td>
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

      <h2>🚚 الإرساليات</h2>

      {/* فلاتر الإرساليات */}
      <div className="cp-filters">
        <div className="cp-filter-field">
          <label>الحالة</label>
          <select
            value={filterShipmentStatus}
            onChange={(e) => setFilterShipmentStatus(e.target.value)}
          >
            <option value="All">الكل</option>
            {availableShipmentStatuses.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div className="cp-filter-field">
          <label>من تاريخ</label>
          <input
            type="date"
            value={filterShipmentDateFrom}
            onChange={(e) => setFilterShipmentDateFrom(e.target.value)}
          />
        </div>

        <div className="cp-filter-field">
          <label>إلى تاريخ</label>
          <input
            type="date"
            value={filterShipmentDateTo}
            onChange={(e) => setFilterShipmentDateTo(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="cp-btn-reset"
          onClick={resetShipmentFilters}
        >
          ✕ إعادة تعيين
        </button>

        <button
          type="button"
          className="cp-btn-print"
          onClick={printSelectedShipments}
          disabled={selectedShipmentIds.size === 0 || preparingShipmentPrint}
        >
          {preparingShipmentPrint
            ? "⏳ جاري التحضير..."
            : `🖨 طباعة المحدد (${selectedShipmentIds.size})`}
        </button>
      </div>

      <div className="cp-filters-summary">
        عرض {filteredShipments.length} من أصل {data.shipments?.length || 0} إرسالية
      </div>

      {filteredShipments.length === 0 ? (
        <h3>لا يوجد إرساليات مطابقة</h3>
      ) : (
        <table>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={allFilteredShipmentsSelected}
                  onChange={toggleSelectAllShipments}
                />
              </th>
              <th>التاريخ</th>
              <th>عدد القطع</th>
              <th>المساحة الإجمالية</th>
              <th>الحالة</th>
              <th>عرض</th>
            </tr>
          </thead>

          <tbody>
            {filteredShipments.map((s: any) => (
              <tr key={s._id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedShipmentIds.has(s._id)}
                    onChange={() => toggleShipmentSelection(s._id)}
                  />
                </td>
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

      {selectedShipment && (
        <div className="shipment-modal-overlay" onClick={closeShipment}>
          <div
            className="shipment-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="shipment-modal-close" onClick={closeShipment}>
              ✕ إغلاق
            </button>

            <ShipmentPrint shipment={selectedShipment} />
          </div>
        </div>
      )}

      {/* منطقة طباعة عدة طلبيات دفعة وحدة */}
      {orderPrintBatch.length > 0 && (
        <div className="order-batch-container">
          {orderPrintBatch.map((order, index) => (
            <div
              key={order._id}
              className="order-batch-item"
              style={{
                pageBreakAfter:
                  index < orderPrintBatch.length - 1 ? "always" : "auto",
              }}
            >
              <OrderPrint order={order} customerName={data.customer?.name} />
            </div>
          ))}
        </div>
      )}

      {/* منطقة طباعة عدة إرساليات دفعة وحدة */}
      {shipmentPrintBatch.length > 0 && (
        <div className="print-batch-container">
          {shipmentPrintBatch.map((shipment, index) => (
            <div
              key={shipment._id}
              className="print-batch-item"
              style={{
                pageBreakAfter:
                  index < shipmentPrintBatch.length - 1 ? "always" : "auto",
              }}
            >
              <ShipmentPrint shipment={shipment} />
            </div>
          ))}
        </div>
      )}

      {/* عند الطباعة الجماعية (طلبيات أو إرساليات)، إخفِ كل شي غير منطقة الطباعة النشطة */}
      {orderPrintBatch.length > 0 && (
        <style>{`
          @media print {
            .customer-profile > *:not(.order-batch-container) {
              display: none !important;
            }
            .order-batch-container {
              display: block !important;
            }
          }
        `}</style>
      )}

      {shipmentPrintBatch.length > 0 && (
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

      {/* أنماط الفلاتر والـ checkboxes (مستقلة عن customerProfile.css) */}
      <style>{`
        .cp-filters {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          gap: 16px;
          background: #f4f7f4;
          border: 1px solid #dfe7df;
          border-radius: 10px;
          padding: 16px 18px;
          margin: 14px 0;
        }

        .cp-filter-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .cp-filter-grow {
          flex: 1;
          min-width: 200px;
        }

        .cp-filter-field label {
          font-size: 12.5px;
          font-weight: bold;
          color: #33513a;
        }

        .cp-filter-field input,
        .cp-filter-field select {
          padding: 9px 12px;
          border: 1px solid #cdd8cd;
          border-radius: 7px;
          font-size: 13.5px;
          color: #222;
          background: white;
          min-width: 150px;
        }

        .cp-filter-field input:focus,
        .cp-filter-field select:focus {
          outline: none;
          border-color: #1b5e20;
          box-shadow: 0 0 0 3px rgba(27,94,32,0.12);
        }

        .cp-btn-reset {
          background: white;
          color: #b71c1c;
          border: 1px solid #b71c1c;
          padding: 9px 18px;
          border-radius: 7px;
          cursor: pointer;
          font-size: 13.5px;
          font-weight: bold;
          height: 38px;
          transition: background 0.2s, color 0.2s;
        }

        .cp-btn-reset:hover {
          background: #b71c1c;
          color: white;
        }

        .cp-btn-print {
          background: #1b5e20;
          color: white;
          border: none;
          padding: 9px 18px;
          border-radius: 7px;
          cursor: pointer;
          font-size: 13.5px;
          font-weight: bold;
          height: 38px;
          transition: background 0.2s;
        }

        .cp-btn-print:hover:not(:disabled) {
          background: #144717;
        }

        .cp-btn-print:disabled {
          background: #a5a5a5;
          cursor: not-allowed;
        }

        .cp-filters-summary {
          font-size: 13px;
          color: #666;
          margin-bottom: 10px;
        }

        @media (max-width: 768px) {
          .cp-filters {
            flex-direction: column;
            align-items: stretch;
          }

          .cp-filter-field input,
          .cp-filter-field select {
            min-width: 0;
          }

          .cp-btn-reset,
          .cp-btn-print {
            width: 100%;
          }
        }
      `}</style>

    </div>
  );
}

export default CustomerProfile;