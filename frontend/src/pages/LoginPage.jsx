import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const LoginPage = ( { setLoggedIn } ) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    axios
      .post('http://localhost:8000/api/token/', { username, password })
      .then((response) => {
        const { access, refresh } = response.data;
        localStorage.setItem('access', access); // Store the token
        localStorage.setItem('username', username); // Store the username
        setLoggedIn(true); // Update login state
        navigate('/dashboard'); // Redirect to dashboard
      })
      .catch((error) => {
        console.error('Login error:', error);
      });

    // // Assuming you will send the login request to your API here.
    // // For now, mock a successful login and redirect to dashboard.
    // localStorage.setItem('access', 'your-jwt-token');  // Store the token (mocked)

    // setLoggedIn(true);

    // Redirect to the dashboard
    navigate('/dashboard');
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default LoginPage;