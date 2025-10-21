import React, { useEffect, useState } from 'react';

const NewRoute = ({ isLogin , user}) => {
    const [stores, setStores] = useState([]);
    const [query, setQuery] = useState('');
    const [selectedStores, setSelectedStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitError, setSubmitError] = useState(null);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);

    useEffect(() => {
        const fetchNearby = async (lat, lng) => {
            try {
                const res = await fetch(`/api/nearby?lat=${lat}&lng=${lng}&radius=10&limit=50`);
                if (!res.ok) throw new Error('Failed to fetch stores');
                const data = await res.json();
                setStores(data.stores || []);
            } catch (err) {
                console.error(err);
                setError('Could not load nearby stores');
            } finally {
                setLoading(false);
            }
        };



        if (navigator && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => fetchNearby(pos.coords.latitude, pos.coords.longitude),
                () => {
                    fetchNearby(40.7128, -74.0060);
                },
                { timeout: 5000 }
            );
        } else {
            fetchNearby(40.7128, -74.0060);
        }
    }, []);

    const toggleStore = (id) => {
        setSubmitError(null);
        setSuccessMessage(null);
        setSelectedStores((prev) => {
            if (prev.includes(id)) return prev.filter((x) => x !== id);
            if (prev.length >= 5) {
                setSubmitError('You may select up to 5 stores');
                return prev;
            }
            return [...prev, id];
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError(null);
        setSuccessMessage(null);

        if (!query || query.trim() === '') {
            setSubmitError('Please provide a route name');
            return;
        }

        const ids = selectedStores.slice(0, 5);
        const payload = {
            name: query.trim(),
            store1_id: ids[0] ?? null,
            store2_id: ids[1] ?? null,
            store3_id: ids[2] ?? null,
            store4_id: ids[3] ?? null,
            store5_id: ids[4] ?? null,
        };

        try {
            setSubmitLoading(true);
            const res = await fetch('/api/newroute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Failed to create route');
            }
            const data = await res.json();
            setSuccessMessage('Route created');
            setQuery('');
            setSelectedStores([]);
        } catch (err) {
            console.error('Create route error:', err);
            setSubmitError(err.message || 'Server error');
        } finally {
            setSubmitLoading(false);
        }
    };

    return (
            <div className="container stores-container">
                <div className="page-header">
                    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                        <div className="form-group" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Route name"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                style={{ width: '50%' }}
                            />
                            <button type="submit" className="btn btn-primary" disabled={submitLoading}>
                                <span className="glyphicon glyphicon-plus" aria-hidden="true"></span>
                            </button>
                        </div>
                        {submitError && <div style={{ color: 'red', marginTop: 6 }}>{submitError}</div>}
                        {successMessage && <div style={{ color: 'green', marginTop: 6 }}>{successMessage}</div>}
                    </form>
                </div>

                <div>
                    {loading && <p>Loading nearby stores…</p>}
                    {error && <p className="text-danger">{error}</p>}
                    {!loading && stores.length === 0 && <p>No stores found nearby.</p>}

                    {stores.map((s) => (
                        <div key={s.id} className="panel panel-default">
                            <div className="panel-body" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', margin: 0 }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedStores.includes(s.id)}
                                        onChange={() => toggleStore(s.id)}
                                        style={{ marginRight: 8 }}
                                    />
                                </label>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <strong>{s.name}</strong>
                                        <span className="text-muted">
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${s.latitude},${s.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {s.address}
                                            </a>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

    );
};

export default NewRoute;
