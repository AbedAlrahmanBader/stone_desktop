import { useEffect, useState } from "react";
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
}

interface EditOrderItem extends NewOrderItem {
  _id?: string;
}

interface ShipmentStone {
  _id?: string;
  stoneType?: string;
  length?: number;
  width?: number;
  thickness?: number;
  linearMeter?: number;
  area?: number;
  pieces?: number;
}

interface ShipmentData {
  _id?: string;
  consignmentNumber?: string;
  stones: ShipmentStone[];
  status: string;
  carNumber: string;
  region: string;
  orderNumber: string;
  customer: string;
  totalArea?: number;
  totalLinearMeter?: number;
  createdAt?: string;
}

function CustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [loadingShipment, setLoadingShipment] = useState(false);
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [newOrder, setNewOrder] = useState<{ orderNumber: string; items: NewOrderItem[] }>({
    orderNumber: "",
    items: [{ stoneType: "", unit: "pieces", requiredQty: 0, length: 0, width: 0, thickness: 0 }]
  });
  const [loading, setLoading] = useState(false);

  // ------- تعديل طلبية موجودة -------
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editOrder, setEditOrder] = useState<{ orderNumber: string; items: EditOrderItem[] }>({
    orderNumber: "",
    items: []
  });
  const [editLoading, setEditLoading] = useState(false);

  // ------- تعديل إرسالية -------
  const [editingShipment, setEditingShipment] = useState<any>(null);
  const [showEditShipment, setShowEditShipment] = useState(false);
  const [editShipmentData, setEditShipmentData] = useState<ShipmentData>({
    stones: [],
    status: "",
    carNumber: "",
    region: "",
    orderNumber: "",
    customer: ""
  });
  const [editShipmentLoading, setEditShipmentLoading] = useState(false);

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

  // ------- إجراءات الطلبيات -------
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
        customer: id,
        items: validItems
      };

      await api.post("/orders", orderData);

      setShowAddOrder(false);
      setNewOrder({
        orderNumber: "",
        items: [{ stoneType: "", unit: "pieces", requiredQty: 0, length: 0, width: 0, thickness: 0 }]
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
      items: [...newOrder.items, { stoneType: "", unit: "pieces", requiredQty: 0, length: 0, width: 0, thickness: 0 }]
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
      items: (order.items || []).map((item: any) => ({
        _id: item._id,
        stoneType: item.stoneType,
        unit: item.unit,
        requiredQty: item.requiredQty,
        length: item.length || 0,
        width: item.width || 0,
        thickness: item.thickness || 0,
      }))
    });
  };

  const cancelEditOrder = () => {
    setEditingOrderId(null);
    setEditOrder({ orderNumber: "", items: [] });
  };

  const addEditOrderItem = () => {
    setEditOrder({
      ...editOrder,
      items: [...editOrder.items, { stoneType: "", unit: "pieces", requiredQty: 0, length: 0, width: 0, thickness: 0 }]
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
      alert("تم حذف الطلبية بنجاح");
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "حدث خطأ أثناء حذف الطلبية");
    }
  };

  // ------- إجراءات الإرساليات -------
  const handleDeleteShipment = async (shipmentId: string) => {
    const confirmed = window.confirm(
      "متأكد إنك بدك تحذف هذه الإرسالية؟ هاد الإجراء ما بينرجع."
    );
    if (!confirmed) return;

    try {
      await api.delete(`/shipments/${shipmentId}`);
      await loadCustomer();
      alert("تم حذف الإرسالية بنجاح");
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "حدث خطأ أثناء حذف الإرسالية");
    }
  };

  const startEditShipment = async (shipmentId: string) => {
    try {
      const res = await api.get(`/shipments/${shipmentId}`);
      setEditingShipment(res.data);
      setEditShipmentData({
        consignmentNumber: res.data.consignmentNumber || "",
        stones: res.data.stones || [],
        status: res.data.status || "",
        carNumber: res.data.carNumber || "",
        region: res.data.region || "",
        orderNumber: res.data.orderNumber || "",
        customer: res.data.customer || "",
        totalArea: res.data.totalArea || 0,
        totalLinearMeter: res.data.totalLinearMeter || 0
      });
      setShowEditShipment(true);
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء تحميل بيانات الإرسالية");
    }
  };

  const cancelEditShipment = () => {
    setShowEditShipment(false);
    setEditingShipment(null);
    setEditShipmentData({
      stones: [],
      status: "",
      carNumber: "",
      region: "",
      orderNumber: "",
      customer: ""
    });
  };

  const handleUpdateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShipment) return;

    setEditShipmentLoading(true);

    try {
      // حساب المساحات والمتر الطولي تلقائياً
      const updatedStones = editShipmentData.stones.map((stone: ShipmentStone) => {
        const length = Number(stone.length) || 0;
        const width = Number(stone.width) || 0;
        const pieces = Number(stone.pieces) || 0;
        const thickness = Number(stone.thickness) || 0;

        // حساب المساحة
        let area = Number(stone.area) || 0;
        if (length > 0 && width > 0 && pieces > 0) {
          area = (length * width * pieces) / 10000; // تحويل من سم² إلى م²
        }

        // حساب المتر الطولي
        let linearMeter = Number(stone.linearMeter) || 0;
        if (length > 0 && pieces > 0) {
          linearMeter = (length * pieces) / 100; // تحويل من سم إلى متر
        }

        return {
          ...stone,
          area: area,
          linearMeter: linearMeter
        };
      });

      // حساب المجموع الكلي
      const totalArea = updatedStones.reduce((sum: number, stone: ShipmentStone) => sum + (Number(stone.area) || 0), 0);
      const totalLinearMeter = updatedStones.reduce((sum: number, stone: ShipmentStone) => sum + (Number(stone.linearMeter) || 0), 0);

      const shipmentToUpdate = {
        ...editShipmentData,
        stones: updatedStones,
        totalArea: totalArea,
        totalLinearMeter: totalLinearMeter
      };

      await api.put(`/shipments/${editingShipment._id}`, shipmentToUpdate);
      cancelEditShipment();
      await loadCustomer();
      alert("تم تعديل الإرسالية بنجاح");
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "حدث خطأ أثناء تعديل الإرسالية");
    } finally {
      setEditShipmentLoading(false);
    }
  };

  const addShipmentStone = () => {
    setEditShipmentData({
      ...editShipmentData,
      stones: [
        ...editShipmentData.stones,
        {
          stoneType: "",
          length: 0,
          width: 0,
          thickness: 0,
          linearMeter: 0,
          area: 0,
          pieces: 0
        }
      ]
    });
  };

  const removeShipmentStone = (index: number) => {
    if (editShipmentData.stones.length === 1) {
      alert("لا يمكن حذف الحجر الوحيد");
      return;
    }
    const updatedStones = editShipmentData.stones.filter((_, i) => i !== index);
    setEditShipmentData({
      ...editShipmentData,
      stones: updatedStones
    });
  };

  const updateShipmentStone = (index: number, field: string, value: any) => {
    const updatedStones = editShipmentData.stones.map((stone: ShipmentStone, i: number) => {
      if (i === index) {
        return { ...stone, [field]: value };
      }
      return stone;
    });
    setEditShipmentData({
      ...editShipmentData,
      stones: updatedStones
    });
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

      {data.shipments?.length === 0 ? (
        <h3>لا يوجد إرساليات لهذا العميل</h3>
      ) : (
        <table>
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>رقم الإرسالية</th>
              <th>عدد القطع</th>
              <th>المساحة الإجمالية</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>

          <tbody>
            {data.shipments.map((s: any) => (
              <tr key={s._id}>
                <td>
                  {s.createdAt
                    ? new Date(s.createdAt).toLocaleDateString("ar")
                    : "---"}
                </td>
                <td>{s.consignmentNumber || "---"}</td>
                <td>{s.stones?.length ?? 0}</td>
                <td>{s.totalArea ?? 0}</td>
                <td>{s.status || "---"}</td>
                <td>
                  <button
                    onClick={() => openShipment(s._id)}
                    disabled={loadingShipment}
                    style={{ marginRight: '5px' }}
                  >
                    عرض
                  </button>
                  <button
                    onClick={() => startEditShipment(s._id)}
                    style={{ marginRight: '5px', backgroundColor: '#4CAF50', color: 'white' }}
                  >
                    ✏️ تعديل
                  </button>
                  <button
                    onClick={() => handleDeleteShipment(s._id)}
                    style={{ backgroundColor: '#f44336', color: 'white' }}
                  >
                    🗑 حذف
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

      {/* مودال تعديل الإرسالية */}
      {showEditShipment && (
        <div className="modal-overlay" onClick={cancelEditShipment}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '95%', maxHeight: '90vh', overflow: 'auto' }}
          >
            <div className="modal-header">
              <h2>تعديل الإرسالية</h2>
              <button
                className="modal-close"
                onClick={cancelEditShipment}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateShipment}>
              <div className="form-group">
                <label>رقم الإرسالية</label>
                <input
                  type="text"
                  value={editShipmentData.consignmentNumber || ""}
                  onChange={(e) => setEditShipmentData({ ...editShipmentData, consignmentNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>رقم السيارة</label>
                <input
                  type="text"
                  value={editShipmentData.carNumber || ""}
                  onChange={(e) => setEditShipmentData({ ...editShipmentData, carNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>المنطقة</label>
                <input
                  type="text"
                  value={editShipmentData.region || ""}
                  onChange={(e) => setEditShipmentData({ ...editShipmentData, region: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>رقم الطلبية</label>
                <input
                  type="text"
                  value={editShipmentData.orderNumber || ""}
                  onChange={(e) => setEditShipmentData({ ...editShipmentData, orderNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>اسم العميل</label>
                <input
                  type="text"
                  value={editShipmentData.customer || ""}
                  onChange={(e) => setEditShipmentData({ ...editShipmentData, customer: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>الحالة</label>
                <select
                  value={editShipmentData.status || ""}
                  onChange={(e) => setEditShipmentData({ ...editShipmentData, status: e.target.value })}
                >
                  <option value="Ready">جاهز</option>
                  <option value="In Progress">قيد التنفيذ</option>
                  <option value="Shipped">تم الشحن</option>
                  <option value="Delivered">تم التسليم</option>
                </select>
              </div>

              <div className="form-group">
                <label>الأحجار</label>
                {editShipmentData.stones?.map((stone: ShipmentStone, index: number) => (
                  <div key={index} className="order-item-row" style={{ flexWrap: 'wrap', gap: '5px', padding: '10px', border: '1px solid #ddd', marginBottom: '10px', borderRadius: '5px' }}>
                    <input
                      type="text"
                      placeholder="نوع الحجر"
                      value={stone.stoneType || ""}
                      onChange={(e) => updateShipmentStone(index, "stoneType", e.target.value)}
                      style={{ minWidth: '120px' }}
                    />
                    <input
                      type="number"
                      placeholder="الطول (سم)"
                      value={stone.length || ""}
                      onChange={(e) => updateShipmentStone(index, "length", Number(e.target.value))}
                      style={{ width: '80px' }}
                    />
                    <input
                      type="number"
                      placeholder="العرض (سم)"
                      value={stone.width || ""}
                      onChange={(e) => updateShipmentStone(index, "width", Number(e.target.value))}
                      style={{ width: '80px' }}
                    />
                    <input
                      type="number"
                      placeholder="السمك (سم)"
                      value={stone.thickness || ""}
                      onChange={(e) => updateShipmentStone(index, "thickness", Number(e.target.value))}
                      style={{ width: '80px' }}
                    />
                    <input
                      type="number"
                      placeholder="المتر الطولي"
                      value={stone.linearMeter || ""}
                      onChange={(e) => updateShipmentStone(index, "linearMeter", Number(e.target.value))}
                      style={{ width: '80px' }}
                    />
                    <input
                      type="number"
                      placeholder="المساحة (م²)"
                      value={stone.area || ""}
                      onChange={(e) => updateShipmentStone(index, "area", Number(e.target.value))}
                      style={{ width: '80px' }}
                    />
                    <input
                      type="number"
                      placeholder="القطع"
                      value={stone.pieces || ""}
                      onChange={(e) => updateShipmentStone(index, "pieces", Number(e.target.value))}
                      style={{ width: '80px' }}
                    />
                    {editShipmentData.stones.length > 1 && (
                      <button
                        type="button"
                        className="btn-remove-item"
                        onClick={() => removeShipmentStone(index)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-add-item"
                  onClick={addShipmentStone}
                >
                  + إضافة حجر
                </button>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={editShipmentLoading}
                >
                  {editShipmentLoading ? "جاري الحفظ..." : "حفظ التعديل"}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={cancelEditShipment}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال عرض الإرسالية */}
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
    </div>
  );
}

export default CustomerProfile;