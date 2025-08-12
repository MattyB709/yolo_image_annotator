import React, { useState } from 'react';
import { Project } from '../types';
import { projectApi } from '../services/api';

interface CreateProjectModalProps {
  onClose: () => void;
  onProjectCreated: (project: Project) => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ onClose, onProjectCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    classes: ['']
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, name: e.target.value });
  };

  const handleClassChange = (index: number, value: string) => {
    const newClasses = [...formData.classes];
    newClasses[index] = value;
    setFormData({ ...formData, classes: newClasses });
  };

  const addClassField = () => {
    setFormData({ ...formData, classes: [...formData.classes, ''] });
  };

  const removeClassField = (index: number) => {
    if (formData.classes.length > 1) {
      const newClasses = formData.classes.filter((_, i) => i !== index);
      setFormData({ ...formData, classes: newClasses });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    const validClasses = formData.classes
      .map(cls => cls.trim())
      .filter(cls => cls !== '');

    if (validClasses.length === 0) {
      setError('At least one class is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const newProject = await projectApi.createProject({
        name: formData.name.trim(),
        classes: validClasses
      });

      onProjectCreated(newProject);
    } catch (err: any) {
      console.error('Error creating project:', err);
      if (err.response?.status === 400) {
        setError(err.response.data.error || 'Invalid project data');
      } else {
        setError('Failed to create project. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal">
        <div className="modal-header">
          <h3>Create New Project</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="error" style={{ marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="projectName">Project Name</label>
              <input
                id="projectName"
                type="text"
                className="form-control"
                value={formData.name}
                onChange={handleNameChange}
                placeholder="Enter project name"
                required
              />
            </div>

            <div className="form-group">
              <label>Classes</label>
              <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                Define the object classes you want to annotate
              </div>
              
              {formData.classes.map((className, index) => (
                <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-control"
                    value={className}
                    onChange={(e) => handleClassChange(index, e.target.value)}
                    placeholder={`Class ${index + 1} (e.g., person, car)`}
                  />
                  {formData.classes.length > 1 && (
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
              
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={addClassField}
              >
                + Add Class
              </button>
            </div>
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;