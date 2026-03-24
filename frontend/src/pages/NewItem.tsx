import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function  NewItem() {
  const { user, logout } = useAuth();
 




  
  return (
    <div style={{ padding: '20px' }}>
      <h1>BidMarket Feed</h1>
      {user ? (
        <div>
          <p>Welcome back, <strong>{user.username}</strong>!</p>
          
        {/* Add this link to the selling dashboard */}
        <Link to="/selling" style={{ textDecoration: 'none', color: '#0066cc', fontWeight: 'bold' }}>
            Selling Dashboard
        </Link>
          
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <p>You are not logged in.</p>
      )}
    </div>
  );
};