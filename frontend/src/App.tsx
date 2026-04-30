import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import SellingDashboard from './pages/SellingDashboard';
import Home from './pages/Home';
import NewItem from './pages/NewItem';
import BuyingDashboard from './pages/BuyingDashboard';
// A temporary placeholder for the homepage


export default function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* The Main Feed */}
        <Route path="/" element={<Home />} />
        
        {/* The Login Page (If they are already logged in, kick them back to the homepage!) */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" /> : <Login />} 
        />
        {/* Register Route */}
        <Route 
          path="/register" 
          element={user ? <Navigate to="/" /> : <Register />} 
        />
        {/* The Selling Dashboard Route. Protected so only logged-in users can access it */}
        <Route 
          path="/selling" 
          element={user ? <SellingDashboard /> : <Navigate to="/login" />} 
        />
          {/* Creatubg Item Route. */}
        <Route 
          path="/newitem" 
          element={user ? <NewItem /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/buying" 
          element={user ? <BuyingDashboard /> : <Navigate to="/login" />} 
        />
      </Routes> 
    </BrowserRouter>
  );
} 