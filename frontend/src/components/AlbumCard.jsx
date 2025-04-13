import React from 'react';
import { useNavigate } from 'react-router-dom';

const AlbumCard = ({ album }) => {
    const navigate = useNavigate();

    const handleClick = (e) => {
        e.preventDefault();
        navigate(`/albums/${album.id}/`);
    };

    return (
        <div key={album.id} className="album-card aspect-w-4 aspect-h-3 max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <a href="#"
                onClick={(e) => handleClick(e, album.id)}
            >
                {album.cover_photo ? (
                    <img
                        src={`http://localhost:8000${album.cover_photo}`}
                        alt={`Cover of ${album.title}`}
                        className="rounded-t-lg object-cover h-48 w-full"
                    />
                ) : (
                    <div className="w-full h-48 bg-gray-300 flex justify-center items-center">
                        <span className="text-gray-500">No cover photo</span>
                    </div>
                )}
            </a>
            <div className="p-4">
                <h3 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{album.title}</h3>
                <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">{album.description}</p>
                <a href="#"
                    onClick={(e) => handleClick(e, album.id)} 
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                    Read more
                    <svg className="rtl:rotate-180 w-3.5 h-3.5 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
                    </svg>
                </a>
            </div>
        </div>
    );
};

export default AlbumCard;