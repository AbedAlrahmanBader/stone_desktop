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

    // شحنة واحدة للطباعة الفردية (زر الطباعة بجانب كل سطر)
    const [selected, setSelected] = useState<Shipment | null>(null);

    // مجموعة الإرساليات المطلوب طباعتها دفعة وحدة
    const [printBatch, setPrintBatch] = useState<Shipment[]>([]);

    const [editingId, setEditingId] = useState<string | null>(null);

    const [editCustomer, setEditCustomer] = useState("");

    const [editStatus, setEditStatus] = useState("");

    // --- فلاتر البحث ---
    const [filterCustomer, setFilterCustomer] = useState("All");
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


    // لما تنجهز دفعة الطباعة، افتح نافذة الطباعة تلقائيًا
    // وبعد ما يخلص المستخدم من الطباعة (أو يلغيها)، رجّع الصفحة لوضعها الطبيعي
    useEffect(() => {

        if (printBatch.length > 0) {

            const timer = setTimeout(() => {
                window.print();
            }, 200);

            const handleAfterPrint = () => {
                setPrintBatch([]);
            };

            window.addEventListener("afterprint", handleAfterPrint);

            return () => {
                clearTimeout(timer);
                window.removeEventListener("afterprint", handleAfterPrint);
            };

        }

    }, [printBatch]);


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

        setFilterCustomer("All");
        setFilterStatus("All");
        setFilterDateFrom("");
        setFilterDateTo("");

    };

    // قائمة أسماء العملاء الموجودين فعليًا (لتعبئة قائمة فلتر العميل تلقائيًا)
    const availableCustomers = useMemo(() => {

        const set = new Set(shipments.map((s) => s.customer));
        return Array.from(set).sort((a, b) => a.localeCompare(b));

    }, [shipments]);

    // قائمة حالات الإرسالية الموجودة فعليًا (لتعبئة قائمة الفلتر تلقائيًا)
    const availableStatuses = useMemo(() => {

        const set = new Set(shipments.map((s) => s.status));
        return Array.from(set);

    }, [shipments]);

    // الإرساليات بعد تطبيق الفلاتر
    const filteredShipments = useMemo(() => {

        return shipments.filter((shipment) => {

            const matchCustomer =
                filterCustomer === "All" || shipment.customer === filterCustomer;

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


    // طباعة كل الإرساليات المفلترة دفعة وحدة
    const printAllFiltered = () => {

        if (filteredShipments.length === 0) {
            alert("لا يوجد إرساليات لطباعتها");
            return;
        }

        setSelected(null);
        setPrintBatch(filteredShipments);

    };


    return (

        <div className="shipments">

            <h1>
                الإرساليات
            </h1>

            {/* شريط الفلاتر */}
            <div className="shipments-filters">

                <div className="filter-field">
                    <label>العميل</label>
                    <select
                        value={filterCustomer}
                        onChange={(e) => setFilterCustomer(e.target.value)}
                    >
                        <option value="All">الكل</option>
                        {availableCustomers.map((customer) => (
                            <option key={customer} value={customer}>
                                {customer}
                            </option>
                        ))}
                    </select>
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

                <button
                    type="button"
                    className="btn-print-all"
                    onClick={printAllFiltered}
                >
                    🖨 طباعة الكل ({filteredShipments.length})
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
                                    onClick={() => {
                                        setPrintBatch([]);
                                        setSelected(shipment);
                                    }}
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

            {/* منطقة طباعة كل الإرساليات دفعة وحدة */}
            {

                printBatch.length > 0 && (

                    <div className="print-batch-container">

                        {
                            printBatch.map((shipment, index) => (

                                <div
                                    key={shipment._id}
                                    className="print-batch-item"
                                    style={{
                                        pageBreakAfter:
                                            index < printBatch.length - 1
                                                ? "always"
                                                : "auto",
                                    }}
                                >

                                    <ShipmentPrint shipment={shipment} />

                                </div>

                            ))
                        }

                    </div>

                )

            }

            {/* عند الطباعة الجماعية، إخفِ كل شي غير منطقة الطباعة */}
            {
                printBatch.length > 0 && (

                    <style>{`
                        @media print {
                            .shipments > *:not(.print-batch-container) {
                                display: none !important;
                            }
                            .print-batch-container {
                                display: block !important;
                                width: 100%;
                            }
                            .print-batch-container * {
                                visibility: visible !important;
                            }
                            body * {
                                visibility: visible !important;
                            }
                        }
                    `}</style>

                )

            }

        </div>

    );

}


export default Shipments;