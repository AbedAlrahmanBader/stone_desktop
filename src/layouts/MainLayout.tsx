import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "../styles/Layout.css";


function MainLayout(){

    return (

        <div className="dashboard">

            <Sidebar />


            <main className="content">

                <Outlet />

            </main>


        </div>

    );

}


export default MainLayout;