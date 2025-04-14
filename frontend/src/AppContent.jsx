// FILE PROBABLY UNUSED

import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import api from './utils/axiosConfig';

import useToken from './hooks/useToken';
import Dashboard from './components/Dashboard';
import LoginPage from './components/LoginPage';
import RegistrationPage from './components/RegistrationPage';
import AlbumDetail from './components/AlbumDetail';
import Sidebar from './components/Sidebar';
import LoadingSpinner from './components/LoadingSpinner';
import SessionExpiredModal from './components/SessionExpiredModal';
import Favorites from './pages/Favorites';

function AppContent() {
  const [loggedIn, setLoggedIn] = useState(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('access');
    const storedUsername = localStorage.getItem('username');

    if (token && storedUsername) {
      try {
        const decoded = jwtDecode(token);
        const isExpired = decoded.exp * 1000 < Date.now();

        if (!isExpired) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setLoggedIn(true);
            setUsername(storedUsername);
        } else {
          console.warn("Token is expired");
          setLoggedIn(false);
          setLoading(true);
        }
    } catch (err) {
      console.error("Failed to decode token", err);
      setLoggedIn(false);
      setLoading(true);
    }
  } else {
      console.warn('🕒 Token expired on load');
      setLoggedIn(false);
      setLoading(true);
    }

    setLoading(false);
  }, []);

  const toggleSidebar = () => {
    console.log("Toggled!");
    setSidebarOpen(!sidebarOpen);
  }

  const access = localStorage.getItem('access');
  if (access) {
    api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
  }

  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('username');
    localStorage.removeItem('refresh');
    delete api.defaults.headers.common['Authorization'];
    setLoggedIn(false);
    setUsername('');
  };

  useToken({ onSessionExpired: () => setSessionExpired(true) });

  const handleModalClose = () => {
    setSessionExpired(false);
    navigate('/');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (loggedIn === null) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <div className="flex w-full relative">
        {loggedIn && (
          <>
          {console.log("sidebarOpen in AppContent:", sidebarOpen)}
          {console.log("toggleSidebar in AppContent:", typeof toggleSidebar)}
          <Sidebar
            username={username}
            onLogout={handleLogout}
            sidebarOpen={sidebarOpen}
            toggleSidebar={toggleSidebar}
          />
          </>
        )}
        <div className={`flex-grow transition-all duration-300 ${sidebarOpen ? 'sm:ml-64' : ''}`}>
          <Routes>
            <Route
              path="/"
              element={
                loggedIn ? (
                  <Dashboard username={username} handleLogout={handleLogout} />
                ) : (
                  <LoginPage setLoggedIn={setLoggedIn} />
                )
              }
            />
            {/* <Route
              path="/login"
              element={
                loggedIn ? (
                  <Navigate to="/" replace />
                ) : (
                  <LoginPage setLoggedIn={setLoggedIn} setUsername={setUsername} />
                )
              }
            /> */}
            <Route
              path="/register"
              element={
                loggedIn ? <Navigate to="/" replace /> : <RegistrationPage />
              }
            />
            <Route
              path="/favorites"
              element={
                loggedIn ? (
                  <Favorites username={username} handleLogout={handleLogout} />
                ) : (
                  <LoginPage setLoggedIn={setLoggedIn} />
                )
              }
            />
            <Route
              path="/album/:id/"
              element={loggedIn ? <AlbumDetail /> : <LoginPage setLoggedIn={setLoggedIn} />}
            />
          </Routes>
        </div>
      </div>
      <SessionExpiredModal isOpen={sessionExpired} onClose={handleModalClose} />
    </>
  );
}

export default AppContent;