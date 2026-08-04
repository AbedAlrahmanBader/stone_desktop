import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import "../styles/orderDetails.css";

function OrderDetails() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    loadOrder();
  }, []);

  const loadOrder = async () => {
    try {
      const res = await api.get(`/orders/${orderNumber}`);
      setOrder(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!order) return <h2>جاري التحميل...</h2>;

  return (
    <div className="order-details">
      <h1>تفاصيل الطلبية</h1>

      <div className="order-card">
        <p><strong>رقم الطلبية:</strong> {order.orderNumber}</p>
        <p><strong>العميل:</strong> {order.customer?.name}</p>
        <p><strong>الحالة:</strong> {order.status}</p>
        <p><strong>الوصف:</strong> {order.description || "---"}</p>
      </div>

      <h2>الأصناف</h2>

      <table>
        <thead>
          <tr>
            <th>نوع الحجر</th>
            <th>الأبعاد</th>
            <th>الكمية</th>
            <th>الوحدة</th>
            <th>التفاصيل</th>
          </tr>
        </thead>

        <tbody>
          {order.items.map((item: any) => (
            <tr key={item._id}>
              <td>{item.stoneType}</td>
              <td>
                {item.length} × {item.width} × {item.thickness}
              </td>
              <td>{item.requiredQty}</td>
              <td>{item.unit}</td>
              <td>{item.details || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default OrderDetails;