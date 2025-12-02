import React, { useEffect, useState } from 'react';
import MorphingCard from '../components/MorphingCard';
import { customerApi } from '../utils/apiClient';

const AdminDashboard = ({ isLogin, user, onShowAuth }) => {
  const [stats, setStats] = useState(null);
  const [pendingBusinesses, setPendingBusinesses] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [businessesLoading, setBusinessesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  // Store search state
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [storeSearchResults, setStoreSearchResults] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [showCreateStore, setShowCreateStore] = useState(false);
  const [newStore, setNewStore] = useState({ name: '', address: '', latitude: '', longitude: '' });

  // Pending stores state
  const [pendingStores, setPendingStores] = useState([]);
  const [pendingStoresLoading, setPendingStoresLoading] = useState(true);

  // Reports state
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportStatusFilter, setReportStatusFilter] = useState('pending');

  // Expandable business details state
  const [expandedBusinessId, setExpandedBusinessId] = useState(null);

  // Edit store modal state
  const [editingStore, setEditingStore] = useState(null);
  const [editStoreForm, setEditStoreForm] = useState({
    name: '', address: '', phone: '', website: '', cuisine: ''
  });

  // Questionnaire settings state
  const [questionnaireRate, setQuestionnaireRate] = useState(5);
  const [questionnaireStats, setQuestionnaireStats] = useState({ answered: 0, skipped: 0 });

  useEffect(() => {
    if (!user?.id || !user?.isAdmin) {
      setStatsLoading(false);
      setBusinessesLoading(false);
    }
  }, [user]);

  // Fetch stats
  useEffect(() => {
    if (!user?.id || !user?.isAdmin) return;

    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('pf_customer_access_token');
        const res = await fetch(`/api/admin/stats?userId=${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          if (res.status === 403) throw new Error('Access denied');
          throw new Error('Failed to fetch stats');
        }
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error('Stats fetch error:', err);
        setError(err.message);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  // Fetch pending businesses
  useEffect(() => {
    if (!user?.id || !user?.isAdmin) return;

    const fetchPendingBusinesses = async () => {
      try {
        const token = localStorage.getItem('pf_customer_access_token');
        const res = await fetch(`/api/admin/pending-businesses?userId=${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch pending businesses');
        const data = await res.json();
        setPendingBusinesses(data.businesses || []);
      } catch (err) {
        console.error('Pending businesses fetch error:', err);
        setError(err.message);
      } finally {
        setBusinessesLoading(false);
      }
    };

    fetchPendingBusinesses();
  }, [user]);

  // Fetch pending stores
  useEffect(() => {
    if (!user?.id || !user?.isAdmin) return;

    const fetchPendingStores = async () => {
      try {
        const token = localStorage.getItem('pf_customer_access_token');
        const res = await fetch('/api/admin/pending-stores', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch pending stores');
        const data = await res.json();
        setPendingStores(data.stores || []);
      } catch (err) {
        console.error('Pending stores fetch error:', err);
      } finally {
        setPendingStoresLoading(false);
      }
    };

    fetchPendingStores();
  }, [user]);

  // Fetch reports
  useEffect(() => {
    if (!user?.id || !user?.isAdmin) return;

    const fetchReports = async () => {
      try {
        const token = localStorage.getItem('pf_customer_access_token');
        const url = reportStatusFilter === 'all'
          ? '/api/reports'
          : `/api/reports?status=${reportStatusFilter}`;
        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch reports');
        const data = await res.json();
        setReports(data.reports || []);
      } catch (err) {
        console.error('Reports fetch error:', err);
      } finally {
        setReportsLoading(false);
      }
    };

    fetchReports();
  }, [user, reportStatusFilter]);

  // Fetch questionnaire settings and stats
  useEffect(() => {
    if (!user?.id || !user?.isAdmin) return;

    const fetchQuestionnaireData = async () => {
      try {
        const token = localStorage.getItem('pf_customer_access_token');

        // Fetch settings
        const settingsRes = await fetch(`/api/admin/questionnaire/settings?userId=${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setQuestionnaireRate(Math.round(settingsData.rate * 100));
        }

        // Fetch stats
        const statsRes = await fetch(`/api/admin/questionnaire/stats?userId=${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setQuestionnaireStats(statsData);
        }
      } catch (err) {
        console.error('Questionnaire data fetch error:', err);
      }
    };

    fetchQuestionnaireData();
  }, [user]);

  // Handle questionnaire rate change (immediate save)
  const handleQuestionnaireRateChange = async (newRate) => {
    setQuestionnaireRate(newRate);

    try {
      await customerApi.put('/api/admin/questionnaire/settings', {
        userId: user.id,
        rate: newRate / 100
      });
    } catch (err) {
      console.error('Failed to update questionnaire rate:', err);
    }
  };

  const handleOpenApproval = (business) => {
    setSelectedBusiness(business);
    setShowStoreModal(true);
    setStoreSearchQuery('');
    setStoreSearchResults([]);
    setSelectedStore(null);
    setShowCreateStore(false);
  };

  const handleStoreSearch = async () => {
    if (storeSearchQuery.trim().length < 2) {
      setMessage('Please enter at least 2 characters to search');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const token = localStorage.getItem('pf_customer_access_token');
      const res = await fetch(`/api/admin/search-stores?userId=${user.id}&query=${encodeURIComponent(storeSearchQuery)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStoreSearchResults(data.stores || []);
        if (data.stores.length === 0) {
          setMessage('No stores found. Try creating a new one.');
          setTimeout(() => setMessage(''), 3000);
        }
      } else {
        setMessage(data.message || 'Failed to search stores');
      }
    } catch (err) {
      console.error('Store search error:', err);
      setMessage('Error searching stores');
    }
  };

  const handleCreateStore = async () => {
    const { name, address, latitude, longitude } = newStore;
    if (!name || !address || !latitude || !longitude) {
      setMessage('All fields are required to create a store');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const token = localStorage.getItem('pf_customer_access_token');
      const res = await fetch('/api/admin/create-store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user.id,
          name,
          address,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSelectedStore(data.store);
        setShowCreateStore(false);
        setMessage(`Store "${data.store.name}" created successfully`);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.message || 'Failed to create store');
      }
    } catch (err) {
      console.error('Create store error:', err);
      setMessage('Error creating store');
    }
  };

  const handleApproveBusiness = async () => {
    if (!selectedBusiness) return;

    try {
      const token = localStorage.getItem('pf_customer_access_token');
      const res = await fetch('/api/admin/approve-business', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user.id,
          businessUsername: selectedBusiness.username,
          storeId: selectedStore?.id || null
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`Business "${selectedBusiness.username}" approved successfully${selectedStore ? ` with store "${selectedStore.name}"` : ''}`);
        setPendingBusinesses(prev => prev.filter(b => b.username !== selectedBusiness.username));
        setShowStoreModal(false);
        setSelectedBusiness(null);
        setSelectedStore(null);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.message || 'Failed to approve business');
      }
    } catch (err) {
      console.error('Approve error:', err);
      setMessage('Error approving business');
    }
  };

  const handleDenyBusiness = async (businessUsername) => {
    if (!window.confirm(`Are you sure you want to deny and remove "${businessUsername}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('pf_customer_access_token');
      const res = await fetch('/api/admin/deny-business', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: user.id, businessUsername })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`Business "${businessUsername}" denied and removed`);
        setPendingBusinesses(prev => prev.filter(b => b.username !== businessUsername));
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.message || 'Failed to deny business');
      }
    } catch (err) {
      console.error('Deny error:', err);
      setMessage('Error denying business');
    }
  };

  // Store moderation handlers
  const handleApproveStore = async (storeId, storeName) => {
    try {
      const token = localStorage.getItem('pf_customer_access_token');
      const res = await fetch(`/api/admin/stores/${storeId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'active' })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`Store "${storeName}" approved successfully`);
        setPendingStores(prev => prev.filter(s => s.id !== storeId));
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.message || 'Failed to approve store');
      }
    } catch (err) {
      console.error('Approve store error:', err);
      setMessage('Error approving store');
    }
  };

  const handleDenyStore = async (storeId, storeName) => {
    if (!window.confirm(`Are you sure you want to deny "${storeName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('pf_customer_access_token');
      const res = await fetch(`/api/admin/stores/${storeId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'inactive' })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`Store "${storeName}" denied`);
        setPendingStores(prev => prev.filter(s => s.id !== storeId));
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.message || 'Failed to deny store');
      }
    } catch (err) {
      console.error('Deny store error:', err);
      setMessage('Error denying store');
    }
  };

  // Report handlers
  const handleUpdateReportStatus = async (reportId, newStatus, reportDescription) => {
    try {
      const token = localStorage.getItem('pf_customer_access_token');
      const res = await fetch(`/api/reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`Report ${newStatus} successfully`);
        setReports(prev => prev.map(r =>
          r.id === reportId ? { ...r, status: newStatus } : r
        ));
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.message || 'Failed to update report');
      }
    } catch (err) {
      console.error('Update report error:', err);
      setMessage('Error updating report');
    }
  };

  // Make store inactive from report and auto-resolve the report
  const handleMakeStoreInactive = async (storeId, storeName, reportId) => {
    if (!window.confirm(`Make "${storeName}" inactive and hide from map? This will also resolve the report.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('pf_customer_access_token');

      // First, set store to inactive
      const storeRes = await fetch(`/api/admin/stores/${storeId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'inactive' })
      });

      if (!storeRes.ok) {
        const data = await storeRes.json();
        setMessage(data.message || 'Failed to make store inactive');
        return;
      }

      // Then, auto-resolve the report
      const reportRes = await fetch(`/api/reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'resolved' })
      });

      if (reportRes.ok) {
        setMessage(`Store "${storeName}" made inactive and report resolved`);
        setReports(prev => prev.map(r =>
          r.id === reportId ? { ...r, status: 'resolved' } : r
        ));
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Store made inactive but failed to resolve report');
      }
    } catch (err) {
      console.error('Make store inactive error:', err);
      setMessage('Error making store inactive');
    }
  };

  // Open edit store modal with pre-populated data
  const openEditStoreModal = (store) => {
    setEditingStore(store);
    setEditStoreForm({
      name: store.name || '',
      address: store.address || '',
      phone: store.phone || '',
      website: store.website || '',
      cuisine: store.cuisine || ''
    });
  };

  // Save edited store
  const handleSaveEditStore = async () => {
    if (!editingStore) return;

    try {
      const token = localStorage.getItem('pf_customer_access_token');
      const res = await fetch(`/api/admin/stores/${editingStore.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editStoreForm)
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`Store "${editStoreForm.name}" updated successfully`);
        setEditingStore(null);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.message || 'Failed to update store');
      }
    } catch (err) {
      console.error('Edit store error:', err);
      setMessage('Error updating store');
    }
  };

  // Not logged in or not admin
  if (!isLogin || !user?.isAdmin) {
    return (
      <div className="container stores-container">
        <div style={{
          textAlign: 'center', marginTop: '50px', padding: '40px',
          backgroundColor: 'white', borderRadius: '12px', border: '2px solid #A7CCDE'
        }}>
          <h2 style={{ color: '#302C9A', marginBottom: '20px' }}>Admin Dashboard</h2>
          <p style={{ color: '#E68E8D', fontSize: '1.1em', marginBottom: '30px' }}>
            Access denied. You must be signed in as an administrator.
          </p>
          <button onClick={onShowAuth} style={{
            backgroundColor: '#302C9A', color: 'white', border: 'none',
            borderRadius: '25px', padding: '12px 30px', fontSize: '1em', cursor: 'pointer'
          }}>
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container stores-container">
      <div className="page-header">
        <h1 className="h3" style={{ color: '#302C9A' }}>Admin Dashboard</h1>
        <p style={{ color: '#6AB7AD' }}>Welcome, {user.username}</p>
      </div>

      {error && (
        <div className="alert alert-danger" style={{
          backgroundColor: 'rgba(230, 142, 141, 0.1)', color: '#E68E8D', border: '1px solid #E68E8D'
        }}>
          {error}
        </div>
      )}

      {message && (
        <div className="alert alert-success" style={{
          backgroundColor: 'rgba(106, 183, 173, 0.1)', color: '#6AB7AD', border: '1px solid #6AB7AD'
        }}>
          {message}
        </div>
      )}

      {/* System Statistics */}
      <div style={{ marginBottom: '40px' }}>
        <h2 className="h4" style={{ color: '#302C9A', marginBottom: '20px' }}>System Statistics</h2>

        {statsLoading ? (
          <p style={{ color: '#6AB7AD' }}>Loading statistics...</p>
        ) : stats ? (
          <div className="row g-3">
            <div className="col-md-3">
              <MorphingCard style={{
                borderRadius: '12px', padding: '20px', textAlign: 'center'
              }}>
                <h3 style={{ color: '#302C9A', fontSize: '2rem', margin: 0 }}>{stats.totalUsers}</h3>
                <p style={{ color: '#6AB7AD', margin: '8px 0 0 0' }}>Total Users</p>
              </MorphingCard>
            </div>

            <div className="col-md-3">
              <MorphingCard style={{
                borderRadius: '12px', padding: '20px', textAlign: 'center'
              }}>
                <h3 style={{ color: '#302C9A', fontSize: '2rem', margin: 0 }}>{stats.totalRoutes}</h3>
                <p style={{ color: '#6AB7AD', margin: '8px 0 0 0' }}>Total Routes</p>
              </MorphingCard>
            </div>

            <div className="col-md-3">
              <MorphingCard style={{
                borderRadius: '12px', padding: '20px', textAlign: 'center'
              }}>
                <h3 style={{ color: '#302C9A', fontSize: '2rem', margin: 0 }}>{stats.totalStores}</h3>
                <p style={{ color: '#6AB7AD', margin: '8px 0 0 0' }}>Total Stores</p>
              </MorphingCard>
            </div>

            <div className="col-md-3">
              <MorphingCard style={{
                borderRadius: '12px', padding: '20px', textAlign: 'center'
              }}>
                <h3 style={{ color: '#302C9A', fontSize: '2rem', margin: 0 }}>{pendingBusinesses.length}</h3>
                <p style={{ color: '#6AB7AD', margin: '8px 0 0 0' }}>Pending Businesses</p>
              </MorphingCard>
            </div>
          </div>
        ) : null}
      </div>

      {/* Geocoding Metrics */}
      {stats && (
        <div style={{ marginBottom: '40px' }}>
          <h2 className="h4" style={{ color: '#302C9A', marginBottom: '20px' }}>Geocoding Status</h2>

          <div className="row g-3">
            <div className="col-md-6">
              <div className="card" style={{
                border: '2px solid #A7CCDE', borderRadius: '12px', padding: '20px'
              }}>
                <h4 style={{ color: '#302C9A', fontSize: '1.5rem', margin: '0 0 8px 0' }}>
                  {stats.geocoding.unchanged}
                </h4>
                <p style={{ color: '#6AB7AD', margin: 0, fontSize: '0.95rem' }}>
                  Stores Not Yet Enriched
                </p>
                <small style={{ color: '#999', display: 'block', marginTop: '8px' }}>
                  Stores with enrichment_status = 'unchanged'
                </small>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card" style={{
                border: '2px solid #A7CCDE', borderRadius: '12px', padding: '20px'
              }}>
                <h4 style={{ color: '#302C9A', fontSize: '1.5rem', margin: '0 0 8px 0' }}>
                  {stats.geocoding.needingBackfill}
                </h4>
                <p style={{ color: '#6AB7AD', margin: 0, fontSize: '0.95rem' }}>
                  Stores Needing Backfill
                </p>
                <small style={{ color: '#999', display: 'block', marginTop: '8px' }}>
                  Stores with coordinates but missing state/country codes
                </small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Questionnaire Management */}
      <div style={{ marginBottom: '40px' }}>
        <h2 className="h4" style={{ color: '#302C9A', marginBottom: '20px' }}>Questionnaire Management</h2>

        <div className="row g-3">
          {/* Questionnaire Stats */}
          <div className="col-md-3">
            <MorphingCard style={{
              borderRadius: '12px', padding: '20px', textAlign: 'center'
            }}>
              <h3 style={{ color: '#302C9A', fontSize: '2rem', margin: 0 }}>{questionnaireStats.answered}</h3>
              <p style={{ color: '#6AB7AD', margin: '8px 0 0 0' }}>Answered</p>
            </MorphingCard>
          </div>

          <div className="col-md-3">
            <MorphingCard style={{
              borderRadius: '12px', padding: '20px', textAlign: 'center'
            }}>
              <h3 style={{ color: '#302C9A', fontSize: '2rem', margin: 0 }}>{questionnaireStats.skipped}</h3>
              <p style={{ color: '#6AB7AD', margin: '8px 0 0 0' }}>Skipped</p>
            </MorphingCard>
          </div>

          {/* Questionnaire Rate Slider */}
          <div className="col-md-6">
            <div style={{
              backgroundColor: 'white', border: '2px solid #A7CCDE', borderRadius: '12px', padding: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ color: '#302C9A', fontWeight: '500' }}>Display Rate</label>
                <span style={{ color: '#6AB7AD', fontWeight: 'bold', fontSize: '1.2rem' }}>{questionnaireRate}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={questionnaireRate}
                onChange={(e) => handleQuestionnaireRateChange(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  height: '8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  accentColor: '#6AB7AD'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <small style={{ color: '#999' }}>0%</small>
                <small style={{ color: '#999' }}>100%</small>
              </div>
              <small style={{ color: '#999', display: 'block', marginTop: '8px' }}>
                Probability a questionnaire appears after a visit
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Business Applications */}
      <div>
        <h2 className="h4" style={{ color: '#302C9A', marginBottom: '20px' }}>
          Pending Business Applications
        </h2>

        {businessesLoading ? (
          <p style={{ color: '#6AB7AD' }}>Loading applications...</p>
        ) : pendingBusinesses.length === 0 ? (
          <p style={{ color: '#6AB7AD' }}>No pending business applications.</p>
        ) : (
          <div style={{ marginTop: '20px' }}>
            {pendingBusinesses.map(business => (
              <div key={business.id} style={{
                backgroundColor: 'white', border: '2px solid #A7CCDE', borderRadius: '12px',
                padding: '20px', marginBottom: '15px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h5 style={{ color: '#302C9A', margin: '0 0 8px 0' }}>{business.username}</h5>
                    <p style={{ color: '#6AB7AD', margin: 0, fontSize: '0.9rem' }}>
                      Applied: {new Date(business.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                      onClick={() => setExpandedBusinessId(expandedBusinessId === business.id ? null : business.id)}
                      style={{
                        backgroundColor: 'transparent', color: '#302C9A', border: '1px solid #302C9A',
                        borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontSize: '0.85rem'
                      }}
                    >
                      {expandedBusinessId === business.id ? '▲ Hide' : '▼ Details'}
                    </button>
                    <button onClick={() => handleOpenApproval(business)} style={{
                      backgroundColor: '#6AB7AD', color: 'white', border: 'none',
                      borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: '500'
                    }}>
                      Approve
                    </button>
                    <button onClick={() => handleDenyBusiness(business.username)} style={{
                      backgroundColor: '#E68E8D', color: 'white', border: 'none',
                      borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: '500'
                    }}>
                      Deny
                    </button>
                  </div>
                </div>

                {/* Expandable Details Section */}
                {expandedBusinessId === business.id && (
                  <div style={{
                    marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #A7CCDE',
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px'
                  }}>
                    <div>
                      <strong style={{ color: '#302C9A', fontSize: '0.85rem' }}>Business Info</strong>
                      <p style={{ margin: '4px 0', fontSize: '0.9rem', color: '#666' }}>
                        Username: {business.username}
                      </p>
                      <p style={{ margin: '4px 0', fontSize: '0.9rem', color: '#666' }}>
                        Goal: {business.goal || 10} punches
                      </p>
                    </div>

                    {business.store ? (
                      <>
                        <div>
                          <strong style={{ color: '#302C9A', fontSize: '0.85rem' }}>Store Details</strong>
                          <p style={{ margin: '4px 0', fontSize: '0.9rem', color: '#666' }}>
                            Name: {business.store.name || 'N/A'}
                          </p>
                          <p style={{ margin: '4px 0', fontSize: '0.9rem', color: '#666' }}>
                            Address: {business.store.address || 'N/A'}
                          </p>
                          <p style={{ margin: '4px 0', fontSize: '0.9rem', color: '#666' }}>
                            Cuisine: {business.store.cuisine || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <strong style={{ color: '#302C9A', fontSize: '0.85rem' }}>Contact</strong>
                          <p style={{ margin: '4px 0', fontSize: '0.9rem', color: '#666' }}>
                            Phone: {business.store.phone || 'N/A'}
                          </p>
                          <p style={{ margin: '4px 0', fontSize: '0.9rem', color: '#666' }}>
                            Email: {business.store.email || 'N/A'}
                          </p>
                          <p style={{ margin: '4px 0', fontSize: '0.9rem', color: '#666' }}>
                            Website: {business.store.website ? (
                              <a href={business.store.website} target="_blank" rel="noopener noreferrer" style={{ color: '#6AB7AD' }}>
                                {business.store.website}
                              </a>
                            ) : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <strong style={{ color: '#302C9A', fontSize: '0.85rem' }}>Social Media</strong>
                          <p style={{ margin: '4px 0', fontSize: '0.9rem', color: '#666' }}>
                            Instagram: {business.store.instagram || 'N/A'}
                          </p>
                          <p style={{ margin: '4px 0', fontSize: '0.9rem', color: '#666' }}>
                            Facebook: {business.store.facebook || 'N/A'}
                          </p>
                          <p style={{ margin: '4px 0', fontSize: '0.9rem', color: '#666' }}>
                            Twitter: {business.store.twitter || 'N/A'}
                          </p>
                          <p style={{ margin: '4px 0', fontSize: '0.9rem', color: '#666' }}>
                            TikTok: {business.store.tiktok || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <strong style={{ color: '#302C9A', fontSize: '0.85rem' }}>Location</strong>
                          <p style={{ margin: '4px 0', fontSize: '0.9rem', color: '#666' }}>
                            Lat: {business.store.latitude || 'N/A'}
                          </p>
                          <p style={{ margin: '4px 0', fontSize: '0.9rem', color: '#666' }}>
                            Lng: {business.store.longitude || 'N/A'}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div>
                        <strong style={{ color: '#302C9A', fontSize: '0.85rem' }}>Store</strong>
                        <p style={{ margin: '4px 0', fontSize: '0.9rem', color: '#999', fontStyle: 'italic' }}>
                          No store associated yet
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending User-Submitted Stores */}
      <div style={{ marginTop: '40px' }}>
        <h2 className="h4" style={{ color: '#302C9A', marginBottom: '20px' }}>
          Pending User-Submitted Stores
        </h2>

        {pendingStoresLoading ? (
          <p style={{ color: '#6AB7AD' }}>Loading pending stores...</p>
        ) : pendingStores.length === 0 ? (
          <p style={{ color: '#6AB7AD' }}>No pending stores.</p>
        ) : (
          <div style={{ marginTop: '20px' }}>
            {pendingStores.map(store => (
              <div key={store.id} style={{
                backgroundColor: 'white', border: '2px solid #A7CCDE', borderRadius: '12px',
                padding: '20px', marginBottom: '15px'
              }}>
                <div style={{ marginBottom: '15px' }}>
                  <h5 style={{ color: '#302C9A', margin: '0 0 8px 0' }}>{store.name}</h5>
                  <p style={{ color: '#6AB7AD', margin: '0 0 4px 0', fontSize: '0.9rem' }}>
                    {store.address}
                  </p>
                  {store.cuisine && (
                    <p style={{ color: '#999', margin: '0 0 4px 0', fontSize: '0.85rem' }}>
                      Cuisine: {store.cuisine}
                    </p>
                  )}
                  <p style={{ color: '#999', margin: 0, fontSize: '0.85rem' }}>
                    Submitted: {new Date(store.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleApproveStore(store.id, store.name)} style={{
                    backgroundColor: '#6AB7AD', color: 'white', border: 'none',
                    borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: '500'
                  }}>
                    Approve
                  </button>
                  <button onClick={() => handleDenyStore(store.id, store.name)} style={{
                    backgroundColor: '#E68E8D', color: 'white', border: 'none',
                    borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: '500'
                  }}>
                    Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reports Management */}
      <div style={{ marginTop: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 className="h4" style={{ color: '#302C9A', margin: 0 }}>
            User Reports
          </h2>
          <select
            value={reportStatusFilter}
            onChange={(e) => {
              setReportStatusFilter(e.target.value);
              setReportsLoading(true);
            }}
            style={{
              padding: '8px 12px', borderRadius: '6px',
              border: '2px solid #A7CCDE', fontSize: '0.9rem',
              backgroundColor: 'white', cursor: 'pointer'
            }}
          >
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
            <option value="all">All Reports</option>
          </select>
        </div>

        {reportsLoading ? (
          <p style={{ color: '#6AB7AD' }}>Loading reports...</p>
        ) : reports.length === 0 ? (
          <p style={{ color: '#6AB7AD' }}>No {reportStatusFilter !== 'all' ? reportStatusFilter : ''} reports found.</p>
        ) : (
          <div style={{ marginTop: '20px' }}>
            {reports.map(report => (
              <div key={report.id} style={{
                backgroundColor: 'white', border: '2px solid #A7CCDE', borderRadius: '12px',
                padding: '20px', marginBottom: '15px'
              }}>
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                    <div>
                      <h5 style={{ color: '#302C9A', margin: '0 0 4px 0' }}>
                        {report.reportedItemType === 'store' ? '🏪' : '🗺️'} {report.reportedItem?.name || `${report.reportedItemType} #${report.reportedItemId}`}
                      </h5>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        backgroundColor: report.status === 'pending' ? 'rgba(255, 193, 7, 0.2)' :
                                        report.status === 'resolved' ? 'rgba(40, 167, 69, 0.2)' :
                                        report.status === 'dismissed' ? 'rgba(108, 117, 125, 0.2)' :
                                        'rgba(106, 183, 173, 0.2)',
                        color: report.status === 'pending' ? '#856404' :
                               report.status === 'resolved' ? '#155724' :
                               report.status === 'dismissed' ? '#383d41' :
                               '#0c5460'
                      }}>
                        {report.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <p style={{ color: '#E68E8D', margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: '500' }}>
                    Category: {report.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>

                  {report.description && (
                    <p style={{ color: '#555', margin: '0 0 8px 0', fontSize: '0.9rem', fontStyle: 'italic' }}>
                      "{report.description}"
                    </p>
                  )}

                  <div style={{ color: '#999', fontSize: '0.85rem' }}>
                    <p style={{ margin: '4px 0' }}>
                      Reported by: {report.reporter ? report.reporter.username : 'Guest'}
                    </p>
                    <p style={{ margin: '4px 0' }}>
                      Submitted: {new Date(report.createdAt).toLocaleString()}
                    </p>
                    {report.reviewer && (
                      <p style={{ margin: '4px 0' }}>
                        Reviewed by: {report.reviewer.username} on {new Date(report.reviewedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {report.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <button onClick={() => handleUpdateReportStatus(report.id, 'resolved', report.description)} style={{
                      backgroundColor: '#6AB7AD', color: 'white', border: 'none',
                      borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: '500'
                    }}>
                      Mark Resolved
                    </button>
                    <button onClick={() => handleUpdateReportStatus(report.id, 'dismissed', report.description)} style={{
                      backgroundColor: '#E68E8D', color: 'white', border: 'none',
                      borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: '500'
                    }}>
                      Dismiss
                    </button>
                  </div>
                )}

                {/* Store-specific actions (available for all report statuses) */}
                {report.reportedItemType === 'store' && report.reportedItem && (
                  <div style={{ display: 'flex', gap: '10px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                    <button
                      onClick={() => handleMakeStoreInactive(report.reportedItem.id, report.reportedItem.name, report.id)}
                      style={{
                        backgroundColor: '#ff9800', color: 'white', border: 'none',
                        borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontWeight: '500', fontSize: '0.9rem'
                      }}
                    >
                      Make Inactive
                    </button>
                    <button
                      onClick={() => openEditStoreModal(report.reportedItem)}
                      style={{
                        backgroundColor: '#302C9A', color: 'white', border: 'none',
                        borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontWeight: '500', fontSize: '0.9rem'
                      }}
                    >
                      Edit Store
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Store Association Modal */}
      {showStoreModal && selectedBusiness && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '12px', padding: '30px',
            maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto',
            border: '2px solid #A7CCDE'
          }}>
            <h3 style={{ color: '#302C9A', marginBottom: '20px' }}>
              Associate Store with "{selectedBusiness.username}"
            </h3>

            {/* Search Stores */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#6AB7AD', display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Search for Store
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={storeSearchQuery}
                  onChange={(e) => setStoreSearchQuery(e.target.value)}
                  placeholder="Store name, address, or city..."
                  style={{
                    flex: 1, padding: '10px', borderRadius: '8px',
                    border: '2px solid #A7CCDE', fontSize: '1em'
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleStoreSearch()}
                />
                <button onClick={handleStoreSearch} style={{
                  backgroundColor: '#302C9A', color: 'white', border: 'none',
                  borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: '500'
                }}>
                  Search
                </button>
              </div>
            </div>

            {/* Search Results */}
            {storeSearchResults.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ color: '#6AB7AD', marginBottom: '10px', fontWeight: '500' }}>
                  Search Results:
                </p>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {storeSearchResults.map(store => (
                    <div
                      key={store.id}
                      onClick={() => setSelectedStore(store)}
                      style={{
                        padding: '12px', borderRadius: '8px', marginBottom: '8px',
                        border: selectedStore?.id === store.id ? '2px solid #6AB7AD' : '2px solid #A7CCDE',
                        backgroundColor: selectedStore?.id === store.id ? 'rgba(106, 183, 173, 0.1)' : 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ color: '#302C9A', fontWeight: '500' }}>{store.name}</div>
                      <div style={{ color: '#6AB7AD', fontSize: '0.9em' }}>{store.address}</div>
                      {store.addr_city && store.addr_state && (
                        <div style={{ color: '#999', fontSize: '0.85em' }}>
                          {store.addr_city}, {store.addr_state}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Store Display */}
            {selectedStore && (
              <div style={{
                padding: '15px', borderRadius: '8px', marginBottom: '20px',
                backgroundColor: 'rgba(106, 183, 173, 0.1)', border: '2px solid #6AB7AD'
              }}>
                <p style={{ color: '#6AB7AD', marginBottom: '8px', fontWeight: '500' }}>Selected Store:</p>
                <div style={{ color: '#302C9A', fontWeight: '500' }}>{selectedStore.name}</div>
                <div style={{ color: '#6AB7AD', fontSize: '0.9em' }}>{selectedStore.address}</div>
                <button
                  onClick={() => setSelectedStore(null)}
                  style={{
                    marginTop: '10px', backgroundColor: '#E68E8D', color: 'white',
                    border: 'none', borderRadius: '6px', padding: '6px 12px',
                    cursor: 'pointer', fontSize: '0.9em'
                  }}
                >
                  Clear Selection
                </button>
              </div>
            )}

            {/* Create Store Toggle */}
            {!showCreateStore && (
              <button
                onClick={() => setShowCreateStore(true)}
                style={{
                  backgroundColor: 'transparent', color: '#302C9A', border: '2px solid #302C9A',
                  borderRadius: '8px', padding: '10px 20px', cursor: 'pointer',
                  fontWeight: '500', marginBottom: '20px', width: '100%'
                }}
              >
                + Create New Store
              </button>
            )}

            {/* Create Store Form */}
            {showCreateStore && (
              <div style={{
                padding: '20px', borderRadius: '8px', marginBottom: '20px',
                backgroundColor: 'rgba(167, 204, 222, 0.1)', border: '2px solid #A7CCDE'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h4 style={{ color: '#302C9A', margin: 0 }}>Create New Store</h4>
                  <button
                    onClick={() => setShowCreateStore(false)}
                    style={{
                      backgroundColor: 'transparent', border: 'none',
                      color: '#E68E8D', cursor: 'pointer', fontSize: '1.2em'
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ color: '#6AB7AD', display: 'block', marginBottom: '5px', fontSize: '0.9em' }}>
                      Store Name *
                    </label>
                    <input
                      type="text"
                      value={newStore.name}
                      onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                      style={{
                        width: '100%', padding: '8px', borderRadius: '6px',
                        border: '1px solid #A7CCDE', fontSize: '1em'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ color: '#6AB7AD', display: 'block', marginBottom: '5px', fontSize: '0.9em' }}>
                      Address *
                    </label>
                    <input
                      type="text"
                      value={newStore.address}
                      onChange={(e) => setNewStore({ ...newStore, address: e.target.value })}
                      style={{
                        width: '100%', padding: '8px', borderRadius: '6px',
                        border: '1px solid #A7CCDE', fontSize: '1em'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ color: '#6AB7AD', display: 'block', marginBottom: '5px', fontSize: '0.9em' }}>
                        Latitude *
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={newStore.latitude}
                        onChange={(e) => setNewStore({ ...newStore, latitude: e.target.value })}
                        style={{
                          width: '100%', padding: '8px', borderRadius: '6px',
                          border: '1px solid #A7CCDE', fontSize: '1em'
                        }}
                      />
                    </div>

                    <div style={{ flex: 1 }}>
                      <label style={{ color: '#6AB7AD', display: 'block', marginBottom: '5px', fontSize: '0.9em' }}>
                        Longitude *
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={newStore.longitude}
                        onChange={(e) => setNewStore({ ...newStore, longitude: e.target.value })}
                        style={{
                          width: '100%', padding: '8px', borderRadius: '6px',
                          border: '1px solid #A7CCDE', fontSize: '1em'
                        }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleCreateStore}
                    style={{
                      backgroundColor: '#6AB7AD', color: 'white', border: 'none',
                      borderRadius: '8px', padding: '10px', cursor: 'pointer',
                      fontWeight: '500', marginTop: '10px'
                    }}
                  >
                    Create Store
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={handleApproveBusiness}
                style={{
                  flex: 1, backgroundColor: '#6AB7AD', color: 'white',
                  border: 'none', borderRadius: '8px', padding: '12px',
                  cursor: 'pointer', fontWeight: '500', fontSize: '1em'
                }}
              >
                {selectedStore ? `Approve with "${selectedStore.name}"` : 'Approve without Store'}
              </button>
              <button
                onClick={() => {
                  setShowStoreModal(false);
                  setSelectedBusiness(null);
                  setSelectedStore(null);
                }}
                style={{
                  backgroundColor: '#E68E8D', color: 'white', border: 'none',
                  borderRadius: '8px', padding: '12px 20px', cursor: 'pointer', fontWeight: '500'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Store Modal */}
      {editingStore && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '12px', padding: '30px',
            maxWidth: '500px', width: '90%', maxHeight: '80vh', overflowY: 'auto',
            border: '2px solid #A7CCDE'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: '#302C9A', margin: 0 }}>
                Edit Store
              </h3>
              <button
                onClick={() => setEditingStore(null)}
                style={{
                  backgroundColor: 'transparent', border: 'none',
                  color: '#E68E8D', cursor: 'pointer', fontSize: '1.5em'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ color: '#6AB7AD', display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Store Name
                </label>
                <input
                  type="text"
                  value={editStoreForm.name}
                  onChange={(e) => setEditStoreForm({ ...editStoreForm, name: e.target.value })}
                  style={{
                    width: '100%', padding: '10px', borderRadius: '8px',
                    border: '2px solid #A7CCDE', fontSize: '1em'
                  }}
                />
              </div>

              <div>
                <label style={{ color: '#6AB7AD', display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Address
                </label>
                <input
                  type="text"
                  value={editStoreForm.address}
                  onChange={(e) => setEditStoreForm({ ...editStoreForm, address: e.target.value })}
                  style={{
                    width: '100%', padding: '10px', borderRadius: '8px',
                    border: '2px solid #A7CCDE', fontSize: '1em'
                  }}
                />
              </div>

              <div>
                <label style={{ color: '#6AB7AD', display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Phone
                </label>
                <input
                  type="text"
                  value={editStoreForm.phone}
                  onChange={(e) => setEditStoreForm({ ...editStoreForm, phone: e.target.value })}
                  style={{
                    width: '100%', padding: '10px', borderRadius: '8px',
                    border: '2px solid #A7CCDE', fontSize: '1em'
                  }}
                />
              </div>

              <div>
                <label style={{ color: '#6AB7AD', display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Website
                </label>
                <input
                  type="text"
                  value={editStoreForm.website}
                  onChange={(e) => setEditStoreForm({ ...editStoreForm, website: e.target.value })}
                  style={{
                    width: '100%', padding: '10px', borderRadius: '8px',
                    border: '2px solid #A7CCDE', fontSize: '1em'
                  }}
                />
              </div>

              <div>
                <label style={{ color: '#6AB7AD', display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Cuisine
                </label>
                <input
                  type="text"
                  value={editStoreForm.cuisine}
                  onChange={(e) => setEditStoreForm({ ...editStoreForm, cuisine: e.target.value })}
                  style={{
                    width: '100%', padding: '10px', borderRadius: '8px',
                    border: '2px solid #A7CCDE', fontSize: '1em'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
              <button
                onClick={handleSaveEditStore}
                style={{
                  flex: 1, backgroundColor: '#6AB7AD', color: 'white',
                  border: 'none', borderRadius: '8px', padding: '12px',
                  cursor: 'pointer', fontWeight: '500', fontSize: '1em'
                }}
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditingStore(null)}
                style={{
                  backgroundColor: '#E68E8D', color: 'white', border: 'none',
                  borderRadius: '8px', padding: '12px 20px', cursor: 'pointer', fontWeight: '500'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
