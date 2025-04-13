import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/axiosConfig';
import PhotoCard from '../components/PhotoCard';

const Favorites = () => {
  const [favoritePhotos, setFavoritePhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [photoToDelete, setPhotoToDelete] = useState(null);
  const modalRef = useRef(null);
  const { isAuthenticated, authTokens } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !authTokens?.access) {
      navigate('/login');
      return;
    }

    const fetchFavorites = async () => {
      try {
        const response = await api.get('/api/favorites/');
        setFavoritePhotos(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching favorites:', err);
        setError('Failed to load favorites. Please try again.');
        if (err.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [isAuthenticated, authTokens, navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setPhotoToDelete(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setPhotoToDelete(null);
      }
    };

    if (photoToDelete) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [photoToDelete]);

  const handleDelete = async (photoId) => {
    setPhotoToDelete(photoId);
  };

  const confirmDeletePhoto = async () => {
    try {
      await api.delete(`/api/photos/${photoToDelete}/`);
      setFavoritePhotos(favoritePhotos.filter(photo => photo.id !== photoToDelete));
      setPhotoToDelete(null);
    } catch (err) {
      console.error('Error deleting photo:', err);
      setError('Failed to delete photo. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Favorite Photos</h1>
        </div>

        <div className="max-w-7xl mx-auto">
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {favoritePhotos.length === 0 ? (
          <div className="text-center text-gray-500">
            You haven't favorited any photos yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {favoritePhotos.map(photo => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Photo Modal */}
      {photoToDelete && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300">
          <div 
            className="bg-white p-6 rounded-lg max-w-md w-full transform transition-all duration-300 scale-100"
            ref={modalRef}
          >
            <h3 className="text-lg font-medium mb-4">Delete Photo</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this photo? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setPhotoToDelete(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeletePhoto}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Favorites; 