import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import Login from './components/login';
import BusinessLogin from './components/business_login';
import Signup from './components/signup';
import BusinessSignup from './components/business_signup';
import Home from './components/home';
import BusinessHome from './components/business_home';
import NewStore from './components/new_store';
import NewRoute from './components/new_route';

const PrivateRoute = ({ isAuth, children, to = "/business/login" }) =>
  isAuth ? children : <Navigate to={to} replace />;

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Small wrappers so we can navigate after success
  const CustomerLoginPage = () => {
    const navigate = useNavigate();
    return (
      <Login
        onLoginSuccess={() => {
          setIsLoggedIn(true);
          navigate("/", { replace: true });
        }}
      />
    );
  };

  const CustomerSignupPage = () => {
    const navigate = useNavigate();
    return (
      <Signup
        onLoginSuccess={() => {
          setIsLoggedIn(true);
          navigate("/", { replace: true });
        }}
      />
    );
  };

  const BusinessLoginPage = () => {
    const navigate = useNavigate();
    return (
      <BusinessLogin
        onLoginSuccess={() => {
          setIsLoggedIn(true);
          navigate("/business/home", { replace: true });
        }}
      />
    );
  };

  const BusinessSignupPage = () => {
    const navigate = useNavigate();
    return (
      <BusinessSignup
        onLoginSuccess={() => {
          // after a pending signup, send them to business login
          navigate("/business/login", { replace: true });
        }}
      />
    );
  };

  const NewStorePage = () => {
    const navigate = useNavigate();
    return (
      <NewStore
        onLoginSuccess={() => {
          setIsLoggedIn(true);
          navigate("/", { replace: true });
        }}
      />
    );
  };

  const NewRoutePage = () => {
    const navigate = useNavigate();
    return (
      <NewRoute
        onLoginSuccess={() => {
          setIsLoggedIn(true);
          navigate("/", { replace: true });
        }}
      />
    );
  };

  return (
    <Router>
      <Routes>
        {/* Customer auth */}
        <Route path="/login" element={<CustomerLoginPage />} />
        <Route path="/signup" element={<CustomerSignupPage />} />

        {/* Business auth */}
        <Route path="/business/login" element={<BusinessLoginPage />} />
        <Route path="/business/signup" element={<BusinessSignupPage />} />

        {/* Homes */}
        <Route path="/" element={<Home isLogin={isLoggedIn} />} />
        <Route
          path="/business/home"
          element={
            <PrivateRoute isAuth={isLoggedIn} to="/business/login">
              <BusinessHome isLogin={isLoggedIn} />
            </PrivateRoute>
          }
        />

        
        <Route path="/newstore" element={<NewStorePage />} />
        <Route path="/newroute" element={<NewRoutePage />} />

       
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
