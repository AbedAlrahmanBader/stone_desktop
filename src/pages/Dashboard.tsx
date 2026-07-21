import { useEffect, useState } from "react";
import "../styles/dashboard.css";
import api from "../api/axios";

interface Stone {
    _id: string;
    barcode: string;
    stoneType: string;
    length: number;
    width: number;
    thickness: number;
    weight: number;
    status: string;
}

interface Shipment {
    _id: string;
    customer: string;
    stones: any[];
    totalArea: number;
    status: string;
}

function Dashboard() {
    const [stones, setStones] = useState<Stone[]>([]);
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const stonesResponse = await api.get("/stones");
            const shipmentsResponse = await api.get("/shipments");

            setStones(stonesResponse.data);
            setShipments(shipmentsResponse.data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    

    const available = stones.filter(
        (item) => item.status === "In Stock"
    ).length;

    const shipped = stones.filter(
        (item) => item.status === "Shipped"
    ).length;

    if (loading) {
        return (
            <div className="dashboard">
                <h2>جاري تحميل البيانات...</h2>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div>
                <h1>📊 لوحة التحكم</h1>

                <div className="cards">
                    <div className="card green">
                        <div className="icon">🪨</div>
                        <h3>عدد المشاتيح</h3>
                        <p>{stones.length}</p>
                    </div>

                    <div className="card blue">
                        <div className="icon">🚚</div>
                        <h3>الإرساليات</h3>
                        <p>{shipments.length}</p>
                    </div>

                    <div className="card purple">
                        <div className="icon">✅</div>
                        <h3>المشاتيح المتوفرة</h3>
                        <p>{available}</p>
                    </div>

                    <div className="card red">
                        <div className="icon">📦</div>
                        <h3>المشاتيح المشحونة</h3>
                        <p>{shipped}</p>
                    </div>

                 
                </div>
            </div>
        </div>
    );
}

export default Dashboard;