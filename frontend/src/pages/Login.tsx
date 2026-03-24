import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth';

export default function Login() {
    // 1. Component State 
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    
    // 2. Global Hooks
    const { login } = useAuth();
    const navigate = useNavigate();

    // 3. The Submit Handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // Stop the page from refreshing!
        setError('');       // Clear any old errors

        try {
            // A. Send the request to your Express server
            const data = await authService.login({ email, password });
            
            // B. Success! Save to global state & localStorage
            login(data.user, data.token);
            
            // C. Redirect them to the homepage
            navigate('/');
        } catch (err: any) {
            // D. Display the exact error your Express server sent back
            setError(err.response?.data?.error || 'Failed to login. Please try again.');
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
            <h2>Login to BidMarket</h2>
            
            {/* If there's an error, show it in red */}
            {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label>Email:</label>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                        style={{ padding: '8px', fontSize: '16px' }}
                    />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label>Password:</label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        style={{ padding: '8px', fontSize: '16px' }}
                    />
                </div>
                
                <button type="submit" style={{ padding: '10px', fontSize: '16px', cursor: 'pointer' }}>
                    Login
                </button>
            </form>
        </div>
    );
}