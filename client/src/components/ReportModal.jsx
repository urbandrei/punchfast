import { useState } from 'react';
import { customerTokens } from '../utils/tokenManager';

const ReportModal = ({ show, onClose, itemType, itemId, itemName }) => {
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    if (!show) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!category) {
            setError('Please select a category');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const token = customerTokens.getAccessToken();
            const headers = {
                'Content-Type': 'application/json'
            };

            // Include token if user is logged in
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('/api/reports', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    reportedItemType: itemType,
                    reportedItemId: itemId,
                    category,
                    description: description.trim() || null
                })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
                setTimeout(() => {
                    onClose();
                    setCategory('');
                    setDescription('');
                    setSuccess(false);
                }, 2000);
            } else {
                setError(data.message || 'Failed to submit report');
            }
        } catch (err) {
            console.error('Error submitting report:', err);
            setError('Network error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const categories = [
        { value: '', label: 'Select a category...' },
        { value: 'closed_permanently', label: 'Closed Permanently' },
        { value: 'wrong_location', label: 'Wrong Location' },
        { value: 'duplicate', label: 'Duplicate Entry' },
        { value: 'inappropriate_content', label: 'Inappropriate Content' },
        { value: 'spam', label: 'Spam' },
        { value: 'other', label: 'Other' }
    ];

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999
            }}
            onClick={handleOverlayClick}
        >
            <div
                style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '30px',
                    maxWidth: '500px',
                    width: '90%',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {success ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '64px', marginBottom: '20px' }}>✓</div>
                        <h2 style={{ color: '#6AB7AD', marginBottom: '10px' }}>Report Submitted</h2>
                        <p style={{ color: '#555' }}>Thank you for helping keep our data accurate!</p>
                    </div>
                ) : (
                    <>
                        <h2 style={{
                            color: '#302C9A',
                            fontSize: '1.5rem',
                            fontWeight: '600',
                            marginBottom: '10px'
                        }}>
                            Report {itemType === 'store' ? 'Store' : 'Route'}
                        </h2>
                        <p style={{
                            color: '#777',
                            fontSize: '0.95rem',
                            marginBottom: '20px'
                        }}>
                            {itemName}
                        </p>

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'block',
                                    color: '#333',
                                    fontWeight: '500',
                                    marginBottom: '8px'
                                }}>
                                    Category *
                                </label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: '1px solid #ddd',
                                        fontSize: '1rem',
                                        backgroundColor: 'white',
                                        cursor: 'pointer'
                                    }}
                                    required
                                >
                                    {categories.map(cat => (
                                        <option key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'block',
                                    color: '#333',
                                    fontWeight: '500',
                                    marginBottom: '8px'
                                }}>
                                    Additional Details (Optional)
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Provide any additional information that might be helpful..."
                                    rows="4"
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: '1px solid #ddd',
                                        fontSize: '1rem',
                                        fontFamily: 'inherit',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>

                            {error && (
                                <div style={{
                                    backgroundColor: '#fee',
                                    color: '#c33',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    marginBottom: '15px',
                                    fontSize: '0.9rem'
                                }}>
                                    {error}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                    style={{
                                        flex: 1,
                                        backgroundColor: '#eee',
                                        color: '#333',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        fontSize: '1rem',
                                        fontWeight: '500',
                                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                        opacity: isSubmitting ? 0.6 : 1
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    style={{
                                        flex: 1,
                                        backgroundColor: '#FF5722',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        fontSize: '1rem',
                                        fontWeight: '500',
                                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                        opacity: isSubmitting ? 0.6 : 1
                                    }}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Report'}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default ReportModal;
