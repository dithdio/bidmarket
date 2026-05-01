import api from './api';
import type { AuthResponse } from '../types';

export const authService = {
    register: async (userData: any): Promise<AuthResponse> => {
        const response = await api.post('/users/register', userData);
        return {
            token: response.data.token,
            user: {
                id: response.data.id,
                username: response.data.username,
                email: response.data.email
            }
        };
    },

    login: async (credentials: any): Promise<AuthResponse> => {
        const response = await api.post('/users/login', credentials);
        // Your backend already sends { token, user }, so just return it!
        return response.data; 
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },
};