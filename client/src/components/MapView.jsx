import React, { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';
import { fromLonLat, toLonLat } from 'ol/proj';
import MapControls from './MapControls';
import 'ol/ol.css';

const MapView = ({
    stores,
    routes,
    viewType,
    selectedId,
    onMarkerClick,
    cuisineFilter,
    userLat,
    userLng,
    centerLat,
    centerLng,
    onMapMove,
    onCoordinateChange,
    onReturnToUser,
    onSearchArea,
    mapHasMoved,
    shouldFitToFeatures,
    isInitialLoad
}) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const vectorLayerRef = useRef(null);
    const animationRef = useRef(null);
    const userHasPannedRef = useRef(false);
    const isAnimatingRef = useRef(false);
    const lastFitExtentRef = useRef(null);

    // Initialize map
    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        const vectorSource = new VectorSource();
        const vectorLayer = new VectorLayer({
            source: vectorSource,
            style: (feature) => {
                const featureType = feature.get('featureType');
                const isSelected = feature.get('id') === selectedId;

                // User location marker - distinct blue pulsing circle
                if (featureType === 'userLocation') {
                    return new Style({
                        image: new CircleStyle({
                            radius: 10,
                            fill: new Fill({ color: 'rgba(0, 122, 255, 0.3)' }),
                            stroke: new Stroke({ color: '#007AFF', width: 3 })
                        })
                    });
                }

                if (featureType === 'store') {
                    return new Style({
                        image: new CircleStyle({
                            radius: isSelected ? 8 : 6,
                            fill: new Fill({ color: isSelected ? '#FF5722' : '#302C9A' }),
                            stroke: new Stroke({ color: '#fff', width: 2 })
                        })
                    });
                } else if (featureType === 'routeLine') {
                    const routeType = feature.get('routeType') || 'default';
                    const colorMap = {
                        'mexican': '#FF6B6B',
                        'sausage': '#4ECDC4',
                        'donut': '#FFE66D',
                        'balkan': '#95E1D3',
                        'steak_house': '#F38181',
                        'default': '#302C9A'
                    };
                    return new Style({
                        stroke: new Stroke({
                            color: colorMap[routeType] || colorMap.default,
                            width: isSelected ? 4 : 2
                        })
                    });
                } else if (featureType === 'routeStore') {
                    const storeOrder = feature.get('order');
                    return new Style({
                        image: new CircleStyle({
                            radius: isSelected ? 10 : 7,
                            fill: new Fill({ color: isSelected ? '#FF5722' : '#FF9800' }),
                            stroke: new Stroke({ color: '#fff', width: 2 })
                        }),
                        text: new Text({
                            text: String(storeOrder),
                            fill: new Fill({ color: '#fff' }),
                            font: 'bold 12px sans-serif'
                        })
                    });
                }
            }
        });
        vectorLayerRef.current = vectorLayer;

        const map = new Map({
            target: mapRef.current,
            layers: [
                new TileLayer({
                    source: new OSM()
                }),
                vectorLayer
            ],
            view: new View({
                center: centerLat && centerLng ? fromLonLat([centerLng, centerLat]) : fromLonLat([0, 0]),
                zoom: centerLat && centerLng ? 11 : 2
            })
        });

        // Handle map clicks
        map.on('click', (evt) => {
            const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f);
            if (feature) {
                const id = feature.get('id');
                const type = feature.get('featureType');
                if (id && (type === 'store' || type === 'routeLine' || type === 'routeStore')) {
                    onMarkerClick(id, type === 'store' ? 'store' : 'route');
                }
            }
        });

        // Change cursor on hover
        map.on('pointermove', (evt) => {
            const pixel = map.getEventPixel(evt.originalEvent);
            const hit = map.hasFeatureAtPixel(pixel);
            map.getTarget().style.cursor = hit ? 'pointer' : '';
        });

        // Detect user pan/zoom interactions
        const handleUserInteraction = () => {
            if (!isAnimatingRef.current) {
                userHasPannedRef.current = true;
            }
        };
        map.on('pointerdrag', handleUserInteraction);
        map.on('wheel', handleUserInteraction);

        // Detect map movements
        map.on('moveend', () => {
            isAnimatingRef.current = false;
            if (onMapMove) {
                const view = map.getView();
                const center = view.getCenter();
                const [lng, lat] = toLonLat(center);
                onMapMove(lat, lng);
            }
        });

        mapInstanceRef.current = map;

        return () => {
            map.setTarget(null);
            mapInstanceRef.current = null;
        };
    }, []);

    // Update markers when data or filters change
    useEffect(() => {
        if (!vectorLayerRef.current) return;

        const vectorSource = vectorLayerRef.current.getSource();
        vectorSource.clear();

        const features = [];

        // Add user location marker if available
        if (userLat != null && userLng != null) {
            const userFeature = new Feature({
                geometry: new Point(fromLonLat([userLng, userLat]))
            });
            userFeature.set('featureType', 'userLocation');
            features.push(userFeature);
        }

        if (viewType === 'stores') {
            // Show individual store markers
            const filteredStores = cuisineFilter === 'all'
                ? stores
                : stores.filter(s => s.cuisine === cuisineFilter || s.amenity === cuisineFilter || s.shop === cuisineFilter);

            filteredStores.forEach(store => {
                if (store.latitude && store.longitude) {
                    const feature = new Feature({
                        geometry: new Point(fromLonLat([parseFloat(store.longitude), parseFloat(store.latitude)]))
                    });
                    feature.set('id', store.id);
                    feature.set('featureType', 'store');
                    features.push(feature);
                }
            });
        } else if (viewType === 'routes') {
            // Show route polylines and store markers
            const filteredRoutes = cuisineFilter === 'all'
                ? routes
                : routes.filter(r => r.routeType === cuisineFilter);

            filteredRoutes.forEach(route => {
                if (route.stores && route.stores.length > 0) {
                    const coordinates = [];
                    const validStores = route.stores.filter(s => s.latitude && s.longitude);

                    // Create line connecting stores
                    validStores.forEach(store => {
                        coordinates.push(fromLonLat([parseFloat(store.longitude), parseFloat(store.latitude)]));
                    });

                    if (coordinates.length > 1) {
                        const lineFeature = new Feature({
                            geometry: new LineString(coordinates)
                        });
                        lineFeature.set('id', route.id);
                        lineFeature.set('featureType', 'routeLine');
                        lineFeature.set('routeType', route.routeType);
                        features.push(lineFeature);
                    }

                    // Create numbered markers for each store on the route
                    validStores.forEach((store, index) => {
                        const storeFeature = new Feature({
                            geometry: new Point(fromLonLat([parseFloat(store.longitude), parseFloat(store.latitude)]))
                        });
                        storeFeature.set('id', route.id);
                        storeFeature.set('featureType', 'routeStore');
                        storeFeature.set('order', store.order || index + 1);
                        features.push(storeFeature);
                    });
                }
            });
        }

        vectorSource.addFeatures(features);
        // NO automatic map fitting - markers update, map stays in place
    }, [stores, routes, viewType, cuisineFilter, userLat, userLng]);

    // Auto-fit to features ONLY when shouldFitToFeatures is true
    useEffect(() => {
        if (!mapInstanceRef.current || !vectorLayerRef.current || !shouldFitToFeatures) {
            return;
        }

        const vectorSource = vectorLayerRef.current.getSource();
        const features = vectorSource.getFeatures();
        const featuresToFit = features.filter(f => f.get('featureType') !== 'userLocation');

        if (featuresToFit.length === 0) return;

        const extent = vectorSource.getExtent();
        const extentKey = extent.join(',');

        // Avoid duplicate fits to same extent
        if (lastFitExtentRef.current === extentKey && !isInitialLoad) {
            return;
        }
        lastFitExtentRef.current = extentKey;

        // Cancel in-flight animations
        if (animationRef.current) {
            mapInstanceRef.current.getView().cancelAnimations();
            animationRef.current = null;
        }

        isAnimatingRef.current = true;
        userHasPannedRef.current = false;

        mapInstanceRef.current.getView().fit(extent, {
            padding: [50, 50, 50, 50],
            maxZoom: 14,
            duration: isInitialLoad ? 0 : 500
        });

        animationRef.current = setTimeout(() => {
            isAnimatingRef.current = false;
            animationRef.current = null;
        }, isInitialLoad ? 0 : 500);
    }, [shouldFitToFeatures, isInitialLoad]);

    // Update map center when centerLat/centerLng change
    useEffect(() => {
        if (!mapInstanceRef.current || centerLat == null || centerLng == null) return;

        // Don't override if user has panned (unless initial load)
        if (userHasPannedRef.current && !isInitialLoad) return;

        const view = mapInstanceRef.current.getView();
        const currentCenter = view.getCenter();
        const newCenter = fromLonLat([centerLng, centerLat]);

        // Check if center actually changed (avoid unnecessary animations)
        const [currentLng, currentLat] = toLonLat(currentCenter);
        const threshold = 0.0001; // ~11 meters
        if (Math.abs(currentLat - centerLat) < threshold &&
            Math.abs(currentLng - centerLng) < threshold) {
            return;
        }

        // Cancel in-flight animations
        if (animationRef.current) {
            view.cancelAnimations();
            clearTimeout(animationRef.current);
            animationRef.current = null;
        }

        isAnimatingRef.current = true;
        userHasPannedRef.current = false;

        view.animate({
            center: newCenter,
            duration: 500
        });

        animationRef.current = setTimeout(() => {
            isAnimatingRef.current = false;
            animationRef.current = null;
        }, 500);
    }, [centerLat, centerLng, isInitialLoad]);

    // Center on selected item (HIGHEST PRIORITY)
    useEffect(() => {
        if (!mapInstanceRef.current || !vectorLayerRef.current || !selectedId) {
            if (vectorLayerRef.current) {
                vectorLayerRef.current.changed();
            }
            return;
        }

        const vectorSource = vectorLayerRef.current.getSource();
        const features = vectorSource.getFeatures();
        const selectedFeature = features.find(f => f.get('id') === selectedId);

        if (selectedFeature) {
            const geometry = selectedFeature.getGeometry();
            const view = mapInstanceRef.current.getView();

            // Cancel in-flight animations (selection has HIGHEST priority)
            if (animationRef.current) {
                view.cancelAnimations();
                clearTimeout(animationRef.current);
                animationRef.current = null;
            }

            isAnimatingRef.current = true;
            userHasPannedRef.current = false;

            if (geometry.getType() === 'Point') {
                view.animate({
                    center: geometry.getCoordinates(),
                    zoom: 15,
                    duration: 500
                });
            } else if (geometry.getType() === 'LineString') {
                const extent = geometry.getExtent();
                view.fit(extent, {
                    padding: [100, 100, 100, 100],
                    maxZoom: 14,
                    duration: 500
                });
            }

            animationRef.current = setTimeout(() => {
                isAnimatingRef.current = false;
                animationRef.current = null;
            }, 500);
        }

        vectorLayerRef.current.changed();
    }, [selectedId]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
            {centerLat != null && centerLng != null && (
                <MapControls
                    currentLat={centerLat}
                    currentLng={centerLng}
                    userLat={userLat}
                    userLng={userLng}
                    onCoordinateChange={onCoordinateChange}
                    onReturnToUser={onReturnToUser}
                    onSearchArea={onSearchArea}
                    hasUserLocation={userLat != null && userLng != null}
                    mapHasMoved={mapHasMoved}
                />
            )}
        </div>
    );
};

export default MapView;
