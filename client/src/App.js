import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import VisitNotificationModal from './components/VisitNotificationModal';
import ChangePasswordModal from './components/ChangePasswordModal';
import BusinessAuthModal from './components/BusinessAuthModal';
import Home from './views/home';
import Dashboard from './views/dashboard';
import NewStore from './views/new_store';
import NewRoute from './views/new_route';
import BusinessPunches from './views/business_punches';
import BusinessDashboard from './views/business_dashboard';
import Achievements from "./views/achievements";

const SESSION_STORAGE_KEY = 'punchfast_notified_stores';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // customer auth modal
  const [showAuthModal, setShowAuthModal] = useState(false);
  // business auth modal
  const [showBusinessAuthModal, setShowBusinessAuthModal] = useState(false);

  const [businessUser, setBusinessUser] = useState(null);

  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [nearbyStores, setNearbyStores] = useState([]);
  const locationCheckInterval = useRef(null);

  useEffect(() => {
    try {
      const stored =
        localStorage.getItem('pf_business_email') ||
        localStorage.getItem('pf_business_username');

      if (stored) {
        setBusinessUser({ username: stored });
      }
    } catch (e) {
      console.error('Error reading business session from storage:', e);
    }
  }, []);

  const handleLogin = (status, userData = null) => {
    setIsLoggedIn(status);
    if (userData) {
      setCurrentUser(userData);
    } else if (!status) {
      setCurrentUser(null);
      if (locationCheckInterval.current) {
        clearInterval(locationCheckInterval.current);
        locationCheckInterval.current = null;
      }
    }
  };

  const handleBusinessLoginSuccess = (businessData) => {
    if (businessData?.username) {
      try {
        localStorage.setItem('pf_business_username', businessData.username);
      } catch (e) {
        console.error('Error saving business username:', e);
      }
      setBusinessUser({ username: businessData.username });
    }
    setShowBusinessAuthModal(false);
  };

  const handleBusinessSignOut = () => {
    setBusinessUser(null);
    try {
      localStorage.removeItem('pf_business_username');
      localStorage.removeItem('pf_business_email');
    } catch (e) {
      console.error('Error clearing business storage:', e);
    }
    window.location.href = '/';
  };

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

  const checkNearbyStores = async (latitude, longitude) => {
    if (!isLoggedIn || !currentUser?.id) return;

    try {
      const res = await fetch(
        `/api/nearby-eligible-stores?userId=${currentUser.id}&latitude=${latitude}&longitude=${longitude}`
      );

      if (!res.ok) {
        console.error('Failed to fetch nearby stores: ');
        return;
      }

      const data = await res.json();

      if (!data.stores || data.stores.length === 0) {
        return;
      }

      const notifiedStores = getNotifiedStores();
      const newStores = data.stores.filter(
        (store) => !notifiedStores.includes(store.id)
      );

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

  const handleLocationError = (error) => {
    console.error('Location error:', error);
  };

  useEffect(() => {
    if (!isLoggedIn || !currentUser) {
      return;
    }

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

  const handleVisit = (storeIds) => {
    addNotifiedStores(storeIds);
  };

  const handleNotVisiting = (storeIds) => {
    addNotifiedStores(storeIds);
  };

  const handleCloseVisitModal = () => {
    setShowVisitModal(false);
    setNearbyStores([]);
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    if (locationCheckInterval.current) {
      clearInterval(locationCheckInterval.current);
      locationCheckInterval.current = null;
    }
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  };

  return (
    <Router>
      <div>
        <Navbar
          isLoggedIn={isLoggedIn}
          currentUser={currentUser}
          business={businessUser}
          onShowAuth={() => setShowAuthModal(true)}
          onShowBusinessAuth={() => setShowBusinessAuthModal(true)}
          onChangePassword={() => setShowChangePasswordModal(true)}
          onSignOut={handleSignOut}
          onBusinessSignOut={handleBusinessSignOut}
        />

        <AuthModal
          show={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={(userData) => handleLogin(true, userData)}
        />

        <BusinessAuthModal
          show={showBusinessAuthModal}
          onClose={() => setShowBusinessAuthModal(false)}
          onLoginSuccess={handleBusinessLoginSuccess}
        />

        <VisitNotificationModal
          show={showVisitModal}
          stores={nearbyStores}
          userId={currentUser?.id}
          onVisit={handleVisit}
          onNotVisiting={handleNotVisiting}
          onClose={handleCloseVisitModal}
        />

        <ChangePasswordModal
          show={showChangePasswordModal}
          onClose={() => setShowChangePasswordModal(false)}
          userId={currentUser?.id}
        />

        <Routes>
          <Route
            path="/"
            element={
              <Home
                isLogin={isLoggedIn}
                user={currentUser}
                onShowAuth={() => setShowAuthModal(true)}
              />
            }
          />

          <Route
            path="/dashboard"
            element={
              <Dashboard
                isLogin={isLoggedIn}
                user={currentUser}
                onShowAuth={() => setShowAuthModal(true)}
              />
            }
          />

          <Route
            path="/newstore"
            element={<NewStore onLoginSuccess={() => handleLogin(true)} />}
          />

          <Route
            path="/newroute"
            element={<NewRoute onLoginSuccess={() => handleLogin(true)} />}
          />

          <Route
            path="/achievements"
            element={<Achievements />}
          />

          <Route
            path="/business/punches"
            element={<BusinessPunches business={businessUser} />}
          />

          <Route
            path="/business/dashboard"
            element={<BusinessDashboard business={businessUser} />}
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
