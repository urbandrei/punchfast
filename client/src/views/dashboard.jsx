import React, { useEffect, useState } from 'react';
import RouteCard from '../components/routeCard';
import StoreCard from '../components/storeCard';

const Dashboard = ({ isLogin, user, onShowAuth }) => {
    const [stores, setStores] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [visits, setVisits] = useState([]);
    const [storesLoading, setStoresLoading] = useState(true);
    const [routesLoading, setRoutesLoading] = useState(true);
    const [visitsLoading, setVisitsLoading] = useState(true);
    const [storesError, setStoresError] = useState(null);
    const [routesError, setRoutesError] = useState(null);
    const [visitsError, setVisitsError] = useState(null);

    useEffect(() => {
        if (!user?.id) {
            setStoresLoading(false);
            setRoutesLoading(false);
            setVisitsLoading(false);
            return;
        }

        const fetchJoinedRoutes = async () => {
            try {
                const res = await fetch(`/api/route-starts/user/${user.id}`);
                if (!res.ok) throw new Error("Failed to fetch joined routes");

                const data = await res.json();

                const activeRoutes = data.routeStarts
                    ?.filter(rs => rs.status === "active")
                    .map(rs => ({
                        id: rs.route.id,
                        name: rs.route.name,
                        routeType: rs.route.routeType,
                        stores: rs.route.stores
                    })) || [];

                setRoutes(activeRoutes);
            } catch (err) {
                console.error(err);
                setRoutesError("Could not load joined routes");
            } finally {
                setRoutesLoading(false);
            }
        };

        const fetchSavedStores = async () => {
            try {
                const res = await fetch(`/api/saved-stores/${user.id}`);
                if (!res.ok) throw new Error("Failed to fetch saved stores");

                const data = await res.json();
                setStores(data.stores || []);
            } catch (err) {
                console.error(err);
                setStoresError("Could not load saved stores");
            } finally {
                setStoresLoading(false);
            }
        };

        const fetchUserVisits = async () => {
            try {
                const res = await fetch(`/api/visits/${user.id}`);
                if (!res.ok) throw new Error("Failed to fetch visits");

                const data = await res.json();
                setVisits(data.visits || []);
            } catch (err) {
                console.error(err);
                setVisitsError("Could not load visit history");
            } finally {
                setVisitsLoading(false);
            }
        };

        fetchJoinedRoutes();
        fetchSavedStores();
        fetchUserVisits();
    }, [user?.id]);

    const handleLeaveRoute = async (routeId) => {
        if (!isLogin) return;

        try {
            const res = await fetch(`/api/route-starts/leave`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    routeId: routeId
                })
            });

            if (res.ok) {
                const refreshRes = await fetch(`/api/route-starts/user/${user.id}`);
                if (refreshRes.ok) {
                    const refreshData = await refreshRes.json();

                    const activeRoutes = refreshData.routeStarts
                        ?.filter(rs => rs.status === "active")
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
                <div
                    style={{
                        textAlign: "center",
                        marginTop: "50px",
                        padding: "40px",
                        backgroundColor: "white",
                        borderRadius: "12px",
                        border: "2px solid #A7CCDE"
                    }}
                >
                    <h2 style={{ color: "#302C9A", marginBottom: "20px" }}>
                        Welcome to Your Dashboard
                    </h2>
                    <p style={{ color: "#6AB7AD", fontSize: "1.1em", marginBottom: "30px" }}>
                        Please sign in to view your joined routes and saved stores.
                    </p>
                    <button
                        onClick={onShowAuth}
                        style={{
                            backgroundColor: "#302C9A",
                            color: "white",
                            border: "none",
                            borderRadius: "25px",
                            padding: "12px 30px",
                            fontSize: "1em",
                            cursor: "pointer"
                        }}
                    >
                        Sign In
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container stores-container">

            {/* ROUTES HEADER */}
            <div className="page-header">
                <h1 className="h3" style={{ color: '#302C9A' }}>My Routes</h1>
            </div>

            <div>
                {routesLoading && <p>Loading your routes...</p>}
                {routesError && <p className="text-danger">{routesError}</p>}
                {!routesLoading && routes.length === 0 && (
                    <p style={{ color: "#6AB7AD" }}>
                        You haven't joined any routes yet. Explore the home page to find routes!
                    </p>
                )}

                <div style={{ marginTop: "20px" }}>
                    {routes.map(route => (
                        <RouteCard
                            key={route.id}
                            routeId={route.id}
                            routeName={route.name}
                            isActive={true}
                            onLeaveClick={() => handleLeaveRoute(route.id)}
                            stores={route.stores || []}
                            userId={user.id}
                            onShowAuth={onShowAuth}
                        />
                    ))}
                </div>
            </div>

            <div className="page-header" style={{ marginTop: "40px" }}>
                <h1 className="h3" style={{ color: "#302C9A" }}>My Saved Stores</h1>
            </div>

            <div>
                {storesLoading && <p>Loading your saved stores...</p>}
                {storesError && <p className="text-danger">{storesError}</p>}
                {!storesLoading && stores.length === 0 && (
                    <p style={{ color: "#6AB7AD" }}>
                        You haven't saved any stores yet. Save stores from the home page!
                    </p>
                )}

                {stores.map(store => (
                    <StoreCard
                        key={store.id}
                        storeId={store.id}
                        storeName={store.name}
                        latitude={store.latitude}
                        longitude={store.longitude}
                        userId={user.id}
                        onShowAuth={onShowAuth}
                    />
                ))}
            </div>

            {/* VISIT HISTORY SECTION */}
            <div className="page-header" style={{ marginTop: "40px" }}>
                <h1 className="h3" style={{ color: "#302C9A" }}>Visit History</h1>
            </div>

            <div>
                {visitsLoading && <p>Loading your visit history...</p>}
                {visitsError && <p className="text-danger">{visitsError}</p>}
                {!visitsLoading && visits.length === 0 && (
                    <p style={{ color: "#6AB7AD" }}>
                        No visits yet. Get punched in at stores to track your visits!
                    </p>
                )}

                {!visitsLoading && visits.length > 0 && (
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                        gap: "1rem",
                        marginTop: "1rem"
                    }}>
                        {visits.map((visit) => (
                            <div
                                key={visit.id}
                                style={{
                                    border: "1px solid #A7CCDE",
                                    borderRadius: "8px",
                                    padding: "1rem",
                                    backgroundColor: "white"
                                }}
                            >
                                <h3 style={{ margin: "0 0 0.5rem 0", color: "#302C9A" }}>
                                    {visit.visitStore?.name || 'Unknown Store'}
                                </h3>
                                <p style={{
                                    color: "#666",
                                    fontSize: "0.9rem",
                                    margin: "0.25rem 0"
                                }}>
                                    {visit.visitStore?.address || ''}
                                </p>
                                <p style={{
                                    color: "#999",
                                    fontSize: "0.85rem",
                                    margin: "0.5rem 0"
                                }}>
                                    {new Date(visit.visitDate).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                                {visit.visitStore?.cuisine && (
                                    <span style={{
                                        display: "inline-block",
                                        background: "#f0f0f0",
                                        padding: "0.25rem 0.5rem",
                                        borderRadius: "4px",
                                        fontSize: "0.8rem",
                                        color: "#666",
                                        marginTop: "0.5rem"
                                    }}>
                                        {visit.visitStore.cuisine}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
