import { useState, useEffect } from "react";
import "../styles/print.css";
import logo from "../assets/AAA.jpg";

interface StoneItem {
    _id?: string;
    stoneType?: string;
    length?: number;
    width?: number;
    thickness?: number;
    linearMeter?: number;
    area?: number;
    pieces?: number;
    details?: string;
    requiredQty?: number;
    remainingQty?: number;
}

interface StonePieceDoc {
    _id?: string;
    barcode?: string;
    items?: StoneItem[];
    totalLinearMeter?: number;
    totalArea?: number;
    status?: string;
}

interface Stone {
    barcode?: string;
    stoneType?: string;
    length?: number;
    width?: number;
    thickness?: number;
    linearMeter?: number;
    area?: number;
    pieces?: number;
    status?: string;
    details?: string;
    requiredQty?: number;
    remainingQty?: number;
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

// واجهة صنف الطلبية
interface OrderItem {
    _id: string;
    stoneType: string;
    length?: number;
    width?: number;
    thickness?: number;
    unit: string;
    requiredQty: number;
    remainingQty: number;
    details?: string;
}

interface Props {
    shipment: any;
    orderItems?: OrderItem[];
    orderNumber?: string;
}

const num = (v: any) => Number(v) || 0;

const SOLD_UNITS = ["قطعة", "متر مربع", "متر طول"] as const;
type SoldUnit = (typeof SOLD_UNITS)[number];

function flattenStones(stonePieces: StonePieceDoc[]): Stone[] {
    const rows: Stone[] = [];

    stonePieces.forEach((stone) => {
        const items = stone.items && stone.items.length > 0 ? stone.items : [];

        items.forEach((item) => {
            rows.push({
                barcode: stone.barcode,
                stoneType: item.stoneType,
                length: item.length,
                width: item.width,
                thickness: item.thickness,
                linearMeter: item.linearMeter,
                area: item.area,
                pieces: item.pieces,
                status: stone.status,
                details: item.details || "",
                requiredQty: item.requiredQty || 0,
                remainingQty: item.remainingQty || 0,
            });
        });
    });

    return rows;
}

function groupSimilarStones(stones: Stone[]): Stone[] {
    const grouped: Stone[] = [];
    
    stones.forEach((stone) => {
        const existingIndex = grouped.findIndex((g) => 
            g.stoneType === stone.stoneType &&
            g.length === stone.length &&
            g.width === stone.width &&
            g.thickness === stone.thickness
        );

        if (existingIndex !== -1) {
            const existing = grouped[existingIndex];
            existing.pieces = (existing.pieces || 0) + (stone.pieces || 0);
            existing.area = (existing.area || 0) + (stone.area || 0);
            existing.linearMeter = (existing.linearMeter || 0) + (stone.linearMeter || 0);
            if (stone.barcode && !existing.barcode?.includes(stone.barcode)) {
                existing.barcode = existing.barcode ? `${existing.barcode}, ${stone.barcode}` : stone.barcode;
            }
            if (stone.details && !existing.details) {
                existing.details = stone.details;
            }
        } else {
            grouped.push({ ...stone });
        }
    });

    return grouped;
}

function getSoldQuantity(s: Stone): { value: string; unit: SoldUnit } {
    if (num(s.area) > 0) return { value: num(s.area).toFixed(2), unit: "متر مربع" };
    if (num(s.linearMeter) > 0) return { value: num(s.linearMeter).toFixed(2), unit: "متر طول" };
    return { value: String(num(s.pieces)), unit: "قطعة" };
}

function getValueForUnit(s: Stone, unit: SoldUnit) {
    if (unit === "قطعة") return String(num(s.pieces));
    if (unit === "متر مربع") return num(s.area).toFixed(2);
    return num(s.linearMeter).toFixed(2);
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

// ===== الدالة الرئيسية لجلب تفاصيل الصنف من الطلبية =====
function getOrderItemDetails(stone: Stone, orderItems?: OrderItem[]): string {
    // إذا كانت الطلبية موجودة
    if (orderItems && orderItems.length > 0) {
        // 1. محاولة المطابقة التامة (نوع + أبعاد)
        const exactMatch = orderItems.find(item => {
            const matchType = item.stoneType === stone.stoneType;
            const matchLength = !item.length || !stone.length || Math.abs(item.length - stone.length) < 0.5;
            const matchWidth = !item.width || !stone.width || Math.abs(item.width - stone.width) < 0.5;
            const matchThickness = !item.thickness || !stone.thickness || Math.abs(item.thickness - stone.thickness) < 0.5;
            return matchType && matchLength && matchWidth && matchThickness;
        });

        if (exactMatch) {
            let details = exactMatch.stoneType;
            
            // إضافة التفاصيل
            if (exactMatch.details) {
                details += `\n📝 ${exactMatch.details}`;
            }
            
            // إضافة الأبعاد
            const dims = [];
            if (exactMatch.length) dims.push(`الطول: ${exactMatch.length}سم`);
            if (exactMatch.width) dims.push(`العرض: ${exactMatch.width}سم`);
            if (exactMatch.thickness) dims.push(`السمك: ${exactMatch.thickness}سم`);
            if (dims.length > 0) {
                details += `\n📐 ${dims.join(' | ')}`;
            }
            
            // إضافة الكميات
            details += `\n📦 المطلوب: ${exactMatch.requiredQty}`;
            if (exactMatch.remainingQty > 0) {
                details += ` | المتبقي: ${exactMatch.remainingQty}`;
            } else {
                details += ` | ✅ مكتمل`;
            }
            
            // إضافة الوحدة
            const unitMap: Record<string, string> = {
                'pieces': 'قطع',
                'linearMeter': 'متر طولي',
                'area': 'مساحة'
            };
            details += `\n📊 الوحدة: ${unitMap[exactMatch.unit] || exactMatch.unit}`;
            
            return details;
        }

        // 2. محاولة المطابقة حسب النوع فقط
        const typeMatch = orderItems.find(item => item.stoneType === stone.stoneType);
        if (typeMatch) {
            let details = typeMatch.stoneType;
            if (typeMatch.details) {
                details += `\n📝 ${typeMatch.details}`;
            }
            details += `\n📦 المطلوب: ${typeMatch.requiredQty}`;
            if (typeMatch.remainingQty > 0) {
                details += ` | المتبقي: ${typeMatch.remainingQty}`;
            }
            return details;
        }
    }

    // 3. إذا لم توجد طلبية، استخدم التفاصيل المخزنة في الحجر
    if (stone.details) {
        let details = stone.stoneType || "---";
        details += `\n📝 ${stone.details}`;
        if (stone.requiredQty && stone.requiredQty > 0) {
            details += `\n📦 المطلوب: ${stone.requiredQty}`;
        }
        if (stone.remainingQty && stone.remainingQty > 0) {
            details += ` | المتبقي: ${stone.remainingQty}`;
        }
        return details;
    }

    // 4. الرجوع إلى نوع الحجر فقط
    return stone.stoneType || "---";
}

function ShipmentPrint({ shipment, orderItems, orderNumber }: Props) {
    const printPage = () => {
        window.print();
    };

    let stones: Stone[] =
        shipment?.stones && shipment.stones.length > 0
            ? flattenStones(shipment.stones as StonePieceDoc[])
            : [
                  { 
                      barcode: "STN-0001", 
                      stoneType: "حجر مسمسم سراحي", 
                      length: 0, 
                      width: 30, 
                      thickness: 5, 
                      linearMeter: 0, 
                      area: 20, 
                      pieces: 20, 
                      status: "In Stock",
                      details: "وجه polished - درجة أولى",
                      requiredQty: 20,
                      remainingQty: 5
                  },
                  { 
                      barcode: "STN-0002", 
                      stoneType: "حجر مسمسم محصور", 
                      length: 69, 
                      width: 30, 
                      thickness: 5, 
                      linearMeter: 0, 
                      area: 21.74, 
                      pieces: 105, 
                      status: "In Stock",
                      details: "وجه honed - درجة ممتازة",
                      requiredQty: 105,
                      remainingQty: 10
                  },
                  { 
                      barcode: "STN-0003", 
                      stoneType: "جية مطبة وجه+جنبين", 
                      length: 0, 
                      width: 42, 
                      thickness: 7, 
                      linearMeter: 35, 
                      area: 0, 
                      pieces: 35, 
                      status: "In Stock",
                      details: "معالجة مطبة - كاملة",
                      requiredQty: 35,
                      remainingQty: 0
                  },
                  { 
                      barcode: "STN-0004", 
                      stoneType: "عتب مسمسم/مطبة", 
                      length: 130, 
                      width: 25, 
                      thickness: 15, 
                      linearMeter: 5.2, 
                      area: 0, 
                      pieces: 4, 
                      status: "In Stock",
                      details: "عتب مع جلب - مقاس خاص",
                      requiredQty: 4,
                      remainingQty: 2
                  },
                  { 
                      barcode: "STN-0005", 
                      stoneType: "سقف مسمسم/مطبة", 
                      length: 30, 
                      width: 25, 
                      thickness: 15, 
                      linearMeter: 0, 
                      area: 0, 
                      pieces: 20, 
                      status: "In Stock",
                      details: "سقف مطبة - عيار 30",
                      requiredQty: 20,
                      remainingQty: 8
                  },
                  { 
                      barcode: "STN-0006", 
                      stoneType: "سقف مسمسم/مطبة", 
                      length: 15, 
                      width: 25, 
                      thickness: 15, 
                      linearMeter: 0, 
                      area: 0, 
                      pieces: 17, 
                      status: "In Stock",
                      details: "سقف مطبة صغير - عيار 15",
                      requiredQty: 17,
                      remainingQty: 3
                  },
              ];

    stones = groupSimilarStones(stones);

    const storageKey = `shipment_units_${shipment?.consignmentNumber || 'default'}`;

    const getRowKey = (stone: Stone, index: number) => {
        return `${stone.stoneType || 'unknown'}_${stone.length || 0}_${stone.width || 0}_${stone.thickness || 0}_${index}`;
    };

    const loadSavedSelections = () => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('Error loading saved selections:', e);
        }
        return { entered: {}, sold: {} };
    };

