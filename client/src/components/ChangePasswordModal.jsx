import React, { useState } from 'react';
import MorphingCard from './MorphingCard';

const ChangePasswordModal = ({ show, onClose, userId }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!show) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          currentPassword,
          newPassword
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

        setTimeout(() => {
          onClose();
          setSuccess('');
        }, 2000);
      } else {
        setError(data.message || 'Failed to change password');
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setError('Failed to change password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    onClose();
  };

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
      onClick={handleClose}
    >
      <MorphingCard
        variant="modal"
        style={{
          borderRadius: '12px',
          padding: '30px',
          maxWidth: '450px',
          width: '90%',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ color: '#302C9A', marginTop: 0, marginBottom: '20px' }}>
          Change Password
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label
              htmlFor="currentPassword"
              style={{
                display: 'block',
                marginBottom: '5px',
                color: '#302C9A',
                fontWeight: '500'
              }}
            >
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #A7CCDE',
                borderRadius: '6px',
                fontSize: '1em',
                boxSizing: 'border-box'
              }}
              disabled={isSubmitting}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label
              htmlFor="newPassword"
              style={{
                display: 'block',
                marginBottom: '5px',
                color: '#302C9A',
                fontWeight: '500'
              }}
            >
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #A7CCDE',
                borderRadius: '6px',
                fontSize: '1em',
                boxSizing: 'border-box'
              }}
              disabled={isSubmitting}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="confirmPassword"
              style={{
                display: 'block',
                marginBottom: '5px',
                color: '#302C9A',
                fontWeight: '500'
              }}
            >
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #A7CCDE',
                borderRadius: '6px',
                fontSize: '1em',
                boxSizing: 'border-box'
              }}
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div
              style={{
                backgroundColor: '#ffe6e6',
                border: '1px solid #E68E8D',
                color: '#c41e3a',
                padding: '10px',
                borderRadius: '6px',
                marginBottom: '15px',
                fontSize: '0.9em'
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                backgroundColor: '#e6f7f4',
                border: '1px solid #6AB7AD',
                color: '#2d7a6e',
                padding: '10px',
                borderRadius: '6px',
                marginBottom: '15px',
                fontSize: '0.9em'
              }}
            >
              {success}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              style={{
                padding: '10px 20px',
                backgroundColor: '#E68E8D',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                opacity: isSubmitting ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => !isSubmitting && (e.target.style.opacity = '0.8')}
              onMouseOut={(e) => !isSubmitting && (e.target.style.opacity = '1')}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '10px 20px',
                backgroundColor: '#302C9A',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                opacity: isSubmitting ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => !isSubmitting && (e.target.style.backgroundColor = '#6AB7AD')}
              onMouseOut={(e) => !isSubmitting && (e.target.style.backgroundColor = '#302C9A')}
            >
              {isSubmitting ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </MorphingCard>
    </div>
  );
};

export default ChangePasswordModal;
