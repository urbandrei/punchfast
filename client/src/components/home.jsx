import React, { useEffect, useState } from 'react';

const Home = ({ isLogin , user}) => {
    const [stores, setStores] = useState([]);
    const [routes, setRoutes] = useState([]);
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

    }, []);

    return (
            <div className="container stores-container">

                <div className="page-header">
                    <a href="/newroute" className="btn btn-primary pull-right">
                        <span className="glyphicon glyphicon-plus"></span>
                    </a>
                    <h1 className="h3">Routes</h1>
                </div>

                <div>
                    {routesLoading && <p>Loading nearby routes...</p>}
                    {routesError && <p className="text-danger">{routesError}</p>}
                    {!routesLoading && routes.length === 0 && <p>No routes found nearby.</p>}

                    {routes.map((s) => (
                        <div key={s.id} className="panel panel-default">
                            <div className="panel-body">
                                <h4 className="panel-title">{s.name}</h4>
                                <ul className="list-group" style={{ marginTop: '10px', marginBottom: 0 }}>
                                    {s.stores && s.stores.map(store => (
                                        <li key={store.id} className="list-group-item" style={{ border: 'none', padding: '5px 15px' }}>
                                            {store.name}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="page-header">
                    <a href="/newstore" className="btn btn-primary pull-right">
                        <span className="glyphicon glyphicon-plus"></span>
                    </a>
                    <h1 className="h3">Stores</h1>
                </div>

                <div>
                    {storesLoading && <p>Loading nearby stores…</p>}
                    {storesError && <p className="text-danger">{storesError}</p>}
                    {!storesLoading && stores.length === 0 && <p>No stores found nearby.</p>}

                    {stores.map((s) => (
                        <div key={s.id} className="panel panel-default">
                            <div className="panel-body">
                                <span className="text-muted pull-right">
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${s.latitude},${s.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {s.address}
                                    </a>
                                </span>
                                <span>{s.name}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

    );
};

export default Home;
