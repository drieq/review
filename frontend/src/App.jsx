import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

import useToken from './hooks/useToken'; // <-- Import useToken hook

import Dashboard from './components/Dashboard';  // <-- Import Dashboard page
import LoginPage from './components/LoginPage';  // <-- Import LoginPage
import AlbumDetail from './components/AlbumDetail'; // <-- Import AlbumDetail page
import Sidebar from './components/Sidebar'; // <-- Import Sidebar component
import LoadingSpinner from './components/LoadingSpinner';

import './App.css'

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('username');
    localStorage.removeItem('refresh');
    setLoggedIn(false);
    setUsername('');
  };

  useToken(handleLogout);

  useEffect(() => {
    const token = localStorage.getItem('access');
    const storedUsername = localStorage.getItem('username');

    if (token && storedUsername) {
      setLoggedIn(true);
      setUsername(storedUsername);
    }

    setLoading(false);
    }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <Router>
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
              path="/album/:id/" 
              element={
                loggedIn ? (
                <AlbumDetail />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}


export default App;