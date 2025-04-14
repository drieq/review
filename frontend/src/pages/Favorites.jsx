import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/axiosConfig';
import PhotoCard from '../components/PhotoCard';
import PhotoListItem from '../components/PhotoListItem';
import LoadingSpinner from '../components/LoadingSpinner';

const Favorites = () => {
  const [favoritePhotos, setFavoritePhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [photoToDelete, setPhotoToDelete] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const modalRef = useRef(null);
  const { isAuthenticated, authTokens, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  if(authLoading) {
    return <LoadingSpinner />;
  }

  useEffect(() => {
    // Retrieve the view mode from local storage
    const savedViewMode = localStorage.getItem('viewMode') || 'grid';
    setViewMode(savedViewMode);
  }, []);

  useEffect(() => {
    // Save the view mode to local storage whenever it changes
    localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (authLoading) return;

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
  }, [isAuthenticated, authTokens, authLoading, navigate]);

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
      <LoadingSpinner />
  )}

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold ml-12 sm:ml-0">Favorite Photos</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        
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
          <div className={`transition-all duration-300 ${
            viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
              : 'space-y-4'
          }`}>
            {favoritePhotos.map(photo => viewMode === 'grid' ? (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onDelete={handleDelete}
              />
            ) : (
              <PhotoListItem
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