import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../utils/axiosConfig';

import SessionExpiredModal from '../components/SessionExpiredModal';

const useToken = ({onSessionExpired}) => {

  useEffect(() => {
    const refreshToken = async () => {
      try {
        const refresh = localStorage.getItem('refresh');

        if (!refresh) {
          throw new Error('No refresh token found');
        }

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

        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        delete api.defaults.headers.common['Authorization'];
        setLoggedIn(false);
        setUsername('');

        if (onSessionExpired) onSessionExpired();
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

      if (!token) {
        if (onSessionExpired) onSessionExpired();
        return;
      }

      const decoded = jwtDecode(token);
      const expiresIn = decoded.exp * 1000 - Date.now();

      if (expiresIn < 0) {
        if (onSessionExpired) onSessionExpired();
      } else {
        console.log(`🕒 Access token expires in ${Math.round(expiresIn / 1000)} seconds`);
        scheduleRefresh(expiresIn);
      }
    };

    checkToken();
  }, [onSessionExpired]);
};

export default useToken;