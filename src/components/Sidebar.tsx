import "../styles/sidebar.css";
import { useNavigate } from "react-router-dom";


function Sidebar(){

    const navigate = useNavigate();


    return (

        <div className="sidebar">

            <h2>
                ALFAWAGHREH FOR MARBLE STONE
            </h2>


            <ul>

                <li onClick={() => navigate("/dashboard")}>
                    الرئيسية
                </li>


                <li onClick={() => navigate("/inventory")}>
                    المخزون
                </li>


                <li onClick={() => navigate("/add-stone")}>
                    إضافة مشتاح
                </li>


                <li onClick={() => navigate("/shipments")}>
                    الإرساليات
                </li>


                <li onClick={() => navigate("/customers")}>
                    العملاء
                </li>


                <li>
                    الإعدادات
                </li>


            </ul>


        </div>

    );

}


export default Sidebar;