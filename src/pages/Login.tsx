import { useState } from "react";
import api from "../api/axios";
import "../styles/login.css";


function Login(){

    const [email,setEmail] = useState("");
    const [password,setPassword] = useState("");



    const handleLogin = async()=>{

        try{

            const res = await api.post(
                "/auth/login",
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


        }catch(error){

            alert("بيانات الدخول غير صحيحة");

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