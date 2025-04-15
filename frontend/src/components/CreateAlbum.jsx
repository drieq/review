import { useState, useEffect } from 'react';
import axios from 'axios';

const CreateAlbum = ({ onAlbumCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTagIds, setSelectedTagIds] = useState([]);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/tags/', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access')}`,
          },
        });
        setAvailableTags(response.data);
      } catch (err) {
        console.error('Error fetching tags:', err);
      }
    };

    fetchTags();
  }, []);

  const handleTagToggle = (tagId) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const tagObjects = availableTags
        .filter((tag) => selectedTagIds.includes(tag.id))
        .map((tag) => ({ name: tag.name }));

      const response = await axios.post(
        'http://localhost:8000/api/albums/',
        { title, description, tags: tagObjects, },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access')}`,
          },
        }
      );
      onAlbumCreated(response.data);  // Pass the newly created album to parent
      setTitle('');
      setDescription('');
      setSelectedTagIds([]);
    } catch (err) {
      console.error('Error creating album:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Album Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        placeholder="Album Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div>
        <p>Select Tags:</p>
        {availableTags.map((tag) => (
          <label key={tag.id}>
            <input
              type="checkbox"
              checked={selectedTagIds.includes(tag.id)}
              onChange={() => handleTagToggle(tag.id)}
            />
            {tag.name}
          </label>
        ))}
      </div>

      <button type="submit">Create Album</button>
    </form>
  );
};

export default CreateAlbum;