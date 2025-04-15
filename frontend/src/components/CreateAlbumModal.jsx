import React, { useState, useRef, useEffect } from 'react';
import api from '../utils/axiosConfig';
import { useNavigate } from 'react-router-dom';
import TagCreator from './TagCreator';

const CreateAlbumModal = ({ isOpen, onClose, onAlbumCreated }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const modalRef = useRef(null);
  

  const [newTag, setNewTag] = useState(null);
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTagIds, setSelectedTagIds] = useState([]);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await api.get('/api/tags/');
        setAvailableTags(response.data);
      } catch (err) {
        console.error('Error fetching tags:', err);
      }
    };

    if (isOpen) {
      fetchTags();
    }
  }, [isOpen]);

  const handleTagAdd = (tagId) => {
    console.log("Adding tag ID (no toggle):", tagId);
    setSelectedTagIds((prev) => {
        // Only add if not already present
        if (!prev.includes(tagId)) {
            const newSelection = [...prev, tagId];
            console.log("New selection after add:", newSelection);
            return newSelection;
        }
        return prev;
    });
  };

  const handleTagToggle = (tagId) => {
    console.log("Toggling tag ID:", tagId);
    setSelectedTagIds((prev) => {
        const newSelection = prev.includes(tagId) 
            ? prev.filter((id) => id !== tagId) 
            : [...prev, tagId];
        console.log("New selection after toggle:", newSelection);
        return newSelection;
    });
  };

  const handleTagCreation = (createdTag) => {
    console.log("New tag created:", createdTag);
    
    // Update availableTags
    setAvailableTags((prevTags) => {
        const updatedTags = [...prevTags, createdTag];
        console.log("Updated available tags:", updatedTags);
        return updatedTags;
    });
    
    // Add to selectedTagIds
    setSelectedTagIds((prevIds) => {
        const updatedIds = [...prevIds, createdTag.id];
        console.log("Updated selected tag IDs:", updatedIds);
        return updatedIds;
    });
  };

  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscKey);
      window.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      window.removeEventListener('keydown', handleEscKey);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const currentSelectedIds = [...selectedTagIds];
    console.log("Current selected IDs before submission:", currentSelectedIds);
  
    try {
      // Correctly format the tags data for the API
      const tagsData = availableTags
        .filter((tag) => selectedTagIds.includes(tag.id))
        .map((tag) => ({ name: tag.name }));

      console.log("Tags data to send:", tagsData);
  
      const response = await api.post('/api/albums/', {
        title,
        description,
        tags: tagsData  // Send the properly formatted tag objects
      });
  
      onAlbumCreated(response.data);
      setTitle('');
      setDescription('');
      setSelectedTagIds([]);
      onClose();
      navigate(`/albums/${response.data.id}`);
    } catch (err) {
      console.error('Error creating album:', err);
      setError(err.response?.data?.error || 'Failed to create album');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div 
        className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md"
        ref={modalRef}
      >
        <h2 className="text-xl font-semibold mb-4">Create New Album</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label 
              htmlFor="title" 
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
              required
            />
          </div>
          <div>
            <label 
              htmlFor="description" 
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
              rows={3}
            />
          </div>

          <TagCreator
            availableTags={availableTags}
            selectedTagIds={selectedTagIds}  // Ensure this is passed correctly and directly reflects the updated state
            onTagCreated={handleTagCreation}
            onTagSelect={handleTagToggle}
            onTagAdd={handleTagAdd}
          />

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Create Album
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAlbumModal; 