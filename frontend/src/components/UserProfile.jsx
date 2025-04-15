// frontend/src/components/UserProfile.jsx
import React, { useEffect, useState, useRef } from 'react';
import api from '../utils/axiosConfig';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import defaultAvatar from '../assets/default-avatar.png';

const UserProfile = ({ onUserDataUpdate, successMessage, setSuccessMessage }) => {
  const { user } = useAuth(); // Get user data from context
  const [userData, setUserData] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const fileInputRef = useRef(null);
  const [showDetails, setShowDetails] = useState(false);


  useEffect(() => {
    if (!userData) {
      const fetchUserData = async () => {
        try {
          const response = await api.get('/api/current_user/'); // Ensure this matches your backend URL
          setUserData(response.data);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      };

      fetchUserData();
    }
  }, [userData]);

  const handleAvatarChange = (e) => {
    setAvatar(e.target.files[0]); // Set the selected file
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    if (avatar) {
      formData.append('avatar', avatar); // Append the avatar file to the form data
    } else {
      console.error('No avatar selected');
      return; // Exit if no avatar is selected
    }

    try {
      await api.put('/api/user/update-avatar/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Set the correct content type
        },
      });

      const response = await api.get('/api/current_user/'); // Ensure this matches your backend URL
        setUserData(response.data);
        onUserDataUpdate(response.data);

      // Update the user data immediately in the local state
      const updatedUserData = { ...userData, avatar: response.data.avatar }; // Assuming response.data.avatar contains the new avatar URL
      setUserData(updatedUserData); // Update local state
      setAvatar(null); // Reset avatar state after upload
      fileInputRef.current.value = null; // Reset the file input value
      onUserDataUpdate(); // Call the update function to refresh user data in the parent component

      // Set success message
      setSuccessMessage('Your avatar has been updated successfully!'); // Set the success message
    } catch (error) {
      console.error('Error updating avatar:', error);
    }
  };

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 4000);
  
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  if (!userData) {
    return <LoadingSpinner />; // Show loading state while fetching data
  }

  // Define the base URL for media files
  const baseUrl = 'http://localhost:8000'; // Adjust this to your actual base URL
  const avatarUrl = userData.avatar ? `${baseUrl}${userData.avatar}` : defaultAvatar; // Construct the full URL

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white shadow-md rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold mb-4">User Profile</h2>
            <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="mb-4 text-indigo-600 hover:underline text-sm font-medium"
                    >
                    {showDetails ? 'Hide Details' : 'Change Details'}
                </button>
        </div>
      <div className="mb-4">
        <img
          src={avatarUrl} // Use the full avatar URL
          alt="User Avatar"
          className="w-32 h-32 rounded-full mx-auto object-cover"
          onError={(e) => {
            e.target.onerror = null; // Prevent looping
            e.target.src = 'default-avatar.png'; // Set a default image if the avatar fails to load
          }}
        />
      </div>
      <div className="flex flex-col items-center mb-4">
            <h5 className="text-xl font-medium text-gray-900 dark:text-white">{userData.username}</h5>
            <span className="text-sm text-gray-500 dark:text-gray-400">{userData.email}</span>
      </div>

        {showDetails && (
        <>
            {/* Divider */}
            <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="mx-4 text-gray-500 text-sm">Change your details</span>
            <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <form onSubmit={handleSubmit}>
            <div className="flex items-center">
                <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 w-full text-slate-500 font-medium text-sm bg-white border file:cursor-pointer cursor-pointer file:border-0 file:py-3 file:px-4 file:mr-4 file:bg-gray-100 file:hover:bg-gray-200 file:text-slate-500 rounded"
                />
                <button
                type="submit"
                className="ml-4 bg-indigo-600 text-sm text-white py-2 px-4 rounded whitespace-nowrap"
                >
                Change Avatar
                </button>
            </div>
            </form>
        </>
        )}
    </div> 
  );
}; 

export default UserProfile;