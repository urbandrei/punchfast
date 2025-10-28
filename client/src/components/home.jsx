import React, { useEffect, useState } from 'react';

const Home = ({ isLogin , user}) => {
    const [stores, setStores] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchNearby = async (lat, lng) => {
            try {
                const res = await fetch(`/api/stores/nearby?lat=${lat}&lng=${lng}&radius=10&limit=50`);
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

        const fetchNearbyRoutes = async (lat, lng) => {
            try {
                console.log("fetching routes");
                const res = await fetch(`/api/nearbyroutes`);
                if (!res.ok) throw new Error('Failed to fetch routes');
                const data = await res.json();
                setRoutes(data.routes || []);
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
        //fetchNearbyRoutes();

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
                    {loading && <p>Loading nearby routes...</p>}
                    {error && <p className="text-danger">{error}</p>}
                    {!loading && routes.length === 0 && <p>No stores found nearby.</p>}

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
                    {loading && <p>Loading nearby stores…</p>}
                    {error && <p className="text-danger">{error}</p>}
                    {!loading && stores.length === 0 && <p>No stores found nearby.</p>}

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
