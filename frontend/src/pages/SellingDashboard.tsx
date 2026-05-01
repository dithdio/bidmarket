import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { itemService } from '../services/item';
import type { Item } from '../types';


export default function SellingDashboard() {
    const { user, logout } = useAuth();
    const [myItems, setMyItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [order, setOrder] = useState('Newest');

    useEffect(() => {
        // We only want to fetch if we actually have a logged-in user
        if (!user) return;

        const fetchMyItems = async () => {
            try {
                const sellerItems = await itemService.getListedItems();
                setMyItems(sellerItems);
            } catch (err) {
                console.log('Full Error Object:', err);
                setError('Failed to load your items.');
            } finally {
                setLoading(false);
            }
        };
        fetchMyItems();
    }, [user]);

    const changeOrder = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const criteria = e.target.value;
        setOrder(criteria);

        const sortedItems = [...myItems].sort((a, b) => {
        const priceA = parseFloat(a.starting_price);
        const priceB = parseFloat(b.starting_price);
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();

        if (criteria === 'Least to Most Expensive') return priceA - priceB;
        if (criteria === 'Most to Least Expensive') return priceB - priceA;
        if (criteria === 'Newest') return dateB - dateA;
        if (criteria === 'Oldest') return dateA - dateB;
        return 0;
    });
        setMyItems(sortedItems);
    };


    //  helper to handle deletions directly from the dashboard
    const handleDelete = async (itemId: number) => {
        if (!window.confirm("Are you sure you want to delete this listing?")) return;
        
        try {
            await itemService.deleteItem(itemId.toString());
            // Remove the deleted item from the screen instantly without refreshing
            setMyItems(myItems.filter(item => item.id !== itemId));
        } catch (err) {
            alert("Failed to delete item.");
        }
    };

    if (!user) {
        return <div style={{ padding: '20px' }}>Please log in to view your seller dashboard.</div>;
    }

    return (
        <div style={{ maxWidth: 'auto', margin: '0 auto', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' , gap: '40px' }}>
                <h2>My Selling Dashboard</h2>
                
                {/* build this 'Create' page next! */}
                <Link to="/newitem">
                    <button style={{ padding: '10px 15px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        + Create New Listing
                    </button>
                </Link>
                
                <Link to="/">
                    <button 
                    style={{ padding: '10px 15px', backgroundColor: '#4911d6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                            Home
                    </button>
                </Link>

            </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="sortBy-select">Sort By:</label>
                
                <select 
                id="sortBy-select"
                value={order} 
                onChange={(e) => changeOrder(e)}
                style={{ padding: '8px', borderRadius: '4px', fontSize: '16px' }}
                >

                {/* Actual options */}
                <option value="Newest">Newest</option>
                <option value="Oldest">Oldest</option>
                <option value="Least to Most Expensive">Least to Most Expensive </option>
                <option value="Most to Least Expensive">Most to Least Expensive</option>
                </select>

                {order && <p> Selected: <strong>{order}</strong></p>}
            </div>


            {loading && <p>Loading your inventory...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {!loading && myItems.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                    <h3>You aren't selling anything yet!</h3>
                    <p>Time to clear out the garage and make some money.</p>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {myItems.map((item) => (
                    <div key={item.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <h3 style={{ margin: '0 0 10px 0' }}>{item.title}</h3>
                                <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '12px', backgroundColor: item.status === 'active' ? '#e6f4ea' : '#fce8e6', color: item.status === 'active' ? '#1e8e3e' : '#d93025' }}>
                                    {item.status.toUpperCase()}
                                </span>
                            </div>
                            <p style={{ color: '#666', fontSize: '14px' }}>{item.description.substring(0, 60)}...</p>
                            <div style={{ margin: '15px 0', fontSize: '18px' }}>
                                Current Price: <strong>${item.current_price}</strong>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <Link to={`/items/${item.id}`} style={{ flex: 1 }}>
                                <button style={{ width: '100%', padding: '8px', cursor: 'pointer' }}>View</button>
                            </Link>
                            <button 
                                onClick={() => handleDelete(item.id)}
                                style={{ padding: '8px', cursor: 'pointer', backgroundColor: '#ff4d4d', color: 'white', border: 'none', borderRadius: '4px' }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}