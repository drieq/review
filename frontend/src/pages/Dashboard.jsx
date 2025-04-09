import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiGrid, FiStar, FiSettings, FiLogOut, FiUser } from 'react-icons/fi';

const Dashboard = ({ onLogout }) => {
  const [albums, setAlbums] = useState([]);
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const fetchAlbums = async () => {
    const token = localStorage.getItem('access'); // Get the token from localStorage

    if (!token) return; // Early return if no token

    try {
      const { data } = await axios.get('http://localhost:8000/api/albums/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlbums(data); // Set albums
    } catch (err) {
      console.error('Error fetching albums:', err);
    }
  };

  const handleLogoutClick = () => {
    onLogout();
    navigate('/'); // Redirect to login page after logout
  };

  useEffect(() => {
    setUsername(localStorage.getItem('username') || 'Guest'); // Get username from localStorage or default to 'Guest'
    fetchAlbums(); // Fetch albums on component mount
  }, []); // Run only once on component mount

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <h2 className="logo">PhotoDash</h2>
        <nav className="nav">
          <a href="#" className="nav-item"><FiGrid /> Dashboard</a>
          <a href="#" className="nav-item"><FiStar /> Favorites</a>
          <a href="#" className="nav-item"><FiSettings /> Settings</a>
        </nav>
        <div className="user-footer">
          <FiUser />
          <span>{username}</span>
          <button onClick={handleLogoutClick}><FiLogOut /></button>
        </div>
      </aside>

      <main className="main-content">
        <h1>Your Albums</h1>
        {albums.length === 0 ? (
          <p>You don't have any albums yet.</p>
        ) : (
          <ul className="album-list">
            {albums.map((album) => (
              <li key={album.id} className="album-item">
                <strong>{album.title}</strong>
                <p>{album.description}</p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
