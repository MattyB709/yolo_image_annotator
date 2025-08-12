import React, { useRef, useState } from 'react';
import { Image } from '../types';
import { imageApi } from '../services/api';

interface ImageUploadProps {
  projectId: number;
  onImagesUploaded: (images: Image[]) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ projectId, onImagesUploaded }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const invalidFiles = Array.from(files).filter(file => !allowedTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      setError(`Invalid file types: ${invalidFiles.map(f => f.name).join(', ')}. Only JPG, JPEG, and PNG files are allowed.`);
      return;
    }

    // Validate file sizes (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = Array.from(files).filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      setError(`Files too large: ${oversizedFiles.map(f => f.name).join(', ')}. Maximum size is 10MB per file.`);
      return;
    }

    try {
      setUploading(true);
      setError('');
      
      const uploadedImages = await imageApi.uploadImages(projectId, files);
      onImagesUploaded(uploadedImages);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      if (err.response?.status === 413) {
        setError('Files too large. Please reduce file sizes and try again.');
      } else {
        setError('Failed to upload images. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragOut = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="image-upload-container">
      {error && (
        <div className="error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div
        className={`upload-dropzone ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDrag}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onClick={handleButtonClick}
        style={{
          border: `2px dashed ${dragActive ? '#1976d2' : '#ddd'}`,
          borderRadius: '8px',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: dragActive ? '#f0f7ff' : uploading ? '#f5f5f5' : 'white',
          cursor: uploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease-in-out'
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleInputChange}
          style={{ display: 'none' }}
          disabled={uploading}
        />

        {uploading ? (
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
            <p><strong>Uploading images...</strong></p>
            <p style={{ fontSize: '0.875rem', color: '#666' }}>
              Please wait while we process your images
            </p>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              {dragActive ? '📤' : '📷'}
            </div>
            <p><strong>Drop images here or click to select</strong></p>
            <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
              Supports JPG, JPEG, and PNG files up to 10MB each
            </p>
          </div>
        )}
      </div>

      <style>{`
        .upload-dropzone.drag-active {
          transform: scale(1.02);
          box-shadow: 0 4px 20px rgba(25, 118, 210, 0.3);
        }
        
        .upload-dropzone:hover:not(.uploading) {
          border-color: #1976d2;
          background-color: #fafafa;
        }
      `}</style>
    </div>
  );
};

export default ImageUpload;