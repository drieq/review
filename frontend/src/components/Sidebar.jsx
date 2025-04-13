import { FiGrid, FiStar, FiSettings, FiLogOut, FiUser } from 'react-icons/fi';
import { useNavigate, NavLink } from 'react-router-dom';
import logo from '../assets/logo.svg';

const Sidebar = ({ username, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <aside 
      className="sidebar h-screen sticky top-0 left-0 z-40 w-64 transition-transform -translate-x-full sm:translate-x-0"
      id="default-sidebar"
    >
      <div className="h-screen flex flex-col justify-between border-r border-gray-200 px-3 py-4 overflow-y-auto bg-white dark:bg-gray-800">
        <img src={logo} alt="Logo" className="w-32 h-16 mx-auto mb-4" />
        {/* <h2 className="logo">Photodash</h2> */}
        <nav className="mt-auto mb-auto">
          <ul className="space-y-2 font-medium">
            <li>
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center p-2 rounded-lg group transition-colors ${
                  isActive
                    ? 'text-indigo-600 bg-gray-100 dark:text-white dark:bg-gray-700'
                    : 'text-gray-900 dark:text-white hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-700'
                }`
              }
            >
                {({ isActive }) => (
                <>
                  <div className="w-5 h-5">
                    <svg
                      className={`shrink-0 w-full h-full transition duration-75 ${
                        isActive
                          ? 'text-indigo-600 dark:text-white'
                          : 'text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-white'
                      }`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <g transform="scale(0.85) translate(2, 2)">
                      <path d="M8.19 0H2.48A2.48 2.48 0 0 0 0 2.48v5.71A2.48 2.48 0 0 0 2.48 10.67h5.71A2.48 2.48 0 0 0 10.67 8.19V2.48A2.48 2.48 0 0 0 8.19 0Zm12.57 0h-5.71A2.48 2.48 0 0 0 12.57 2.48v5.71a2.48 2.48 0 0 0 2.48 2.48h5.71A2.48 2.48 0 0 0 24 8.19V2.48A2.48 2.48 0 0 0 20.76 0ZM8.19 13.33H2.48A2.48 2.48 0 0 0 0 15.81v5.71A2.48 2.48 0 0 0 2.48 24h5.71a2.48 2.48 0 0 0 2.48-2.48v-5.71a2.48 2.48 0 0 0-2.48-2.48Zm12.57 0h-5.71a2.48 2.48 0 0 0-2.48 2.48v5.71A2.48 2.48 0 0 0 15.05 24h5.71A2.48 2.48 0 0 0 24 21.52v-5.71a2.48 2.48 0 0 0-2.48-2.48Z" />
                    </g>
                  </svg>
                </div>
                <span className="flex-1 ms-3 whitespace-nowrap">Dashboard</span>
                </>
              )}
            </NavLink>
            </li>
            <li>
            <NavLink
              to="/favorites"
              className={({ isActive }) =>
                `flex items-center p-2 rounded-lg group transition-colors ${
                  isActive
                    ? 'text-indigo-600 bg-gray-100 dark:text-white dark:bg-gray-700'
                    : 'text-gray-900 dark:text-white hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-700'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="w-5 h-5">
                    <svg
                      className={`shrink-0 w-full h-full transition duration-75 ${
                        isActive
                          ? 'text-indigo-600 dark:text-white'
                          : 'text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-white'
                      }`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="flex-1 ms-3 whitespace-nowrap">Favorites</span>
                </>
              )}
            </NavLink>
            </li>
            <li>
              <a 
                href="#" 
                className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-700 group">
                  <div className="w-5 h-5">
                    <svg
                      className="shrink-0 w-full h-full text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                    <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 0 0-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 0 0-2.282.819l-.922 1.597a1.875 1.875 0 0 0 .432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 0 0 0 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 0 0-.432 2.385l.922 1.597a1.875 1.875 0 0 0 2.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 0 0 2.28-.819l.923-1.597a1.875 1.875 0 0 0-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 0 0 0-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 0 0-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 0 0-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 0 0-1.85-1.567h-1.843ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="flex-1 ms-3 whitespace-nowrap">Settings</span>
                </a>
            </li>
          </ul>
        </nav>
        <div className="p-4 flex items-center mt-auto space-x-3">
          <img
          className="h-10 w-10 rounded-full object-cover"
          src="https://images.unsplash.com/photo-1502685104226-ee32379fefbe"
          alt="User avatar"
          />
          <span className="text-sm font-medium text-gray-900">{username}</span>
          <button 
            onClick={handleLogout}
            className="flex items-end ms-auto p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
          >
              <FiLogOut />
            </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;