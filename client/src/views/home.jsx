import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import RouteCard from '../components/routeCard';
import StoreCard from '../components/storeCard';
import MapView from '../components/MapView';
import SkeletonCard from '../components/SkeletonCard';
import ErrorDisplay from '../components/ErrorDisplay';
import WaveDecoration from '../components/WaveDecoration';

const Home = ({ isLogin, user, onShowAuth }) => {
    // Separate state for each view type
    const [storesData, setStoresData] = useState({
        items: [],
        offset: 0,
        hasMore: true,
        loading: false
    });
    const [routesData, setRoutesData] = useState({
        items: [],
        offset: 0,
        hasMore: true,
        loading: false
    });
    const [userRouteStarts, setUserRouteStarts] = useState([]);
    const [storesError, setStoresError] = useState(null);
    const [routesError, setRoutesError] = useState(null);

    // Real-time location tracking
    const [currentLocation, setCurrentLocation] = useState(null);
    const [locationWatchId, setLocationWatchId] = useState(null);

    // New location state management
    const [userLocation, setUserLocation] = useState(null);      // GPS position
    const [mapCenter, setMapCenter] = useState(null);            // Current map/search center
    const [hasGeolocationError, setHasGeolocationError] = useState(false);
    const [mapHasMoved, setMapHasMoved] = useState(false);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const [shouldFitToFeatures, setShouldFitToFeatures] = useState(true);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Map/list interaction state
    const [viewType, setViewType] = useState('routes');
    const [selectedId, setSelectedId] = useState(null);
    const [cuisineFilter, setCuisineFilter] = useState('all');
    const [availableCuisines, setAvailableCuisines] = useState([]);

    // Scroll positions for each view
    const [storesScrollPos, setStoresScrollPos] = useState(0);
    const [routesScrollPos, setRoutesScrollPos] = useState(0);

    const listRef = useRef(null);
    const navigate = useNavigate();

    // Helper function: Calculate distance using Haversine formula
    const calculateDistance = (lat1, lng1, lat2, lng2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    // Helper function: Sort items by distance from current location
    const sortByDistance = (items, location) => {
        if (!location) return items;
        return items.map(item => ({
            ...item,
            distance: calculateDistance(
                location.lat,
                location.lng,
                parseFloat(item.latitude || item.stores?.[0]?.latitude),
                parseFloat(item.longitude || item.stores?.[0]?.longitude)
            )
        })).sort((a, b) => a.distance - b.distance);
    };

    // Load initial items for a view type
    const loadInitialItems = async (type, location) => {
        const endpoint = type === 'stores' ? 'stores' : 'routes';
        const setData = type === 'stores' ? setStoresData : setRoutesData;
        const setError = type === 'stores' ? setStoresError : setRoutesError;

        setData(prev => ({ ...prev, loading: true }));

        try {
            const res = await fetch(
                `/api/${endpoint}/nearby?lat=${location.lat}&lng=${location.lng}&limit=15&offset=0`
            );
            const data = await res.json();

            setData({
                items: data[endpoint] || [],
                offset: 15,
                hasMore: (data[endpoint] || []).length === 15,
                loading: false
            });
            setError(null);
        } catch (err) {
            console.error(`Error loading ${type}:`, err);
            setError(`Could not load nearby ${type}`);
            setData(prev => ({ ...prev, loading: false }));
        }
    };

    // Load more items for infinite scroll
    const loadMoreItems = async (type) => {
        const endpoint = type === 'stores' ? 'stores' : 'routes';
        const data = type === 'stores' ? storesData : routesData;
        const setData = type === 'stores' ? setStoresData : setRoutesData;
        const setError = type === 'stores' ? setStoresError : setRoutesError;

        if (!currentLocation || !data.hasMore || data.loading || data.items.length >= 100) return;

        setData(prev => ({ ...prev, loading: true }));

        try {
            const res = await fetch(
                `/api/${endpoint}/nearby?lat=${currentLocation.lat}&lng=${currentLocation.lng}&limit=15&offset=${data.offset}`
            );
            const newData = await res.json();
            const newItems = newData[endpoint] || [];

            setData(prev => ({
                items: [...prev.items, ...newItems],
                offset: prev.offset + 15,
                hasMore: newItems.length === 15 && (prev.items.length + newItems.length) < 100,
                loading: false
            }));
            setError(null);
        } catch (err) {
            console.error(`Error loading more ${type}:`, err);
            setError(`Could not load more ${type}`);
            setData(prev => ({ ...prev, loading: false }));
        }
    };

    // Fetch user route starts
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

    // Set up real-time location tracking
    useEffect(() => {
        if (navigator.geolocation) {
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const newLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setCurrentLocation(newLocation);
                    setUserLocation(newLocation);
                    setMapCenter(newLocation);  // Initially same as user location
                    setHasGeolocationError(false);

                    // Load initial data on first location update
                    if (!initialLoadComplete) {
                        loadInitialItems('stores', newLocation);
                        loadInitialItems('routes', newLocation);
                        setInitialLoadComplete(true);
                        setShouldFitToFeatures(true);
                        setIsInitialLoad(true);
                    }
                },
                (error) => {
                    console.error('Location error:', error);
                    setHasGeolocationError(true);
                    setUserLocation(null);
                    setMapCenter(null);
                    // DO NOT load data - show error instead
                },
                { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
            );
            setLocationWatchId(watchId);

            return () => navigator.geolocation.clearWatch(watchId);
        } else {
            // No geolocation support
            console.error('Geolocation not supported');
            setHasGeolocationError(true);
            setUserLocation(null);
            setMapCenter(null);
        }
    }, []);

    // Reset shouldFitToFeatures after initial load completes
    useEffect(() => {
        if (initialLoadComplete && isInitialLoad) {
            const timer = setTimeout(() => {
                setShouldFitToFeatures(false);
                setIsInitialLoad(false);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [initialLoadComplete, isInitialLoad]);

    // Fetch user route starts when user logs in
    useEffect(() => {
        fetchUserRouteStarts();
    }, [isLogin, user]);

    // Extract unique cuisines when routes/stores change
    useEffect(() => {
        const cuisines = new Set();

        routesData.items.forEach(route => {
            if (route.routeType) {
                cuisines.add(route.routeType);
            }
        });

        storesData.items.forEach(store => {
            if (store.cuisine) cuisines.add(store.cuisine);
            if (store.amenity) cuisines.add(store.amenity);
            if (store.shop) cuisines.add(store.shop);
        });

        setAvailableCuisines(Array.from(cuisines).sort());
    }, [routesData.items, storesData.items]);

    // Scroll to selected item when selectedId changes
    useEffect(() => {
        if (!selectedId || !listRef.current) return;

        const itemElement = document.getElementById(`item-${selectedId}`);
        if (itemElement) {
            itemElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [selectedId]);

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

    const handleMarkerClick = (id, type) => {
        setSelectedId(id);
        // Optionally switch view type to match clicked item
        if (type === 'store' && viewType !== 'stores') {
            setViewType('stores');
        } else if (type === 'route' && viewType !== 'routes') {
            setViewType('routes');
        }
    };

    const handleItemClick = (id) => {
        setSelectedId(id);
    };

    const handleCuisineChange = (e) => {
        setCuisineFilter(e.target.value);
        setSelectedId(null); // Clear selection when filter changes
    };

    const handleViewTypeChange = (type) => {
        setViewType(type);
        setSelectedId(null);

        // Restore scroll position for the new view
        setTimeout(() => {
            if (listRef.current) {
                listRef.current.scrollTop = type === 'stores' ? storesScrollPos : routesScrollPos;
            }
        }, 0);
    };

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        const data = viewType === 'stores' ? storesData : routesData;

        // Save scroll position
        if (viewType === 'stores') {
            setStoresScrollPos(scrollTop);
        } else {
            setRoutesScrollPos(scrollTop);
        }

        // Check if within 5 items of bottom (assume ~150px per item)
        const itemHeight = 150;
        const itemsFromBottom = (scrollHeight - scrollTop - clientHeight) / itemHeight;

        if (itemsFromBottom < 5 && data.hasMore && !data.loading && data.items.length < 100) {
            loadMoreItems(viewType);
        }
    };

    // Map interaction handlers
    const handleMapMove = (newLat, newLng) => {
        const newCenter = { lat: newLat, lng: newLng };
        setMapCenter(newCenter);

        // Check if moved >50m from user location
        if (userLocation) {
            const distance = calculateDistance(
                userLocation.lat, userLocation.lng,
                newLat, newLng
            );
            setMapHasMoved(distance > 0.05); // 50 meters (0.05 km)
        } else {
            setMapHasMoved(true);
        }
    };

    const handleCoordinateChange = (lat, lng) => {
        setMapCenter({ lat, lng });
        setMapHasMoved(true);
    };

    const handleReturnToUser = () => {
        if (userLocation) {
            setMapCenter(userLocation);
            setMapHasMoved(false);
            setShouldFitToFeatures(true);
            // Reload data at user location
            setStoresData({ items: [], offset: 0, hasMore: true, loading: false });
            setRoutesData({ items: [], offset: 0, hasMore: true, loading: false });
            setInitialLoadComplete(false);
            loadInitialItems('stores', userLocation);
            loadInitialItems('routes', userLocation);

            setTimeout(() => {
                setInitialLoadComplete(true);
                setShouldFitToFeatures(false);
            }, 600);
        }
    };

    const handleSearchThisArea = () => {
        if (mapCenter) {
            setMapHasMoved(false);
            setShouldFitToFeatures(true);
            // Clear existing data and reload at new center
            setStoresData({ items: [], offset: 0, hasMore: true, loading: false });
            setRoutesData({ items: [], offset: 0, hasMore: true, loading: false });
            setInitialLoadComplete(false);
            loadInitialItems('stores', mapCenter);
            loadInitialItems('routes', mapCenter);

            setTimeout(() => {
                setInitialLoadComplete(true);
                setShouldFitToFeatures(false);
            }, 600);
        }
    };

    // Memoize filtered data to prevent unnecessary re-renders
    const memoizedFilteredRoutes = useMemo(() => {
        return cuisineFilter === 'all'
            ? routesData.items
            : routesData.items.filter(r => r.routeType === cuisineFilter);
    }, [routesData.items, cuisineFilter]);

    const memoizedFilteredStores = useMemo(() => {
        return cuisineFilter === 'all'
            ? storesData.items
            : storesData.items.filter(s =>
                s.cuisine === cuisineFilter ||
                s.amenity === cuisineFilter ||
                s.shop === cuisineFilter
            );
    }, [storesData.items, cuisineFilter]);

    // Memoize callbacks to prevent re-creating functions on every render
    const handleMarkerClickMemo = useCallback((id, type) => {
        setSelectedId(id);
        if (type === 'store' && viewType !== 'stores') {
            setViewType('stores');
        } else if (type === 'route' && viewType !== 'routes') {
            setViewType('routes');
        }
    }, [viewType]);

    const handleMapMoveMemo = useCallback((newLat, newLng) => {
        const newCenter = { lat: newLat, lng: newLng };
        setMapCenter(newCenter);

        if (userLocation) {
            const distance = calculateDistance(
                userLocation.lat, userLocation.lng,
                newLat, newLng
            );
            setMapHasMoved(distance > 0.05);
        } else {
            setMapHasMoved(true);
        }
    }, [userLocation]);

    const handleCoordinateChangeMemo = useCallback((lat, lng) => {
        setMapCenter({ lat, lng });
        setMapHasMoved(true);
    }, []);

    const handleReturnToUserMemo = useCallback(() => {
        if (userLocation) {
            setMapCenter(userLocation);
            setMapHasMoved(false);
            setShouldFitToFeatures(true);
            setStoresData({ items: [], offset: 0, hasMore: true, loading: false });
            setRoutesData({ items: [], offset: 0, hasMore: true, loading: false });
            setInitialLoadComplete(false);
            loadInitialItems('stores', userLocation);
            loadInitialItems('routes', userLocation);

            setTimeout(() => {
                setInitialLoadComplete(true);
                setShouldFitToFeatures(false);
            }, 600);
        }
    }, [userLocation]);

    const handleSearchThisAreaMemo = useCallback(() => {
        if (mapCenter) {
            setMapHasMoved(false);
            setShouldFitToFeatures(true);
            setStoresData({ items: [], offset: 0, hasMore: true, loading: false });
            setRoutesData({ items: [], offset: 0, hasMore: true, loading: false });
            setInitialLoadComplete(false);
            loadInitialItems('stores', mapCenter);
            loadInitialItems('routes', mapCenter);

            setTimeout(() => {
                setInitialLoadComplete(true);
                setShouldFitToFeatures(false);
            }, 600);
        }
    }, [mapCenter]);

    return (
        <div style={{
            position: 'fixed',
            top: '50px',
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Map container - 50% height + wave height, moved up by wave height */}
            <div style={{
                height: 'calc(50% + 2*var(--pf-wave-height, 2.5vh))',
                marginTop: '0',
                position: 'relative'
            }}>
                <MapView
                    stores={memoizedFilteredStores}
                    routes={memoizedFilteredRoutes}
                    viewType={viewType}
                    selectedId={selectedId}
                    onMarkerClick={handleMarkerClickMemo}
                    cuisineFilter={cuisineFilter}
                    userLat={userLocation?.lat}
                    userLng={userLocation?.lng}
                    centerLat={mapCenter?.lat}
                    centerLng={mapCenter?.lng}
                    onMapMove={handleMapMoveMemo}
                    onCoordinateChange={handleCoordinateChangeMemo}
                    onReturnToUser={handleReturnToUserMemo}
                    onSearchArea={handleSearchThisAreaMemo}
                    mapHasMoved={mapHasMoved}
                    shouldFitToFeatures={shouldFitToFeatures}
                    isInitialLoad={isInitialLoad}
                />
            </div>

            {/* Wave decoration between map and list */}
            <WaveDecoration position="top" baseColor="cards" />

            {/* List container - scrollable, fills remaining space minus option bars (100px) */}
            <div
                ref={listRef}
                onScroll={handleScroll}
                className="pf-gradient-fade"
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    paddingBottom: '110px',
                    backgroundColor: '#A7CCDE',
                    position: 'relative'
                }}
            >
                <div className="container">
                    {viewType === 'routes' ? (
                        <div>
                            {/* SKELETON LOADING - Initial load only */}
                            {!initialLoadComplete && routesData.loading && routesData.items.length === 0 && (
                                <>
                                    {Array.from({ length: 15 }).map((_, idx) => (
                                        <SkeletonCard key={idx} type="route" />
                                    ))}
                                </>
                            )}

                            {/* ERROR STATES */}
                            {routesError && !routesData.loading && (
                                <ErrorDisplay message={routesError} type="api" />
                            )}

                            {hasGeolocationError && !userLocation && initialLoadComplete && (
                                <ErrorDisplay
                                    message="Location access denied"
                                    type="location"
                                />
                            )}

                            {/* EMPTY STATES */}
                            {initialLoadComplete && !routesData.loading && !routesError && !hasGeolocationError &&
                             memoizedFilteredRoutes.length === 0 && routesData.items.length === 0 && (
                                <p>No routes found {cuisineFilter !== 'all' ? `for ${cuisineFilter}` : 'nearby'}.</p>
                            )}
                            {initialLoadComplete && !routesData.loading && memoizedFilteredRoutes.length === 0 && routesData.items.length > 0 && (
                                <p>No routes found for {cuisineFilter}.</p>
                            )}

                            <div style={{ marginTop: '20px' }}>
                                {memoizedFilteredRoutes.map((route) => {
                                    const userRouteStart = userRouteStarts.find(
                                        rs => rs.routeId === route.id && rs.status === 'active'
                                    );
                                    const isActive = !!userRouteStart;
                                    const isSelected = selectedId === route.id;

                                    return (
                                        <div key={route.id} id={`item-${route.id}`}>
                                            <RouteCard
                                                routeId={route.id}
                                                routeName={route.name}
                                                isActive={isActive}
                                                isSelected={isSelected}
                                                onJoinClick={() => handleJoinRoute(route.id, route.name)}
                                                onLeaveClick={() => handleLeaveRoute(route.id, route.name)}
                                                onCardClick={() => handleItemClick(route.id)}
                                                stores={route.stores || []}
                                                userId={user?.id}
                                                onShowAuth={onShowAuth}
                                            />
                                        </div>
                                    );
                                })}
                                {routesData.loading && routesData.items.length > 0 && (
                                    <p style={{ textAlign: 'center', padding: '20px' }}>Loading more routes...</p>
                                )}
                                {!routesData.hasMore && routesData.items.length > 0 && (
                                    <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                                        {routesData.items.length >= 100 ? 'Showing 100 routes (max)' : 'No more routes to load'}
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div>
                            {/* SKELETON LOADING - Initial load only */}
                            {!initialLoadComplete && storesData.loading && storesData.items.length === 0 && (
                                <>
                                    {Array.from({ length: 15 }).map((_, idx) => (
                                        <SkeletonCard key={idx} type="store" />
                                    ))}
                                </>
                            )}

                            {/* ERROR STATES */}
                            {storesError && !storesData.loading && (
                                <ErrorDisplay message={storesError} type="api" />
                            )}

                            {hasGeolocationError && !userLocation && initialLoadComplete && (
                                <ErrorDisplay
                                    message="Location access denied"
                                    type="location"
                                />
                            )}

                            {/* EMPTY STATES */}
                            {initialLoadComplete && !storesData.loading && !storesError && !hasGeolocationError &&
                             memoizedFilteredStores.length === 0 && storesData.items.length === 0 && (
                                <p>No stores found {cuisineFilter !== 'all' ? `for ${cuisineFilter}` : 'nearby'}.</p>
                            )}
                            {initialLoadComplete && !storesData.loading && memoizedFilteredStores.length === 0 && storesData.items.length > 0 && (
                                <p>No stores found for {cuisineFilter}.</p>
                            )}

                            <div style={{ marginTop: '20px' }}>
                                {memoizedFilteredStores.map((store) => {
                                    const isSelected = selectedId === store.id;

                                    return (
                                        <div key={store.id} id={`item-${store.id}`}>
                                            <StoreCard
                                                storeId={store.id}
                                                storeName={store.name}
                                                latitude={store.latitude}
                                                longitude={store.longitude}
                                                isSelected={isSelected}
                                                onCardClick={() => handleItemClick(store.id)}
                                                userId={user?.id}
                                                onShowAuth={onShowAuth}
                                            />
                                        </div>
                                    );
                                })}
                                {storesData.loading && storesData.items.length > 0 && (
                                    <p style={{ textAlign: 'center', padding: '20px' }}>Loading more stores...</p>
                                )}
                                {!storesData.hasMore && storesData.items.length > 0 && (
                                    <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                                        {storesData.items.length >= 100 ? 'Showing 100 stores (max)' : 'No more stores to load'}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Option bars - fixed at bottom */}
            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 1000
            }}>
                {/* Cuisine filter bar with wave */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <WaveDecoration position="bottom" baseColor="filter" />
                    <div style={{
                        padding: '12px 0',
                        backgroundColor: '#f8f9fa'
                    }}>
                    <div className="container" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <label htmlFor="cuisine-filter" style={{ fontWeight: 'bold', minWidth: '100px' }}>
                            Filter by type:
                        </label>
                        <select
                            id="cuisine-filter"
                            value={cuisineFilter}
                            onChange={handleCuisineChange}
                            style={{
                                flex: 1,
                                padding: '8px 12px',
                                borderRadius: '4px',
                                border: '1px solid #ced4da',
                                fontSize: '14px'
                            }}
                        >
                            <option value="all">All Types</option>
                            {availableCuisines.map(cuisine => (
                                <option key={cuisine} value={cuisine}>
                                    {cuisine.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() => navigate(viewType === 'stores' ? '/newstore' : '/newroute')}
                            style={{
                                padding: '8px 20px',
                                backgroundColor: '#6AB7AD',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5aa69d'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6AB7AD'}
                        >
                            {viewType === 'stores' ? 'Add Store' : 'Add Route'}
                        </button>
                    </div>
                    </div>
                </div>

                {/* View toggle bar with wave */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <WaveDecoration position="bottom" baseColor="tabs" backgroundColor='#f8f9fa'/>
                    <div style={{
                        padding: '12px 0',
                        backgroundColor: '#302C9A'
                    }}>
                        <div className="container" style={{
                        display: 'flex',
                        gap: '12px',
                        justifyContent: 'center'
                    }}>
                        <button
                            onClick={() => handleViewTypeChange('routes')}
                            style={{
                                flex: 1,
                                maxWidth: '200px',
                                padding: '10px 20px',
                                backgroundColor: viewType === 'routes' ? 'white' : 'transparent',
                                color: viewType === 'routes' ? '#302C9A' : 'white',
                                border: viewType === 'routes' ? 'none' : '2px solid white',
                                borderRadius: '6px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            Routes
                        </button>
                        <button
                            onClick={() => handleViewTypeChange('stores')}
                            style={{
                                flex: 1,
                                maxWidth: '200px',
                                padding: '10px 20px',
                                backgroundColor: viewType === 'stores' ? 'white' : 'transparent',
                                color: viewType === 'stores' ? '#302C9A' : 'white',
                                border: viewType === 'stores' ? 'none' : '2px solid white',
                                borderRadius: '6px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            Stores
                        </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
