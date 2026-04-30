import { Link, useNavigate } from "react-router-dom";
import { itemService } from "../services/item";
import { useState } from "react";

export default function  NewItem() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [end_time, setEnd_time] = useState('')
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();
    
    //Submit Handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        
        setError('');
        setIsSubmitting(true);
        setSuccessMessage('');

        try {
            // A. Send item creation data to your Express server
            const starting_price = parseFloat(price);
            const data = await itemService.createItem({ title, description, starting_price, end_time });
            // B. Success!
            setSuccessMessage('Item listed successfully! Redirecting...');
            setTimeout(() => {
            navigate('/selling'); // Or whatever your dashboard path is
            }, 1500);

        } catch (err: any) {
            // C. Catch your backend validation errors
            setError(err.response?.data?.error || 'Failed to create item. Please try again.');
        }
    };
 
  return (
            <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
            <h2>List an Item</h2>

            {/* Success Alert */}
            {successMessage && (
                <div style={{ 
                    backgroundColor: '#d4edda', 
                    color: '#155724', 
                    padding: '10px', 
                    borderRadius: '4px',
                    marginBottom: '15px' 
                }}>
                    {successMessage}
                </div>
            )}

            {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label>Title:</label>
                    <input 
                        type="text" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        required 
                        style={{ padding: '8px', fontSize: '16px' }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label>Description (Optional):</label>
                    <input 
                        type="text" 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)} 
                        style={{ padding: '8px', fontSize: '16px' }}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label>Starting Price:</label>
                    <input 
                        type="number" 
                        step="0.01"  // This allows 10.25 but flags 10.255 as invalid
                        min="0.01"   // Prevents zero or negative prices
                        value={price} 
                        onChange={(e) => {
                            const val = e.target.value;
                            // This regex allows numbers with up to 2 decimal places
                            if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
                                setPrice(val);
                            }
                        }}                        
                        required 
                        style={{ padding: '8px', fontSize: '16px' }}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label>Auction End Date & Time:</label>
                    <input 
                        type="datetime-local"
                        value={end_time}
                        onChange={(e) => setEnd_time(e.target.value)}
                        required
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    style={{ 
                        padding: '10px', 
                        fontSize: '16px', 
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        backgroundColor: isSubmitting ? '#cccccc' : '#4CAF50', 
                        color: 'white', 
                        border: 'none',
                        opacity: isSubmitting ? 0.7 : 1
                    }}
                >
                    {isSubmitting ? 'Processing...' : 'List Item'}
                </button>
            </form>
    </div>
  );
};