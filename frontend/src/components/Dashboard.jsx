
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../api/axios';

import AlbumCard from "./AlbumCard";
import AlbumDetail from "./AlbumDetail";
import Sidebar from "./Sidebar";

const Dashboard = ({ username, handleLogout }) => {
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAlbums = async () => {
      const accessToken = localStorage.getItem('access');
    
      if (!accessToken) {
        navigate('/'); // Redirect to login if no token
        return;
      }
    
      try {
        const response = await axios.get('http://localhost:8000/api/albums/', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setAlbums(response.data);
      } catch (err) {
        console.error('Error fetching albums:', err);

        if (err.response && err.response.status === 401) {
          refreshToken();
        }
      }
    };

    fetchAlbums(); 
  }, [navigate]); 

  const refreshToken = async () => {
    const refreshToken = localStorage.getItem('refresh');
    if (!refreshToken) {
      handleLogout();
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/api/token/refresh/', {
        refresh: refreshToken,
      });
      const { access, refresh } = response.data;

      localStorage.setItem('access', access);
      localStorage.setItem('refresh', refresh);
      fetchAlbums(); // Retry fetching albums after refreshing token
    } catch (err) {
      console.error('Error refreshing token:', err);
      handleLogout(); // Logout if refresh token fails
    }
  };

  const fetchAlbumDetails = (albumId) => {
    const album = albums.find((album) => album.id === albumId);  // Get selected album by ID
    setSelectedAlbum(album);  // Set the selected album state
    navigate(`/album/${albumId}/`);  // Navigate to album detail page
  };


  return (
    <div className="dashboard">
      <main className="main-content p-6">
          <h1 className="text-3xl font-bold mb-6">Your Albums</h1>  
          <div className="album-container grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 p-4">
            {albums.map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
                onClick={() => handleAlbumClick(album.id)}  // Pass the album ID to fetchAlbumDetails
              />
            ))}
          </div>
      </main>
    </div>
  );
};

export default Dashboard;
