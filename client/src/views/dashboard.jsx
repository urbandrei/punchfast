import React, { useEffect, useState } from 'react';
import RouteCard from '../components/routeCard';
import StoreCard from '../components/storeCard';

const Dashboard = ({ isLogin, user, onShowAuth }) => {
    const [stores, setStores] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [storesLoading, setStoresLoading] = useState(true);
    const [routesLoading, setRoutesLoading] = useState(true);
    const [storesError, setStoresError] = useState(null);
    const [routesError, setRoutesError] = useState(null);

    useEffect(() => {
        const fetchJoinedRoutes = async () => {
            if (!user?.id) {
                setRoutesLoading(false);
                return;
            }

            try {
                const res = await fetch(`/api/users/${user.id}/route-starts`);
                if (!res.ok) throw new Error('Failed to fetch joined routes');
                const data = await res.json();
                const activeRoutes = data.routeStarts
                    ?.filter(rs => rs.status === 'active')
                    .map(rs => ({
                        id: rs.route.id,
                        name: rs.route.name,
                        routeType: rs.route.routeType,
                        stores: rs.route.stores
                    })) || [];
                setRoutes(activeRoutes);
            } catch (err) {
                console.error(err);
                setRoutesError('Could not load joined routes');
            } finally {
                setRoutesLoading(false);
            }
        };

        const fetchSavedStores = async () => {
            if (!user?.id) {
                setStoresLoading(false);
                return;
            }

            try {
                const res = await fetch(`/api/saved-stores/${user.id}`);
                if (!res.ok) throw new Error('Failed to fetch saved stores');
                const data = await res.json();
                setStores(data.stores || []);
            } catch (err) {
                console.error(err);
                setStoresError('Could not load saved stores');
            } finally {
                setStoresLoading(false);
            }
        };

        fetchJoinedRoutes();
        fetchSavedStores();
    }, [user?.id]);

    const handleLeaveRoute = async (routeId, routeName) => {
        if (!isLogin) {
            return;
        }
        try {
            const res = await fetch('/api/route-starts/leave', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    routeId: routeId
                })
            });
            if (res.ok) {
                const refreshRes = await fetch(`/api/users/${user.id}/route-starts`);
                if (refreshRes.ok) {
                    const refreshData = await refreshRes.json();
                    const activeRoutes = refreshData.routeStarts
                        ?.filter(rs => rs.status === 'active')
                        .map(rs => ({
                            id: rs.route.id,
                            name: rs.route.name,
                            routeType: rs.route.routeType,
                            stores: rs.route.stores
                        })) || [];
                    setRoutes(activeRoutes);
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (!isLogin || !user) {
        return (
            <div className="container stores-container">
                <div style={{
                    textAlign: 'center',
                    marginTop: '50px',
                    padding: '40px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    border: '2px solid #A7CCDE'
                }}>
                    <h2 style={{ color: '#302C9A', marginBottom: '20px' }}>
                        Welcome to Your Dashboard
                    </h2>
                    <p style={{ color: '#6AB7AD', fontSize: '1.1em', marginBottom: '30px' }}>
                        Please sign in to view your joined routes and saved stores.
                    </p>
                    <button
                        onClick={onShowAuth}
                        style={{
                            backgroundColor: '#302C9A',
                            color: 'white',
                            border: 'none',
                            borderRadius: '25px',
                            padding: '12px 30px',
                            fontSize: '1em',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#6AB7AD'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#302C9A'}
                    >
                        Sign In
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container stores-container">
            <div className="page-header">
                <h1 className="h3" style={{ color: '#302C9A' }}>My Routes</h1>
            </div>

            <div>
                {routesLoading && <p>Loading your routes...</p>}
                {routesError && <p className="text-danger">{routesError}</p>}
                {!routesLoading && routes.length === 0 && (
                    <p style={{ color: '#6AB7AD' }}>
                        You haven't joined any routes yet. Explore the home page to find routes!
                    </p>
                )}

                <div style={{ marginTop: '20px' }}>
                    {routes.map((route) => (
                        <RouteCard
                            key={route.id}
                            routeId={route.id}
                            routeName={route.name}
                            isActive={true}
                            onLeaveClick={() => handleLeaveRoute(route.id, route.name)}
                            stores={route.stores || []}
                            userId={user?.id}
                            onShowAuth={onShowAuth}
                        />
                    ))}
                </div>
            </div>

            <div className="page-header" style={{ marginTop: '40px' }}>
                <h1 className="h3" style={{ color: '#302C9A' }}>My Saved Stores</h1>
            </div>

            <div>
                {storesLoading && <p>Loading your saved stores...</p>}
                {storesError && <p className="text-danger">{storesError}</p>}
                {!storesLoading && stores.length === 0 && (
                    <p style={{ color: '#6AB7AD' }}>
                        You haven't saved any stores yet. Save stores from the home page!
                    </p>
                )}

                {stores.map((s) => (
                    <StoreCard
                        key={s.id}
                        storeId={s.id}
                        storeName={s.name}
                        latitude={s.latitude}
                        longitude={s.longitude}
                        userId={user?.id}
                        onShowAuth={onShowAuth}
                    />
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
