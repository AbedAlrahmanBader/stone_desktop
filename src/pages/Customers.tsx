// في Customers.tsx - أضف زر تعديل في الجدول

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../styles/customers.css";

interface Customer {
  _id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

function Customers() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  const loadCustomers = async () => {
    try {
      const res = await api.get("/customers");
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const saveCustomer = async () => {
    if (!form.name) {
      alert("أدخل اسم العميل");
      return;
    }

    try {
      if (editingCustomer) {
        // تحديث عميل موجود
        await api.put(`/customers/${editingCustomer._id}`, form);
        alert("تم تحديث العميل");
        setEditingCustomer(null);
      } else {
        // إضافة عميل جديد
        await api.post("/customers", form);
        alert("تمت إضافة العميل");
      }

      setForm({
        name: "",
        phone: "",
        email: "",
        address: "",
        notes: "",
      });

      loadCustomers();
    } catch (err) {
      console.error(err);
      alert("حدث خطأ");
    }
  };

  const deleteCustomer = async (id: string) => {
    if (!window.confirm("حذف العميل؟")) return;

    try {
      await api.delete(`/customers/${id}`);
      loadCustomers();
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء الحذف");
    }
  };

  // دالة لبدء التعديل
  const startEditing = (customer: Customer) => {
    setEditingCustomer(customer);
    setForm({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      notes: customer.notes,
    });
    // التمرير إلى أعلى الصفحة
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // إلغاء التعديل
  const cancelEditing = () => {
    setEditingCustomer(null);
    setForm({
      name: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
    });
  };

  return (
    <div className="customers-page">

      <h1>العملاء</h1>

      <div className="customer-form">
        <h2>{editingCustomer ? "تعديل العميل" : "إضافة عميل جديد"}</h2>

        <input
          name="name"
          placeholder="اسم العميل"
          value={form.name}
          onChange={handleChange}
        />

        <input
          name="phone"
          placeholder="رقم الهاتف"
          value={form.phone}
          onChange={handleChange}
        />

        <input
          name="email"
          placeholder="البريد الإلكتروني"
          value={form.email}
          onChange={handleChange}
        />

        <input
          name="address"
          placeholder="العنوان"
          value={form.address}
          onChange={handleChange}
        />

        <textarea
          name="notes"
          placeholder="ملاحظات"
          value={form.notes}
          onChange={handleChange}
        />

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={saveCustomer}>
            {editingCustomer ? "تحديث العميل" : "إضافة العميل"}
          </button>
          
          {editingCustomer && (
            <button 
              onClick={cancelEditing}
              style={{ backgroundColor: "#6c757d" }}
            >
              إلغاء التعديل
            </button>
          )}
        </div>
      </div>

      <table className="customers-table">
        <thead>
          <tr>
            <th>#</th>
            <th>الاسم</th>
            <th>الهاتف</th>
            <th>البريد</th>
            <th>العنوان</th>
            <th>ملاحظات</th>
            <th>إجراءات</th>
          </tr>
        </thead>

        <tbody>
          {customers.map((customer, index) => (
            <tr key={customer._id}>
              <td>{index + 1}</td>

              <td
                style={{ cursor: "pointer", color: "green" }}
                onClick={() => navigate(`/customers/profile/${customer._id}`)}
              >
                {customer.name}
              </td>

              <td>{customer.phone}</td>
              <td>{customer.email}</td>
              <td>{customer.address}</td>
              <td>{customer.notes}</td>

              <td>
                <div style={{ display: "flex", gap: "5px" }}>
                  <button
                    className="edit-btn"
                    onClick={() => startEditing(customer)}
                    style={{
                      backgroundColor: "#007bff",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    تعديل
                  </button>
                  
                  <button
                    className="delete-btn"
                    onClick={() => deleteCustomer(customer._id)}
                    style={{
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    حذف
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}

export default Customers;