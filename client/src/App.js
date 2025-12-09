import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import UnifiedAuthModal from './components/UnifiedAuthModal';
import VisitNotificationModal from './components/VisitNotificationModal';
import PunchNotificationModal from './components/PunchNotificationModal';
import ChangePasswordModal from './components/ChangePasswordModal';
import AchievementModal from './components/AchievementModal';
import QuestionnaireModal from './components/QuestionnaireModal';
import ReportModal from './components/ReportModal';
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
import {
  calculateDistance,
  cacheNearbyStores,
  getCachedStores,
  getStartingLocation,
  addVisitDenial,
  markVisitedToday,
  findNearbyStores,
  filterEligibleStores,
  shouldRefreshStoreList
} from './utils/proximityUtils';

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
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState(null);
  const [questionnaireData, setQuestionnaireData] = useState(null);
  const [reportData, setReportData] = useState({ itemType: '', itemId: '', itemName: '' });
  const [nearbyStores, setNearbyStores] = useState([]);
  const [punchStore, setPunchStore] = useState(null);
  const locationCheckInterval = useRef(null);

  // Proximity detection state
  const [cachedStores, setCachedStores] = useState([]);
  const [startingLocation, setStartingLocation] = useState(null);
  const [lastProximityCheck, setLastProximityCheck] = useState(0);

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

  const fetchAndCacheSavedStores = async (location) => {
    if (!currentUser || !location) return;

    try {
      // Fetch user's saved stores
      const savedStoresRes = await fetch(
        `/api/saved-stores/${currentUser.id}`
      );

      if (!savedStoresRes.ok) {
        console.error('Failed to fetch saved stores');
        return;
      }

      const savedStoresData = await savedStoresRes.json();
      const savedStoreIds = savedStoresData.savedStores?.map(s => s.storeId) || [];

      // Fetch nearby stores
      const nearbyRes = await fetch(
        `/api/stores/nearby?lat=${location.lat}&lng=${location.lng}&limit=50&offset=0`
      );

      if (!nearbyRes.ok) {
        console.error('Failed to fetch nearby stores');
        return;
      }

      const nearbyData = await nearbyRes.json();
      const stores = nearbyData.stores || [];

      // Filter for only saved/liked stores
      const savedNearbyStores = stores.filter(store =>
        savedStoreIds.includes(store.id)
      );

      // Cache stores and starting location
      cacheNearbyStores(savedNearbyStores, location);
      setCachedStores(savedNearbyStores);
      setStartingLocation(location);

      console.log(`Cached ${savedNearbyStores.length} saved stores`);
    } catch (err) {
      console.error('Error fetching and caching stores:', err);
    }
  };

  const checkProximity = (location) => {
    if (!currentUser || !location) return;

    // Debounce: Only check every 5 seconds max
    const now = Date.now();
    if (now - lastProximityCheck < 5000) return;
    setLastProximityCheck(now);

    // Get cached stores (or load from localStorage if not in state)
    let stores = cachedStores;
    let starting = startingLocation;

    if (stores.length === 0) {
      stores = getCachedStores();
      starting = getStartingLocation();
      if (stores.length > 0) {
        setCachedStores(stores);
        setStartingLocation(starting);
      }
    }

    // Check if we should refresh the store list
    if (shouldRefreshStoreList(location, stores, starting)) {
      console.log('User moved beyond furthest store, refreshing...');
      fetchAndCacheSavedStores(location);
      return; // Will check proximity on next update
    }

    // Find stores within 15 meters
    const nearbyStores = findNearbyStores(location, stores);

    if (nearbyStores.length === 0) return;

    // Filter out denied and already-visited-today stores
    const eligibleStores = filterEligibleStores(nearbyStores);

    if (eligibleStores.length === 0) return;

    // Separate verified vs non-verified
    const verifiedStores = eligibleStores.filter(s => s.isVerified);
    const nonVerifiedStores = eligibleStores.filter(s => !s.isVerified);

    // Show appropriate modal
    if (verifiedStores.length > 0) {
      setPunchStore(verifiedStores[0]);
      setShowPunchModal(true);
    } else if (nonVerifiedStores.length > 0) {
      setNearbyStores(nonVerifiedStores);
      setShowVisitModal(true);
    }
  };

  const handleLocationUpdate = (position) => {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    const location = { lat: latitude, lng: longitude };

    // Check proximity using cached stores
    checkProximity(location);
  };

  const handleLocationError = (error) => {
    console.error('Location error:', error);
  };

  // Load cached stores on initial login
  useEffect(() => {
    if (!isLoggedIn || !currentUser) return;

    // Try to restore from localStorage first
    const cached = getCachedStores();
    const starting = getStartingLocation();

    if (cached.length > 0 && starting) {
      setCachedStores(cached);
      setStartingLocation(starting);
      console.log(`Restored ${cached.length} cached stores from localStorage`);
    }

    // Fetch fresh data on app open
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          fetchAndCacheSavedStores(location);
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  }, [isLoggedIn, currentUser]);

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
    // Mark stores as visited today
    storeIds.forEach(storeId => markVisitedToday(storeId));
  };

  const handleNotVisiting = (storeIds) => {
    // Add denials with 1-hour expiration
    storeIds.forEach(storeId => addVisitDenial(storeId));
  };

  const handleCloseVisitModal = () => {
    setShowVisitModal(false);
    setNearbyStores([]);
  };

  const handlePunch = (storeId) => {
    // Mark store as visited today
    markVisitedToday(storeId);
  };

  const handleNotPunching = (storeId) => {
    // Add denial with 1-hour expiration
    addVisitDenial(storeId);
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

  const handleQuestionnaireSubmit = (unlockedAchievements) => {
    // Show achievement modal if any were unlocked
    if (unlockedAchievements && unlockedAchievements.length > 0) {
      setCurrentAchievement(unlockedAchievements[0]);
      setShowAchievementModal(true);
    }
  };

  const handleQuestionnaireSkip = () => {
    // Nothing special to do on skip
  };

  const handleCloseQuestionnaireModal = () => {
    setShowQuestionnaireModal(false);
    setQuestionnaireData(null);
  };

  const handleQuestionnaireTriggered = async (visit) => {
    try {
      // Fetch the questionnaire for this visit
      const res = await fetch(`/api/questionnaire/pending?userId=${currentUser.id}&visitId=${visit.id}`);

      if (!res.ok) {
        console.error('Failed to fetch questionnaire');
        return;
      }

      const data = await res.json();

      if (data.hasQuestion) {
        setQuestionnaireData({
          storeId: data.storeId,
          storeName: data.storeName,
          question: data.question
        });
        setShowQuestionnaireModal(true);
      }
    } catch (err) {
      console.error('Error fetching questionnaire:', err);
    }
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    customerTokens.clearTokens(); // Clear JWT tokens
    if (locationCheckInterval.current) {
      clearInterval(locationCheckInterval.current);
      locationCheckInterval.current = null;
    }
  };

  const handleShowReport = (itemType, itemId, itemName) => {
    setReportData({ itemType, itemId, itemName });
    setShowReportModal(true);
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
          onQuestionnaireTriggered={handleQuestionnaireTriggered}
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

        <QuestionnaireModal
          show={showQuestionnaireModal}
          userId={currentUser?.id}
          storeId={questionnaireData?.storeId}
          storeName={questionnaireData?.storeName}
          question={questionnaireData?.question}
          onSubmit={handleQuestionnaireSubmit}
          onSkip={handleQuestionnaireSkip}
          onClose={handleCloseQuestionnaireModal}
        />

        <ReportModal
          show={showReportModal}
          onClose={() => setShowReportModal(false)}
          itemType={reportData.itemType}
          itemId={reportData.itemId}
          itemName={reportData.itemName}
        />

        <Routes>
          <Route
            path="/"
            element={
              <Home
                isLogin={isLoggedIn}
                user={currentUser}
                onShowAuth={() => setShowAuthModal(true)}
                onShowReport={handleShowReport}
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
