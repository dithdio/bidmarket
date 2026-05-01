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

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Only redirect if it's a 401 AND we aren't already trying to login
        // This prevents the "Login Loop"
        if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user'); // Also clear the user object
            window.location.href = '/login'; 
        }
        
        // This line is CRITICAL: it passes the error back to your Login.tsx catch block
        return Promise.reject(error);
    }
);

export default api;