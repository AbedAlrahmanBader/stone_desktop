import axios from "axios";

const api = axios.create({
    baseURL: "https://server-stone-1.onrender.com/api"
});

export default api;