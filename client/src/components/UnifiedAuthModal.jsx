import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const UnifiedAuthModal = ({ show, onClose, onLoginSuccess, initialAuthType = 'customer' }) => {
    const [authType, setAuthType] = useState(initialAuthType);
    const [activeTab, setActiveTab] = useState('login');
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        legalName: '',
        email: '',
        phone: '',
        address: ''
    });
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    if (!show) return null;

    const resetForm = () => {
        setFormData({
            username: '',
            password: '',
            confirmPassword: '',
            legalName: '',
            email: '',
            phone: '',
            address: ''
        });
        setMessage('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        resetForm();
    };

    const handleAuthTypeToggle = () => {
        setAuthType(prev => prev === 'customer' ? 'business' : 'customer');
        resetForm();
    };

    const handleFieldChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        const { username, password, confirmPassword, legalName, email, phone, address } = formData;

        // Validation
        if (authType === 'business' && activeTab === 'signup') {
            if (!username || !legalName || !email || !address || !phone || !password || !confirmPassword) {
                setIsLoading(false);
                setMessage('Please fill in all required fields.');
                return;
            }
            if (password !== confirmPassword) {
                setIsLoading(false);
                setMessage('Passwords do not match.');
                return;
            }
        }

        // Determine endpoint
        let endpoint;
        if (authType === 'customer') {
            endpoint = activeTab === 'login' ? '/api/login' : '/api/signup';
        } else {
            endpoint = activeTab === 'login' ? '/api/business/login' : '/api/business/signup';
        }

        // Build payload
        let payload;
        if (authType === 'customer') {
            payload = { username, password };
        } else if (activeTab === 'login') {
            payload = { username, password };
        } else {
            // Business signup
            payload = { username, password, legalName, email, address, phone };
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                if (authType === 'customer') {
                    // Customer login/signup: Close modal immediately, pass tokens
                    onLoginSuccess(data.user, 'customer', {
                        accessToken: data.accessToken,
                        refreshToken: data.refreshToken
                    });
                    handleClose();
                } else if (activeTab === 'login') {
                    // Business login: Close modal, navigate to /business/punches, pass tokens
                    if (data.business && onLoginSuccess) {
                        onLoginSuccess(data.business, 'business', {
                            accessToken: data.accessToken,
                            refreshToken: data.refreshToken
                        });
                    }
                    handleClose();
                    navigate('/business/punches');
                } else {
                    // Business signup: Show approval message, keep modal open
                    setMessage(
                        data.message ||
                        'Application submitted. Your business is pending approval.'
                    );
                    // Clear only password fields
                    setFormData(prev => ({
                        ...prev,
                        password: '',
                        confirmPassword: ''
                    }));
                }
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

    // Dynamic tab titles based on auth type
    const getTabTitle = (tab) => {
        if (authType === 'customer') {
            return tab === 'login' ? 'Sign In' : 'Sign Up';
        } else {
            return tab === 'login' ? 'Business Sign In' : 'Business Sign Up';
        }
    };

    const getSubmitButtonText = () => {
        if (isLoading) {
            return activeTab === 'login' ? 'Signing In...' : 'Signing Up...';
        }
        return activeTab === 'login' ? 'Sign In' : 'Sign Up';
    };

    // Determine input ID prefix for autofill
    const idPrefix = authType === 'customer' ? 'customer' : 'business';

    return (
        <>
            <div className="modal d-block" tabIndex="-1" role="dialog" onClick={handleClose}>
                <div className="modal-dialog modal-dialog-centered" role="document" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-content">
                        <div className="modal-body px-4 pt-0 pb-4">
                            {/* Tab Navigation */}
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
                                        {getTabTitle('login')}
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
                                        {getTabTitle('signup')}
                                    </button>
                                </li>
                            </ul>

                            {/* Error/Success Message */}
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

                            {/* Form */}
                            <form onSubmit={handleSubmit}>
                                {/* Username Field */}
                                <div className="mb-3">
                                    <label htmlFor={`${idPrefix}-username`} className="form-label" style={{ color: '#302C9A', fontWeight: '500' }}>
                                        {authType === 'business' ? 'Business Username' : 'Username'}
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id={`${idPrefix}-username`}
                                        placeholder={authType === 'business' ? 'Choose a username for your business' : 'Enter username'}
                                        value={formData.username}
                                        onChange={(e) => handleFieldChange('username', e.target.value)}
                                        required
                                        autoComplete="username"
                                        style={{ borderColor: '#A7CCDE', borderRadius: '8px' }}
                                        onFocus={(e) => e.target.style.borderColor = '#6AB7AD'}
                                        onBlur={(e) => e.target.style.borderColor = '#A7CCDE'}
                                    />
                                </div>

                                {/* Business Signup Only Fields */}
                                {authType === 'business' && activeTab === 'signup' && (
                                    <>
                                        <div className="mb-3">
                                            <label htmlFor="business-legal-name" className="form-label" style={{ color: '#302C9A', fontWeight: '500' }}>
                                                Legal Business Name
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="business-legal-name"
                                                placeholder="Exact legal name"
                                                value={formData.legalName}
                                                onChange={(e) => handleFieldChange('legalName', e.target.value)}
                                                required
                                                style={{ borderColor: '#A7CCDE', borderRadius: '8px' }}
                                                onFocus={(e) => e.target.style.borderColor = '#6AB7AD'}
                                                onBlur={(e) => e.target.style.borderColor = '#A7CCDE'}
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label htmlFor="business-email" className="form-label" style={{ color: '#302C9A', fontWeight: '500' }}>
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                id="business-email"
                                                placeholder="business@example.com"
                                                value={formData.email}
                                                onChange={(e) => handleFieldChange('email', e.target.value)}
                                                required
                                                autoComplete="email"
                                                style={{ borderColor: '#A7CCDE', borderRadius: '8px' }}
                                                onFocus={(e) => e.target.style.borderColor = '#6AB7AD'}
                                                onBlur={(e) => e.target.style.borderColor = '#A7CCDE'}
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label htmlFor="business-phone" className="form-label" style={{ color: '#302C9A', fontWeight: '500' }}>
                                                Phone
                                            </label>
                                            <input
                                                type="tel"
                                                className="form-control"
                                                id="business-phone"
                                                placeholder="Business phone number"
                                                value={formData.phone}
                                                onChange={(e) => handleFieldChange('phone', e.target.value)}
                                                required
                                                style={{ borderColor: '#A7CCDE', borderRadius: '8px' }}
                                                onFocus={(e) => e.target.style.borderColor = '#6AB7AD'}
                                                onBlur={(e) => e.target.style.borderColor = '#A7CCDE'}
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label htmlFor="business-address" className="form-label" style={{ color: '#302C9A', fontWeight: '500' }}>
                                                Business Address
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="business-address"
                                                placeholder="Street, city, state, ZIP"
                                                value={formData.address}
                                                onChange={(e) => handleFieldChange('address', e.target.value)}
                                                required
                                                style={{ borderColor: '#A7CCDE', borderRadius: '8px' }}
                                                onFocus={(e) => e.target.style.borderColor = '#6AB7AD'}
                                                onBlur={(e) => e.target.style.borderColor = '#A7CCDE'}
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Password Field */}
                                <div className="mb-3">
                                    <label htmlFor={`${idPrefix}-password`} className="form-label" style={{ color: '#302C9A', fontWeight: '500' }}>
                                        {authType === 'business' && activeTab === 'signup' ? 'Create Password' : 'Password'}
                                    </label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        id={`${idPrefix}-password`}
                                        placeholder={authType === 'business' && activeTab === 'signup' ? 'Create a strong password' : 'Enter password'}
                                        value={formData.password}
                                        onChange={(e) => handleFieldChange('password', e.target.value)}
                                        required
                                        autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
                                        style={{ borderColor: '#A7CCDE', borderRadius: '8px' }}
                                        onFocus={(e) => e.target.style.borderColor = '#6AB7AD'}
                                        onBlur={(e) => e.target.style.borderColor = '#A7CCDE'}
                                    />
                                </div>

                                {/* Confirm Password (Business Signup Only) */}
                                {authType === 'business' && activeTab === 'signup' && (
                                    <div className="mb-4">
                                        <label htmlFor="business-confirm-password" className="form-label" style={{ color: '#302C9A', fontWeight: '500' }}>
                                            Confirm Password
                                        </label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            id="business-confirm-password"
                                            placeholder="Re-enter password"
                                            value={formData.confirmPassword}
                                            onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                                            required
                                            autoComplete="new-password"
                                            style={{ borderColor: '#A7CCDE', borderRadius: '8px' }}
                                            onFocus={(e) => e.target.style.borderColor = '#6AB7AD'}
                                            onBlur={(e) => e.target.style.borderColor = '#A7CCDE'}
                                        />
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    className="btn btn-primary w-100"
                                    disabled={isLoading}
                                    style={{ borderRadius: '8px', padding: '12px', fontWeight: '500' }}
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            {getSubmitButtonText()}
                                        </>
                                    ) : (
                                        getSubmitButtonText()
                                    )}
                                </button>

                                {/* Auth Type Toggle Link */}
                                <div className="text-center mt-3">
                                    <button
                                        type="button"
                                        onClick={handleAuthTypeToggle}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#302C9A',
                                            textDecoration: 'underline',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            padding: 0
                                        }}
                                    >
                                        {authType === 'customer' ? 'Sign in as a business' : 'Sign in as a customer'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop show"></div>
        </>
    );
};

export default UnifiedAuthModal;
