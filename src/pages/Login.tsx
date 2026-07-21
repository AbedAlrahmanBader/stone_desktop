import { useState } from "react";
import api from "../api/axios";
import "../styles/login.css";
import axios from "axios"; // ✅ مهم


function Login(){

    const [email,setEmail] = useState("");
    const [password,setPassword] = useState("");



    const handleLogin = async()=>{

        try{

            const res = await axios.post(
  "https://server-stone.onrender.com/api/auth/login",
  {
    email,
    password
  }
);


            localStorage.setItem(
                "token",
                res.data.token
            );


            window.location.href="/dashboard";


        }catch (error: any) {
  console.log("ERROR:", error.response?.data || error.message);
  alert(error.response?.data?.message || "في مشكلة بالسيرفر");
}

    };



    return (

        <div className="login-page">


            <div className="login-card">


                <div className="logo">

                    🪨

                </div>


                <h1>
                    Quarry System
                </h1>


                <p>
                    نظام إدارة المحجر
                </p>



                <input

                    placeholder="البريد الإلكتروني"

                    value={email}

                    onChange={(e)=>
                        setEmail(e.target.value)
                    }

                />



                <input

                    placeholder="كلمة المرور"

                    type="password"

                    value={password}

                    onChange={(e)=>
                        setPassword(e.target.value)
                    }

                />



                <button
                onClick={handleLogin}
                >

                    دخول

                </button>



            </div>


        </div>

    );

}


export default Login;