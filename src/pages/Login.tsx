import { useState } from "react";
import api from "../api/axios";
import logo from "../assets/AAA.jpg";
import "../styles/login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("الرجاء تعبئة كل الحقول");
      return;
    }

    setLoading(true);
    try {
      // ما عاد لازم نمسك التوكن يدوياً ونخزنه بـ localStorage
      // السيرفر بيحط الكوكي httpOnly تلقائياً، والمتصفح بيبعتها مع كل طلب لاحق
      await api.post("/auth/login", { email, password });

      window.location.href = "/dashboard";
    } catch (error: any) {
      alert(error.response?.data?.message || "في مشكلة بالسيرفر");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo">
          <img src={logo} alt="Alfawaghreh Logo" />
        </div>

        <h1>ALFAWAGHREH FOR MARBLE STONE</h1>

        <p>نظام إدارة المحجر</p>

        <div className="input-group">
          <input
            placeholder="البريد الإلكتروني"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            placeholder="كلمة المرور"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button onClick={handleLogin} disabled={loading}>
          {loading ? "جاري الدخول..." : "دخول"}
        </button>
      </div>
    </div>
  );
}

export default Login;
