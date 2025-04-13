import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/axiosConfig';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('access');
      if (accessToken) {
        try {
          // Set the authorization header
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          
          // Verify the token
          const response = await api.post('/api/token/verify/', {
            token: accessToken
          });

          if (response.status === 200) {
            setIsAuthenticated(true);
            setUser({
              username: localStorage.getItem('username')
            });
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('access');
            localStorage.removeItem('refresh');
            localStorage.removeItem('username');
            api.defaults.headers.common['Authorization'] = null;
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          // Clear invalid tokens
          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
          localStorage.removeItem('username');
          api.defaults.headers.common['Authorization'] = null;
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      let response;
      if (typeof credentials === 'string') {
        // Regular login
        response = await fetch('http://localhost:8000/api/token/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            username: credentials,
            password: credentials
          }),
        });
      } else if (credentials.access_token) {
        // Google OAuth login
        response = await fetch('http://localhost:8000/api/google/login/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            access_token: credentials.access_token
          }),
        });
      } else {
        // Regular email/password login
        response = await fetch('http://localhost:8000/api/token/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            username: credentials.email,
            password: credentials.password
          }),
        });
      }

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      
      // Store the tokens
      localStorage.setItem('access', data.access);
      localStorage.setItem('refresh', data.refresh);
      localStorage.setItem('username', data.username);
      
      // Set the authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;
      
      // Update auth state
      setIsAuthenticated(true);
      setUser({
        username: data.username
      });
      
      return true;
    } catch (error) {
      console.error('Error during login:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      localStorage.removeItem('username');
      api.defaults.headers.common['Authorization'] = null;
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 