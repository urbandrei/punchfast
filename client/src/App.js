import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/login';
import BusinessLogin from './components/business_login';
import Signup from './components/signup';
import BusinessSignup from './components/business_signup';
import Home from './components/home';
import BusinessHome from './components/business_home';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = (status) => {
    setIsLoggedIn(status);
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login onLoginSuccess={() => handleLogin(true)} />} />
        <Route path="/signup" element={<Signup onLoginSuccess={() => handleLogin(true)} />} />
        <Route path="/business/login" element={<BusinessLogin onLoginSuccess={() => handleLogin(true)} />} />
        <Route path="/business/signup" element={<BusinessSignup onLoginSuccess={() => handleLogin(true)} />} />
        <Route path="/" element={<Home user={{ isLogin: isLoggedIn }} />} />
        <Route path="/business/home" element={<BusinessHome business={{ isLogin: isLoggedIn }} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;