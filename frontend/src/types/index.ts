// src/types/index.ts

export interface User {
    id: number;
    username: string;
    email: string;
}

export interface Item {
    id: number;
    title: string;
    description: string;
    starting_price: string;
    current_price: string;  
    end_time: string;
    seller_id: number;
    status: 'active' | 'sold' | 'expired' | 'canceled',
    created_at: string;
    seller_name?: string;
}

export interface Bid {
    id: number;
    item_id: number;
    bidder_id: number;
    amount: string; 
    created_at: string;
}

export interface Watchlist {
    id: number;
    user_id: number;
    item_id: number;
    created_at: string;
}

// A helper type for when a user logs in and we get a token back
export interface AuthResponse {
    token: string;
    user: User;
}