import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import UnifiedAuthModal from './components/UnifiedAuthModal';
import VisitNotificationModal from './components/VisitNotificationModal';
import PunchNotificationModal from './components/PunchNotificationModal';
import ChangePasswordModal from './components/ChangePasswordModal';
import AchievementModal from './components/AchievementModal';
import Home from './views/home';
import Dashboard from './views/dashboard';
import NewStore from './views/new_store';
import NewRoute from './views/new_route';
import BusinessPunches from './views/business_punches';
import BusinessDashboard from './views/business_dashboard';
import AdminDashboard from './views/admin_dashboard';
import Achievements from "./views/achievements";
import { customerTokens, businessTokens } from './utils/tokenManager';
import { customerApi, businessApi } from './utils/apiClient';

const SESSION_STORAGE_KEY = 'punchfast_notified_stores';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // unified auth modal
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [businessUser, setBusinessUser] = useState(null);

  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showPunchModal, setShowPunchModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState(null);
  const [nearbyStores, setNearbyStores] = useState([]);
  const [punchStore, setPunchStore] = useState(null);
  const locationCheckInterval = useRef(null);

  // Session restoration on mount
  useEffect(() => {
    // Restore customer session from JWT tokens
    if (customerTokens.hasTokens()) {
      customerApi.get('/api/session')
        .then(response => {
          if (response.ok) {
            return response.json();
          }
          throw new Error('Session invalid');
        })
        .then(data => {
          setIsLoggedIn(true);
          setCurrentUser({
            id: data.session.userId,
            username: data.session.username,
            isAdmin: data.session.isAdmin
          });
        })
        .catch((error) => {
          console.error('Error restoring customer session:', error);
          customerTokens.clearTokens();
        });
    }

    // Restore business session from JWT tokens
    if (businessTokens.hasTokens()) {
      businessApi.get('/api/business/session')
        .then(response => {
          if (response.ok) {
            return response.json();
          }
          throw new Error('Session invalid');
        })
        .then(data => {
          setBusinessUser({
            id: data.session.businessId,
            username: data.session.username
          });
        })
        .catch((error) => {
          console.error('Error restoring business session:', error);
          businessTokens.clearTokens();
        });
    }

    // Legacy: Check for old business username in localStorage
    try {
      const stored =
        localStorage.getItem('pf_business_email') ||
        localStorage.getItem('pf_business_username');

      if (stored && !businessTokens.hasTokens()) {
        // Only use legacy if no JWT tokens exist
        setBusinessUser({ username: stored });
      }
    } catch (e) {
      console.error('Error reading legacy business session:', e);
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
  };

  const handleUnifiedLoginSuccess = (userData, type, tokens) => {
    if (type === 'customer') {
      // Store customer tokens
      if (tokens?.accessToken && tokens?.refreshToken) {
        customerTokens.setTokens(tokens.accessToken, tokens.refreshToken);
      }

      handleLogin(true, userData);

      // Redirect admins to admin dashboard
      if (userData?.isAdmin) {
        window.location.href = '/admin/dashboard';
        return;
      }
    } else if (type === 'business') {
      // Store business tokens
      if (tokens?.accessToken && tokens?.refreshToken) {
        businessTokens.setTokens(tokens.accessToken, tokens.refreshToken);
      }

      handleBusinessLoginSuccess(userData);
    }
    setShowAuthModal(false);
  };

  const handleBusinessSignOut = () => {
    setBusinessUser(null);
    businessTokens.clearTokens(); // Clear JWT tokens
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

      if (newStores.length === 0) {
        return;
      }

      // Separate verified and non-verified stores
      const verifiedStores = newStores.filter(store => store.isVerified);
      const nonVerifiedStores = newStores.filter(store => !store.isVerified);

      // Prioritize punch modal for verified stores
      if (verifiedStores.length > 0) {
        setPunchStore(verifiedStores[0]);
        setShowPunchModal(true);
      } else if (nonVerifiedStores.length > 0) {
        setNearbyStores(nonVerifiedStores);
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

  // Poll for newly unlocked achievements
  useEffect(() => {
    if (!isLoggedIn || !currentUser?.id) return;

    const checkNewAchievements = async () => {
      try {
        const response = await fetch(`/api/achievements/newly-unlocked/${currentUser.id}`);
        const data = await response.json();
        if (data.achievements?.length > 0) {
          setCurrentAchievement(data.achievements[0]);
          setShowAchievementModal(true);
        }
      } catch (err) {
        console.error('Error checking for new achievements:', err);
      }
    };

    checkNewAchievements(); // Check immediately on login
    const interval = setInterval(checkNewAchievements, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isLoggedIn, currentUser?.id]);

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

  const handlePunch = (storeId) => {
    addNotifiedStores([storeId]);
  };

  const handleNotPunching = (storeId) => {
    addNotifiedStores([storeId]);
  };

  const handleClosePunchModal = () => {
    setShowPunchModal(false);
    setPunchStore(null);
  };

  const handleAchievementModalClose = async () => {
    if (currentAchievement) {
      try {
        await fetch('/api/achievements/mark-shown', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            achievementId: currentAchievement.id
          })
        });
      } catch (err) {
        console.error('Error marking achievement as shown:', err);
      }
    }
    setShowAchievementModal(false);
    setCurrentAchievement(null);
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    customerTokens.clearTokens(); // Clear JWT tokens
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
          onChangePassword={() => setShowChangePasswordModal(true)}
          onSignOut={handleSignOut}
          onBusinessSignOut={handleBusinessSignOut}
        />

        <UnifiedAuthModal
          show={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={handleUnifiedLoginSuccess}
          initialAuthType="customer"
        />

        <VisitNotificationModal
          show={showVisitModal}
          stores={nearbyStores}
          userId={currentUser?.id}
          onVisit={handleVisit}
          onNotVisiting={handleNotVisiting}
          onClose={handleCloseVisitModal}
        />

        <PunchNotificationModal
          show={showPunchModal}
          store={punchStore}
          userId={currentUser?.id}
          onPunch={handlePunch}
          onNotPunching={handleNotPunching}
          onClose={handleClosePunchModal}
        />

        <ChangePasswordModal
          show={showChangePasswordModal}
          onClose={() => setShowChangePasswordModal(false)}
          userId={currentUser?.id}
        />

        <AchievementModal
          show={showAchievementModal}
          achievement={currentAchievement}
          onClose={handleAchievementModalClose}
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
            element={
              <Achievements
                isLogin={isLoggedIn}
                user={currentUser}
                onShowAuth={() => setShowAuthModal(true)}
              />
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <AdminDashboard
                isLogin={isLoggedIn}
                user={currentUser}
                onShowAuth={() => setShowAuthModal(true)}
              />
            }
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
