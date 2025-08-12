import React, { useState, useEffect } from 'react';
import { Image, Annotation, ClassDefinition } from '../types';
import { annotationApi } from '../services/api';
import AnnotationCanvas from './AnnotationCanvas';
import AnnotationSidebar from './AnnotationSidebar';

interface AnnotationInterfaceProps {
  image: Image;
  classDefinitions: ClassDefinition[];
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

const AnnotationInterface: React.FC<AnnotationInterfaceProps> = ({
  image,
  classDefinitions,
  onClose,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious
}) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Load annotations for current image
  const loadAnnotations = async () => {
    try {
      setLoading(true);
      const data = await annotationApi.getAnnotations(image.id);
      setAnnotations(data);
    } catch (error) {
      console.error('Failed to load annotations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize selected class
  useEffect(() => {
    if (classDefinitions.length > 0 && selectedClassId === 0) {
      setSelectedClassId(classDefinitions[0].id);
    }
  }, [classDefinitions, selectedClassId]);

  // Load annotations when image changes
  useEffect(() => {
    loadAnnotations();
    setSelectedAnnotation(null);
  }, [image.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      switch (e.key) {
        case 'Escape':
          if (selectedAnnotation) {
            setSelectedAnnotation(null);
          } else {
            onClose();
          }
          break;
        case 'ArrowRight':
          if (hasNext && onNext) {
            e.preventDefault();
            onNext();
          }
          break;
        case 'ArrowLeft':
          if (hasPrevious && onPrevious) {
            e.preventDefault();
            onPrevious();
          }
          break;
        case 'Delete':
        case 'Backspace':
          if (selectedAnnotation) {
            e.preventDefault();
            handleDeleteSelected();
          }
          break;
        default:
          // Number keys for class selection
          const numKey = parseInt(e.key);
          if (numKey >= 1 && numKey <= classDefinitions.length) {
            e.preventDefault();
            setSelectedClassId(classDefinitions[numKey - 1].id);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedAnnotation, onClose, onNext, onPrevious, hasNext, hasPrevious, classDefinitions]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeleteSelected = async () => {
    if (!selectedAnnotation) return;

    try {
      await annotationApi.deleteAnnotation(selectedAnnotation.id);
      setAnnotations(annotations.filter(a => a.id !== selectedAnnotation.id));
      setSelectedAnnotation(null);
    } catch (error) {
      console.error('Failed to delete annotation:', error);
      alert('Failed to delete annotation');
    }
  };

  const formatDate = (dateString: string) => {
    // Convert SQL datetime format to ISO format
    const isoDate = dateString.replace(' ', 'T') + 'Z';
    return new Date(isoDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSelectedClassName = () => {
    return classDefinitions.find(c => c.id === selectedClassId)?.name || 'Unknown';
  };

  if (classDefinitions.length === 0) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h3>No Classes Defined</h3>
          <p>Please define some classes for this project before annotating images.</p>
          <button 
            onClick={onClose}
            style={{
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#fff',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #ddd'
      }}>
        <div>
          <h3 style={{ margin: 0, marginBottom: '0.25rem' }}>{image.original_name}</h3>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>
            {image.width} × {image.height} • {formatDate(image.uploaded_at)} • Active: {getSelectedClassName()}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* Navigation */}
          <button
            onClick={onPrevious}
            disabled={!hasPrevious}
            style={{
              background: hasPrevious ? '#1976d2' : '#ccc',
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
              background: hasNext ? '#1976d2' : '#ccc',
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

          <div style={{ width: '1px', height: '24px', backgroundColor: '#ddd', margin: '0 0.5rem' }} />

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              background: '#666',
              border: 'none',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Canvas Area */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {loading ? (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              color: '#666'
            }}>
              Loading annotations...
            </div>
          ) : (
            <AnnotationCanvas
              image={image}
              annotations={annotations}
              classDefinitions={classDefinitions}
              selectedClassId={selectedClassId}
              onAnnotationsChange={setAnnotations}
              onAnnotationSelect={setSelectedAnnotation}
              selectedAnnotation={selectedAnnotation}
            />
          )}
        </div>

        {/* Sidebar */}
        <AnnotationSidebar
          annotations={annotations}
          classDefinitions={classDefinitions}
          selectedAnnotation={selectedAnnotation}
          selectedClassId={selectedClassId}
          onAnnotationSelect={setSelectedAnnotation}
          onAnnotationsChange={setAnnotations}
          onClassSelect={setSelectedClassId}
        />
      </div>

      {/* Footer with shortcuts */}
      <div style={{
        padding: '0.5rem 1rem',
        backgroundColor: '#f8f9fa',
        borderTop: '1px solid #ddd',
        fontSize: '0.75rem',
        color: '#666',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <div>
          <strong>Shortcuts:</strong> ESC (close/deselect) • ←/→ (navigate) • 1-9 (select class) • Del (delete selected)
        </div>
        <div>
          {annotations.length} annotation{annotations.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
};

export default AnnotationInterface;