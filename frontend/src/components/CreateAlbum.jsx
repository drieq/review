import { useState } from 'react';
import axios from 'axios';

const CreateAlbum = ({ onAlbumCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        'http://localhost:8000/api/albums/',
        { title, description },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access')}`,
          },
        }
      );
      onAlbumCreated(response.data);  // Pass the newly created album to parent
      setTitle('');
      setDescription('');
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
      <button type="submit">Create Album</button>
    </form>
  );
};

export default CreateAlbum;