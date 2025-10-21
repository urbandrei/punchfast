import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const NewStore = ({ onLoginSuccess }) => {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Try to get user's current position
        const fetchPositionAndSubmit = () => new Promise((resolve) => {
            if (navigator && navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                    () => resolve(null),
                    { timeout: 5000 }
                );
            } else {
                resolve(null);
            }
        });

        try {
            const pos = await fetchPositionAndSubmit();
            if (!pos) {
                setMessage('Could not determine your location. Please allow location access and try again.');
                return;
            }

            const payload = {
                name,
                address,
                latitude: pos.lat,
                longitude: pos.lng,
            };

            const response = await fetch('/api/newstore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            setMessage(data.message || (response.ok ? 'Store created' : 'Error'));
            if (response.ok) {
                console.log('new store successful!');
            }
        } catch (error) {
            console.error('Create store error:', error);
            setMessage('An error occurred. Please try again.');
        }
    };

    return (
        <div className="bg-light position-relative" style={{ minHeight: '100vh' }}>
            <style>{`
                .slide-alert {
                    position: absolute;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%) scaleY(0);
                    min-width: 300px;
                    z-index: 1050;
                    transition: transform 0.4s cubic-bezier(.4,0,.2,1);
                }
                .slide-alert.show {
                    transform: translateX(-50%) scaleY(1);
                }
            `}</style>
            <div className={`slide-alert alert ${message ? (message === 'Store created' ? 'alert-success' : 'alert-danger') : ''} text-center${message ? ' show' : ''}`} role="alert">
                {message}
            </div>
            <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm mb-4">
                <div className="container-fluid">
                    <a className="navbar-brand fw-bold" href="#">Punchfast</a>
                    <div className="d-flex ms-auto">
                        <Link to="/login" className="btn btn-outline-primary" role="button">Customer</Link>
                    </div>
                </div>
            </nav>
            <div className="container">
                <div className="row justify-content-center align-items-center min-vh-100" style={{marginTop: '-56px'}}>
                    <div className="card shadow-sm mx-auto w-100" style={{maxWidth: '500px'}}>
                        <div className="card-body p-4 p-md-5">
                            <h2 className="card-title text-center mb-2 fw-bold">Create New Store</h2>
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label htmlFor="name" className="form-label">Store Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="name"
                                        placeholder="Enter store name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="address" className="form-label">Address</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="address"
                                        placeholder="Enter address"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <button type="submit" className="btn btn-primary">Create Store</button>
                                </div>

                                <div className="text-center mt-4">
                                    <p className="text-muted mb-0">Already have an account? <Link to="/business/login" className="text-decoration-none fw-medium">Sign in</Link></p>
                                </div>
                            </form>

                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewStore;