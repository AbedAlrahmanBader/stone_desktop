// CustomerProfile.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../api/axios";
import ShipmentPrint from "../components/ShipmentPrint";

import "../styles/customerProfile.css";

function CustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [loadingShipment, setLoadingShipment] = useState(false);
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [newOrder, setNewOrder] = useState({
    orderNumber: "",
    items: [{ stoneType: "", unit: "pieces", requiredQty: 0 }]
  });
  const [loading, setLoading] = useState(false);

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
      // Filter out empty items
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
      
      // Reset form and refresh data
      setShowAddOrder(false);
      setNewOrder({
        orderNumber: "",
        items: [{ stoneType: "", unit: "pieces", requiredQty: 0 }]
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
      items: [...newOrder.items, { stoneType: "", unit: "pieces", requiredQty: 0 }]
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

  const updateOrderItem = (index: number, field: string, value: any) => {
    const updatedItems = newOrder.items.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setNewOrder({ ...newOrder, items: updatedItems });
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

      {/* Orders Section */}
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
              <th>عدد القطع</th>
              <th>المساحة الإجمالية</th>
              <th>الحالة</th>
              <th>عرض</th>
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

      {/* Add Order Modal */}
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