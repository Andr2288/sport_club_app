// frontend/src/lib/axios.js

import axios from "axios";

export const axiosInstance = axios.create({
    baseURL: "http://localhost:3001/api", // Оновлено порт
    withCredentials: true
})