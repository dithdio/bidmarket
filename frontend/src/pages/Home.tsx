import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function  Home() {
  const { user, logout } = useAuth();
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>BidMarket Feed</h1>
      {user ? (
        <div>
          <p>Welcome back, <strong>{user.username}</strong>!</p>
          <div style={{ 
            maxWidth: '1200px', 
            margin: '0 auto', 
            padding: '20px', 
            display: 'flex',
            gap: '40px',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Link to="/selling" style={{ textDecoration: 'none', color: '#0066cc', fontWeight: 'bold' }}>
                Selling Dashboard
            </Link>
            
            <Link to="/buying" style={{ textDecoration: 'none', color: '#0066cc', fontWeight: 'bold' }}>
                Buying Dashboard
            </Link>
          </div>
          <div>
            <button onClick={logout}>Logout</button>
          </div>
      </div>
      ) : <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '20px',             // Adds vertical space between elements
        marginTop: '50px' 
    }}>
        <p style={{ margin: 0, fontSize: '18px', color: '#333' }}>You are not logged in.</p>
        
        <div style={{ display: 'flex', gap: '15px' }}> {/* Container for just the buttons */}
            <Link to="/Login" style={{ 
                textDecoration: 'none', 
                color: 'white', 
                backgroundColor: '#0066cc', 
                padding: '10px 20px', 
                borderRadius: '5px',
                fontWeight: 'bold' 
            }}>
                Login
            </Link>
            
            <Link to="/Register" style={{ 
                textDecoration: 'none', 
                color: 'white', 
                backgroundColor: '#0066cc', 
                padding: '10px 20px', 
                borderRadius: '5px',
                fontWeight: 'bold' 
            }}>
                Register
            </Link>
        </div>
      </div>}
    </div>
  );
};