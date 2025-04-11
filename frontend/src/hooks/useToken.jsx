import { useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { isTokenExpired } from '../utils/tokenUtils';
import axios from 'axios';

const useToken = (handleLogout) => {
  useEffect(() => {
    const refreshToken = async () => {
      try {
        const refresh = localStorage.getItem('refresh');
        const response = await fetch('/api/token/refresh/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh }),
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('access', data.access);

          const decoded = jwtDecode(data.access);
          const expiresIn = decoded.exp * 1000 - Date.now();
          console.log(`🔒 Access token refreshed. Expires in ${Math.round(expiresIn / 1000)} seconds`);

          scheduleRefresh(expiresIn);
        } else {
          throw new Error('Failed to refresh token');
        }
      } catch (err) {
        console.error(err);
        handleLogout();
      }
    };

    const scheduleRefresh = (expiresIn) => {
      // Refresh 60 seconds before expiry
      const refreshTime = expiresIn - 60000;
      if (refreshTime > 0) {
        setTimeout(refreshToken, refreshTime);
      } else {
        refreshToken();
      }
    };

    const checkToken = () => {
      const token = localStorage.getItem('access');
      if (token) {
        const decoded = jwtDecode(token);
        const expiresIn = decoded.exp * 1000 - Date.now();
        console.log(`🕒 Access token expires in ${Math.round(expiresIn / 1000)} seconds`);
        scheduleRefresh(expiresIn);
      }
    };

    checkToken();
  }, [handleLogout]);
};

export default useToken;