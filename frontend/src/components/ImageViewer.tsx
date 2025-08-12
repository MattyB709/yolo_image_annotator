import React, { useState, useRef, useEffect } from 'react';
import { Image } from '../types';
import { imageApi } from '../services/api';

interface ImageViewerProps {
  image: Image;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ 
  image, 
  onClose, 
  onNext, 
  onPrevious, 
  hasNext, 
  hasPrevious 
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, 0.1));
  };

  const handleFitToScreen = () => {
    if (!imageRef.current || !containerRef.current) return;
    
    const container = containerRef.current;
    const containerWidth = container.clientWidth - 40; // Account for padding
    const containerHeight = container.clientHeight - 120; // Account for controls
    
    const scaleX = containerWidth / image.width;
    const scaleY = containerHeight / image.height;
    const scale = Math.min(scaleX, scaleY, 1);
    
    setZoom(scale);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newZoom = Math.max(0.1, Math.min(5, zoom + delta));
    setZoom(newZoom);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowRight':
        if (hasNext && onNext) onNext();
        break;
      case 'ArrowLeft':
        if (hasPrevious && onPrevious) onPrevious();
        break;
      case '+':
      case '=':
        handleZoomIn();
        break;
      case '-':
        handleZoomOut();
        break;
      case '0':
        resetView();
        break;
      case 'f':
        handleFitToScreen();
        break;
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasNext, hasPrevious, onNext, onPrevious, onClose, zoom]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    resetView();
    setLoading(true);
  }, [image.id]);

  const formatFileSize = (width: number, height: number): string => {
    return `${width} × ${height}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      className="image-viewer-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.9)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem',
        backgroundColor: 'rgba(0,0,0,0.8)',
        color: 'white'
      }}>
        <div>
          <h3 style={{ margin: 0, marginBottom: '0.25rem' }}>{image.original_name}</h3>
          <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
            {formatFileSize(image.width, image.height)} • {formatDate(image.uploaded_at)}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '0.5rem'
          }}
        >
          ×
        </button>
      </div>

      {/* Navigation and Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.5rem 1rem',
        backgroundColor: 'rgba(0,0,0,0.8)',
        color: 'white'
      }}>
        {/* Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={onPrevious}
            disabled={!hasPrevious}
            style={{
              background: hasPrevious ? '#1976d2' : '#666',
              border: 'none',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: hasPrevious ? 'pointer' : 'not-allowed',
              fontSize: '0.875rem'
            }}
          >
            ← Previous
          </button>
          <button
            onClick={onNext}
            disabled={!hasNext}
            style={{
              background: hasNext ? '#1976d2' : '#666',
              border: 'none',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: hasNext ? 'pointer' : 'not-allowed',
              fontSize: '0.875rem'
            }}
          >
            Next →
          </button>
        </div>

        {/* Zoom Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomOut}
            style={{
              background: '#1976d2',
              border: 'none',
              color: 'white',
              padding: '0.25rem 0.5rem',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            -
          </button>
          <button
            onClick={handleZoomIn}
            style={{
              background: '#1976d2',
              border: 'none',
              color: 'white',
              padding: '0.25rem 0.5rem',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            +
          </button>
          <button
            onClick={handleFitToScreen}
            style={{
              background: '#1976d2',
              border: 'none',
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '0.75rem'
            }}
          >
            Fit
          </button>
          <button
            onClick={resetView}
            style={{
              background: '#1976d2',
              border: 'none',
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '0.75rem'
            }}
          >
            1:1
          </button>
        </div>
      </div>

      {/* Image Container */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {loading && (
          <div style={{ color: 'white', fontSize: '1.2rem' }}>
            Loading image...
          </div>
        )}
        <img
          ref={imageRef}
          src={imageApi.getImageUrl(image.project_id, image.filename)}
          alt={image.original_name}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            userSelect: 'none',
            pointerEvents: 'none'
          }}
          onLoad={() => {
            setLoading(false);
            // Auto-fit on first load if image is larger than container
            setTimeout(handleFitToScreen, 100);
          }}
          onError={() => setLoading(false)}
        />
      </div>

      {/* Footer with shortcuts */}
      <div style={{
        padding: '0.5rem 1rem',
        backgroundColor: 'rgba(0,0,0,0.8)',
        color: 'white',
        fontSize: '0.75rem',
        textAlign: 'center',
        opacity: 0.7
      }}>
        Shortcuts: ESC (close) • ←/→ (navigate) • +/- (zoom) • 0 (reset) • F (fit) • Mouse wheel (zoom)
      </div>
    </div>
  );
};

export default ImageViewer;