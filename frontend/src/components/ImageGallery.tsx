import React, { useState } from 'react';
import { Image } from '../types';
import { imageApi } from '../services/api';

interface ImageGalleryProps {
  projectId: number;
  images: Image[];
  onImageClick: (image: Image) => void;
  onImageDeleted: (imageId: number) => void;
  onRefresh: () => void;
  onAnnotateClick: (image: Image) => void;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ 
  projectId, 
  images, 
  onImageClick, 
  onImageDeleted,
  onRefresh,
  onAnnotateClick
}) => {
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);


  const formatDate = (dateString: string): string => {
    // Convert SQL datetime format to ISO format
    const isoDate = dateString.replace(' ', 'T') + 'Z';
    return new Date(isoDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleImageSelect = (imageId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    const newSelected = new Set(selectedImages);
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId);
    } else {
      newSelected.add(imageId);
    }
    setSelectedImages(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedImages.size === 0) return;
    
    const imageNames = images
      .filter(img => selectedImages.has(img.id))
      .map(img => img.original_name)
      .join(', ');
    
    if (!window.confirm(`Delete ${selectedImages.size} image(s)? This action cannot be undone.\n\nImages: ${imageNames}`)) {
      return;
    }

    setLoading(true);
    try {
      await Promise.all(
        Array.from(selectedImages).map(imageId => imageApi.deleteImage(imageId))
      );
      
      // Notify parent component
      selectedImages.forEach(imageId => onImageDeleted(imageId));
      setSelectedImages(new Set());
      onRefresh();
    } catch (error) {
      alert('Failed to delete some images. Please try again.');
      console.error('Delete error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSingle = async (image: Image, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!window.confirm(`Delete "${image.original_name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await imageApi.deleteImage(image.id);
      onImageDeleted(image.id);
      onRefresh();
    } catch (error) {
      alert('Failed to delete image. Please try again.');
      console.error('Delete error:', error);
    }
  };

  const selectAll = () => {
    setSelectedImages(new Set(images.map(img => img.id)));
  };

  const clearSelection = () => {
    setSelectedImages(new Set());
  };

  if (images.length === 0) {
    return (
      <div className="empty-state">
        <h4>No images uploaded</h4>
        <p>Upload some images to start annotating objects for your YOLO dataset.</p>
      </div>
    );
  }

  return (
    <div className="image-gallery">
      {/* Gallery Controls */}
      <div className="gallery-controls" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1rem',
        padding: '0.5rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.875rem', color: '#666' }}>
            {images.length} image{images.length !== 1 ? 's' : ''}
          </span>
          {selectedImages.size > 0 && (
            <span style={{ fontSize: '0.875rem', color: '#1976d2', fontWeight: 500 }}>
              {selectedImages.size} selected
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {images.length > 0 && (
            <>
              <button 
                className="btn btn-secondary btn-small" 
                onClick={selectAll}
                disabled={selectedImages.size === images.length}
              >
                Select All
              </button>
              {selectedImages.size > 0 && (
                <>
                  <button 
                    className="btn btn-secondary btn-small" 
                    onClick={clearSelection}
                  >
                    Clear Selection
                  </button>
                  <button 
                    className="btn btn-danger btn-small" 
                    onClick={handleDeleteSelected}
                    disabled={loading}
                  >
                    {loading ? 'Deleting...' : `Delete ${selectedImages.size}`}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Image Grid */}
      <div className="image-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        {images.map((image) => (
          <div
            key={image.id}
            className={`image-card ${selectedImages.has(image.id) ? 'selected' : ''}`}
            onClick={() => onImageClick(image)}
            style={{
              position: 'relative',
              background: 'white',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: selectedImages.has(image.id) ? '3px solid #1976d2' : '3px solid transparent'
            }}
          >
            {/* Selection Checkbox */}
            <div
              className="selection-checkbox"
              onClick={(e) => handleImageSelect(image.id, e)}
              style={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                width: '20px',
                height: '20px',
                backgroundColor: selectedImages.has(image.id) ? '#1976d2' : 'rgba(255,255,255,0.8)',
                border: '2px solid #1976d2',
                borderRadius: '3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 2
              }}
            >
              {selectedImages.has(image.id) && (
                <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
              )}
            </div>

            {/* Delete Button */}
            <button
              className="delete-btn"
              onClick={(e) => handleDeleteSingle(image, e)}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '24px',
                height: '24px',
                backgroundColor: 'rgba(211, 47, 47, 0.8)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2
              }}
              title="Delete image"
            >
              ×
            </button>

            {/* Image Thumbnail */}
            <div style={{ aspectRatio: '1', overflow: 'hidden', backgroundColor: '#f5f5f5' }}>
              <img
                src={imageApi.getThumbnailUrl(image.id, 'medium')}
                alt={image.original_name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  // Fallback to original image if thumbnail fails
                  e.currentTarget.src = imageApi.getImageUrl(image.project_id, image.filename);
                }}
              />
            </div>

            {/* Image Info */}
            <div style={{ padding: '0.75rem' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                {image.original_name}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>
                {image.width} × {image.height} • {formatDate(image.uploaded_at)}
              </div>
              
              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAnnotateClick(image);
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: '#1976d2',
                    color: 'white',
                    border: 'none',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                  title="Annotate this image"
                >
                  🎯 Annotate
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .image-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }
        
        .image-card.selected {
          transform: translateY(-1px);
        }
        
        .image-card:hover .delete-btn {
          background-color: rgba(211, 47, 47, 1);
        }
      `}</style>
    </div>
  );
};

export default ImageGallery;