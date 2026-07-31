import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../styles/orderDetails.css";

function OrderDetails() {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const res = await api.get(`/orders/number/${orderNumber}`);
        setOrder(res.data);
      } catch (error) {
        console.error(error);
        alert("تعذر تحميل بيانات الطلبية");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
  }, [orderNumber, navigate]);

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
              </tr>
            </thead>
            <tbody>
              {order.items.map((item: any, index: number) => (
                <tr key={index}>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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