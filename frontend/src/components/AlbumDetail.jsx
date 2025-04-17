import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from "react-dropzone";
import PhotoCard from './PhotoCard';
import PhotoListItem from './PhotoListItem';
import AlbumTagManager from './AlbumTagManager';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

const AlbumDetail = () => {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [album, setAlbum] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [photoToDelete, setPhotoToDelete] = useState(null);
  const [showDeleteAlbumModal, setShowDeleteAlbumModal] = useState(false);
  const [editedTags, setEditedTags] = useState([]);
  const [albumTags, setAlbumTags] = useState([]);
  const titleInputRef = useRef(null);
  const descriptionInputRef = useRef(null);
  const modalRef = useRef(null);
  const deleteAlbumModalRef = useRef(null);
  const accessLinkModalRef = useRef(null);
  const [clientSelections, setClientSelections] = useState({});
  const [selectedClient, setSelectedClient] = useState("");
  const [clientNames, setClientNames] = useState([]);
  const [showAccessLinkModal, setShowAccessLinkModal] = useState(false);

  const [newLink, setNewLink] = useState({
    client_name: "",
    email: "",
    can_download: false,
    max_selections: "",
    expires_at: "",
    welcome_message: "",
    notify_on_selection: true,
    password: "",
  });

  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('viewMode') || 'grid';
  });

  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (album && album.tags) {
      setAlbumTags(album.tags);
    }
  }, [album]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchAlbum = async () => {
      try {
        const response = await api.get(`/api/albums/${albumId}/`);
        console.log(response)
        setAlbum(response.data);
        setPhotos(response.data.photos);
        setEditedTitle(response.data.title);
        setEditedDescription(response.data.description || '');
        setEditedTags(response.data.tags || []);
        setClientSelections(response.data.client_selections || {});

        if (response.data.access_links && Array.isArray(response.data.access_links)) {
          setClientNames(response.data.access_links);
          console.log(clientNames);
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching album:', err);
        setError('Failed to load album. Please try again.');
        if (err.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (albumId) {
      fetchAlbum();
    }
  }, [albumId, isAuthenticated, navigate]);

  const getFilteredPhotos = () => {
    if (!selectedClient) return photos;

    const selectedClientLink = clientNames.find(link => link.id === selectedClient);
    if (!selectedClientLink) return [];

    const clientName = selectedClientLink.client_name;
    const selectedPhotoIds = clientSelections[clientName] || [];

    return photos.filter(photo => selectedPhotoIds.includes(photo.id));
  };

  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        if (photoToDelete) {
          setPhotoToDelete(null);
        }
        if (showDeleteAlbumModal) {
          setShowDeleteAlbumModal(false);
        }
        if (showAccessLinkModal) {
          setShowAccessLinkModal(false);
        }
      }
    };

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setPhotoToDelete(null);
      }
      if (deleteAlbumModalRef.current && !deleteAlbumModalRef.current.contains(e.target)) {
        setShowDeleteAlbumModal(false);
      }
      if (accessLinkModalRef.current && !accessLinkModalRef.current.contains(e.target)) {
        setShowAccessLinkModal(false);
      }
    };

    if (photoToDelete || showDeleteAlbumModal || showAccessLinkModal) {
      window.addEventListener('keydown', handleEscKey);
      window.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      window.removeEventListener('keydown', handleEscKey);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [photoToDelete, showDeleteAlbumModal, showAccessLinkModal]);

  const handleTitleChange = (e) => {
    setEditedTitle(e.target.value);
  };

  const handleDescriptionChange = (e) => {
    setEditedDescription(e.target.value);
  };

  const handleSave = async () => {

    try {
      const response = await api.patch(`/api/albums/${albumId}/`, {
        title: editedTitle,
        description: editedDescription,
        tags: editedTags.map(tag => ({ name: tag.name })), 
      });
      setAlbum(response.data);
      setIsEditingTitle(false);
      setIsEditingDescription(false);
      setError(null);
    } catch (err) {
      console.error('Error updating album:', err);
      setError('Failed to update album. Please try again.');
    }
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  const handleTitleBlur = () => {
    handleSave();
  };

  const handleDescriptionBlur = () => {
    handleSave();
  };

  const onDrop = async (acceptedFiles) => {
    const formData = new FormData();
    acceptedFiles.forEach((file) => {
      formData.append("images", file);
    });

    try {
      const response = await api.post(
        `/api/albums/${albumId}/upload/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

      const updatedPhotos = response.data.map((photo) => {
        if (photo.image && !photo.image.startsWith("http")) {
          photo.image = `http://localhost:8000${photo.image}`;
        }
        return photo;
      });

      setPhotos((prev) => [...prev, ...updatedPhotos]);
      setError(null);
    } catch (error) {
      console.error("Error uploading photos:", error);
      setError("Failed to upload photos. Please try again.");
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: "image/*",
  });

  const handleDeletePhoto = async (photoId) => {
    setPhotoToDelete(photoId);
  };

  const confirmDeletePhoto = async () => {
    try {
      await api.delete(`/api/photos/${photoToDelete}/`);
      setPhotos(photos.filter(photo => photo.id !== photoToDelete));
      setPhotoToDelete(null);
      setError(null);
    } catch (err) {
      console.error('Error deleting photo:', err);
      setError('Failed to delete photo. Please try again.');
    }
  };

  const handleDeleteAlbum = async () => {
    try {
      await api.delete(`/api/albums/${albumId}/`);
      navigate('/');
    } catch (err) {
      console.error('Error deleting album:', err);
      setError('Failed to delete album. Please try again.');
      setShowDeleteAlbumModal(false);
    }
  };

  const handleNewLinkChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewLink({
      ...newLink,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const createAccessLink = async (e) => {
    e.preventDefault();
    try {
      // Format the data for the API
      const linkData = {
        ...newLink,
        album: albumId,
        // Convert empty string to null for optional fields
        email: newLink.email || null,
        max_selections: newLink.max_selections ? parseInt(newLink.max_selections) : null,
        expires_at: newLink.expires_at || null
      };
  
      console.log("Sending data to API:", linkData); // Debug what's being sent
      
      const response = await api.post('/api/client-access/auth/', linkData);
      console.log("API response:", response.data); // Debug the response
      
      // Update the local state with the new link
      setClientNames(prev => [...prev, response.data]);
      
      // Reset form and close modal
      setNewLink({
        client_name: "",
        email: "",
        can_download: false,
        max_selections: "",
        expires_at: "",
        welcome_message: "",
        notify_on_selection: true,
        password: "",
      });
      setShowAccessLinkModal(false);
      
      // Optional: Display success message
      setError(null);
    } catch (err) {
      console.error('Error creating access link:', err);
      if (err.response) {
        // Log the detailed error response from the server
        console.error('Server error details:', err.response.data);
        setError(`Failed to create access link: ${err.response.data.detail || 'Server error'}`);
      } else {
        setError('Failed to create access link. Please try again.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-center rounded-lg cursor-pointer text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
          >
            <svg className="rotate-180 w-3.5 h-3.5 me-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
            </svg>
            Back to Albums
          </button>
          <button
              onClick={() => setShowAccessLinkModal(true)}
              className="px-4 py-2 cursor-pointer text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Share with Client
            </button>
          <button
            onClick={() => setShowDeleteAlbumModal(true)}
            className="px-4 py-2 cursor-pointer text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Delete Album
          </button>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <div className="flex">
            <div className="mb-8 w-1/2 pe-3">
              <div className="space-y-4">
                {isEditingTitle ? (
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={editedTitle}
                    onChange={handleTitleChange}
                    onKeyDown={handleTitleKeyDown}
                    onBlur={handleTitleBlur}
                    className="w-full p-2 text-3xl font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none focus:ring-0"
                    autoFocus
                  />
                ) : (
                  <h1
                    className="text-3xl font-bold text-gray-900 cursor-pointer hover:bg-gray-100 p-2 rounded border-b-2 border-transparent hover:border-gray-300"
                    onClick={() => setIsEditingTitle(true)}
                  >
                    {album?.title}
                  </h1>
                )}

                {isEditingDescription ? (
                  <textarea
                    ref={descriptionInputRef}
                    value={editedDescription}
                    onChange={handleDescriptionChange}
                    onBlur={handleDescriptionBlur}
                    className="w-full p-2 text-gray-600 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                    rows="3"
                    autoFocus
                  />
                ) : (
                  <p
                    className="text-gray-600 cursor-pointer hover:bg-gray-100 p-2 rounded border border-transparent hover:border-gray-300 min-h-[80px]"
                    onClick={() => setIsEditingDescription(true)}
                  >
                    {album?.description || 'Click to add a description'}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col w-1/2">
              {/* Album Tag Manager */}
              <div className="mb-8">
                <AlbumTagManager 
                    albumId={albumId} 
                    initialTags={album.tags || []} 
                    onTagsUpdated={(newTags) => {
                      setAlbumTags(newTags);
                      setEditedTags(newTags);
                      setAlbum(prev => ({ ...prev, tags: newTags }));
                    }}
                />
              </div>
              <div
                {...getRootProps()}
                className={`w-full flex items-center justify-center border-2 border-dashed rounded-lg p-8 text-center mb-8 ${
                  isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
              >
                <input {...getInputProps()} />
                <p className="text-gray-600 opacity-50 w-full">
                  Drag and drop photos here, or click to select files
                </p>
              </div>
            </div>  
          </div>






        </div>

        {/* Client Filter Buttons */}
        {clientNames.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 mt-auto align-self-end">
            <span>Available selections:</span>
            <button
              className={`px-3 py-1 rounded-full text-sm ${
                selectedClient ? 'bg-gray-100 text-gray-700' : 'bg-blue-600 text-white'
              }`}
              variant={selectedClient ? "outline" : "default"}
              onClick={() => setSelectedClient(null)}
            >
              All
            </button>
            {clientNames.map((link) => (
              <button
                key={link.id}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedClient === link.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
                }`}
                onClick={() => setSelectedClient(link.id)}
              >
                {link.client_name || "Unnamed Client"}
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center mb-6">

          <div className="flex items-center">
            <h2 className="text-2xl font-semibold">Photos</h2>
            {photos.length > 0 && (
                <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                  {getFilteredPhotos().length}
                </span>
              )}
            </div>


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

        {photos.length === 0 ? (
          <div className="text-center text-gray-500">
            No photos in this album yet.
          </div>
        ) : (
          <div className={`transition-all duration-300 ${
            viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
              : 'space-y-4'
          }`}>
              {console.log("Function:", getFilteredPhotos())}  {/* Add this to check if the function is triggered */}
            {getFilteredPhotos().map(photo => viewMode === 'grid' ? (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onDelete={handleDeletePhoto}
              />
            ) : (
              <PhotoListItem
                key={photo.id}
                photo={photo}
                onDelete={handleDeletePhoto}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
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

      {/* Delete Album Modal */}
      {showDeleteAlbumModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div
            ref={deleteAlbumModalRef}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Delete Album
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this album? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteAlbumModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAlbum}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    {showAccessLinkModal && (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
        <div
          ref={accessLinkModalRef}
          className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 overflow-y-auto max-h-[90vh]"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Share Album with Client
          </h3>
          
          <form onSubmit={createAccessLink} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Name*
              </label>
              <input
                type="text"
                name="client_name"
                value={newLink.client_name}
                onChange={handleNewLinkChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email (optional)
              </label>
              <input
                type="email"
                name="email"
                value={newLink.email}
                onChange={handleNewLinkChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="client@example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password (optional)
              </label>
              <input
                type="password"
                name="password"
                value={newLink.password}
                onChange={handleNewLinkChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Leave blank for no password"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Welcome Message
              </label>
              <textarea
                name="welcome_message"
                value={newLink.welcome_message}
                onChange={handleNewLinkChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Welcome! Please select your favorite photos..."
              ></textarea>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:space-x-4">
              <div className="w-full sm:w-1/2 mb-3 sm:mb-0">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Selections
                </label>
                <input
                  type="number"
                  name="max_selections"
                  value={newLink.max_selections}
                  onChange={handleNewLinkChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Unlimited"
                />
              </div>
              
              <div className="w-full sm:w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expires At
                </label>
                <input
                  type="datetime-local"
                  name="expires_at"
                  value={newLink.expires_at}
                  onChange={handleNewLinkChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="can_download"
                name="can_download"
                checked={newLink.can_download}
                onChange={handleNewLinkChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="can_download" className="text-sm text-gray-700">
                Allow client to download photos
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="notify_on_selection"
                name="notify_on_selection"
                checked={newLink.notify_on_selection}
                onChange={handleNewLinkChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="notify_on_selection" className="text-sm text-gray-700">
                Notify me when client makes selections
              </label>
            </div>
            
            <div className="flex justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setShowAccessLinkModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Create Link
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
  );
};

export default AlbumDetail;