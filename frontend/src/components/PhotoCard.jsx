import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/axiosConfig';
import Toast from './Toast';

const PhotoCard = ({ photo, onDelete, isDragging }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      try {
        const response = await api.get(`/api/photos/${photo.id}/`);
        setIsFavorited(response.data.is_favorited);
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };

    checkFavoriteStatus();
    console.log('Photo ID:', photo.id);
    console.log('Is favorited:', isFavorited);
  }, [photo.id]);

  const getImageUrl = (image) => {
    if (!image) return '';
    if (image.startsWith('http')) return image;
    return `http://localhost:8000${image}`;
  };

  const handleDownload = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(photo.image);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = photo.title || 'photo.jpg';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Error downloading photo:', error);
    }
  };

  const handleDeleteClick = () => {
    setIsDropdownOpen(false);
    onDelete(photo.id);
  };

  const handleFavorite = async () => {
    try {
      const response = await api.post(`/api/photos/${photo.id}/toggle-favorite/`);
      const newFavoriteStatus = response.data.is_favorited;

      console.log('API response:', response.data);
      
      setIsFavorited(newFavoriteStatus);

      if (response.data.status === 'added') {
        setToastMessage('Photo added to favorites');
      } else if (response.data.status === 'removed') {
        setToastMessage('Photo removed from favorites');
      } else {
        setToastMessage('Failed to update favorite status');
      };

      console.log('SetToastMessage:', toastMessage);

      setShowToast(true);
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setToastMessage('Failed to update favorite status');
      setShowToast(true);
    }
  };

  return (
    <>
      {showToast && (
        <Toast
          message={toastMessage}
          type="success"
          duration={3000}
          onClose={() => setShowToast(false)}
        />
      )}
      <div className={`relative aspect-square w-full transition-transform duration-200 ${
        isDragging ? 'scale-95 opacity-50' : 'hover:scale-[1.02]'
      }`}>
        <div className="w-full h-full overflow-hidden rounded-lg bg-gray-200">
          <img
            src={getImageUrl(photo.image)}
            alt={photo.title || 'Photo'}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors duration-200"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                <div className="py-1">
                  <a
                    href="#"
                    onClick={handleDownload}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                  >
                    Download
                  </a>
                  <button
                    onClick={handleFavorite}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                  >
                    {isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
                  </button>
                  <button
                    onClick={handleDeleteClick}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors duration-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PhotoCard; 