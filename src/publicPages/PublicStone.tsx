import {
    useEffect,
    useState
} from "react";


import {
    useParams
} from "react-router-dom";


import api from "../api/axios";


import "../styles/publicStone.css";



function PublicStone(){


const {barcode}=useParams();


const [stone,setStone]=useState<any>(null);


const [loading,setLoading]=useState(true);



useEffect(()=>{


api.get(
    `/public/stone/${barcode}`
)

.then(res=>{

    setStone(res.data);

})

.catch(()=>{

    setStone(null);

})

.finally(()=>{

    setLoading(false);

});


},[barcode]);




if(loading){

return (

<div className="loading">

جاري تحميل البيانات...

</div>

)

}



if(!stone){

return (

<div className="loading">

المشتاح غير موجود

</div>

)

}



return (

<div className="stone-page">


<div className="stone-card">


<h1>
ALFAWAGHREH
</h1>


<h2>
MARBLE STONE
</h2>


<hr/>


<h3>
تفاصيل المشتاح
</h3>



<p>
<strong>
رقم الباركود:
</strong>

{stone.barcode}

</p>



{
stone.items?.map(
(item:any,index:number)=>(


<div 
key={index}
className="stone-item"
>


<hr/>


<p>

<strong>
نوع الحجر:
</strong>

{item.stoneType}

</p>



<p>

<strong>
الطول:
</strong>

{
item.length === 0
?
"مفتوح"
:
item.length
}

 سم

</p>



<p>

<strong>
العرض:
</strong>

{item.width}

 سم

</p>



<p>

<strong>
السمك:
</strong>

{item.thickness}

 سم

</p>



<p>

<strong>
القطع:
</strong>

{item.pieces}

</p>



<p>

<strong>
المساحة:
</strong>

{item.area}

م²

</p>



<p>

<strong>
المتر الطولي:
</strong>

{item.linearMeter}

م

</p>



</div>


)

)}



<hr/>


<p>

<strong>
مجموع المساحة:
</strong>

{stone.totalArea}

م²

</p>


<p>

<strong>
الحالة:
</strong>

{stone.status}

</p>



</div>


</div>

)

}


export default PublicStone;