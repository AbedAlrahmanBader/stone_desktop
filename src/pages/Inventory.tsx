import { useEffect, useState } from "react";
import api from "../api/axios";
import "../styles/inventory.css";


interface Stone {

    _id:string;

    barcode:string;

    stoneType:string;

    length:number;

    width:number;

    linearMeter:number;

    area:number;

    pieces:number;

    status:string;

}



function Inventory(){


    const [stones,setStones] = useState<Stone[]>([]);

    const [search,setSearch] = useState("");

    const [status,setStatus] = useState("All");




    const loadStones = async()=>{

        try{

            const res = await api.get("/stones");

            setStones(res.data);


        }catch(error){

            console.log(error);

        }

    };



    useEffect(()=>{

        loadStones();

    },[]);




    const filteredStones = stones.filter((stone)=>{


        const matchSearch =

        stone.barcode
        .toLowerCase()
        .includes(
            search.toLowerCase()
        );



        const matchStatus =

        status==="All" ||

        stone.status===status;



        return matchSearch && matchStatus;


    });





    return (

        <div className="inventory">


            <h1>
                📦 المخزون
            </h1>




            <div className="inventory-tools">


                <input

                placeholder="بحث بالباركود..."

                value={search}

                onChange={(e)=>
                    setSearch(e.target.value)
                }

                />





                <select

                value={status}

                onChange={(e)=>
                    setStatus(e.target.value)
                }

                >

                    <option value="All">
                        الكل
                    </option>


                    <option value="In Stock">
                        موجود
                    </option>


                    <option value="Shipped">
                        مشحون
                    </option>


                </select>


            </div>







            <table>


                <thead>


                    <tr>


                        <th>
                            الباركود
                        </th>


                        <th>
                            نوع الحجر
                        </th>


                        <th>
                            الطول
                        </th>


                        <th>
                            العرض
                        </th>


                        <th>
                            متر طول
                        </th>


                        <th>
                            متر مربع
                        </th>


                        <th>
                            قطعة
                        </th>


                        <th>
                            الحالة
                        </th>


                    </tr>


                </thead>






                <tbody>


                {


                filteredStones.map((stone)=>(


                    <tr key={stone._id}>


                        <td>
                            {stone.barcode}
                        </td>



                        <td>
                            {stone.stoneType}
                        </td>




                        <td>
                            {stone.length} m
                        </td>




                        <td>
                            {stone.width} m
                        </td>




                        <td>
                            {stone.linearMeter} m
                        </td>




                        <td>
                            {
                            Number(stone.area)
                            .toFixed(2)
                            } m²
                        </td>




                        <td>
                            {stone.pieces}
                        </td>





                        <td>


                            <span
                            className={
                                stone.status==="In Stock"
                                ?
                                "available"
                                :
                                "shipped"
                            }
                            >

                            {
                            stone.status==="In Stock"
                            ?
                            "متوفر"
                            :
                            "مشحون"
                            }


                            </span>


                        </td>



                    </tr>


                ))


                }



                </tbody>



            </table>



        </div>

    );


}


export default Inventory;