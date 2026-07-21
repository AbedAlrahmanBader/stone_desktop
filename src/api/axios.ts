import axios from "axios";

const api = axios.create({
    baseURL: "https://server-stone.onrender.com/api"
});

export default api;