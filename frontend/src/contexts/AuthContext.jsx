import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/axiosConfig';
import LoadingSpinner from '../components/LoadingSpinner';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authTokens, setAuthTokens] = useState({
    access: localStorage.getItem('access'),
    refresh: localStorage.getItem('refresh')
  });

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = authTokens?.access;
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
            setAuthTokens({ access: null, refresh: null });
            api.defaults.headers.common['Authorization'] = null;
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          // Clear invalid tokens
          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
          localStorage.removeItem('username');
          setAuthTokens({ access: null, refresh: null });
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
        response = await api.post('/api/token/', {
          username: credentials,
          password: credentials
        });
      } else if (credentials.access_token) {
        // Google OAuth login
        response = await api.post('/api/google/login/', {
          access_token: credentials.access_token
        });
      } else {
        // Regular email/password login
        response = await api.post('/api/token/', {
          username: credentials.email,
          password: credentials.password
        });
      }

      const data = response.data;
      
      // Store the tokens
      localStorage.setItem('access', data.access);
      localStorage.setItem('refresh', data.refresh);
      localStorage.setItem('username', data.username);
      
      // Update auth state
      setAuthTokens({
        access: data.access,
        refresh: data.refresh
      });
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

  const logout = () => {
    try {
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      localStorage.removeItem('username');
      setAuthTokens({ access: null, refresh: null });
      api.defaults.headers.common['Authorization'] = null;
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    isLoading ? (
      <LoadingSpinner />
    ) : (
      <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading, authTokens }}>
        {children}
      </AuthContext.Provider>
    )
  )
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 