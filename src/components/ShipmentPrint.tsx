import { useState } from "react";
import "../styles/print.css";
import logo from "../assets/AAA.jpg";

interface Stone {
    _id?: string;
    barcode?: string;
    stoneType?: string;
    length?: number;
    width?: number;
    thickness?: number;
    linearMeter?: number;
    area?: number;
    pieces?: number;
    status?: string;
}

interface ThicknessSummaryRow {
    stoneType: string;
    thickness: number;
    area: number;
}

interface ThicknessOnlyRow {
    thickness: number;
    area: number;
}

interface Props {
    shipment: any;
}

const num = (v: any) => Number(v) || 0;

const SOLD_UNITS = ["قطعة", "متر مربع", "متر طول"] as const;
type SoldUnit = (typeof SOLD_UNITS)[number];

function getSoldQuantity(s: Stone): { value: string; unit: SoldUnit } {
    if (num(s.area) > 0) return { value: num(s.area).toFixed(2), unit: "متر مربع" };
    if (num(s.linearMeter) > 0) return { value: num(s.linearMeter).toFixed(2), unit: "متر طول" };
    return { value: String(num(s.pieces)), unit: "قطعة" };
}

// بيرجع القيمة المناسبة حسب الوحدة المختارة من المستخدم
function getValueForUnit(s: Stone, unit: SoldUnit) {
    if (unit === "قطعة") return String(num(s.pieces));
    if (unit === "متر مربع") return num(s.area).toFixed(2);
    return num(s.linearMeter).toFixed(2); // متر طول
}

function getEnteredQuantity(s: Stone): { value: string; unit: SoldUnit } {
    const sold = getSoldQuantity(s);
    const isOpenLength = !s.length || num(s.length) === 0;
    const hasConvertedMeasure = num(s.area) > 0 || num(s.linearMeter) > 0;

    if (!isOpenLength && hasConvertedMeasure && num(s.pieces) > 0) {
        return { value: String(num(s.pieces)), unit: "قطعة" };
    }
    return sold;
}

