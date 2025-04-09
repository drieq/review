import { use, useEffect, useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import Dashboard from './pages/Dashboard';  // <-- Import Dashboard page
import LoginPage from './pages/LoginPage';  // <-- Assuming you already have this page

import './App.css'
import axios from 'axios'

import Login from './Login'

import { FiGrid, FiStar, FiSettings, FiLogOut, FiUser } from 'react-icons/fi';

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access');
    const storedUsername = localStorage.getItem('username');
    if (token && storedUsername) {
      setLoggedIn(true);
      setUsername(storedUsername);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('username');
    localStorage.removeItem('refresh');
    setLoggedIn(false);
    setUsername('');
  };

  return (
    <Router>
      <Routes>
        {/* Show LoginPage if user is not logged in */}
        <Route path="/" element={loggedIn ? <Dashboard username={username} onLogout={handleLogout} /> : <LoginPage setLoggedIn={setLoggedIn} />} />
        
        {/* Only show Dashboard if logged in */}
        <Route path="/dashboard" element={loggedIn ? <Dashboard username={username} onLogout={handleLogout} /> : <LoginPage setLoggedIn={setLoggedIn} />} />
      </Routes>
    </Router>
  );
}


export default App;