import "../styles/orderPrint.css";
import logo from "../assets/AAA.jpg";

interface OrderItem {
    _id?: string;
    stoneType: string;
    unit: string;
    requiredQty: number;
    remainingQty?: number;
    length?: number;
    width?: number;
    thickness?: number;
    details?: string;
}

interface Props {
    order: any;
    customerName?: string;
}

const unitLabel = (unit: string) => {
    if (unit === "linearMeter") return "متر طولي";
    if (unit === "area") return "متر مربع";
    return "قطعة";
};

function OrderPrint({ order, customerName }: Props) {
    const items: OrderItem[] = order?.items || [];

    return (
        <div className="order-print-page" dir="rtl">

            <div className="op-header">
                <div className="op-header-main">
                    <div className="op-company-block">
                        <div className="op-company-name">ALFAWAGHREH FOR MARBLE STONE</div>
                        <div className="op-company-info">
                            <div>Palestine</div>
                        </div>
                    </div>
                    <div className="op-logo-container">
                        <img src={logo} alt="Wagera Logo" className="op-logo" />
                    </div>
                </div>

                <div className="op-contact-row">
                    <span>Tel: 022770300</span>
                    <span>Fax: 22770500</span>
                    <span>Mobile: 0599119011</span>
                </div>
            </div>

            <hr className="op-rule" />

            <div className="op-title-row">
                <div className="op-doc-number">
                    <span className="op-label-en">No.</span>
                    <span className="op-doc-number-value">
                        {order?.orderNumber ?? "---"}
                    </span>
                </div>
                <div className="op-title">
                    <span className="ar">طلبية</span>
                    <span className="op-label-en">Order</span>
                </div>
            </div>

            <hr className="op-rule" />

            <div className="op-details">

                <div className="op-detail-row">
                    <span className="op-label">العميل</span>
                    <span className="op-value">
                        {customerName || order?.customer?.name || "---"}
                    </span>
                </div>

                <div className="op-detail-row">
                    <span className="op-label">التاريخ</span>
                    <span className="op-value">
                        {order?.createdAt
                            ? new Date(order.createdAt).toLocaleDateString("en-GB")
                            : "---"}
                    </span>
                </div>

                <div className="op-detail-row">
                    <span className="op-label">الحالة</span>
                    <span className="op-value">
                        {order?.status === "Open" ? "مفتوحة" : "مكتملة"}
                    </span>
                </div>

                <div className="op-detail-row op-detail-full">
                    <span className="op-label">الوصف</span>
                    <span className="op-value">{order?.description || "---"}</span>
                </div>

            </div>

            <table className="op-items-table">
                <thead>
                    <tr>
                        <th>الرقم</th>
                        <th>نوع الحجر</th>
                        <th>الطول (سم)</th>
                        <th>العرض (سم)</th>
                        <th>السمك (سم)</th>
                        <th>الوحدة</th>
                        <th>الكمية المطلوبة</th>
                        <th>الكمية المتبقية</th>
                        <th>تفاصيل</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={item._id || index}>
                            <td>{index + 1}</td>
                            <td>{item.stoneType || "---"}</td>
                            <td>{!item.length ? "مفتوح" : item.length}</td>
                            <td>{item.width ?? "---"}</td>
                            <td>{item.thickness ?? "---"}</td>
                            <td>{unitLabel(item.unit)}</td>
                            <td>{item.requiredQty}</td>
                            <td>{item.remainingQty ?? item.requiredQty}</td>
                            <td>{item.details || "---"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="op-signatures">
                <span>Prepared by ....................</span>
                <span>Approved by ....................</span>
            </div>

            <div className="op-footer">With Best Regards, ...</div>

        </div>
    );
}

export default OrderPrint;