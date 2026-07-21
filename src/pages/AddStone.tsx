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
    linearMeter: "",
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


  // تحويل من سم إلى متر
  const lengthMeter = length / 100;
  const widthMeter = width / 100;


  const lengthIsZero = length === 0;


  // معاينة الحساب
  let previewLinearMeter: number;
  let previewArea: number;
  let linearMeterIsAuto = false;


  if (!lengthIsZero) {

    // المتر الطولي = الطول بالمتر × عدد القطع
    previewLinearMeter =
      form.linearMeter !== ""
        ? enteredLinearMeter
        : lengthMeter * pieces;


    linearMeterIsAuto = form.linearMeter === "";


    // المتر مربع = الطول بالمتر × العرض بالمتر × عدد القطع
    previewArea =
      lengthMeter *
      widthMeter *
      pieces;


  } else {

    // الطول صفر → متر طول يدوي
    previewLinearMeter = enteredLinearMeter;


    // المتر مربع = المتر طول × العرض بالمتر
    previewArea =
      enteredLinearMeter *
      widthMeter;
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

        // إرسال بالسنتيمتر
        length,
        width,

        thickness: Number(form.thickness),

        pieces,

        linearMeter:
          form.linearMeter !== ""
            ? enteredLinearMeter
            : 0,
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

      alert(
        error.response?.data?.message ||
        "حدث خطأ أثناء الإضافة"
      );

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
        placeholder="الطول (سم) - اتركه 0 إذا غير متوفر"
        value={form.length}
        onChange={handleChange}
      />


      <input
        type="number"
        name="width"
        placeholder="العرض (سم)"
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
            : "متر طول (اتركه فارغ للحساب التلقائي)"
        }
        value={form.linearMeter}
        onChange={handleChange}
        style={
          lengthIsZero
            ? {
                borderColor: "#B71C1C",
                borderWidth: 1,
              }
            : undefined
        }
      />


      <input
        type="number"
        name="pieces"
        placeholder="عدد القطع"
        value={form.pieces}
        onChange={handleChange}
      />



      <div className="calculated-preview">

        <p>
          المتر طول:
          <strong>
            {" "}
            {previewLinearMeter.toFixed(2)}
          </strong>

          {linearMeterIsAuto && " (تلقائي)"}
        </p>


        <p>
          المتر مربع:
          <strong>
            {" "}
            {previewArea.toFixed(2)}
          </strong>

          {lengthIsZero
            ? " (من المتر طول × العرض)"
            : " (تلقائي)"}
        </p>

      </div>



      <button onClick={saveStone}>
        حفظ المشتاح
      </button>


    </div>
  );
}

export default AddStone;