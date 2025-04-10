// hooks/useToken.jsx
import { useEffect } from 'react';
import { jwtDecode } from "jwt-decode";

const useToken = (handleLogout, navigate) => {
  useEffect(() => {
    const token = localStorage.getItem('access');
    if (!token) {
      handleLogout();
      return;
    }

    const decodedToken = jwtDecode(token);
    const expirationTime = decodedToken?.exp * 1000; // Decode and check expiration time

    if (expirationTime < Date.now()) {
      handleLogout();
      navigate('/');  // Redirect to login if token expired
    }
  }, [handleLogout, navigate]);
};

export default useToken;