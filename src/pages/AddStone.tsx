import { useState } from "react";
import api from "../api/axios";
import "../styles/addStone.css";

function AddStone() {
  const [form, setForm] = useState({
    barcode: "",
    stoneType: "",
    length: "",
    width: "",
    thickness: "",
    linearMeter: "", // اختياري لو الطول موجود، إجباري لو الطول = صفر
    pieces: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const length = Number(form.length) || 0;
  const width = Number(form.width) || 0;
  const pieces = Number(form.pieces) || 1;
  const enteredLinearMeter = Number(form.linearMeter) || 0;

  const lengthIsZero = length === 0;

  // معاينة حية لنفس منطق الباك اند
  let previewLinearMeter: number;
  let previewArea: number;
  let linearMeterIsAuto = false;

  if (!lengthIsZero) {
    // الطول موجود: المتر طول يتحسب تلقائيًا لو ما انكتب، والمساحة = طول × عرض × عدد
    previewLinearMeter =
      form.linearMeter !== "" ? enteredLinearMeter : length * pieces;
    linearMeterIsAuto = form.linearMeter === "";
    previewArea = length * width * pieces;
  } else {
    // الطول = صفر: لازم متر طول يدوي، والمساحة = متر طول × عرض
    previewLinearMeter = enteredLinearMeter;
    previewArea = enteredLinearMeter * width;
  }

  const saveStone = async () => {
    if (!form.barcode || !form.stoneType || !form.width) {
      alert("الرجاء تعبئة الباركود ونوع الحجر والعرض");
      return;
    }

    if (lengthIsZero && enteredLinearMeter === 0) {
      alert("الطول = 0، الرجاء إدخال المتر طول يدويًا");
      return;
    }

    try {
      await api.post("/stones", {
        barcode: form.barcode,
        stoneType: form.stoneType,
        length,
        width,
        thickness: Number(form.thickness),
        pieces,
        linearMeter: form.linearMeter !== "" ? enteredLinearMeter : 0,
      });

      alert("تم إضافة المشتاح بنجاح");

      setForm({
        barcode: "",
        stoneType: "",
        length: "",
        width: "",
        thickness: "",
        linearMeter: "",
        pieces: "",
      });
    } catch (error: any) {
      console.log(error.response?.data || error);
      alert(error.response?.data?.message || "حدث خطأ أثناء الإضافة");
    }
  };

  return (
    <div className="add-stone">
      <h1>إضافة مشتاح جديد</h1>

      <input
        name="barcode"
        placeholder="الباركود"
        value={form.barcode}
        onChange={handleChange}
      />

      <input
        name="stoneType"
        placeholder="نوع الحجر"
        value={form.stoneType}
        onChange={handleChange}
      />

      <input
        type="number"
        name="length"
        placeholder="الطول (م) - اتركه 0 إذا غير متوفر"
        value={form.length}
        onChange={handleChange}
      />

      <input
        type="number"
        name="width"
        placeholder="العرض (م)"
        value={form.width}
        onChange={handleChange}
      />

      <input
        type="number"
        name="thickness"
        placeholder="السمك (سم)"
        value={form.thickness}
        onChange={handleChange}
      />

      <input
        type="number"
        name="linearMeter"
        placeholder={
          lengthIsZero
            ? "متر طول (إجباري لأن الطول = 0)"
            : "متر طول (اتركه فاضي للحساب التلقائي)"
        }
        value={form.linearMeter}
        onChange={handleChange}
        style={lengthIsZero ? { borderColor: "#B71C1C", borderWidth: 1 } : undefined}
      />

      <input
        type="number"
        name="pieces"
        placeholder="عدد القطع"
        value={form.pieces}
        onChange={handleChange}
      />

      {/* معاينة حية */}
      <div className="calculated-preview">
        <p>
          المتر طول: <strong>{previewLinearMeter.toFixed(2)}</strong>
          {linearMeterIsAuto && " (تلقائي)"}
        </p>
        <p>
          المتر مربع: <strong>{previewArea.toFixed(2)}</strong>
          {lengthIsZero ? " (من المتر طول × العرض)" : " (تلقائي)"}
        </p>
      </div>

      


      <button onClick={saveStone}>حفظ المشتاح</button>
    </div>
  );
}

export default AddStone;