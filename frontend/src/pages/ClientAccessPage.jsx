// /frontend/src/pages/ClientAccessPage.jsx

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function ClientAccessPage() {
  const { token } = useParams();
  const [album, setAlbum] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [password, setPassword] = useState("");
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [error, setError] = useState(null);
  const [maxSelections, setMaxSelections] = useState(null);
  const [canDownload, setCanDownload] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [selectedPhotos, setSelectedPhotos] = useState([]);

  const API_URL = `http://localhost:8000/api/client-access/${token}/`;

  useEffect(() => {
    const storedPassword = localStorage.getItem("storedPassword");
    const storedToken = localStorage.getItem("token");
    if (storedToken === token && storedPassword) {
        fetchAlbum(storedPassword);
    } else {
        setPasswordRequired(true);
    }
  }, []);

  const fetchAlbum = async (pw) => {
    try {
    const response = await axios.get(API_URL, {
        params: pw ? { password: pw } : {},
        // headers: {
        //   Authorization: `Bearer ${token}`,
        // },
    });

    setAlbum(response.data.album);
    setPhotos(response.data.album.photos);
    setMaxSelections(response.data.max_selections);
    setCanDownload(response.data.can_download);
    setWelcomeMessage(response.data.welcome_message);
    setPasswordRequired(false);
    localStorage.setItem("token", token);
    } catch (err) {
    if (err.response?.status === 401) {
        setPasswordRequired(true);
    } else {
        setError(err.response?.data?.error || "Failed to load album.");
    }
    }
};

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem("token", token);
    localStorage.setItem("storedPassword", password);
    fetchAlbum(password);
  };

  const handleSelect = async (photoId) => {
    if (maxSelections && selectedPhotos.length >= maxSelections) {
      alert("Maximum number of selections reached.");
      return;
    }

    try {
      const storedPassword = localStorage.getItem("storedPassword");

      await axios.post(`${API_URL}select/${photoId}/`,
        { password: storedPassword },
        {
            headers: {
                "Content-Type": "application/json",
            },
        }
      );
      setSelectedPhotos([...selectedPhotos, photoId]);
    } catch (err) {
      console.error("Selection failed:", err);
    }
  };

  if (error) return <p className="text-red-600">{error}</p>;

  if (passwordRequired) {
    return (
      <form onSubmit={handlePasswordSubmit} className="p-6">
        <label className="block text-lg mb-2">Enter Password</label>
        <input
          type="password"
          className="border rounded px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="ml-2 px-4 py-2 bg-blue-500 text-white rounded">
          Submit
        </button>
      </form>
    );
  }

  if (!album) return <p>Loading album...</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{album.title}</h1>
      {welcomeMessage && <p className="mb-4 italic">{welcomeMessage}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <div key={photo.id} className="relative group">
            <img
              src={photo.image} // adjust depending on your backend image field
              alt=""
              className="w-full object-cover rounded shadow"
            />
            <button
              onClick={() => handleSelect(photo.id)}
              className="absolute bottom-2 right-2 bg-white text-sm px-2 py-1 rounded shadow"
              disabled={selectedPhotos.includes(photo.id)}
            >
              {selectedPhotos.includes(photo.id) ? "Selected" : "Select"}
            </button>
          </div>
        ))}
      </div>

      {canDownload && (
        <p className="mt-6 text-green-600">
          ✅ Downloads are enabled for this album.
        </p>
      )}
    </div>
  );
}
