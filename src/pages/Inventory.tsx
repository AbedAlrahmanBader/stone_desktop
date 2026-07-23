import { useEffect, useState } from "react";
import api from "../api/axios";
import "../styles/inventory.css";


interface Stone {

    _id:string;

    barcode:string;

    stoneType:string;

    length:number;

    width:number;

    thickness:number;

    linearMeter:number;

    area:number;

    pieces:number;

    status:string;

}


interface EditForm {

    barcode:string;

    stoneType:string;

    length:string;

    width:string;

    thickness:string;

    pieces:string;

    linearMeter:string;

}


const emptyForm: EditForm = {
    barcode: "",
    stoneType: "",
    length: "",
    width: "",
    thickness: "",
    pieces: "",
    linearMeter: "",
};


function Inventory(){


    const [stones,setStones] = useState<Stone[]>([]);

    const [search,setSearch] = useState("");

    const [status,setStatus] = useState("All");

    const [editingId, setEditingId] = useState<string | null>(null);

    const [editForm, setEditForm] = useState<EditForm>(emptyForm);




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



    // بدء تعديل مشتاح
    const startEdit = (stone: Stone) => {

        setEditingId(stone._id);

        setEditForm({
            barcode: stone.barcode,
            stoneType: stone.stoneType,
            length: String(stone.length ?? ""),
            width: String(stone.width ?? ""),
            thickness: String(stone.thickness ?? ""),
            pieces: String(stone.pieces ?? ""),
            linearMeter: String(stone.linearMeter ?? ""),
        });

    };


    // إلغاء التعديل
    const cancelEdit = () => {

        setEditingId(null);
        setEditForm(emptyForm);

    };


    // حفظ التعديل
    const saveEdit = async (id: string) => {

        try {

            await api.put(`/stones/${id}`, {

                barcode: editForm.barcode,
                stoneType: editForm.stoneType,
                length: Number(editForm.length) || 0,
                width: Number(editForm.width) || 0,
                thickness: Number(editForm.thickness) || 0,
                pieces: Number(editForm.pieces) || 0,
                linearMeter: Number(editForm.linearMeter) || 0,

            });

            cancelEdit();

            await loadStones();


        } catch (error: any) {

            console.log(error);

            alert(
                error?.response?.data?.message ||
                "حدث خطأ أثناء التعديل"
            );

        }

    };


    // حذف مشتاح
    const handleDelete = async (id: string) => {

        const confirmed = window.confirm(
            "متأكد إنك بدك تحذف هذا المشتاح؟"
        );

        if (!confirmed) return;

        try {

            await api.delete(`/stones/${id}`);

            await loadStones();


        } catch (error: any) {

            console.log(error);

            alert(
                error?.response?.data?.message ||
                "حدث خطأ أثناء الحذف"
            );

        }

    };




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
                            السماكة
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


                        <th>
                            إجراءات
                        </th>


                    </tr>


                </thead>






                <tbody>


                {


                filteredStones.map((stone)=>{

                    const isEditing = editingId === stone._id;

                    return (


                    <tr key={stone._id}>


                        <td>
                            {
                                isEditing ? (

                                    <input
                                        value={editForm.barcode}
                                        onChange={(e)=>
                                            setEditForm((prev)=>({
                                                ...prev,
                                                barcode: e.target.value,
                                            }))
                                        }
                                    />

                                ) : (

                                    stone.barcode

                                )
                            }
                        </td>



                        <td>
                            {
                                isEditing ? (

                                    <input
                                        value={editForm.stoneType}
                                        onChange={(e)=>
                                            setEditForm((prev)=>({
                                                ...prev,
                                                stoneType: e.target.value,
                                            }))
                                        }
                                    />

                                ) : (

                                    stone.stoneType

                                )
                            }
                        </td>




                        <td>
                            {
                                isEditing ? (

                                    <input
                                        type="number"
                                        value={editForm.length}
                                        onChange={(e)=>
                                            setEditForm((prev)=>({
                                                ...prev,
                                                length: e.target.value,
                                            }))
                                        }
                                    />

                                ) : (

                                    `${stone.length} m`

                                )
                            }
                        </td>




                        <td>
                            {
                                isEditing ? (

                                    <input
                                        type="number"
                                        value={editForm.width}
                                        onChange={(e)=>
                                            setEditForm((prev)=>({
                                                ...prev,
                                                width: e.target.value,
                                            }))
                                        }
                                    />

                                ) : (

                                    `${stone.width} m`

                                )
                            }
                        </td>




                        <td>
                            {
                                isEditing ? (

                                    <input
                                        type="number"
                                        value={editForm.thickness}
                                        onChange={(e)=>
                                            setEditForm((prev)=>({
                                                ...prev,
                                                thickness: e.target.value,
                                            }))
                                        }
                                    />

                                ) : (

                                    stone.thickness

                                )
                            }
                        </td>




                        <td>
                            {
                                isEditing ? (

                                    <input
                                        type="number"
                                        value={editForm.linearMeter}
                                        onChange={(e)=>
                                            setEditForm((prev)=>({
                                                ...prev,
                                                linearMeter: e.target.value,
                                            }))
                                        }
                                    />

                                ) : (

                                    `${stone.linearMeter} m`

                                )
                            }
                        </td>




                        <td>
                            {
                            Number(stone.area)
                            .toFixed(2)
                            } m²
                        </td>




                        <td>
                            {
                                isEditing ? (

                                    <input
                                        type="number"
                                        value={editForm.pieces}
                                        onChange={(e)=>
                                            setEditForm((prev)=>({
                                                ...prev,
                                                pieces: e.target.value,
                                            }))
                                        }
                                    />

                                ) : (

                                    stone.pieces

                                )
                            }
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



                        <td>

                            {
                                isEditing ? (

                                    <>

                                        <button onClick={()=> saveEdit(stone._id)}>
                                            ✅ حفظ
                                        </button>

                                        <button onClick={cancelEdit}>
                                            ❌ إلغاء
                                        </button>

                                    </>

                                ) : (

                                    <>

                                        <button onClick={()=> startEdit(stone)}>
                                            ✏️ تعديل
                                        </button>

                                        <button onClick={()=> handleDelete(stone._id)}>
                                            🗑 حذف
                                        </button>

                                    </>

                                )
                            }

                        </td>



                    </tr>


                    );

                })


                }



                </tbody>



            </table>



        </div>

    );


}


export default Inventory;