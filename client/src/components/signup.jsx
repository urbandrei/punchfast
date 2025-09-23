import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Signup = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });
            
            const data = await response.json();
            setMessage(data.message);
            if (response.ok) {
                console.log('Sign up successful!');
                onLoginSuccess();
            }
        } catch (error) {
            console.error('Sign up error:', error);
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
            <div className={`slide-alert alert ${message ? (message === 'Sign up successful!' ? 'alert-success' : 'alert-danger') : ''} text-center${message ? ' show' : ''}`} role="alert">
                {message}
            </div>
            <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm mb-4">
                <div className="container-fluid">
                    <a className="navbar-brand fw-bold" href="#">Punchfast</a>
                        <div className="d-flex ms-auto">
                            <Link to="/business/signin" className="btn btn-outline-primary" role="button">Business</Link>
                        </div>
                </div>
            </nav>
            <div className="container">
                <div className="row justify-content-center align-items-center min-vh-100" style={{marginTop: '-56px'}}>
                    <div className="card shadow-sm mx-auto w-100" style={{maxWidth: '500px'}}>
                        <div className="card-body p-4 p-md-5">
                            <h2 className="card-title text-center mb-2 fw-bold">Sign Up</h2>                                
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label htmlFor="username" className="form-label">Username</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="username"
                                        placeholder="Enter username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="password" className="form-label">Password</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        id="password"
                                        placeholder="Enter password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <button type="submit" className="btn btn-primary">Sign in</button>
                                    <a href="#" className="form-text text-decoration-none ms-3">Forgot?</a>
                                </div>

                                <div className="text-center mt-4">
                                    <p className="text-muted mb-0">Already have an account? <Link to="/login" className="text-decoration-none fw-medium">Sign in</Link></p>
                                </div>
                            </form>

                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;