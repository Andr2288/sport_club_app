// src/lib/axios.js
import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'http://localhost:3001/api', // Виправлений порт з .env
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Важливо для передачі cookies з JWT
});

// Видаляємо interceptor для токенів, оскільки використовуємо cookies
// axiosInstance.interceptors.request.use((config) => {
//     const { authUser } = useAuthStore.getState();
//     if (authUser?.token) {
//         config.headers.Authorization = `Bearer ${authUser.token}`;
//     }
//     return config;
// });

// Можна додати interceptor для обробки помилок
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Якщо отримали 401, можна очистити auth store
            // useAuthStore.getState().setAuthUser(null);
        }
        return Promise.reject(error);
    }
);

export { axiosInstance };