import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import api from '../utils/axiosConfig'; // Assuming you're using the same api utility

const AlbumTagManager = ({ albumId, initialTags = [], onTagsUpdated }) => {
    const [tagName, setTagName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [filteredTags, setFilteredTags] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedTags, setSelectedTags] = useState(initialTags);
    const [availableTags, setAvailableTags] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasInitializedTags, setHasInitializedTags] = useState(false);

    const inputRef = useRef(null);
    const dropdownRef = useRef(null);

    // Fetch all available tags when component mounts
    useEffect(() => {
        const fetchTags = async () => {
            try {
                setIsLoading(true);
                const response = await api.get('/api/tags/');
                setAvailableTags(response.data);
                setIsLoading(false);
            } catch (err) {
                console.error('Error fetching tags:', err);
                setError('Failed to load tags');
                setIsLoading(false);
            }
        };

        fetchTags();
    }, []);

    useEffect(() => {
        if (!hasInitializedTags && initialTags.length > 0) {
            setSelectedTags(initialTags);
            setHasInitializedTags(true);
        }
    }, [initialTags, hasInitializedTags]);

    useEffect(() => {
        // Close dropdown when clicking outside
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
                inputRef.current && !inputRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        const value = e.target.value;
        setTagName(value);
        setIsDropdownOpen(value.length > 0);

        // Filter existing tags based on user input, excluding already selected tags
        if (value) {
            const filtered = availableTags.filter(tag => 
                tag.name.toLowerCase().includes(value.toLowerCase()) &&
                !selectedTags.some(selectedTag => selectedTag.id === tag.id)
            );
            setFilteredTags(filtered);
        } else {
            setFilteredTags([]);
        }
    };

    const handleInputFocus = () => {
        if (tagName.length > 0) {
            setIsDropdownOpen(true);
        }
    };

    const updateAlbumTags = async (updatedTags) => {
        try {
            // Format tags for API request
            const tagsData = updatedTags.map(tag => ({ name: tag.name }));
            
            // Update album with new tags
            await api.patch(`/api/albums/${albumId}/`, {
                tags: tagsData
            });
            setSelectedTags(updatedTags);

            if (onTagsUpdated) {
                onTagsUpdated(updatedTags);
            }
        } catch (err) {
            console.error('Error updating album tags:', err);
            setError('Failed to update tags');
        }
    };

    const handleKeyDown = async (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            setError('');
            setSuccess('');

            if (!tagName) {
                setError('Tag name is required.');
                return;
            }

            const existingTag = availableTags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase());

            if (existingTag) {
                // If tag exists but is not already selected
                if (!selectedTags.some(tag => tag.id === existingTag.id)) {
                    const updatedTags = [...selectedTags, existingTag];
                    setSelectedTags(updatedTags);
                    await updateAlbumTags(updatedTags);
                }
            } else {
                // If tag doesn't exist, create new one
                const token = localStorage.getItem('access');

                try {
                    const response = await axios.post('/api/tags/', { name: tagName }, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });
                    
                    // Add new tag to available tags
                    setAvailableTags(prev => [...prev, response.data]);
                    
                    // Add new tag to selected tags
                    const updatedTags = [...selectedTags, response.data];
                    setSelectedTags(updatedTags);
                    
                    // Update album with new tags
                    await updateAlbumTags(updatedTags);
                    
                    // setSuccess(`Created tag: ${response.data.name}`);
                    setTimeout(() => setSuccess(''), 2000);
                } catch (err) {
                    setError('Failed to create tag. Please try again.');
                }
            }

            // Clear the input field and close the dropdown
            setTagName('');
            setFilteredTags([]);
            setIsDropdownOpen(false);
        } else if (e.key === 'Escape') {
            setIsDropdownOpen(false);
        }
    };

    const handleTagSelect = async (tag) => {
        // Add tag to selected tags
        const updatedTags = [...selectedTags, tag];
        setSelectedTags(updatedTags);
        
        // Update album with new tags
        await updateAlbumTags(updatedTags);
        
        // Clear input and dropdown
        setTagName('');
        setFilteredTags([]);
        setIsDropdownOpen(false);
        inputRef.current.focus();
    };

    const removeTag = async (tagId) => {
        // Remove tag from selected tags
        const updatedTags = selectedTags.filter(tag => tag.id !== tagId);
        setSelectedTags(updatedTags);
        
        // Update album with new tags
        await updateAlbumTags(updatedTags);
        onTagsUpdated(updatedTags);
    };

    return (
        <div className="album-tag-manager p-6 rounded-lg bg-white shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Album Tags</h3>
            
            {/* Selected tags display */}
            <div className="flex flex-wrap gap-2 mb-4">
                {selectedTags.map(tag => (
                    <div 
                        key={tag.id} 
                        className="flex items-center bg-blue-50 text-blue-700 rounded-full px-3 py-1.5 text-sm font-medium transition-all hover:bg-blue-100"
                    >
                        <span>{tag.name}</span>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                removeTag(tag.id);
                            }}
                            type="button"
                            className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                            aria-label={`Remove ${tag.name} tag`}
                        >
                            &times;
                        </button>
                    </div>
                ))}
                
                {selectedTags.length === 0 && (
                    <span className="text-gray-500 text-sm">No tags added yet</span>
                )}
            </div>
            
            {/* Tag input with dropdown */}
            <div className="relative">
                <div className="flex items-center bg-gray-50 rounded-lg overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-blue-400 transition-all">
                    <input
                        ref={inputRef}
                        type="text"
                        value={tagName}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={handleInputFocus}
                        placeholder="Type to add or create tags..."
                        className="flex-1 px-4 py-2.5 bg-transparent border-none focus:outline-none text-gray-700"
                        disabled={isLoading}
                    />
                    {tagName && (
                        <button 
                            type="button"
                            onClick={() => setTagName('')}
                            className="px-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                            &times;
                        </button>
                    )}
                </div>
                
                {isDropdownOpen && filteredTags.length > 0 && (
                    <div 
                        ref={dropdownRef}
                        className="absolute z-10 bg-white border border-gray-200 rounded-lg mt-1 w-full shadow-lg overflow-hidden max-h-60 overflow-y-auto"
                    >
                        {filteredTags.map(tag => (
                            <div 
                                key={tag.id} 
                                className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                                onClick={() => handleTagSelect(tag)}
                            >
                                <span className="text-gray-700">{tag.name}</span>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Add</span>
                            </div>
                        ))}
                    </div>
                )}
                
                {isDropdownOpen && filteredTags.length === 0 && tagName && (
                    <div className="absolute z-10 bg-white border border-gray-200 rounded-lg mt-1 w-full shadow-lg p-4">
                        <p className="text-gray-600 text-sm">
                            Press <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">Enter</span> to create "<span className="font-medium">{tagName}</span>"
                        </p>
                    </div>
                )}
            </div>
            
            {error && <div className="mt-2 text-red-500 text-sm">{error}</div>}
            {success && <div className="mt-2 text-green-500 text-sm animate-pulse">{success}</div>}
            
            <p className="mt-3 text-xs text-gray-500">
                Type a tag name and press Enter to create or select existing tags
            </p>
        </div>
    );
};

export default AlbumTagManager;