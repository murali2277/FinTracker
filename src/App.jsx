import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import axios from 'axios';

// Configure Axios Base URL
if (import.meta.env.VITE_API_URL) {
  axios.defaults.baseURL = import.meta.env.VITE_API_URL;
}
import { ThemeProvider } from './context/ThemeContext';

import DashboardLayout from './layouts/DashboardLayout';
import PublicLayout from './layouts/PublicLayout';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AddTransaction from './pages/AddTransaction';
import History from './pages/History';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import About from './pages/About';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Calendar from './pages/Calendar';
import Goals from './pages/Goals';
import Wallet from './pages/Wallet';

const LandingRedirectOrDashboard = () => {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : <Landing />;
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingRedirectOrDashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/landing" element={<Landing />} />

            {/* Protected Dashboard Layout Routes */}
            {/* The layout adds sidebar/navbar, so we only want this for actual app pages */}
            <Route  element={<DashboardLayout />}> 
               <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
               <Route path="/add-transaction" element={<ProtectedRoute><AddTransaction /></ProtectedRoute>} />
               <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
               <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
               <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
               <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
               <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
               <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ToastContainer position="bottom-right" theme="colored" />
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
