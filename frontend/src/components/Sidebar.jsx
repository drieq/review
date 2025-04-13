import { FiGrid, FiStar, FiSettings, FiLogOut, FiUser } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ username, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <aside className="sidebar h-screen sticky top-0">
      <h2 className="logo">PhotoDash</h2>
      <nav className="nav">
        <a href="#" className="nav-item"><FiGrid /> Dashboard</a>
        <a href="#" className="nav-item"><FiStar /> Favorites</a>
        <a href="#" className="nav-item"><FiSettings /> Settings</a>
      </nav>
      <div className="user-footer">
        <FiUser />
        <span>{username}</span>
        <button onClick={handleLogout}><FiLogOut /></button>
      </div>
    </aside>
  );
};

export default Sidebar;