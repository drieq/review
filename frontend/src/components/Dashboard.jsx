import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import CreateAlbumModal from './CreateAlbumModal';
import AlbumCard from "./AlbumCard";
import { useAuth } from '../contexts/AuthContext';

const Dashboard = ( sidebarOpen ) => {
  const [albums, setAlbums] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const response = await axios.get('/api/albums/');
        setAlbums(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching albums:', err);
        setError('Failed to load albums. Please try again.');
        if (err.response?.status === 401) {
          logout();
          navigate('/login');
        }
      }
    };

    fetchAlbums();
  }, [logout, navigate]);

  const handleAlbumCreated = (newAlbum) => {
    setAlbums([newAlbum, ...albums]);
  };

  const handleAlbumClick = (albumId) => {
    navigate(`/albums/${albumId}`);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className='text-3xl font-bold ml-12 sm:ml-0'>Your Albums</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 cursor-pointer text-sm font-medium bg-blue-700 text-white rounded-md hover:bg-blue-800 transition-colors"
        >
          Create New Album
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 justify-items-center sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {albums.map(album => (
          <AlbumCard
            key={album.id}
            album={album}
            onClick={() => handleAlbumClick(album.id)}
          />
        ))}
      </div>

      <CreateAlbumModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onAlbumCreated={handleAlbumCreated}
      />
    </div>
  );
};

export default Dashboard;
