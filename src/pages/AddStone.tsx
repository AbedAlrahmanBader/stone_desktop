import { useEffect, useState } from "react";
import api from "../api/axios";
import "../styles/addStone.css";

interface StoneItemForm {
  stoneType: string;
  length: string;
  width: string;
  thickness: string;
  linearMeter: string;
  pieces: string;
}

interface CustomerOption {
  _id: string;
  name: string;
}

interface OrderOption {
  _id: string;
  orderNumber: string;
  status: string;
}

interface OrderItemOption {
  _id: string;
  stoneType: string;
  unit: string;
  length: number;
  width: number;
  thickness: number;
  requiredQty: number;
  remainingQty: number;
}

const emptyItem = (): StoneItemForm => ({
  stoneType: "",
  length: "",
  width: "",
  thickness: "",
  linearMeter: "",
  pieces: "",
});

const unitLabel = (unit: string) => {
  if (unit === "pieces") return "قطع";
  if (unit === "linearMeter") return "متر طولي";
  if (unit === "area") return "مساحة";
  return unit;
};

function calcItemPreview(item: StoneItemForm) {
  const length = Number(item.length) || 0;
  const width = Number(item.width) || 0;
  const pieces = Number(item.pieces) || 1;
  const enteredLinearMeter = Number(item.linearMeter) || 0;

  const lengthMeter = length / 100;
  const widthMeter = width / 100;

  const lengthIsZero = length === 0;

  let linearMeter: number;
  let area: number;
  let linearMeterIsAuto = false;

  if (!lengthIsZero) {
    linearMeter =
      item.linearMeter !== "" ? enteredLinearMeter : lengthMeter * pieces;

    linearMeterIsAuto = item.linearMeter === "";

    area = lengthMeter * widthMeter * pieces;
  } else {
    linearMeter = enteredLinearMeter;
    area = enteredLinearMeter * widthMeter;
  }

  return { lengthIsZero, linearMeter, area, linearMeterIsAuto };
}

