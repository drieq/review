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
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const navigate = useNavigate();

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

  useEffect(() => {
    const token = localStorage.getItem('access');
    const storedUsername = localStorage.getItem('username');

    if (token && storedUsername) {
        const decoded = jwtDecode(token);
        const isExpired = decoded.exp * 1000 < Date.now();

        if (!isExpired) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setLoggedIn(true);
            setUsername(storedUsername);
        }
    } else {
        console.warn('🕒 Token expired on load');
    }

    setLoading(false);
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <div className="flex w-full m-0">
        {loggedIn && <Sidebar username={username} handleLogout={handleLogout} />}
        <div className="flex-grow">
          <Routes>
            <Route
              path="/"
              element={
                loggedIn ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <LoginPage setLoggedIn={setLoggedIn} setUsername={setUsername} />
                )
              }
            />
            <Route
              path="/register"
              element={
                loggedIn ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <RegistrationPage />
                )
              }
            />
            <Route
              path="/dashboard"
              element={
                loggedIn ? (
                  <Dashboard username={username} handleLogout={handleLogout} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/favorites"
              element={
                loggedIn ? (
                  <Favorites username={username} handleLogout={handleLogout} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/album/:id/"
              element={
                loggedIn ? <AlbumDetail /> : <Navigate to="/" replace />
              }
            />
            <Route
              path="/login"
              element={<Navigate to="/" replace />}
            />
          </Routes>
        </div>
      </div>
      <SessionExpiredModal isOpen={sessionExpired} onClose={handleModalClose} />
    </>
  );
}

export default AppContent;