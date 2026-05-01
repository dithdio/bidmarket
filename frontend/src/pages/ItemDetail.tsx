import { Link, useParams } from 'react-router-dom';
import type { Item } from '../types';
import { useEffect, useState, useCallback } from 'react';
import { itemService } from '../services/item';

export default function ItemDetail() {
    const { id } = useParams<{ id: string }>();
    const [item, setItem] = useState<Item | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    // 1. Wrapped in useCallback to prevent infinite loops
    const fetchItem = useCallback(async () => {
        if (!id) return;
        try {
            const data = await itemService.getItemById(id);
            setItem(data);
        } catch (err) {
            setError('Failed to load the item.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    // 2. Added proper dependency array
    useEffect(() => {
        fetchItem();
    }, [fetchItem]);

    if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;
    if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;
    if (!item) return <div style={{ padding: '20px' }}>No item found.</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>{item.title}</h2>
                <Link to="/">
                    <button style={{ padding: '10px 15px', backgroundColor: '#4911d6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Home
                    </button>
                </Link>
            </div>

            <div style={{
                maxWidth: '600px',
                margin: '20px auto',
                padding: '25px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                backgroundColor: '#fff',
                fontFamily: 'sans-serif',
                textAlign: 'left'
            }}>
                {/* 1. Header Section */}
                <div style={{ display: 'flex', marginBottom: '10px' }}>
                    <span style={{
                        marginLeft: 'auto',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        backgroundColor: item.status === 'active' ? '#e6fffa' : '#fff5f5',
                        color: item.status === 'active' ? '#2c7a7b' : '#c53030',
                        border: `1px solid ${item.status === 'active' ? '#81e6d9' : '#feb2b2'}`
                    }}>
                        {item.status}
                    </span>
                </div>
            
                {/* 2. Price Section */}
                <div style={{ display: 'flex', gap: '30px', margin: '20px 0', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <div>
                        <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>Current Price</p>
                        <p style={{ fontSize: '22px', fontWeight: 'bold', color: '#0066cc', margin: '0' }}>
                            ${item.current_price || item.starting_price}
                        </p>
                    </div>
                    <div style={{ borderLeft: '1px solid #ddd', paddingLeft: '30px' }}>
                        <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0' }}>Starting Price</p>
                        <p style={{ fontSize: '16px', color: '#333', margin: '0' }}>
                            ${item.starting_price}
                        </p>
                    </div>
                </div>
            
                {/* 3. Description Section */}
                {item.description && item.description.trim() !== "" && (
                    <div style={{ marginBottom: '25px' }}>
                        <h3 style={{ fontSize: '16px', color: '#444', marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
                            Description
                        </h3>
                        <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#555', margin: 0 }}>
                            {item.description}
                        </p>
                    </div>
                )}
            
                {/* 4. Footer Section */}
                <div style={{ borderTop: '1px solid #eee', paddingTop: '15px', fontSize: '13px', color: '#888', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span><strong>Ends:</strong> {new Date(item.end_time).toLocaleString()}</span>
                        <span><strong>Seller:</strong> {item.seller_name}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span><strong>Listed:</strong> {new Date(item.created_at).toLocaleDateString()}</span>
                        <span><strong>Item Ref:</strong> #{item.id}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}