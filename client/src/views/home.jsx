import React, { useEffect, useState } from 'react';
import RouteCard from '../components/routeCard';
import StoreCard from '../components/storeCard';

const Home = ({ isLogin , user, onShowAuth}) => {
    const [stores, setStores] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [userRouteStarts, setUserRouteStarts] = useState([]);
    const [storesLoading, setStoresLoading] = useState(true);
    const [routesLoading, setRoutesLoading] = useState(true);
    const [storesError, setStoresError] = useState(null);
    const [routesError, setRoutesError] = useState(null);
    const [radius, setRadius] = useState(100);
    const [storeAmount, setStoreAmount] = useState(100);

    useEffect(() => {
        const fetchNearby = async (lat, lng) => {
            try {
                const res = await fetch(`/api/stores/nearby?lat=${lat}&lng=${lng}&radius=${radius}&limit=${storeAmount}`);
                if (!res.ok) throw new Error('Failed to fetch stores');
                const data = await res.json();
                setStores(data.stores || []);
            } catch (err) {
                console.error(err);
                setStoresError('Could not load nearby stores');
            } finally {
                setStoresLoading(false);
            }
        };

        const fetchNearbyRoutes = async (lat, lng) => {
            try {
                const res = await fetch(`/api/routes/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
                if (!res.ok) throw new Error('Failed to fetch routes');
                const data = await res.json();
                setRoutes(data.routes || []);
            } catch (err) {
                console.error(err);
                setRoutesError('Could not load nearby routes');
            } finally {
                setRoutesLoading(false);
            }
        };

        const fetchUserRouteStarts = async () => {
            if (!isLogin || !user?.id) return;

            try {
                const res = await fetch(`/api/users/${user.id}/route-starts`);
                if (!res.ok) throw new Error('Failed to fetch user route starts');
                const data = await res.json();
                setUserRouteStarts(data.routeStarts || []);
            } catch (err) {
                console.error('Error fetching user route starts:', err);
            }
        };

        if (navigator && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    fetchNearby(pos.coords.latitude, pos.coords.longitude);
                    fetchNearbyRoutes(pos.coords.latitude, pos.coords.longitude);
                },
                () => {
                    fetchNearby(40.7128, -74.0060);
                    fetchNearbyRoutes(40.7128, -74.0060);
                },
                { timeout: 5000 }
            );
        } else {
            fetchNearby(40.7128, -74.0060);
            fetchNearbyRoutes(40.7128, -74.0060);
        }

        fetchUserRouteStarts();

    }, [isLogin, user]);

    const handleJoinRoute = async (routeId, routeName) => {
        if (!isLogin) {
            if (onShowAuth) {
                onShowAuth();
            }
            return;
        }
        try {
            const res = await fetch('/api/route-starts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    routeId: routeId
                })
            });
            const data = await res.json();
            if (res.ok) {
                const refreshRes = await fetch(`/api/users/${user.id}/route-starts`);
                if (refreshRes.ok) {
                    const refreshData = await refreshRes.json();
                    setUserRouteStarts(refreshData.routeStarts || []);
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

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
            const data = await res.json();
            if (res.ok) {
                const refreshRes = await fetch(`/api/users/${user.id}/route-starts`);
                if (refreshRes.ok) {
                    const refreshData = await refreshRes.json();
                    setUserRouteStarts(refreshData.routeStarts || []);
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
            <div className="container stores-container">
                <div className="page-header">
                    <a href="/newroute" className="btn pull-right" style={{
                        backgroundColor: '#302C9A',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 16px'
                    }}>
                        <span className="glyphicon glyphicon-plus"></span>
                    </a>
                    <h1 className="h3" style={{ color: '#302C9A' }}>Routes</h1>
                </div>

                <div>
                    {routesLoading && <p>Loading nearby routes...</p>}
                    {routesError && <p className="text-danger">{routesError}</p>}
                    {!routesLoading && routes.length === 0 && <p>No routes found nearby.</p>}

                    <div style={{ marginTop: '20px' }}>
                        {routes.map((route) => {
                            const userRouteStart = userRouteStarts.find(
                                rs => rs.routeId === route.id && rs.status === 'active'
                            );
                            const isActive = !!userRouteStart;

                            return (
                                <RouteCard
                                    key={route.id}
                                    routeId={route.id}
                                    routeName={route.name}
                                    isActive={isActive}
                                    onJoinClick={() => handleJoinRoute(route.id, route.name)}
                                    onLeaveClick={() => handleLeaveRoute(route.id, route.name)}
                                    stores={route.stores || []}
                                    userId={user?.id}
                                    onShowAuth={onShowAuth}
                                />
                            );
                        })}
                    </div>
                </div>
                <div className="page-header">
                    <a href="/newstore" className="btn pull-right" style={{
                        backgroundColor: '#302C9A',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 16px'
                    }}>
                        <span className="glyphicon glyphicon-plus"></span>
                    </a>
                    <h1 className="h3" style={{ color: '#302C9A' }}>Stores</h1>
                </div>

                <div>
                    {storesLoading && <p>Loading nearby stores…</p>}
                    {storesError && <p className="text-danger">{storesError}</p>}
                    {!storesLoading && stores.length === 0 && <p>No stores found nearby.</p>}

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

export default Home;
