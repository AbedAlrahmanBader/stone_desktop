import { useEffect, useState } from "react";
import api from "../api/axios";
import "../styles/shipments.css";

import ShipmentPrint from "../components/ShipmentPrint";


interface Shipment {

    _id:string;
    customer:string;
    totalArea:number;
    status:string;
    stones:any[];
    createdAt:string;

}



function Shipments(){


    const [shipments,setShipments] = useState<Shipment[]>([]);

    const [selected,setSelected] = useState<Shipment | null>(null);



    const loadShipments = async()=>{

        try{

            const response = await api.get("/shipments");

            setShipments(response.data);


        }catch(error){

            console.log(error);

        }

    };



    useEffect(()=>{

        loadShipments();

    },[]);




    return (

        <div className="shipments">


            <h1>
                الإرساليات
            </h1>



            <table>

                <thead>

                    <tr>

                        <th>العميل</th>

                        <th>عدد المشاتيح</th>

                        <th>المساحة</th>

                        <th>الحالة</th>

                        <th>التاريخ</th>

                        <th>طباعة</th>

                    </tr>

                </thead>



                <tbody>


                {

                    shipments.map((shipment)=>(


                        <tr key={shipment._id}>


                            <td>
                                {shipment.customer}
                            </td>



                            <td>
                                {shipment.stones.length}
                            </td>



                            <td>
                                {shipment.totalArea.toFixed(2)} m²
                            </td>



                            <td>
                                {shipment.status}
                            </td>



                            <td>

                                {
                                new Date(
                                    shipment.createdAt
                                )
                                .toLocaleDateString()
                                }

                            </td>



                            <td>


                                <button
                                onClick={()=>
                                    setSelected(shipment)
                                }
                                >

                                    🖨 طباعة

                                </button>


                            </td>


                        </tr>


                    ))

                }


                </tbody>


            </table>



            {
                selected && (

                    <div style={{marginTop:"30px"}}>

                        <ShipmentPrint
                            shipment={selected}
                        />

                    </div>

                )
            }



        </div>

    );

}


export default Shipments;