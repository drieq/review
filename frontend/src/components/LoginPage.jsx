import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const LoginPage = ( { setLoggedIn, setUsername } ) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous error

    try {
      const response = await axios.post('http://localhost:8000/api/token/', {
        username: usernameInput,
        password,
      });
      const { access, refresh } = response.data;

      localStorage.setItem('access', access);
      localStorage.setItem('refresh', refresh);
      localStorage.setItem('username', usernameInput);

      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`; 

      setLoggedIn(true);
      setUsername(usernameInput);
      navigate('/dashboard');

    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          value={usernameInput}
          onChange={(e) => setUsernameInput(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="error">{error}</p>}
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default LoginPage;