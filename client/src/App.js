import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import VisitNotificationModal from './components/VisitNotificationModal';
import ChangePasswordModal from './components/ChangePasswordModal';
import CookieConsent from './components/CookieConsent';   // ⭐ ADDED

import Home from './views/home';
import Dashboard from './views/dashboard';
import NewStore from './views/new_store';
import NewRoute from './views/new_route';

const SESSION_STORAGE_KEY = 'punchfast_notified_stores';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [nearbyStores, setNearbyStores] = useState([]);
  const locationCheckInterval = useRef(null);

  // 🔐 LOGIN HANDLER
  const handleLogin = (status, userData = null) => {
    setIsLoggedIn(status);
    if (status && userData) {
      setCurrentUser(userData);
    } else {
      setCurrentUser(null);
      if (locationCheckInterval.current) {
        clearInterval(locationCheckInterval.current);
        locationCheckInterval.current = null;
      }
    }
  };

  // ===========================
  // STORE NOTIFICATION FUNCTIONS
  // ===========================
  const getNotifiedStores = () => {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (err) {
      console.error('Error reading notified stores:', err);
      return [];
    }
  };

  const addNotifiedStores = (storeIds) => {
    try {
      const existing = getNotifiedStores();
      const updated = [...new Set([...existing, ...storeIds])];
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Error saving notified stores:', err);
    }
  };

  // ===========================
  // LOCATION CHECK
  // ===========================
  const checkNearbyStores = async (latitude, longitude) => {
    if (!isLoggedIn || !currentUser?.id) return;

    try {
      const res = await fetch(
        `/api/nearby-eligible-stores?userId=${currentUser.id}&latitude=${latitude}&longitude=${longitude}`
      );

      if (!res.ok) {
        console.error('Failed to fetch nearby stores');
        return;
      }

      const data = await res.json();
      if (!data.stores || data.stores.length === 0) return;

      const notified = getNotifiedStores();
      const newStores = data.stores.filter((store) => !notified.includes(store.id));

      if (newStores.length > 0) {
        setNearbyStores(newStores);
        setShowVisitModal(true);
      }
    } catch (err) {
      console.error('Error checking nearby stores:', err);
    }
  };

  const handleLocationUpdate = (position) => {
    const { latitude, longitude } = position.coords;
    checkNearbyStores(latitude, longitude);
  };

  const handleLocationError = (err) => {
    console.error('Location error:', err);
  };

  useEffect(() => {
    if (!isLoggedIn || !currentUser) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        handleLocationUpdate,
        handleLocationError
      );
    }

    locationCheckInterval.current = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          handleLocationUpdate,
          handleLocationError
        );
      }
    }, 60000);

    return () => {
      if (locationCheckInterval.current) {
        clearInterval(locationCheckInterval.current);
        locationCheckInterval.current = null;
      }
    };
  }, [isLoggedIn, currentUser]);

  // ===========================
  // VISIT MODAL HANDLERS
  // ===========================
  const handleVisit = (storeIds) => addNotifiedStores(storeIds);
  const handleNotVisiting = (storeIds) => addNotifiedStores(storeIds);

  const handleCloseVisitModal = () => {
    setShowVisitModal(false);
    setNearbyStores([]);
  };

  // ===========================
  // SIGN OUT
  // ===========================
  const handleSignOut = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);

    if (locationCheckInterval.current) {
      clearInterval(locationCheckInterval.current);
      locationCheckInterval.current = null;
    }

    sessionStorage.removeItem(SESSION_STORAGE_KEY);

    fetch("/api/logout", { method: "POST" }).catch(() => {});
  };

  return (
    <Router>
      <div>
        
        {/* ⭐ COOKIE CONSENT POPUP */}
        <CookieConsent />

        {/* NAVBAR */}
        <Navbar
          isLoggedIn={isLoggedIn}
          currentUser={currentUser}
          onShowAuth={() => setShowAuthModal(true)}
          onChangePassword={() => setShowChangePasswordModal(true)}
          onSignOut={handleSignOut}
        />

        {/* AUTH MODAL */}
        <AuthModal
          show={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={(userData) => handleLogin(true, userData)}
        />

        {/* VISIT MODAL */}
        <VisitNotificationModal
          show={showVisitModal}
          stores={nearbyStores}
          userId={currentUser?.id}
          onVisit={handleVisit}
          onNotVisiting={handleNotVisiting}
          onClose={handleCloseVisitModal}
        />

        {/* CHANGE PASSWORD */}
        <ChangePasswordModal
          show={showChangePasswordModal}
          onClose={() => setShowChangePasswordModal(false)}
          userId={currentUser?.id}
        />

        {/* ROUTES */}
        <Routes>
          <Route path="/" element={<Home isLogin={isLoggedIn} user={currentUser} onShowAuth={() => setShowAuthModal(true)} />} />
          <Route path="/dashboard" element={<Dashboard isLogin={isLoggedIn} user={currentUser} onShowAuth={() => setShowAuthModal(true)} />} />
          <Route path="/newstore" element={<NewStore onLoginSuccess={() => handleLogin(true)} />} />
          <Route path="/newroute" element={<NewRoute onLoginSuccess={() => handleLogin(true)} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
