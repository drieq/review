import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import RegistrationPage from './components/RegistrationPage';
import Dashboard from './components/Dashboard';
import AlbumDetail from './components/AlbumDetail';
import Favorites from './pages/Favorites';
import PrivateRoute from './components/PrivateRoute';
import Sidebar from './components/Sidebar';
import UserProfile from './components/UserProfile';
import api from './utils/axiosConfig';

import './App.css'

const AppRoutes = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [hasFetchedData, setHasFetchedData] = useState(false);


  // useEffect(() => {
  //   if (user) {
  //     setUserData(user);
  //   }
  // }, [user]);

  // useEffect(() => {
  //   console.log("isAuthenticatd:", isAuthenticated);
  //   console.log("userData:", userData);
  //   if (!hasFetchedData && !userData) {
  //     const fetchUserData = async () => {
  //       try {
  //         const response = await api.get('/api/current_user/'); // Ensure this matches your backend URL
  //         setUserData(response.data);
  //         setHasFetchedData(true);  // Set the flag to prevent further fetches

  //       } catch (error) {
  //         console.error('Error fetching user data:', error);
  //       }
  //     };

  //     fetchUserData();
  //   }
  // }, [hasFetchedData, userData, isAuthenticated]);

  useEffect(() => {
    console.log("hasFetchedData:", hasFetchedData);
    console.log("user:", user);
  
    if (user && !hasFetchedData) {
      // Prevent fetching again by setting hasFetchedData to true immediately
      setHasFetchedData(true);
  
      // Now make the request only once
      const fetchUserData = async () => {
        try {
          const response = await api.get('/api/current_user/');  // Ensure this is your correct backend URL
          setUserData(response.data);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      };
  
      fetchUserData();
    }
  }, [user, hasFetchedData]);  // Only run when 'user' or 'hasFetchedData' changes
  

  const updateUserData = async () => {
    try {
      const response = await api.get('/api/current_user/');
      setUserData(response.data);
    } catch (error) {
      console.error('Error fetching updated user data:', error);
    }
  };

  const toggleSidebar = () => {
    console.log("Toggled!");
    setSidebarOpen(!sidebarOpen);
  }

  // Routes for unauthenticated users
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  // Routes for authenticated users
  return (
    <div className="flex h-screen">
      <Sidebar username={userData?.username} avatar={userData?.avatar} userData={userData} onUserDataUpdate={updateUserData} onLogout={logout} sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Dashboard sidebarOpen={sidebarOpen} />} />
          <Route path="/albums/:albumId" element={<AlbumDetail />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/profile" element={<UserProfile userData={userData} onUserDataUpdate={updateUserData} successMessage={successMessage} setSuccessMessage={setSuccessMessage} />} />
          <Route path="/login" element={<Navigate to="/" />} />
          <Route path="/register" element={<Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      {successMessage && (
        <div
          className="fixed top-0 right-0 m-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded">
          {successMessage}
        </div>
      )}
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;