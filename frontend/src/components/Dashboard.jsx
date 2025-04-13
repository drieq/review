import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import CreateAlbumModal from './CreateAlbumModal';
import AlbumCard from "./AlbumCard";
import Sidebar from "./Sidebar";
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
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
    <div className="flex h-screen bg-gray-100">
      <Sidebar username={user?.username} onLogout={logout} />
      <div className="flex-1 overflow-auto">
        <main className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Your Albums</h1>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create New Album
            </button>
          </div>
          
          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <div className="album-container grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
            {albums.map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
                onClick={() => handleAlbumClick(album.id)}
              />
            ))}
          </div>
        </main>

        <CreateAlbumModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onAlbumCreated={handleAlbumCreated}
        />
      </div>
    </div>
  );
};

export default Dashboard;
