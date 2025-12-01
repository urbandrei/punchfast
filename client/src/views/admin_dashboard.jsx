import React, { useEffect, useState } from 'react';

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
        const res = await fetch(`/api/admin/stats?userId=${user.id}`);
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
        const res = await fetch(`/api/admin/pending-businesses?userId=${user.id}`);
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
      const res = await fetch(`/api/admin/search-stores?userId=${user.id}&query=${encodeURIComponent(storeSearchQuery)}`);
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
      const res = await fetch('/api/admin/create-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch('/api/admin/approve-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch('/api/admin/deny-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
              <div className="card" style={{
                border: '2px solid #A7CCDE', borderRadius: '12px', padding: '20px', textAlign: 'center'
              }}>
                <h3 style={{ color: '#302C9A', fontSize: '2rem', margin: 0 }}>{stats.totalUsers}</h3>
                <p style={{ color: '#6AB7AD', margin: '8px 0 0 0' }}>Total Users</p>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card" style={{
                border: '2px solid #A7CCDE', borderRadius: '12px', padding: '20px', textAlign: 'center'
              }}>
                <h3 style={{ color: '#302C9A', fontSize: '2rem', margin: 0 }}>{stats.totalRoutes}</h3>
                <p style={{ color: '#6AB7AD', margin: '8px 0 0 0' }}>Total Routes</p>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card" style={{
                border: '2px solid #A7CCDE', borderRadius: '12px', padding: '20px', textAlign: 'center'
              }}>
                <h3 style={{ color: '#302C9A', fontSize: '2rem', margin: 0 }}>{stats.totalStores}</h3>
                <p style={{ color: '#6AB7AD', margin: '8px 0 0 0' }}>Total Stores</p>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card" style={{
                border: '2px solid #A7CCDE', borderRadius: '12px', padding: '20px', textAlign: 'center'
              }}>
                <h3 style={{ color: '#302C9A', fontSize: '2rem', margin: 0 }}>{pendingBusinesses.length}</h3>
                <p style={{ color: '#6AB7AD', margin: '8px 0 0 0' }}>Pending Businesses</p>
              </div>
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
                padding: '20px', marginBottom: '15px', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <h5 style={{ color: '#302C9A', margin: '0 0 8px 0' }}>{business.username}</h5>
                  <p style={{ color: '#6AB7AD', margin: 0, fontSize: '0.9rem' }}>
                    Applied: {new Date(business.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
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
    </div>
  );
};

export default AdminDashboard;
