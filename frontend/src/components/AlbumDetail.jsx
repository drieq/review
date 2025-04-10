import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import axios from "../api/axios";

const AlbumDetail = ({ album }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [fetchedAlbum, setFetchedAlbum] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(null); // To track which dropdown is open
  const [editableTitle, setEditableTitle] = useState(album ? album.title : ""); 
  const [editableDescription, setEditableDescription] = useState(album ? album.description : ""); 
  const [photos, setPhotos] = useState(album ? album.photos : []); 
  const [showConfirmation, setShowConfirmation] = useState(false); // State to control confirmation dialog
  const [photoToDelete, setPhotoToDelete] = useState(null); // State to track which photo to delete

  const dropdownRefs = useRef({});

  useEffect(() => {
    // Only fetch the album if the album prop is not provided
    if (id) {
      const fetchAlbum = async () => {
        const token = localStorage.getItem("access");
        try {
          const response = await axios.get(
            `http://localhost:8000/api/albums/${id}/`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          setFetchedAlbum(response.data); // Set the fetched album data to state

          // Set the fetched album data to the state
          setEditableTitle(response.data.title);
          setEditableDescription(response.data.description);
          setPhotos(response.data.photos || []);
        } catch (error) {
          console.error("Error fetching album:", error);
        }
      };

      fetchAlbum(); // Call the function to fetch the album
    }
  }, [id]); // If the id or album prop changes, fetch the album again
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRefs.current[isDropdownOpen] && !dropdownRefs.current[isDropdownOpen].contains(event.target)) {
        setIsDropdownOpen(null); // Close any open dropdown
      }
    };
  
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const onDrop = async (acceptedFiles) => {
    const token = localStorage.getItem("access");
    const formData = new FormData();
    acceptedFiles.forEach((file) => {
      formData.append("images", file);
    });

    try {
      const response = await axios.post(
        `http://localhost:8000/api/albums/${id}/upload/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });

        const updatedPhotos = response.data.map((photo) => {
          if (photo.image && !photo.image.startsWith("http")) {
            photo.image = `http://localhost:8000${photo.image}`;
          }
          return photo;
        });


      setPhotos((prev) => [...prev, ...response.data]); // Update photos state
    } catch (error) {
      console.error("Error uploading photos:", error);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: "image/*",
  });

  const handleUpdateAlbum = async () => {
    const token = localStorage.getItem("access");
    console.log("Updating album with ID:", id);

    if (!id) {
      console.error("Album ID is not available");
      return;
    }

    try {
      const response = await axios.patch(
        `http://localhost:8000/api/albums/${id}/`,
        {
          title: editableTitle,
          description: editableDescription,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log('Album updated:', response.data);
      // Optionally, you can update the local state with the new album data
      setEditableTitle(response.data.title);
      setEditableDescription(response.data.description);

    } catch (error) {
      console.error("Error updating album:", error);
    }
  }

  const handleDeleteClick = (photoId) => {
    console.log("Delete clicked!")
    setPhotoToDelete(photoId); // Set the photo ID to delete
    setShowConfirmation(true); // Show confirmation dialog
  };

  const handleDelete = async () => {
    if (!photoToDelete) return;

    try {
      const accessToken = localStorage.getItem('access');
      if (!accessToken) return;

      // Make the delete request to the backend
      await axios.delete(`http://localhost:8000/api/photos/${photoToDelete}/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Update the UI by calling the onDelete callback
      // handleDeletePhoto(photoToDelete);

      // Close the confirmation dialog
      setPhotos((prevPhotos) =>
        prevPhotos.filter((photo) => photo.id !== photoToDelete)
      );

      delete dropdownRefs.current[photoToDelete];

      setShowConfirmation(false);
      setPhotoToDelete(null);

      
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false); // Close the confirmation dialog without deleting
    setPhotoToDelete(null);
  };

  const handleDeletePhoto = async (photoId) => {
    try {
      const accessToken = localStorage.getItem("access");
      if (!accessToken) {
        console.error("No access token found");
        return;
      }

      await axios.delete(`http://localhost:8000/api/photos/${photoId}/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setPhotos((prevPhotos) => prevPhotos.filter((photo) => photo.id !== photoId)); // Update the photos state
    } catch (error) {
    console.error("Error deleting photo:", error);
  }
};



  if (!fetchedAlbum) {
    return <div>Loading...</div>; // Show loading state if no album data
  }

  const toggleDropdown = (photoId) => {
    setIsDropdownOpen((prev) => (prev === photoId ? null : photoId)); // Toggle visibility
  };

    return (
      <>
      <div className="dashboard">
        <main className="main-content p-6">
          <h1 className="text-3xl font-bold mb-4">
            <input
              type="text"
              value={editableTitle}
              onChange={(e) => setEditableTitle(e.target.value)}
              onBlur={handleUpdateAlbum}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault(); // Prevent form submission or line break
                  handleUpdateAlbum();
                  e.target.blur(); // Optional: blur to mimic finishing editing
                }
              }}
              className="border-b border-gray-400 focus:outline-none"
            />
          </h1>

          <div className="album-detail mt-6">

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 hover:underline"
            >
            <svg className="rotate-180 w-3.5 h-3.5 me-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
            </svg>
              Back to albums
            </button>

            <textarea
              value={editableDescription}
              onChange={(e) => setEditableDescription(e.target.value)}
              onBlur={handleUpdateAlbum}
              className="w-full p-2 mt-2 border border-gray-300 rounded-md"
            />

            <div {...getRootProps()} className="dropzone mt-4 p-4 border-2 border-dashed border-gray-400 rounded-lg">
              <input {...getInputProps()} />
              <p>Drag & Drop photos here, or click to select files</p>
            </div>

            <div className="photos grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 p-4">
              {photos && photos.length > 0 ? (
                photos.map((photo) => {
                  const imageUrl = photo.image;

                  return (
                  <div
                    key={photo.id}
                    className="max-w-sm h-auto bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700"
                  >
                    <img
                      src={imageUrl}
                      alt={`Photo from ${editableTitle}`}
                      className="album-photo rounded-t-lg shadow object-cover max-h-80 w-full"
                    />
                    <div className="p-5">
                      <h3 className="truncate mb-2 tracking-tight text-gray-900 dark:text-white">
                        {photo.title}
                      </h3>

                      {/* Dropdown button */}
                      <div className="flex justify-end relative">
                        <button
                          onClick={() => toggleDropdown(photo.id)}
                          className="inline-block text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-4 focus:outline-none focus:ring-gray-200 dark:focus:ring-gray-700 rounded-lg text-sm p-1.5"
                          type="button"
                        >
                          <span className="sr-only">Open dropdown</span>
                          <svg
                            className="w-5 h-5"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 16 3"
                          >
                            <path d="M2 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm6.041 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM14 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
                          </svg>
                        </button>

                        {/* Dropdown menu */}
                        {isDropdownOpen === photo.id && (
                          <div 
                            ref={(el) => (dropdownRefs.current[photo.id] = el)}
                            className="z-10 absolute t-10 text-base list-none bg-white divide-y divide-gray-100 rounded-lg shadow-sm w-44 dark:bg-gray-700 -right-1/2 transform -translate-x-1/2 top-5 mt-2">
                            <ul className="py-2" aria-labelledby="dropdownButton">
                              <li>
                                <a
                                  href="#"
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                                >
                                  Edit
                                </a>
                              </li>
                              <li>
                                <a
                                  href="#"
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                                >
                                  Export Data
                                </a>
                              </li>
                              <li>
                                <a
                                  href="#"
                                  onClick={() => handleDeleteClick(photo.id)}
                                  className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                                >
                                  Delete
                                </a>
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })
              ) : (
                <p>No photos available for this album.</p>
              )}
            </div>
          </div>
        </main>
        {/* Confirmation Dialog */}
          {showConfirmation && (
            <div className="confirmation-dialog">
              <p>Are you sure you want to delete this photo?</p>
              <button onClick={handleDelete}>Yes, Delete</button>
              <button onClick={handleCancel}>Cancel</button>
            </div>
          )}
      </div>
      </>
    );
  };


export default AlbumDetail;