import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project } from '../types';
import { projectApi } from '../services/api';
import CreateProjectModal from './CreateProjectModal';

const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await projectApi.getProjects();
      setProjects(data);
    } catch (err) {
      setError('Failed to load projects. Make sure the server is running.');
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleProjectCreated = (newProject: Project) => {
    setProjects([newProject, ...projects]);
    setShowCreateModal(false);
  };

  const handleProjectClick = (project: Project) => {
    navigate(`/projects/${project.id}`);
  };

  const handleDeleteProject = async (project: Project, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent navigation
    
    if (window.confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      try {
        await projectApi.deleteProject(project.id);
        setProjects(projects.filter(p => p.id !== project.id));
      } catch (err) {
        alert('Failed to delete project');
        console.error('Error deleting project:', err);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="loading">
        <span>Loading projects...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="error">
          <strong>Error:</strong> {error}
        </div>
        <button 
          className="btn btn-primary" 
          onClick={loadProjects}
          style={{ marginTop: '1rem' }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>My Projects</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          + Create Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <h3>No projects yet</h3>
          <p>Create your first YOLO annotation project to get started.</p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
            style={{ marginTop: '1rem' }}
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="project-grid">
          {projects.map((project) => (
            <div 
              key={project.id} 
              className="project-card"
              onClick={() => handleProjectClick(project)}
            >
              <h3>{project.name}</h3>
              <div className="project-meta">
                Created {formatDate(project.created_at)}
              </div>
              
              {project.class_definitions && project.class_definitions.length > 0 && (
                <div className="class-list">
                  {project.class_definitions.map((classDef) => (
                    <span 
                      key={classDef.id} 
                      className="class-tag"
                      style={{ backgroundColor: classDef.color }}
                    >
                      {classDef.name}
                    </span>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                  {project.class_definitions?.length || 0} classes
                </span>
                <button
                  className="btn btn-danger btn-small"
                  onClick={(e) => handleDeleteProject(project, e)}
                  title="Delete project"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onProjectCreated={handleProjectCreated}
        />
      )}
    </div>
  );
};

export default ProjectList;