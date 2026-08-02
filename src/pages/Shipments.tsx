import { useEffect, useMemo, useState } from "react";
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

    // --- فلاتر البحث ---
    const [filterCustomer, setFilterCustomer] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");
    const [filterDateFrom, setFilterDateFrom] = useState("");
    const [filterDateTo, setFilterDateTo] = useState("");


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

    // إعادة تعيين كل الفلاتر
    const resetFilters = () => {

        setFilterCustomer("");
        setFilterStatus("All");
        setFilterDateFrom("");
        setFilterDateTo("");

    };

    // قائمة حالات الإرسالية الموجودة فعليًا (لتعبئة قائمة الفلتر تلقائيًا)
    const availableStatuses = useMemo(() => {

        const set = new Set(shipments.map((s) => s.status));
        return Array.from(set);

    }, [shipments]);

    // الإرساليات بعد تطبيق الفلاتر
    const filteredShipments = useMemo(() => {

        return shipments.filter((shipment) => {

            const matchCustomer = shipment.customer
                ?.toLowerCase()
                .includes(filterCustomer.trim().toLowerCase());

            const matchStatus =
                filterStatus === "All" || shipment.status === filterStatus;

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

            return matchCustomer && matchStatus && matchFrom && matchTo;

        });

    }, [shipments, filterCustomer, filterStatus, filterDateFrom, filterDateTo]);


    return (

        <div className="shipments">

            <h1>
                الإرساليات
            </h1>

            {/* شريط الفلاتر */}
            <div className="shipments-filters">

                <div className="filter-field">
                    <label>بحث بالعميل</label>
                    <input
                        placeholder="اسم العميل..."
                        value={filterCustomer}
                        onChange={(e) => setFilterCustomer(e.target.value)}
                    />
                </div>

                <div className="filter-field">
                    <label>الحالة</label>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="All">الكل</option>
                        {availableStatuses.map((status) => (
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
                    onClick={resetFilters}
                >
                    ✕ إعادة تعيين
                </button>

            </div>

            <div className="filters-summary">
                عرض {filteredShipments.length} من أصل {shipments.length} إرسالية
            </div>

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

                    filteredShipments.length === 0 ? (

                        <tr>
                            <td colSpan={8} className="no-results">
                                لا يوجد إرساليات مطابقة لهذا البحث
                            </td>
                        </tr>

                    ) : (

                    filteredShipments.map((shipment) => (

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

                    )

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
