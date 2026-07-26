import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";


function PublicStone(){

    const { barcode } = useParams();

    const [stone,setStone] = useState<any>(null);


    useEffect(()=>{

        if(barcode){

            api.get(`/stones/barcode/${barcode}`)
            .then(res=>{
                setStone(res.data);
            })
            .catch(()=>{
                setStone(null);
            });

        }

    },[barcode]);


    if(!stone)
        return <h2>المشتاح غير موجود</h2>


    return (

        <div dir="rtl">

            <h1>تفاصيل المشتاح</h1>

            <p>
                الباركود:
                {stone.barcode}
            </p>

            {stone.items?.map((item:any,index:number)=>(

                <div key={index}>

                    <p>
                    نوع الحجر: {item.stoneType}
                    </p>

                    <p>
                    الطول: {item.length}
                    </p>

                    <p>
                    العرض: {item.width}
                    </p>

                    <p>
                    السمك: {item.thickness}
                    </p>

                    <p>
                    عدد القطع: {item.pieces}
                    </p>

                    <hr/>

                </div>

            ))}

        </div>

    )

}


export default PublicStone;