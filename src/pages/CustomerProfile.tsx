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


  if (!data) {
    return (
      <h2>
        جاري تحميل بيانات العميل...
      </h2>
    );
  }


  return (
    <div className="customer-profile">

      <h1>
        {data.customer?.name}
      </h1>

      <div className="customer-info">

        <h3>
          معلومات العميل
        </h3>

        <p>
          📞 الهاتف:{" "}
          {data.customer?.phone || "---"}
        </p>

        <p>
          📧 البريد:{" "}
          {data.customer?.email || "---"}
        </p>

        <p>
          📍 العنوان:{" "}
          {data.customer?.address || "---"}
        </p>

      </div>

      <h2>
        🚚 الإرساليات
      </h2>

      {data.shipments?.length === 0 ? (
        <h3>
          لا يوجد إرساليات لهذا العميل
        </h3>
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