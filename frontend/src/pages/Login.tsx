import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    
    const { login, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const handleSubmit = async () => {
        // Clear previous errors
        setError('');       

        try {
            const data = await authService.login({ email, password });
            
            if (data && data.token) {
                login(data.user, data.token);
                navigate('/');
            }
        } catch (err: any) {
            console.log("Catch block triggered:", err);
            
            // Extract message safely
            const message = err.response?.data?.error || err.message || 'Failed to login';
            
            setError(message);

            // Clear error after 3 seconds (as requested)
            setTimeout(() => {
                setError('');      // Remove the red message
                setEmail('');      // Clear the email field
                setPassword('');   // Clear the password field
            }, 3000);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
            <h2>Login to BidMarket</h2>
            
            {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
            
            {/* Removed onSubmit from form to prevent native reload */}
            <form style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
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
                
                {/* Changed type to "button" and added onClick */}
                <button 
                    type="button" 
                    onClick={handleSubmit}
                    style={{ padding: '10px', fontSize: '16px', cursor: 'pointer' }}
                >
                    Login
                </button>
            </form>
        </div>
    );
}