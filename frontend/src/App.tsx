import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import SellingDashboard from './pages/SellingDashboard';
import Home from './pages/Home';
import NewItem from './pages/NewItem';
import BuyingDashboard from './pages/BuyingDashboard';
import ItemDetail from './pages/ItemDetail';
// A temporary placeholder for the homepage


export default function App() {
  const { user } = useAuth();

  const ProtectedRoute = ({ children }: { children: React.JSX.Element }) => {
    const { user } = useAuth();
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };


  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/items/:id" element={<ItemDetail />} />

      {/* Wrap protected pages in the Bouncer */}
      <Route path="/selling" element={<ProtectedRoute><SellingDashboard /></ProtectedRoute>} />
      <Route path="/newitem" element={<ProtectedRoute><NewItem /></ProtectedRoute>} />
      <Route path="/buying" element={<ProtectedRoute><BuyingDashboard /></ProtectedRoute>} />
    </Routes>
    </BrowserRouter>
  );
} 