import { useState } from 'react';

const AuthModal = ({ show, onClose, onLoginSuccess }) => {
    const [activeTab, setActiveTab] = useState('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        const endpoint = activeTab === 'login' ? '/api/login' : '/api/signup';

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                onLoginSuccess(data.user);
                onClose();
                setUsername('');
                setPassword('');
                setMessage('');
            } else {
                setMessage(data.message || 'An error occurred. Please try again.');
            }
        } catch (error) {
            console.error('Authentication error:', error);
            setMessage('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setMessage('');
        setUsername('');
        setPassword('');
    };

    const handleClose = () => {
        setUsername('');
        setPassword('');
        setMessage('');
        onClose();
    };

    if (!show) return null;

    return (
        <>
            <div className="modal d-block" tabIndex="-1" role="dialog" onClick={handleClose}>
                <div className="modal-dialog modal-dialog-centered" role="document" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-content">
                        <div className="modal-body px-4 pt-0 pb-4">
                            <ul className="nav nav-tabs nav-fill mb-4" role="tablist" style={{ borderBottom: '2px solid #A7CCDE' }}>
                                <li className="nav-item" role="presentation">
                                    <button
                                        className={`nav-link ${activeTab === 'login' ? 'active' : ''}`}
                                        onClick={() => handleTabChange('login')}
                                        type="button"
                                        style={{
                                            color: activeTab === 'login' ? '#302C9A' : '#6c757d',
                                            borderColor: activeTab === 'login' ? '#A7CCDE #A7CCDE #fff' : 'transparent',
                                            fontWeight: activeTab === 'login' ? '600' : '400'
                                        }}
                                    >
                                        Sign In
                                    </button>
                                </li>
                                <li className="nav-item" role="presentation">
                                    <button
                                        className={`nav-link ${activeTab === 'signup' ? 'active' : ''}`}
                                        onClick={() => handleTabChange('signup')}
                                        type="button"
                                        style={{
                                            color: activeTab === 'signup' ? '#302C9A' : '#6c757d',
                                            borderColor: activeTab === 'signup' ? '#A7CCDE #A7CCDE #fff' : 'transparent',
                                            fontWeight: activeTab === 'signup' ? '600' : '400'
                                        }}
                                    >
                                        Sign Up
                                    </button>
                                </li>
                            </ul>

                            {message && (
                                <div className="alert" role="alert" style={{
                                    backgroundColor: 'rgba(230, 142, 141, 0.1)',
                                    color: '#E68E8D',
                                    border: '1px solid #E68E8D',
                                    borderRadius: '8px'
                                }}>
                                    {message}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label htmlFor="modal-username" className="form-label" style={{ color: '#302C9A', fontWeight: '500' }}>Username</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="modal-username"
                                        placeholder="Enter username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        autoComplete="username"
                                        style={{ borderColor: '#A7CCDE', borderRadius: '8px' }}
                                        onFocus={(e) => e.target.style.borderColor = '#6AB7AD'}
                                        onBlur={(e) => e.target.style.borderColor = '#A7CCDE'}
                                    />
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="modal-password" className="form-label" style={{ color: '#302C9A', fontWeight: '500' }}>Password</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        id="modal-password"
                                        placeholder="Enter password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
                                        style={{ borderColor: '#A7CCDE', borderRadius: '8px' }}
                                        onFocus={(e) => e.target.style.borderColor = '#6AB7AD'}
                                        onBlur={(e) => e.target.style.borderColor = '#A7CCDE'}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary w-100"
                                    disabled={isLoading}
                                    style={{ borderRadius: '8px', padding: '12px', fontWeight: '500' }}
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            {activeTab === 'login' ? 'Signing In...' : 'Signing Up...'}
                                        </>
                                    ) : (
                                        activeTab === 'login' ? 'Sign In' : 'Sign Up'
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop show"></div>
        </>
    );
};

export default AuthModal;
