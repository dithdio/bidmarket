import { createContext, useState, useEffect, type ReactNode, useContext } from 'react';
import type { User } from '../types';
import { jwtDecode } from 'jwt-decode'

// 1. Define exactly what lives inside our "Global Cloud"
interface AuthContextType {
    user: User | null;
    login: (userData: User, token: string) => void;
    logout: () => void;
}

// 2. Create the Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Create the Provider (The component that wraps your app)
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        
        if (storedUser && storedToken) {
            try {
                // 1. Decode the token to get the expiration
                const decoded: any = jwtDecode(storedToken);
                const currentTime = Date.now() / 1000; // Convert ms to seconds

                // 2. Compare current time to expiration time
                if (decoded.exp < currentTime) {
                    console.log("Token expired. Logging out...");
                    logout(); // Token is dead, wipe everything
                } else {
                    setUser(JSON.parse(storedUser)); // Token is healthy!
                }
            } catch (err) {
                // If token is malformed or can't be decoded
                logout();
            }   
        }
    }, []);

    const login = (userData: User, token: string) => {
        setUser(userData); // Update the React state
        localStorage.setItem('user', JSON.stringify(userData)); // Save to browser
        localStorage.setItem('token', token); // Save token for Axios
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// 4. Create a custom hook so components can easily grab the data
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};