function ShipmentPrint({ shipment }: Props) {
    const printPage = () => {
        window.print();
    };

    const stones: Stone[] =
        shipment?.stones && shipment.stones.length > 0
            ? shipment.stones
            : [
                  { barcode: "STN-0001", stoneType: "حجر مسمسم سراحي", length: 0, width: 30, thickness: 5, linearMeter: 0, area: 20, pieces: 20, status: "In Stock" },
                  { barcode: "STN-0002", stoneType: "حجر مسمسم محصور", length: 69, width: 30, thickness: 5, linearMeter: 0, area: 21.74, pieces: 105, status: "In Stock" },
                  { barcode: "STN-0003", stoneType: "جية مطبة وجه+جنبين", length: 0, width: 42, thickness: 7, linearMeter: 35, area: 0, pieces: 35, status: "In Stock" },
                  { barcode: "STN-0004", stoneType: "عتب مسمسم/مطبة", length: 130, width: 25, thickness: 15, linearMeter: 5.2, area: 0, pieces: 4, status: "In Stock" },
                  { barcode: "STN-0005", stoneType: "سقف مسمسم/مطبة", length: 30, width: 25, thickness: 15, linearMeter: 0, area: 0, pieces: 20, status: "In Stock" },
                  { barcode: "STN-0006", stoneType: "سقف مسمسم/مطبة", length: 15, width: 25, thickness: 15, linearMeter: 0, area: 0, pieces: 17, status: "In Stock" },
              ];

    // تخزين اختيار الوحدة لكل صف (لو المستخدم غيّر الوحدة يدويًا)
    const [soldUnitOverrides, setSoldUnitOverrides] = useState<Record<number, SoldUnit>>({});
    const [enteredUnitOverrides, setEnteredUnitOverrides] = useState<Record<number, SoldUnit>>({});

    const totals = shipment?.totals || {
        count: stones.length,
        cube: shipment?.totalCube ?? 0,
        sqm: stones.reduce((sum, s) => sum + num(s.area), 0),
        linearM: stones.reduce((sum, s) => sum + num(s.linearMeter), 0),
        pieces: stones.reduce((sum, s) => sum + num(s.pieces), 0),
    };

    const summaryByTreatment: ThicknessSummaryRow[] =
        shipment?.summaryByTreatment && shipment.summaryByTreatment.length > 0
            ? shipment.summaryByTreatment
            : Object.values(
                  stones.reduce((acc: Record<string, ThicknessSummaryRow>, s) => {
                      const key = `${s.stoneType || "---"}|${s.thickness ?? "---"}`;
                      if (!acc[key]) {
                          acc[key] = { stoneType: s.stoneType || "---", thickness: num(s.thickness), area: 0 };
                      }
                      acc[key].area += num(s.area) || num(s.linearMeter) || num(s.pieces);
                      return acc;
                  }, {})
              );

    const summaryByTreatmentTotal =
        shipment?.summaryByTreatmentTotal ??
        summaryByTreatment.reduce((sum, r) => sum + num(r.area), 0).toFixed(2);

    const summaryByThickness: ThicknessOnlyRow[] =
        shipment?.summaryByThickness && shipment.summaryByThickness.length > 0
            ? shipment.summaryByThickness
            : Object.values(
                  stones.reduce((acc: Record<string, ThicknessOnlyRow>, s) => {
                      const key = `${s.thickness ?? "---"}`;
                      if (!acc[key]) {
                          acc[key] = { thickness: num(s.thickness), area: 0 };
                      }
                      acc[key].area += num(s.area) || num(s.linearMeter) || num(s.pieces);
                      return acc;
                  }, {})
              );

    const summaryByThicknessTotal =
        shipment?.summaryByThicknessTotal ??
        summaryByThickness.reduce((sum, r) => sum + num(r.area), 0).toFixed(4);

    return (
        <div className="print-container">
            <button className="print-button" onClick={printPage}>
                🖨 طباعة الإرسالية
            </button>

            <div
                className="print-page"
                dir="ltr"
                contentEditable
                suppressContentEditableWarning
            >
                <div className="company-header">
                    <div className="header-main">
                        <div className="company-name-block">
                            <div className="company-name">ALFAWAGHREH FOR MARBLE STONE</div>
                            <div className="company-info-lines">
                                <div>Palestine</div>
                                <div>P.O.Box: {shipment?.poBox || "—"}</div>
                            </div>
                        </div>
                        <div className="logo-container">
                            <img src={logo} alt="Wagera Logo" className="company-logo" />
                        </div>
                    </div>

                    <div className="header-contact-row">
                        <div className="contact-line">
                            <span>Tel: {shipment?.tel || "022770300"}</span>
                            <span>Fax: {shipment?.fax || "22770500"}</span>
                            <span>Mobile: {shipment?.mobile || "0599119011"}</span>
                        </div>
                        <div className="license-block">
                            <div className="license-box">
                                <span className="license-value">{shipment?.licenseNumber || "562508739"}</span>
                                <span className="license-label">| مشغل مرخص رقم</span>
                            </div>
                        </div>
                    </div>

                    <div className="header-contact-row">
                        <div className="contact-line">
                            <span>Web Site: {shipment?.website || "www.fwagerastones.co"}</span>
                            <span>E-Mail: {shipment?.email || "alfwagra@yahoo.com"}</span>
                        </div>
                    </div>
                </div>

                <hr className="section-rule" />

                <div className="title-row">
                    <div className="doc-number">
                        <span className="label-en">No.</span>
<span className="doc-number-value">{shipment?.consignmentNumber ?? "---"}</span>
                        <span>: رقم</span>
                    </div>
                    <div className="certificate-title">
                        <span className="ar">شهادة إرسال</span>
                        <span className="label-en">Consignment</span>
                    </div>
                </div>

                <hr className="section-rule" />

                <div className="certificate-details">
                    <div className="detail-row">
                       <span className="label-en">Date:</span>
                        <span className="value">
                            {shipment?.createdAt
                                ? new Date(shipment.createdAt).toLocaleDateString("en-GB")
                                : shipment?.date || "03/05/2026"}
                        </span>
                        <span className="label">:  التاريخ </span>
                    </div>
                    <div className="detail-row">
                        <span className="label-en">Mr.</span>
                        <span className="value">&nbsp;</span>
                        <span className="label">: المرسل اليه السيد  </span>
                    </div>
                    <div className="detail-row">
                        <span className="label-en">Leaving hour:</span>
                        <span className="value">
                            {shipment?.leavingHour ||
                                (shipment?.createdAt
                                    ? new Date(shipment.createdAt).toLocaleTimeString("ar-EG", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                      })
                                    : "---")}
                        </span>
                        <span className="label"> : ساعة المغادرة </span>
                    </div>
                    <div className="detail-row">
                        <span className="label-en">Order No.</span>
                        <span className="value">{shipment?.orderNumber}</span>
                        <span className="label">:   رقم الطلبية </span>
                    </div>
                    <div className="detail-row">
                        <span className="label-en">Region:</span>
                        <span className="value">{shipment?.region || "القدس"}</span>
                        <span className="label">:  المنطقة </span>
                    </div>
                    <div className="detail-row">
                        <span className="label-en">Car No.</span>
                        <span className="value">{shipment?.carNumber}</span>
                        <span className="label">:    رقم السيارة </span>
                    </div>
                </div>

                <table className="shipment-table">
                    <thead>
                        <tr>
                            <th>الرقم</th>
                            <th>بيان الصنف</th>
                            <th>المعالجة المطلوبة</th>
                            <th>الطول (سم)</th>
                            <th>العرض (سم)</th>
                            <th>السمك (سم)</th>
                            <th colSpan={2}>كمية مدخلة</th>
                            <th colSpan={2}>كمية البيع</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stones.map((stone, index) => {
                            const enteredDefault = getEnteredQuantity(stone);
                            const autoSold = getSoldQuantity(stone);

                            const enteredUnit = enteredUnitOverrides[index] ?? enteredDefault.unit;
                            const enteredValue = getValueForUnit(stone, enteredUnit);

                            const soldUnit = soldUnitOverrides[index] ?? autoSold.unit;
                            const soldValue = getValueForUnit(stone, soldUnit);

                            return (
                                <tr key={stone._id || stone.barcode || index}>
                                    <td>{index + 1}</td>
                                    <td></td>
                                    <td>{stone.stoneType || "---"}</td>
                                    <td>{num(stone.length) === 0 ? "مفتوح" : stone.length}</td>
                                    <td>{stone.width ?? "---"}</td>
                                    <td>{stone.thickness ?? "---"}</td>
                                    <td>{enteredValue}</td>
                                    <td contentEditable={false}>
                                        <select
                                            className="unit-select"
                                            value={enteredUnit}
                                            onChange={(e) =>
                                                setEnteredUnitOverrides((prev) => ({
                                                    ...prev,
                                                    [index]: e.target.value as SoldUnit,
                                                }))
                                            }
                                        >
                                            {SOLD_UNITS.map((u) => (
                                                <option key={u} value={u}>
                                                    {u}
                                                </option>
                                            ))}
                                        </select>
                                        <span className="unit-print-label">{enteredUnit}</span>
                                    </td>
                                    <td>{soldValue}</td>
                                    <td contentEditable={false}>
                                        <select
                                            className="unit-select"
                                            value={soldUnit}
                                            onChange={(e) =>
                                                setSoldUnitOverrides((prev) => ({
                                                    ...prev,
                                                    [index]: e.target.value as SoldUnit,
                                                }))
                                            }
                                        >
                                            {SOLD_UNITS.map((u) => (
                                                <option key={u} value={u}>
                                                    {u}
                                                </option>
                                            ))}
                                        </select>
                                        <span className="unit-print-label">{soldUnit}</span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                <div className="totals-section">
                    <div className="total-count">
                        <span className="total-label">العدد:</span>
                        <span className="total-value">{totals.count}</span>
                    </div>
                    <div className="total-line">
                        <span className="total-label">مجموع الكمية:</span>
                        <span className="total-value">{Number(totals.cube).toFixed(2)} كوب</span>
                        <span className="total-value">،</span>
                        <span className="total-value">{Number(totals.sqm).toFixed(3)} متر مربع</span>
                        <span className="total-value">،</span>
                        <span className="total-value">{Number(totals.linearM).toFixed(2)} متر طول</span>
                        <span className="total-value">،</span>
                        <span className="total-value">{totals.pieces} قطعة</span>
                    </div>
                </div>

                <div className="summary-section">
                    <div className="summary-title">الإجمالي حسب السماك</div>
                    <div className="summary-tables">
                        <table className="summary-table treatment-summary">
                            <thead>
                                <tr>
                                    <th>نوع الحجر</th>
                                    <th>السماكة (سم)</th>
                                    <th>الكمية</th>
                                </tr>
                            </thead>
                            <tbody>
                                {summaryByTreatment.map((row, index) => (
                                    <tr key={index}>
                                        <td>{row.stoneType}</td>
                                        <td>{row.thickness}</td>
                                        <td>{Number(row.area).toFixed(2)}</td>
                                    </tr>
                                ))}
                                <tr className="summary-total-row">
                                    <td colSpan={2}>المجموع:</td>
                                    <td>{summaryByTreatmentTotal}</td>
                                </tr>
                            </tbody>
                        </table>

                        <table className="summary-table thickness-summary">
                            <thead>
                                <tr>
                                    <th>السماكة (سم)</th>
                                    <th>الكمية</th>
                                </tr>
                            </thead>
                            <tbody>
                                {summaryByThickness.map((row, index) => (
                                    <tr key={index}>
                                        <td>{row.thickness}</td>
                                        <td>{Number(row.area).toFixed(2)}</td>
                                    </tr>
                                ))}
                                <tr className="summary-total-row">
                                    <td>المجموع:</td>
                                    <td>{summaryByThicknessTotal}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="notes-section">
                    <div className="note">
                        * Ownership of commodity is transferred when all accrued payments are settled البضاعة ليست ملكاً للمشتري ما لم تسدد قيمتها
                    </div>
                    <div className="note">
                        * This is not a valid transaction only in the presence of the official seal and signature لا يعتد اعتماد هذه المعاملة إلا بوجود الختم والتوقيع الرسمي
                    </div>
                </div>

                <div className="signatures">
                    <div className="signature-item">
                        <span>Treasurer's Sig. ....................</span>
                    </div>
                    <div className="signature-item">
                        <span>Receiver's Sig. ....................</span>
                    </div>
                    <div className="signature-item">
                        <span>Accountant's Sig. ....................</span>
                    </div>
                </div>

                <div className="footer">With Best Regards, ...</div>
            </div>
        </div>
    );
}

export default ShipmentPrint;