function AddStone() {
  const [barcode, setBarcode] = useState("");
  const [items, setItems] = useState<StoneItemForm[]>([emptyItem()]);

  // --- عميل وطلبية ---
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerOrders, setCustomerOrders] = useState<OrderOption[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  // --- أصناف الطلبية المختارة (لعرضها كقائمة اختيار لنوع الحجر) ---
  const [orderItems, setOrderItems] = useState<OrderItemOption[]>([]);
  const [loadingOrderItems, setLoadingOrderItems] = useState(false);

  // تحميل لستة العملاء عند فتح الصفحة
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const res = await api.get("/customers");
        setCustomers(res.data);
      } catch (error) {
        console.error(error);
      }
    };
    loadCustomers();
  }, []);

  // تحميل طلبيات العميل المختار
  useEffect(() => {
    if (!selectedCustomerId) {
      setCustomerOrders([]);
      setOrderNumber("");
      return;
    }

    const loadCustomerOrders = async () => {
      setLoadingOrders(true);
      try {
        const res = await api.get(`/customers/profile/${selectedCustomerId}`);
        const orders: OrderOption[] = res.data?.orders || [];
        // نعرض بس الطلبيات المفتوحة (اللي لسا ناقصها كمية)
        setCustomerOrders(orders.filter((o) => o.status === "Open"));
      } catch (error) {
        console.error(error);
        alert("تعذر تحميل طلبيات العميل");
      } finally {
        setLoadingOrders(false);
      }
    };

    loadCustomerOrders();
    setOrderNumber("");
  }, [selectedCustomerId]);

  // تحميل أصناف الطلبية المختارة (لعرضها كقائمة اختيار نوع الحجر)
  useEffect(() => {
    if (!orderNumber) {
      setOrderItems([]);
      return;
    }

    const loadOrderItems = async () => {
      setLoadingOrderItems(true);
      try {
        const res = await api.get(`/orders/number/${orderNumber}`);
        const allItems: OrderItemOption[] = res.data?.items || [];
        // بس الأصناف يلي لسا ناقصها كمية
        setOrderItems(allItems.filter((it) => it.remainingQty > 0));
      } catch (error) {
        console.error(error);
        setOrderItems([]);
      } finally {
        setLoadingOrderItems(false);
      }
    };

    loadOrderItems();
  }, [orderNumber]);

  const updateItem = (
    index: number,
    field: keyof StoneItemForm,
    value: string
  ) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  // اختيار صنف جاهز من الطلبية بيعبي نوع الحجر والأبعاد تلقائيًا
  // (لازم تكون مطابقة تمامًا عشان الخصم من الطلبية يشتغل صح)
  const applyOrderItem = (index: number, orderItemId: string) => {
    const orderItem = orderItems.find((oi) => oi._id === orderItemId);
    if (!orderItem) return;

    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              stoneType: orderItem.stoneType,
              length: orderItem.length ? String(orderItem.length) : "",
              width: orderItem.width ? String(orderItem.width) : "",
              thickness: orderItem.thickness ? String(orderItem.thickness) : "",
            }
          : item
      )
    );
  };

  const addItemRow = () => {
    setItems((prev) => [...prev, emptyItem()]);
  };

  const removeItemRow = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const previews = items.map(calcItemPreview);

  const totalLinearMeter = previews.reduce((sum, p) => sum + p.linearMeter, 0);
  const totalArea = previews.reduce((sum, p) => sum + p.area, 0);

  const saveStone = async () => {
    if (!barcode) {
      alert("الرجاء إدخال الباركود");
      return;
    }

    if (items.length === 0) {
      alert("أضف نوع حجر واحد على الأقل");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const preview = previews[i];

      if (!item.stoneType || !item.width) {
        alert(`الرجاء تعبئة نوع الحجر والعرض للصنف رقم ${i + 1}`);
        return;
      }

      if (preview.lengthIsZero && (Number(item.linearMeter) || 0) === 0) {
        alert(`الطول = 0 للصنف رقم ${i + 1}، الرجاء إدخال المتر طول يدويًا`);
        return;
      }
    }

    try {
      await api.post("/stones", {
        barcode,
        orderNumber: orderNumber || undefined,
        items: items.map((item) => ({
          stoneType: item.stoneType,
          length: Number(item.length) || 0,
          width: Number(item.width) || 0,
          thickness: Number(item.thickness) || 0,
          pieces: Number(item.pieces) || 1,
          linearMeter:
            item.linearMeter !== "" ? Number(item.linearMeter) : undefined,
        })),
      });

      alert("تم إضافة المشتاح بنجاح");

      setBarcode("");
      setSelectedCustomerId("");
      setOrderNumber("");
      setCustomerOrders([]);
      setOrderItems([]);
      setItems([emptyItem()]);
    } catch (error: any) {
      console.log(error.response?.data || error);
      alert(error.response?.data?.message || "حدث خطأ أثناء الإضافة");
    }
  };

  return (
    <div className="add-stone">
      <h1>إضافة مشتاح جديد</h1>

      <input
        placeholder="الباركود"
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
      />

      {/* اختيار العميل */}
      <select
        value={selectedCustomerId}
        onChange={(e) => setSelectedCustomerId(e.target.value)}
      >
        <option value="">-- اختر العميل (اختياري) --</option>
        {customers.map((c) => (
          <option key={c._id} value={c._id}>
            {c.name}
          </option>
        ))}
      </select>

      {/* اختيار الطلبية - يظهر بس إذا في عميل مختار */}
      {selectedCustomerId && (
        <select
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          disabled={loadingOrders}
        >
          <option value="">
            {loadingOrders
              ? "جاري تحميل الطلبيات..."
              : customerOrders.length === 0
              ? "لا يوجد طلبيات مفتوحة لهذا العميل"
              : "-- اختر الطلبية (اختياري) --"}
          </option>
          {customerOrders.map((o) => (
            <option key={o._id} value={o.orderNumber}>
              {o.orderNumber}
            </option>
          ))}
        </select>
      )}

      {items.map((item, index) => {
        const preview = previews[index];

        return (
          <div className="stone-item-card" key={index}>
            <div className="stone-item-header">
              <h3>نوع حجر #{index + 1}</h3>

              {items.length > 1 && (
                <button
                  type="button"
                  className="remove-item-btn"
                  onClick={() => removeItemRow(index)}
                >
                  حذف
                </button>
              )}
            </div>

            {/* قائمة أصناف الطلبية المختارة - تعبي نوع الحجر والأبعاد تلقائيًا */}
            {orderNumber && (
              <select
                className="order-item-picker"
                value=""
                disabled={loadingOrderItems}
                onChange={(e) => {
                  if (e.target.value) applyOrderItem(index, e.target.value);
                }}
              >
                <option value="">
                  {loadingOrderItems
                    ? "جاري تحميل أصناف الطلبية..."
                    : orderItems.length === 0
                    ? "لا يوجد أصناف متبقية بهذه الطلبية"
                    : "-- اختر صنف من الطلبية (تعبئة تلقائية) --"}
                </option>
                {orderItems.map((oi) => (
                  <option key={oi._id} value={oi._id}>
                    {oi.stoneType} — {oi.length || "مفتوح"}×{oi.width}×
                    {oi.thickness} — متبقي {oi.remainingQty} {unitLabel(oi.unit)}
                  </option>
                ))}
              </select>
            )}

            <input
              placeholder="نوع الحجر"
              value={item.stoneType}
              onChange={(e) => updateItem(index, "stoneType", e.target.value)}
            />

            <input
              type="number"
              placeholder="الطول (سم) - اتركه 0 إذا غير متوفر"
              value={item.length}
              onChange={(e) => updateItem(index, "length", e.target.value)}
            />

            <input
              type="number"
              placeholder="العرض (سم)"
              value={item.width}
              onChange={(e) => updateItem(index, "width", e.target.value)}
            />

            <input
              type="number"
              placeholder="السمك (سم)"
              value={item.thickness}
              onChange={(e) => updateItem(index, "thickness", e.target.value)}
            />

            <input
              type="number"
              placeholder={
                preview.lengthIsZero
                  ? "متر طول (إجباري لأن الطول = 0)"
                  : "متر طول (اتركه فارغ للحساب التلقائي)"
              }
              value={item.linearMeter}
              onChange={(e) =>
                updateItem(index, "linearMeter", e.target.value)
              }
              style={
                preview.lengthIsZero
                  ? { borderColor: "#B71C1C", borderWidth: 1 }
                  : undefined
              }
            />

            <input
              type="number"
              placeholder="عدد القطع"
              value={item.pieces}
              onChange={(e) => updateItem(index, "pieces", e.target.value)}
            />

            <div className="calculated-preview">
              <p>
                المتر طول: <strong>{preview.linearMeter.toFixed(2)}</strong>
                {preview.linearMeterIsAuto && " (تلقائي)"}
              </p>

              <p>
                المتر مربع: <strong>{preview.area.toFixed(2)}</strong>
                {preview.lengthIsZero
                  ? " (من المتر طول × العرض)"
                  : " (تلقائي)"}
              </p>
            </div>
          </div>
        );
      })}

      <button type="button" className="add-item-btn" onClick={addItemRow}>
        + إضافة نوع حجر آخر
      </button>

      <div className="calculated-preview totals-preview">
        <p>
          إجمالي المتر طول: <strong>{totalLinearMeter.toFixed(2)}</strong>
        </p>
        <p>
          إجمالي المتر مربع: <strong>{totalArea.toFixed(2)}</strong>
        </p>
      </div>

      <button onClick={saveStone}>حفظ المشتاح</button>
    </div>
  );
}

export default AddStone;
