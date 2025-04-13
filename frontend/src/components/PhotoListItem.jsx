import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/axiosConfig';
import Toast from './Toast';

const PhotoListItem = ({ photo, onDelete, isDragging }) => {
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
        const response = await api.get(`/api/favorites/`);
        const isFavorited = response.data.some(favorite => favorite.id === photo.id);
        setIsFavorited(isFavorited);
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };

    checkFavoriteStatus();
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
      const newStatus = response.data.status === 'added';
      setIsFavorited(newStatus);
      setToastMessage(newStatus ? 'Photo added to favorites!' : 'Photo removed from favorites');
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
      <div className={`flex items-center p-4 bg-white rounded-lg shadow-sm transition-all duration-200 ${
        isDragging ? 'opacity-50' : 'hover:shadow-md'
      }`}>
        <div className="w-20 h-20 flex-shrink-0">
          <img
            src={getImageUrl(photo.image)}
            alt={photo.title || 'Photo'}
            className="w-full h-full object-cover rounded"
          />
        </div>
        <div className="ml-4 flex-grow">
          <h3 className="text-lg font-medium text-gray-900">{photo.title || 'Untitled'}</h3>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            {isFavorited ? (
              <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            )}
          </div>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors duration-200"
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

export default PhotoListItem; 