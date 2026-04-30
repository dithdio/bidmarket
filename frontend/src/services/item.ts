import api from './api';
import type { Item } from '../types';

// A quick helper type for what a user sends when creating a new auction
export interface CreateItemPayload {
    title: string;
    description: string;
    starting_price: number; 
    end_time: string; // usually an ISO string like "2026-03-30T12:00:00Z"
}

export interface UpdateItemPayload {
    title?: string;
    description?: string;
    end_time?: string;
}


export const itemService = {
    // 1. Fetch the main feed (GET /api/items)
    getAllItems: async (): Promise<Item[]> => {
        const response = await api.get('/items');
        return response.data;
    },

    // 2. Fetch a specific item for the details page (GET /api/items/:id)
    getItemById: async (id: string): Promise<Item> => {
        const response = await api.get(`/items/${id}`);
        return response.data;
    },

    // 3. Create a new auction (POST /api/items)
    createItem: async (itemData: CreateItemPayload): Promise<Item> => {
        const response = await api.post('/items', itemData);
        return response.data;
    },

    // 4. Delete an auction (DELETE /api/items/:id)
    deleteItem: async (id: string): Promise<void> => {
        await api.delete(`/items/${id}`);
    },

    // 5. Fetch the items that this user is able to buy (GET /api/items/buyableItems)
    getBuyableItems: async (): Promise<Item[]> => {
        const response = await api.get('/items/buyableItems');
        return response.data;
    },
    
    // 6. Fetch the items being sold by this user (GET /api/items/listedItems)
    getListedItems: async (): Promise<Item[]> => {
        const response = await api.get('/items/listedItems');
        return response.data;
    },

    // 7. Patch a user's auction item (PATCH /api/items/:id)
    patchItems: async (id: string, itemData: UpdateItemPayload): Promise<Item[]> => {
        const response = await api.patch(`/items/${id}`, itemData);
        return response.data;
    }


};