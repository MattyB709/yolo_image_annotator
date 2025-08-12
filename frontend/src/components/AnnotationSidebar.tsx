import React, { useState } from 'react';
import { Annotation, ClassDefinition } from '../types';
import { annotationApi } from '../services/api';

interface AnnotationSidebarProps {
  annotations: Annotation[];
  classDefinitions: ClassDefinition[];
  selectedAnnotation: Annotation | null;
  selectedClassId: number;
  onAnnotationSelect: (annotation: Annotation | null) => void;
  onAnnotationsChange: (annotations: Annotation[]) => void;
  onClassSelect: (classId: number) => void;
}

const AnnotationSidebar: React.FC<AnnotationSidebarProps> = ({
  annotations,
  classDefinitions,
  selectedAnnotation,
  selectedClassId,
  onAnnotationSelect,
  onAnnotationsChange,
  onClassSelect
}) => {
  const [editingAnnotation, setEditingAnnotation] = useState<number | null>(null);
  const [loading, setLoading] = useState<Set<number>>(new Set());

  const formatCoordinates = (annotation: Annotation) => {
    return `(${annotation.x_center.toFixed(3)}, ${annotation.y_center.toFixed(3)}, ${annotation.width.toFixed(3)}, ${annotation.height.toFixed(3)})`;
  };

  const handleAnnotationClick = (annotation: Annotation) => {
    if (editingAnnotation === annotation.id) {
      setEditingAnnotation(null);
    }
    onAnnotationSelect(annotation);
  };

  const handleDeleteAnnotation = async (annotation: Annotation, event: React.MouseEvent) => {
    event.stopPropagation();

    setLoading(prev => new Set(prev).add(annotation.id));
    try {
      await annotationApi.deleteAnnotation(annotation.id);
      onAnnotationsChange(annotations.filter(a => a.id !== annotation.id));
      if (selectedAnnotation?.id === annotation.id) {
        onAnnotationSelect(null);
      }
    } catch (error) {
      console.error('Failed to delete annotation:', error);
      alert('Failed to delete annotation');
    } finally {
      setLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(annotation.id);
        return newSet;
      });
    }
  };

  const handleClassChange = async (annotation: Annotation, newClassId: number) => {
    if (newClassId === annotation.class_id) return;

    setLoading(prev => new Set(prev).add(annotation.id));
    try {
      const updatedAnnotation = await annotationApi.updateAnnotation(annotation.id, {
        class_id: newClassId,
        x_center: annotation.x_center,
        y_center: annotation.y_center,
        width: annotation.width,
        height: annotation.height
      });

      onAnnotationsChange(annotations.map(a => 
        a.id === annotation.id ? updatedAnnotation : a
      ));
    } catch (error) {
      console.error('Failed to update annotation class:', error);
      alert('Failed to update annotation class');
    } finally {
      setLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(annotation.id);
        return newSet;
      });
    }
  };

  const getClassStats = () => {
    const stats: Record<number, number> = {};
    annotations.forEach(annotation => {
      stats[annotation.class_id] = (stats[annotation.class_id] || 0) + 1;
    });
    return stats;
  };

  const classStats = getClassStats();

  return (
    <div className="annotation-sidebar" style={{
      width: '300px',
      backgroundColor: '#f8f9fa',
      borderLeft: '1px solid #ddd',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem',
        borderBottom: '1px solid #ddd',
        backgroundColor: 'white'
      }}>
        <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>Annotations</h3>
        <div style={{ fontSize: '0.875rem', color: '#666' }}>
          {annotations.length} annotation{annotations.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Class Selection */}
      <div style={{ padding: '1rem', borderBottom: '1px solid #ddd', backgroundColor: 'white' }}>
        <h4 style={{ margin: 0, marginBottom: '0.75rem' }}>Active Class</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {classDefinitions.map((classDef) => (
            <label
              key={classDef.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem',
                borderRadius: '4px',
                backgroundColor: selectedClassId === classDef.id ? classDef.color + '20' : 'transparent',
                border: selectedClassId === classDef.id ? `2px solid ${classDef.color}` : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <input
                type="radio"
                name="selectedClass"
                value={classDef.id}
                checked={selectedClassId === classDef.id}
                onChange={() => onClassSelect(classDef.id)}
                style={{ accentColor: classDef.color }}
              />
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  backgroundColor: classDef.color,
                  borderRadius: '3px'
                }}
              />
              <span style={{ flex: 1, fontSize: '0.875rem' }}>
                {classDef.name}
              </span>
              {classStats[classDef.id] && (
                <span style={{
                  backgroundColor: classDef.color,
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontSize: '0.75rem'
                }}>
                  {classStats[classDef.id]}
                </span>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Annotation List */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {annotations.length === 0 ? (
          <div style={{
            padding: '2rem 1rem',
            textAlign: 'center',
            color: '#666',
            fontSize: '0.875rem'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎯</div>
            <div>No annotations yet</div>
            <div style={{ marginTop: '0.25rem' }}>
              Select a class and draw on the image
            </div>
          </div>
        ) : (
          <div style={{ padding: '0.5rem' }}>
            {annotations.map((annotation, index) => {
              const classDef = classDefinitions.find(c => c.id === annotation.class_id);
              const isSelected = selectedAnnotation?.id === annotation.id;
              const isLoading = loading.has(annotation.id);
              
              return (
                <div
                  key={annotation.id}
                  style={{
                    padding: '0.75rem',
                    margin: '0.5rem 0',
                    backgroundColor: isSelected ? classDef?.color + '20' : 'white',
                    border: isSelected ? `2px solid ${classDef?.color}` : '1px solid #ddd',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    opacity: isLoading ? 0.6 : 1
                  }}
                  onClick={() => handleAnnotationClick(annotation)}
                >
                  {/* Annotation Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          backgroundColor: classDef?.color || '#666',
                          borderRadius: '2px'
                        }}
                      />
                      <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                        #{index + 1}
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteAnnotation(annotation, e)}
                      disabled={isLoading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#d32f2f',
                        cursor: 'pointer',
                        fontSize: '14px',
                        padding: '2px',
                        borderRadius: '2px'
                      }}
                      title="Delete annotation"
                    >
                      {isLoading ? '...' : '×'}
                    </button>
                  </div>

                  {/* Class Selector */}
                  <div style={{ marginBottom: '0.5rem' }}>
                    <select
                      value={annotation.class_id}
                      onChange={(e) => handleClassChange(annotation, parseInt(e.target.value))}
                      disabled={isLoading}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: '100%',
                        padding: '0.25rem',
                        border: '1px solid #ddd',
                        borderRadius: '3px',
                        fontSize: '0.875rem',
                        backgroundColor: 'white'
                      }}
                    >
                      {classDefinitions.map((classDef) => (
                        <option key={classDef.id} value={classDef.id}>
                          {classDef.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Coordinates */}
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#666',
                    fontFamily: 'monospace'
                  }}>
                    YOLO: {formatCoordinates(annotation)}
                  </div>

                  {/* Detailed info when selected */}
                  {isSelected && (
                    <div style={{
                      marginTop: '0.5rem',
                      padding: '0.5rem',
                      backgroundColor: 'rgba(255,255,255,0.5)',
                      borderRadius: '3px',
                      fontSize: '0.75rem'
                    }}>
                      <div><strong>Center:</strong> ({(annotation.x_center * 100).toFixed(1)}%, {(annotation.y_center * 100).toFixed(1)}%)</div>
                      <div><strong>Size:</strong> {(annotation.width * 100).toFixed(1)}% × {(annotation.height * 100).toFixed(1)}%</div>
                      <div><strong>Created:</strong> {new Date(annotation.created_at).toLocaleTimeString()}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer with instructions */}
      <div style={{
        padding: '0.75rem',
        borderTop: '1px solid #ddd',
        backgroundColor: 'white',
        fontSize: '0.75rem',
        color: '#666'
      }}>
        <div><strong>Instructions:</strong></div>
        <div>• Select a class above</div>
        <div>• Click and drag to draw boxes</div>
        <div>• Click boxes to select/edit</div>
        <div>• Right-click boxes to change class</div>
        <div>• Use mouse wheel to zoom</div>
      </div>
    </div>
  );
};

export default AnnotationSidebar;