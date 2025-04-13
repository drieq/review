import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from "react-dropzone";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import api from '../api/axios';
import PhotoCard from './PhotoCard';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';

const AlbumDetail = () => {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [album, setAlbum] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [photoToDelete, setPhotoToDelete] = useState(null);
  const titleInputRef = useRef(null);
  const descriptionInputRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchAlbum = async () => {
      try {
        const response = await api.get(`/api/albums/${albumId}/`);
        setAlbum(response.data);
        setPhotos(response.data.photos);
        setEditedTitle(response.data.title);
        setEditedDescription(response.data.description || '');
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

  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && photoToDelete) {
        setPhotoToDelete(null);
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [photoToDelete]);

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

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = async (result) => {
    setIsDragging(false);
    
    if (!result.destination) return;

    const items = Array.from(photos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setPhotos(items);

    try {
      await api.post(`/api/albums/${albumId}/reorder-photos/`, {
        photo_orders: items.map((photo, index) => ({
          id: photo.id,
          order: index
        }))
      });
      setError(null);
    } catch (err) {
      console.error('Error updating photo order:', err);
      setError('Failed to update photo order. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar username={user?.username} onLogout={logout} />
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            <div className="max-w-7xl mx-auto">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="aspect-square bg-gray-200 rounded-lg"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar username={user?.username} onLogout={logout} />
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            <div className="max-w-7xl mx-auto">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar username={user?.username} onLogout={logout} />
      <div className="flex-1 overflow-auto">
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
            </div>

            <div className="mb-8">
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

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center mb-8 ${
                isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
            >
              <input {...getInputProps()} />
              <p className="text-gray-600">
                Drag and drop photos here, or click to select files
              </p>
            </div>
            
            <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <Droppable 
                droppableId="photos" 
                direction="horizontal" 
                isDropDisabled={false}
                isCombineEnabled={false}
                ignoreContainerClipping={false}
              >
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-fr"
                  >
                    {photos.map((photo, index) => (
                      <Draggable key={photo.id} draggableId={photo.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`aspect-square transition-transform duration-200 ${
                              snapshot.isDragging ? 'z-50' : ''
                            }`}
                            style={{
                              ...provided.draggableProps.style,
                              gridColumn: 'auto',
                              gridRow: 'auto'
                            }}
                          >
                            <PhotoCard
                              photo={photo}
                              onDelete={handleDeletePhoto}
                              isDragging={snapshot.isDragging}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {photoToDelete && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-white p-6 rounded-lg max-w-md w-full transform transition-all duration-300 scale-100">
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

export default AlbumDetail;