import axios from 'axios';

// 1. Create the base Axios instance
const api = axios.create({
    // In Vite, environment variables start with VITE_
    // We will set this up in a .env file next!
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// 2. The Interceptor: Automatically attach the token
api.interceptors.request.use(
    (config) => {
        // Look inside the browser's localStorage for a saved token
        const token = localStorage.getItem('token');
        
        // If we found one, attach it to the Authorization header
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;