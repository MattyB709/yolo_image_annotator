import React, { useState } from 'react';
import { Project, ClassDefinition } from '../types';
import { projectApi } from '../services/api';

interface ClassManagementProps {
  project: Project;
  onClassesUpdated: (updatedClasses: { class_definitions: ClassDefinition[] }) => void;
}

const ClassManagement: React.FC<ClassManagementProps> = ({ project, onClassesUpdated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingClasses, setEditingClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const startEditing = () => {
    setEditingClasses(project.class_definitions?.map(c => c.name) || ['']);
    setIsEditing(true);
    setError('');
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditingClasses([]);
    setError('');
  };

  const handleClassChange = (index: number, value: string) => {
    const newClasses = [...editingClasses];
    newClasses[index] = value;
    setEditingClasses(newClasses);
  };

  const addClassField = () => {
    setEditingClasses([...editingClasses, '']);
  };

  const removeClassField = (index: number) => {
    if (editingClasses.length > 1) {
      setEditingClasses(editingClasses.filter((_, i) => i !== index));
    }
  };

  const saveClasses = async () => {
    const validClasses = editingClasses
      .map(cls => cls.trim())
      .filter(cls => cls !== '');

    if (validClasses.length === 0) {
      setError('At least one class is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const updatedClasses = await projectApi.updateProjectClasses(project.id, validClasses);
      onClassesUpdated(updatedClasses);
      setIsEditing(false);
      setEditingClasses([]);
    } catch (err: any) {
      console.error('Error updating classes:', err);
      setError('Failed to update classes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderClassList = () => {
    if (!project.class_definitions || project.class_definitions.length === 0) {
      return (
        <div className="empty-state" style={{ padding: '2rem 1rem' }}>
          <h4>No classes defined</h4>
          <p>Add some classes to start annotating objects in your images.</p>
          <button className="btn btn-primary" onClick={startEditing} style={{ marginTop: '1rem' }}>
            Add Classes
          </button>
        </div>
      );
    }

    return (
      <div>
        <div className="class-list" style={{ marginBottom: '1.5rem' }}>
          {project.class_definitions.map((classDef) => (
            <div
              key={classDef.id}
              className="class-tag"
              style={{ 
                backgroundColor: classDef.color,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem'
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.3)'
                }}
              ></div>
              {classDef.name}
              <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                ID: {classDef.id}
              </span>
            </div>
          ))}
        </div>
        <button className="btn btn-secondary" onClick={startEditing}>
          Edit Classes
        </button>
      </div>
    );
  };

  const renderClassEditor = () => {
    return (
      <div>
        {error && (
          <div className="error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#666' }}>
          Edit your class definitions. Colors will be automatically assigned.
        </div>

        {editingClasses.map((className, index) => (
          <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input
              type="text"
              className="form-control"
              value={className}
              onChange={(e) => handleClassChange(index, e.target.value)}
              placeholder={`Class ${index + 1} (e.g., person, car)`}
            />
            {editingClasses.length > 1 && (
              <button
                type="button"
                className="btn btn-danger btn-small"
                onClick={() => removeClassField(index)}
                style={{ flexShrink: 0 }}
              >
                Remove
              </button>
            )}
          </div>
        ))}

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={addClassField}
          >
            + Add Class
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #eee' }}>
          <button 
            className="btn btn-secondary" 
            onClick={cancelEditing}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary"
            onClick={saveClasses}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Classes'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3>Class Definitions</h3>
        {!isEditing && project.class_definitions && project.class_definitions.length > 0 && (
          <span style={{ fontSize: '0.875rem', color: '#666' }}>
            {project.class_definitions.length} {project.class_definitions.length === 1 ? 'class' : 'classes'}
          </span>
        )}
      </div>

      {isEditing ? renderClassEditor() : renderClassList()}
      
      {!isEditing && project.class_definitions && project.class_definitions.length > 0 && (
        <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px', fontSize: '0.875rem' }}>
          <strong>YOLO Format Info:</strong>
          <div style={{ marginTop: '0.5rem', color: '#666' }}>
            These classes will be used with IDs 0-{project.class_definitions.length - 1} in your YOLO label files.
            The order shown here determines the class IDs.
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;