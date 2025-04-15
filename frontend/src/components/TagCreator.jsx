import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const TagCreator = ({ availableTags, selectedTagIds, onTagCreated, onTagSelect, onTagAdd }) => {
    const [tagName, setTagName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    // const [tags, setTags] = useState([]); // State to hold created tags
    const [filteredTags, setFilteredTags] = useState([]); // State for filtered existing tags
    const [currentSelectedTags, setCurrentSelectedTags] = useState([]);

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const inputRef = useRef(null);
    const dropdownRef = useRef(null);

        // When selectedTagIds prop changes, update the internal state
    useEffect(() => {
        setCurrentSelectedTags(selectedTagIds);
    }, [selectedTagIds]);  // This will run every time selectedTagIds changes

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

        // Filter existing tags based on user input
        if (value) {
            const filtered = availableTags.filter(tag => 
                tag.name.toLowerCase().includes(value.toLowerCase()) &&
                !currentSelectedTags.includes(tag.id)
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
                // If the tag exists, add it to the selected tags
                if (!currentSelectedTags.includes(existingTag.id)) {
                    onTagAdd(existingTag.id); // Use add instead of toggle for better UX
                }
            } else {
                // If the tag does not exist, create a new one
                const token = localStorage.getItem('access');

                try {
                    const response = await axios.post('/api/tags/', { name: tagName }, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });

                    console.log("Tag created:", response.data);
                    onTagCreated(response.data); // Call the handler with the new tag
                    // setTags((prevTags) => [...prevTags, response.data]); // Add the new tag to the list
                    
                    const newTagId = response.data.id;
                    onTagAdd(newTagId);
                } catch (err) {
                    setError('Failed to create tag. Please try again.');
                }
            }

            // Clear the input field and close the dropdown
            setTagName('');
            setFilteredTags([]);
        }
    };

    // const handleTagDelete = (tagId) => {
    //     setTags((prevTags) => prevTags.filter(tag => tag.id !== tagId)); // Remove the tag from the list
    // };

    const handleTagSelect = (tag) => {
        onTagAdd(tag.id);
        setTagName(''); // Clear the input field
        setFilteredTags([]); // Clear filtered tags
        inputRef.current.focus();
    };

    const removeTag = (tagId) => {
        onTagSelect(tagId);
    };

    return (
        <div className="tag-creator p-6 rounded-lg bg-white shadow-md border border-gray-200">
            <h2 className="text-lg font-semibold mb-3 text-gray-800">Tags</h2>
            
            {/* Selected tags display */}
            <div className="flex flex-wrap gap-2 mb-4">
                {availableTags
                    .filter(tag => currentSelectedTags.includes(tag.id))
                    .map(tag => (
                    <div 
                        key={tag.id} 
                        className="flex items-center bg-blue-50 text-blue-700 rounded-full px-3 py-1.5 text-sm font-medium transition-all hover:bg-blue-100"
                    >
                        <span>{tag.name}</span>
                        <button
                            onClick={(e) => {
                            e.preventDefault(); // Prevent form submission
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
                    />
                    {tagName && (
                        <button 
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
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Select</span>
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

export default TagCreator;
