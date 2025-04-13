import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SessionExpiredModal = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleSessionExpired = () => {
      setIsOpen(true);
    };

    window.addEventListener('sessionExpired', handleSessionExpired);

    return () => {
      window.removeEventListener('sessionExpired', handleSessionExpired);
    };
  }, []);

  const handleGoToLogin = (e) => {
    e.preventDefault();
    setIsOpen(false);
    navigate('/');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md text-center">
        <h2 className="text-xl font-semibold mb-4">Session Expired</h2>
        <p className="mb-6">Your session has expired. Please log in again.</p>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          onClick={handleGoToLogin}
        >
          Go to Login
        </button>
      </div>
    </div>
  );
};

export default SessionExpiredModal;