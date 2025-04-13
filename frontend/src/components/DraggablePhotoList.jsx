import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import api from '../utils/axiosConfig';

const DraggablePhotoList = ({ photos, albumId, onPhotosUpdate }) => {
  const [isReordering, setIsReordering] = useState(false);

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(photos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update the order of all photos
    const photoOrders = items.map((photo, index) => ({
      id: photo.id,
      order: index,
    }));

    try {
      setIsReordering(true);
      await api.post(`/api/albums/${albumId}/reorder-photos/`, {
        photo_orders: photoOrders,
      });
      onPhotosUpdate(items);
    } catch (error) {
      console.error('Error reordering photos:', error);
    } finally {
      setIsReordering(false);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="photos">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {photos.map((photo, index) => (
              <Draggable
                key={photo.id}
                draggableId={photo.id.toString()}
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`relative group ${
                      snapshot.isDragging ? 'shadow-lg' : ''
                    }`}
                  >
                    <img
                      src={photo.image}
                      alt={photo.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <p className="text-white text-sm font-medium">
                        {photo.title}
                      </p>
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default DraggablePhotoList; 