    const saveSelections = (entered: Record<string, SoldUnit>, sold: Record<string, SoldUnit>) => {
        try {
            localStorage.setItem(storageKey, JSON.stringify({ entered, sold }));
        } catch (e) {
            console.error('Error saving selections:', e);
        }
    };

    const initialSaved = loadSavedSelections();
    const initialEntered: Record<string, SoldUnit> = {};
    const initialSold: Record<string, SoldUnit> = {};

    stones.forEach((stone, index) => {
        const key = getRowKey(stone, index);
        const enteredDefault = getEnteredQuantity(stone);
        const autoSold = getSoldQuantity(stone);
        
        initialEntered[key] = initialSaved.entered?.[key] || enteredDefault.unit;
        initialSold[key] = initialSaved.sold?.[key] || autoSold.unit;
    });

    const [enteredUnitOverrides, setEnteredUnitOverrides] = useState<Record<string, SoldUnit>>(initialEntered);
    const [soldUnitOverrides, setSoldUnitOverrides] = useState<Record<string, SoldUnit>>(initialSold);

    useEffect(() => {
        saveSelections(enteredUnitOverrides, soldUnitOverrides);
    }, [enteredUnitOverrides, soldUnitOverrides]);

    useEffect(() => {
        const handleBeforeUnload = () => {
            saveSelections(enteredUnitOverrides, soldUnitOverrides);
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [enteredUnitOverrides, soldUnitOverrides]);

    const updateEnteredUnit = (key: string, unit: SoldUnit) => {
        setEnteredUnitOverrides(prev => {
            const newState = { ...prev, [key]: unit };
            saveSelections(newState, soldUnitOverrides);
            return newState;
        });
    };

    const updateSoldUnit = (key: string, unit: SoldUnit) => {
        setSoldUnitOverrides(prev => {
            const newState = { ...prev, [key]: unit };
            saveSelections(enteredUnitOverrides, newState);
            return newState;
        });
    };

    type SoldTotals = { pieces: number; sqm: number; linearM: number };

    const soldTotals = stones.reduce<SoldTotals>(
        (acc, stone, index) => {
            const key = getRowKey(stone, index);
            const autoSold = getSoldQuantity(stone);
            const unit = soldUnitOverrides[key] ?? autoSold.unit;
            const value = Number(getValueForUnit(stone, unit)) || 0;

            if (unit === "قطعة") acc.pieces += value;
            else if (unit === "متر مربع") acc.sqm += value;
            else acc.linearM += value;

            return acc;
        },
        { pieces: 0, sqm: 0, linearM: 0 }
    );

    const soldTotalParts: string[] = [];
    if (soldTotals.sqm > 0) soldTotalParts.push(`${soldTotals.sqm.toFixed(2)} متر مربع`);
    if (soldTotals.linearM > 0) soldTotalParts.push(`${soldTotals.linearM.toFixed(2)} متر طول`);
    if (soldTotals.pieces > 0) soldTotalParts.push(`${soldTotals.pieces} قطعة`);

    const totals = shipment?.totals || {
        count: stones.length,
        cube: shipment?.totalCube ?? 0,
        sqm: shipment?.totalArea ?? stones.reduce((sum, s) => sum + num(s.area), 0),
        linearM: shipment?.totalLinearMeter ?? stones.reduce((sum, s) => sum + num(s.linearMeter), 0),
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

    // دالة لعرض التفاصيل بشكل منسق مع فواصل الأسطر
    const formatDetailsForDisplay = (details: string) => {
        return details.split('\n').map((line, i) => (
            <div key={i} style={{ fontSize: '12px', lineHeight: '1.4', padding: '1px 0' }}>
                {line}
            </div>
        ));
    };

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

                {/* ===== إضافة رقم الطلبية بشكل بارز ===== */}
                <div style={{
                    textAlign: 'center',
                    padding: '10px 0',
                    marginBottom: '15px',
                    backgroundColor: '#f0f8ff',
                    borderRadius: '8px',
                    border: '2px solid #0056b3'
                }}>
                    <span style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#0056b3'
                    }}>
                        📋 رقم الطلبية: {shipment?.orderNumber || orderNumber || "---"}
                    </span>
                </div>

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
                        <span className="value">
                            {shipment?.customer || "---"}
                        </span>
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
                        <span className="value">{shipment?.orderNumber || orderNumber || "---"}</span>
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
                            <th style={{ width: '5%' }}>الرقم</th>
                            <th style={{ width: '25%' }}>بيان الصنف</th>
                            <th style={{ width: '12%' }}>المعالجة المطلوبة</th>
                            <th style={{ width: '8%' }}>الطول (سم)</th>
                            <th style={{ width: '8%' }}>العرض (سم)</th>
                            <th style={{ width: '8%' }}>السمك (سم)</th>
                            <th colSpan={2} style={{ width: '15%' }}>كمية مدخلة</th>
                            <th colSpan={2} style={{ width: '15%' }}>كمية البيع</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stones.map((stone, index) => {
                            const key = getRowKey(stone, index);
                            const enteredDefault = getEnteredQuantity(stone);
                            const autoSold = getSoldQuantity(stone);

                            const enteredUnit = enteredUnitOverrides[key] ?? enteredDefault.unit;
                            const enteredValue = getValueForUnit(stone, enteredUnit);

                            const soldUnit = soldUnitOverrides[key] ?? autoSold.unit;
                            const soldValue = getValueForUnit(stone, soldUnit);

                            // الحصول على تفاصيل الصنف من الطلبية
                            const itemDetails = getOrderItemDetails(stone, orderItems);
                            const detailsLines = itemDetails.split('\n');

                            return (
                                <tr key={key}>
                                    <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                        {index + 1}
                                    </td>
                                    <td 
                                        contentEditable={false} 
                                        style={{ 
                                            backgroundColor: '#e8f4f8', 
                                            fontWeight: '500',
                                            color: '#004466',
                                            minWidth: '180px',
                                            fontSize: '11px',
                                            lineHeight: '1.4',
                                            padding: '4px 8px',
                                            textAlign: 'right',
                                            direction: 'rtl'
                                        }}
                                    >
                                        {detailsLines.map((line, i) => (
                                            <div key={i} style={{ 
                                                padding: '1px 0',
                                                borderBottom: i < detailsLines.length - 1 ? '1px dotted #cce0e8' : 'none'
                                            }}>
                                                {line}
                                            </div>
                                        ))}
                                    </td>
                                    <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                        {stone.stoneType || "---"}
                                    </td>
                                    <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                        {num(stone.length) === 0 ? "مفتوح" : stone.length}
                                    </td>
                                    <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                        {stone.width ?? "---"}
                                    </td>
                                    <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                        {stone.thickness ?? "---"}
                                    </td>
                                    <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                        {enteredValue}
                                    </td>
                                    <td contentEditable={false} style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                        <select
                                            className="unit-select"
                                            value={enteredUnit}
                                            onChange={(e) => updateEnteredUnit(key, e.target.value as SoldUnit)}
                                            style={{ fontSize: '11px', padding: '2px 4px' }}
                                        >
                                            {SOLD_UNITS.map((u) => (
                                                <option key={u} value={u}>
                                                    {u}
                                                </option>
                                            ))}
                                        </select>
                                        <span className="unit-print-label">{enteredUnit}</span>
                                    </td>
                                    <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                        {soldValue}
                                    </td>
                                    <td contentEditable={false} style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                        <select
                                            className="unit-select"
                                            value={soldUnit}
                                            onChange={(e) => updateSoldUnit(key, e.target.value as SoldUnit)}
                                            style={{ fontSize: '11px', padding: '2px 4px' }}
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
                        <span className="total-label">مجموع الكمية: 0.0 كوب,</span>
                        {soldTotalParts.map((part, i) => (
                            <span key={i} className="total-value">
                                {part}
                                {i < soldTotalParts.length - 1 ? " ، " : ""}
                            </span>
                        ))}
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