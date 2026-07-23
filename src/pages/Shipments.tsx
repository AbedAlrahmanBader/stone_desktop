import { useEffect, useState } from "react";
import api from "../api/axios";
import "../styles/shipments.css";

import ShipmentPrint from "../components/ShipmentPrint";


interface Shipment {

    _id: string;
    consignmentNumber: number;
    customer: string;
    totalArea: number;
    status: string;
    stones: any[];
    createdAt: string;

}


function Shipments() {

    const [shipments, setShipments] = useState<Shipment[]>([]);

    const [selected, setSelected] = useState<Shipment | null>(null);

    const [editingId, setEditingId] = useState<string | null>(null);

    const [editCustomer, setEditCustomer] = useState("");

    const [editStatus, setEditStatus] = useState("");


    const loadShipments = async () => {

        try {

            const response = await api.get("/shipments");

            setShipments(response.data);


        } catch (error) {

            console.log(error);

        }

    };


    useEffect(() => {

        loadShipments();

    }, []);


    // بدء تعديل إرسالية
    const startEdit = (shipment: Shipment) => {

        setEditingId(shipment._id);
        setEditCustomer(shipment.customer);
        setEditStatus(shipment.status);

    };


    // إلغاء التعديل
    const cancelEdit = () => {

        setEditingId(null);
        setEditCustomer("");
        setEditStatus("");

    };


    // حفظ التعديل
    const saveEdit = async (id: string) => {

        try {

            await api.put(`/shipments/${id}`, {

                customer: editCustomer,
                status: editStatus

            });

            cancelEdit();

            await loadShipments();


        } catch (error) {

            console.log(error);

            alert("حدث خطأ أثناء التعديل");

        }

    };


    // حذف إرسالية
    const handleDelete = async (id: string) => {

        const confirmed = window.confirm(
            "متأكد إنك بدك تحذف هذه الإرسالية؟ رح ترجع القطع المرتبطة فيها للمخزون."
        );

        if (!confirmed) return;

        try {

            await api.delete(`/shipments/${id}`);

            if (selected?._id === id) {
                setSelected(null);
            }

            await loadShipments();


        } catch (error) {

            console.log(error);

            alert("حدث خطأ أثناء الحذف");

        }

    };


    return (

        <div className="shipments">

            <h1>
                الإرساليات
            </h1>

            <table>

                <thead>

                    <tr>

                        <th>رقم الإرسالية</th>
                        <th>العميل</th>
                        <th>عدد المشاتيح</th>
                        <th>المساحة</th>
                        <th>الحالة</th>
                        <th>التاريخ</th>
                        <th>طباعة</th>
                        <th>إجراءات</th>

                    </tr>

                </thead>

                <tbody>

                {

                    shipments.map((shipment) => (

                        <tr key={shipment._id}>

                            <td>
                                {shipment.consignmentNumber}
                            </td>

                            <td>

                                {
                                    editingId === shipment._id ? (

                                        <input
                                            value={editCustomer}
                                            onChange={(e) =>
                                                setEditCustomer(e.target.value)
                                            }
                                        />

                                    ) : (

                                        shipment.customer

                                    )
                                }

                            </td>

                            <td>
                                {shipment.stones.length}
                            </td>

                            <td>
                                {shipment.totalArea.toFixed(2)} m²
                            </td>

                            <td>

                                {
                                    editingId === shipment._id ? (

                                        <select
                                            value={editStatus}
                                            onChange={(e) =>
                                                setEditStatus(e.target.value)
                                            }
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Ready">Ready</option>
                                            <option value="Shipped">Shipped</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>

                                    ) : (

                                        shipment.status

                                    )
                                }

                            </td>

                            <td>

                                {
                                new Date(
                                    shipment.createdAt
                                )
                                .toLocaleDateString()
                                }

                            </td>

                            <td>

                                <button
                                    onClick={() =>
                                        setSelected(shipment)
                                    }
                                >

                                    🖨 طباعة

                                </button>

                            </td>

                            <td>

                                {
                                    editingId === shipment._id ? (

                                        <>

                                            <button onClick={() => saveEdit(shipment._id)}>
                                                ✅ حفظ
                                            </button>

                                            <button onClick={cancelEdit}>
                                                ❌ إلغاء
                                            </button>

                                        </>

                                    ) : (

                                        <>

                                            <button onClick={() => startEdit(shipment)}>
                                                ✏️ تعديل
                                            </button>

                                            <button onClick={() => handleDelete(shipment._id)}>
                                                🗑 حذف
                                            </button>

                                        </>

                                    )
                                }

                            </td>

                        </tr>

                    ))

                }

                </tbody>

            </table>

            {

                selected && (

                    <div style={{ marginTop: "30px" }}>

                        <ShipmentPrint
                            shipment={selected}
                        />

                    </div>

                )

            }

        </div>

    );

}


export default Shipments;