import "../styles/sidebar.css";


function Sidebar(){

return (

<div className="sidebar">

<h2>
Quarry System
</h2>


<ul>

<li onClick={()=>window.location.href="/Dashboard"}>
    الرئيسية
</li>
<li onClick={()=>window.location.href="/inventory"}>
المخزون
</li>
<li onClick={()=>window.location.href="/add-stone"}>
إضافة مشتاح
</li>
<li onClick={()=>window.location.href="/shipments"}>
الإرساليات
</li>
<li onClick={() => window.location.href="/customers"}>
    العملاء
</li>
<li>الإعدادات</li>


</ul>

</div>

);

}


export default Sidebar;