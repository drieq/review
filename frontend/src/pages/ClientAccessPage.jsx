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
  const [isLoading, setIsLoading] = useState(true);
  const [maxSelections, setMaxSelections] = useState(null);
  const [canDownload, setCanDownload] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [owner, setOwner] = useState("");
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('clientViewMode') || 'grid';
  });

  const API_URL = `http://localhost:8000/api/client-access/${token}/`;

  useEffect(() => {
    // Save the view mode to local storage whenever it changes
    localStorage.setItem('clientViewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    const storedAccessToken = sessionStorage.getItem("accessToken");
    const storedToken = sessionStorage.getItem("token");

    const expiresAt = parseInt(sessionStorage.getItem("accessTokenExpires"), 10);
    if (Date.now() > expiresAt) {
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("token");
      setPasswordRequired(true);
      setIsLoading(false);
      return;
    }

    if (storedToken === token && storedAccessToken) {
      fetchAlbum(storedAccessToken);
    } else {
      setPasswordRequired(true);
      setIsLoading(false);
    }
  }, [token]);

  const fetchAlbum = async (accessToken) => {
    setIsLoading(true);
    try {
      const response = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setAlbum(response.data.album);
      setPhotos(response.data.album.photos);
      setMaxSelections(response.data.max_selections);
      setCanDownload(response.data.can_download);
      setWelcomeMessage(response.data.welcome_message);
      setOwner(response.data.album.owner_name || response.data.album.owner || "Album Owner");
      
      // Load previously selected photos if any
      const selectionsResponse = await axios.get(`${API_URL}selections/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      if (selectionsResponse.data && selectionsResponse.data.selections) {
        setSelectedPhotos(selectionsResponse.data.selections.map(s => s.photo_id));
      }
      
      setPasswordRequired(false);
      sessionStorage.setItem("token", token);
    } catch (err) {
      if (err.response?.status === 401) {
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("token");
        setPasswordRequired(true);
      } else {
        setError(err.response?.data?.error || "Failed to load album.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}auth/`, {password});
      const accessToken = response.data.access_token;
      sessionStorage.setItem("accessToken", accessToken);
      sessionStorage.setItem("accessTokenExpires", Date.now() + 2 * 60 * 60 * 1000);
      sessionStorage.setItem("token", token);
      fetchAlbum(accessToken);
    } catch (err) {
      setError("Invalid password");
      setIsLoading(false);
    }
  };

  const handleSelect = async (photoId) => {
    const accessToken = sessionStorage.getItem("accessToken");

    if (!accessToken) {
      alert("You need to authenticate first.");
      return;
    }

    // If photo is already selected, unselect it
    if (selectedPhotos.includes(photoId)) {
      try {
        await axios.delete(`${API_URL}select/${photoId}/`, {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        });
        setSelectedPhotos(selectedPhotos.filter(id => id !== photoId));
      } catch (err) {
        console.error("Unselection failed:", err);
      }
      return;
    }

    // If max selections reached, show alert
    if (maxSelections && selectedPhotos.length >= maxSelections) {
      alert(`Maximum selection limit reached (${maxSelections}). Please unselect a photo before selecting a new one.`);
      return;
    }

    try {
      await axios.post(`${API_URL}select/${photoId}/`, {},
        {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      setSelectedPhotos([...selectedPhotos, photoId]);
    } catch (err) {
      console.error("Selection failed:", err);
    }
  };

  const handleDownloadSelected = async () => {
    if (selectedPhotos.length === 0) {
      alert("Please select at least one photo to download.");
      return;
    }

    const accessToken = sessionStorage.getItem("accessToken");
    if (!accessToken) {
      alert("You need to authenticate first.");
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}download/`,
        { photo_ids: selectedPhotos },
        {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          responseType: 'blob',
        }
      );
      
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${album.title || 'photos'}-selection.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download selected photos. Please try again.");
    }
  };

  const handleDownloadAll = async () => {
    const accessToken = sessionStorage.getItem("accessToken");
    if (!accessToken) {
      alert("You need to authenticate first.");
      return;
    }

    try {
      const response = await axios.get(
        `${API_URL}download-all/`,
        {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
          responseType: 'blob',
        }
      );
      
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${album.title || 'photos'}-all.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download all photos. Please try again.");
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

  if (passwordRequired) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Enter Album Password
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <form onSubmit={handlePasswordSubmit}>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={!password}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (!album) return <p>Loading album...</p>;

  const PhotoCard = ({ photo }) => (
    <div className="relative overflow-hidden bg-white rounded-lg shadow-md group h-72">
      <div className="relative h-full">
        <img
          src={photo.image}
          alt={photo.title || "Photo"}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Selected indicator */}
        {selectedPhotos.includes(photo.id) && (
          <div className="absolute top-3 right-3 bg-indigo-600 text-white rounded-full p-1 z-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent text-white transform translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <div className="flex justify-between items-center">
          <div>
            {photo.title && <p className="font-medium text-xs max-w-xs truncate">{photo.title}</p>}
            {photo.caption && <p className="text-xs text-gray-300">{photo.caption}</p>}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSelect(photo.id);
            }}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              selectedPhotos.includes(photo.id)
                ? 'bg-indigo-700 text-white hover:bg-indigo-800'
                : 'bg-white text-gray-900 hover:bg-gray-100'
            } transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
          >
            {selectedPhotos.includes(photo.id) ? "Selected" : "Select"}
          </button>
        </div>
      </div>
    </div>
  );

  const PhotoListItem = ({ photo }) => (
    <div className="flex items-center bg-white rounded-lg shadow-md p-4 group">
      <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0 mr-4">
        <img
          src={photo.image}
          alt={photo.title || "Photo"}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-grow">
        {photo.title && <p className="font-medium text-gray-900">{photo.title}</p>}
        {photo.caption && <p className="text-sm text-gray-500">{photo.caption}</p>}
      </div>
      <button
        onClick={() => handleSelect(photo.id)}
        className={`ml-4 px-3 py-1 rounded-md text-sm font-medium ${
          selectedPhotos.includes(photo.id)
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        } transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
      >
        {selectedPhotos.includes(photo.id) ? "Selected" : "Select"}
      </button>
    </div>
  );

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row">
            <div className="mb-8 md:w-1/2 md:pe-4">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold text-gray-900">{album.title}</h1>
                {album.description && (
                  <p className="text-gray-600 min-h-[80px]">
                    {album.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col md:w-1/2">
              {welcomeMessage && (
                <div className="bg-gray-100 rounded-lg p-4 mb-4">
                  <span className="text-sm font-semibold text-gray-900">{owner}</span>
                  <p className="text-sm font-normal py-2.5 text-gray-900">{welcomeMessage}</p>
                </div>
              )}
              
              {maxSelections && (
                <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
                  <p className="font-medium">Selection Limit: {selectedPhotos.length}/{maxSelections}</p>
                  <p className="text-sm">You can select up to {maxSelections} photos from this album.</p>
                </div>
              )}

              {canDownload && (
                <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <p>Downloads are enabled for this album.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <h2 className="text-2xl font-semibold">Photos</h2>
            {photos.length > 0 && (
              <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                {photos.length}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {canDownload && selectedPhotos.length > 0 && (
              <button
                onClick={handleDownloadSelected}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Selected ({selectedPhotos.length})
              </button>
            )}
            
            {canDownload && (
              <button
                onClick={handleDownloadAll}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download All
              </button>
            )}
            
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-100'
              }`}
              aria-label="Grid view"
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
              aria-label="List view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {photos.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            No photos in this album yet.
          </div>
        ) : (
          <div className={`transition-all duration-300 ${
            viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
              : 'space-y-4'
          }`}>
            {photos.map(photo => viewMode === 'grid' ? (
              <PhotoCard key={photo.id} photo={photo} />
            ) : (
              <PhotoListItem key={photo.id} photo={photo} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}