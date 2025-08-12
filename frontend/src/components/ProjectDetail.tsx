import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Project, Image } from '../types';
import { projectApi, imageApi, importExportApi } from '../services/api';
import ClassManagement from './ClassManagement';
import ImageUpload from './ImageUpload';
import ImageGallery from './ImageGallery';
import ImageViewer from './ImageViewer';
import AnnotationInterface from './AnnotationInterface';

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [images, setImages] = useState<Image[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [annotatingImage, setAnnotatingImage] = useState<Image | null>(null);
  const [currentTab, setCurrentTab] = useState<'classes' | 'images'>('classes');
  const [importLoading, setImportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const loadProject = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError('');
      const data = await projectApi.getProject(parseInt(id));
      setProject(data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Project not found');
      } else {
        setError('Failed to load project. Make sure the server is running.');
      }
      console.error('Error loading project:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadImages = async () => {
    if (!id) return;
    
    try {
      setImagesLoading(true);
      const data = await imageApi.getImages(parseInt(id));
      setImages(data);
    } catch (err) {
      console.error('Error loading images:', err);
    } finally {
      setImagesLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
    loadImages();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClassesUpdated = (updatedClasses: any) => {
    if (project) {
      setProject({
        ...project,
        class_definitions: updatedClasses.class_definitions
      });
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    
    if (window.confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      try {
        await projectApi.deleteProject(project.id);
        navigate('/');
      } catch (err) {
        alert('Failed to delete project');
        console.error('Error deleting project:', err);
      }
    }
  };

  const handleImagesUploaded = (newImages: Image[]) => {
    setImages(prevImages => [...newImages, ...prevImages]);
  };

  const handleImageDeleted = (imageId: number) => {
    setImages(prevImages => prevImages.filter(img => img.id !== imageId));
  };

  const handleImageClick = (image: Image) => {
    setSelectedImage(image);
  };

  const handleImageViewerNext = () => {
    if (!selectedImage) return;
    const currentIndex = images.findIndex(img => img.id === selectedImage.id);
    if (currentIndex < images.length - 1) {
      setSelectedImage(images[currentIndex + 1]);
    }
  };

  const handleImageViewerPrevious = () => {
    if (!selectedImage) return;
    const currentIndex = images.findIndex(img => img.id === selectedImage.id);
    if (currentIndex > 0) {
      setSelectedImage(images[currentIndex - 1]);
    }
  };

  const handleAnnotateClick = (image: Image) => {
    setAnnotatingImage(image);
  };

  const handleAnnotationNext = () => {
    if (!annotatingImage) return;
    const currentIndex = images.findIndex(img => img.id === annotatingImage.id);
    if (currentIndex < images.length - 1) {
      setAnnotatingImage(images[currentIndex + 1]);
    }
  };

  const handleAnnotationPrevious = () => {
    if (!annotatingImage) return;
    const currentIndex = images.findIndex(img => img.id === annotatingImage.id);
    if (currentIndex > 0) {
      setAnnotatingImage(images[currentIndex - 1]);
    }
  };

  const handleImportDataset = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !id) return;

    if (!file.name.toLowerCase().endsWith('.zip')) {
      alert('Please select a ZIP file containing your YOLO dataset.');
      return;
    }

    setImportLoading(true);
    try {
      const result = await importExportApi.importYoloDataset(parseInt(id), file);
      
      if (result.success) {
        const { imagesImported, annotationsImported, classesFound, errors } = result.results;
        
        let message = `Dataset imported successfully!\n\n`;
        message += `• Images imported: ${imagesImported}\n`;
        message += `• Annotations imported: ${annotationsImported}\n`;
        message += `• Classes found: ${classesFound}\n`;
        
        if (errors.length > 0) {
          message += `\nWarnings:\n${errors.slice(0, 5).join('\n')}`;
          if (errors.length > 5) {
            message += `\n... and ${errors.length - 5} more issues`;
          }
        }
        
        alert(message);
        
        // Refresh data
        loadProject();
        loadImages();
      } else {
        alert('Import failed: ' + result.message);
      }
    } catch (error: any) {
      alert('Import failed: ' + (error.response?.data?.error || 'Unknown error'));
      console.error('Import error:', error);
    } finally {
      setImportLoading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleExportDataset = async () => {
    if (!id || !project) return;

    if (images.length === 0) {
      alert('No images to export. Please upload some images first.');
      return;
    }

    setExportLoading(true);
    try {
      // Use direct download URL
      const exportUrl = importExportApi.getExportUrl(parseInt(id));
      const link = document.createElement('a');
      link.href = exportUrl;
      link.download = `${project.name}_yolo_dataset.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      alert('Export failed: ' + (error.response?.data?.error || 'Unknown error'));
      console.error('Export error:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    // Convert SQL datetime format to ISO format
    const isoDate = dateString.replace(' ', 'T') + 'Z';
    return new Date(isoDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="loading">
        <span>Loading project...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="error">
          <strong>Error:</strong> {error}
        </div>
        <div style={{ marginTop: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            ← Back to Projects
          </button>
          <button 
            className="btn btn-primary" 
            onClick={loadProject}
            style={{ marginLeft: '1rem' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <button 
            className="btn btn-secondary" 
            onClick={() => navigate('/')}
            style={{ marginRight: '1rem' }}
          >
            ← Back to Projects
          </button>
          <h2 style={{ display: 'inline', margin: 0 }}>{project.name}</h2>
        </div>
        <button 
          className="btn btn-danger"
          onClick={handleDeleteProject}
        >
          Delete Project
        </button>
      </div>

      {/* Project Info Card */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>Project Information</h3>
        <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <p><strong>Name:</strong> {project.name}</p>
            <p><strong>Created:</strong> {formatDate(project.created_at)}</p>
          </div>
          <div>
            <p><strong>Classes:</strong> {project.class_definitions?.length || 0}</p>
            <p><strong>Images:</strong> {images.length}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button
          className={`btn ${currentTab === 'classes' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setCurrentTab('classes')}
        >
          Classes ({project.class_definitions?.length || 0})
        </button>
        <button
          className={`btn ${currentTab === 'images' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setCurrentTab('images')}
        >
          Images ({images.length})
        </button>
      </div>

      {/* YOLO Import/Export Actions */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>YOLO Dataset</h3>
        <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
          Import existing YOLO datasets or export your annotated project for training.
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {/* Import */}
          <div>
            <input
              type="file"
              accept=".zip"
              onChange={handleImportDataset}
              disabled={importLoading}
              style={{ display: 'none' }}
              id="import-dataset"
            />
            <label
              htmlFor="import-dataset"
              className={`btn btn-secondary ${importLoading ? 'disabled' : ''}`}
              style={{ 
                cursor: importLoading ? 'not-allowed' : 'pointer',
                opacity: importLoading ? 0.6 : 1
              }}
            >
              {importLoading ? '📥 Importing...' : '📥 Import YOLO Dataset'}
            </label>
          </div>

          {/* Export */}
          <button
            className="btn btn-primary"
            onClick={handleExportDataset}
            disabled={exportLoading || images.length === 0}
            style={{ 
              opacity: (exportLoading || images.length === 0) ? 0.6 : 1 
            }}
          >
            {exportLoading ? '📤 Exporting...' : '📤 Export YOLO Dataset'}
          </button>

          {images.length === 0 && (
            <span style={{ fontSize: '0.875rem', color: '#666' }}>
              Upload images to enable export
            </span>
          )}
        </div>

        <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#666' }}>
          <div><strong>Import:</strong> ZIP file with images/ and labels/ folders (YOLO format)</div>
          <div><strong>Export:</strong> Downloads ZIP with images/train/, labels/train/, classes.txt, and data.yaml</div>
        </div>
      </div>

      {/* Tab Content */}
      {currentTab === 'classes' && (
        <ClassManagement 
          project={project} 
          onClassesUpdated={handleClassesUpdated}
        />
      )}

      {currentTab === 'images' && (
        <div>
          {/* Image Upload */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3>Upload Images</h3>
            <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
              Upload images to start annotating objects for your YOLO dataset.
            </p>
            <ImageUpload 
              projectId={project.id} 
              onImagesUploaded={handleImagesUploaded}
            />
          </div>

          {/* Image Gallery */}
          <div className="card">
            <h3>Image Gallery</h3>
            {imagesLoading ? (
              <div className="loading">Loading images...</div>
            ) : (
              <ImageGallery
                projectId={project.id}
                images={images}
                onImageClick={handleImageClick}
                onImageDeleted={handleImageDeleted}
                onRefresh={loadImages}
                onAnnotateClick={handleAnnotateClick}
              />
            )}
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {selectedImage && (
        <ImageViewer
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onNext={handleImageViewerNext}
          onPrevious={handleImageViewerPrevious}
          hasNext={images.findIndex(img => img.id === selectedImage.id) < images.length - 1}
          hasPrevious={images.findIndex(img => img.id === selectedImage.id) > 0}
        />
      )}

      {/* Annotation Interface Modal */}
      {annotatingImage && project && (
        <AnnotationInterface
          image={annotatingImage}
          classDefinitions={project.class_definitions || []}
          onClose={() => setAnnotatingImage(null)}
          onNext={handleAnnotationNext}
          onPrevious={handleAnnotationPrevious}
          hasNext={images.findIndex(img => img.id === annotatingImage.id) < images.length - 1}
          hasPrevious={images.findIndex(img => img.id === annotatingImage.id) > 0}
        />
      )}
    </div>
  );
};

export default ProjectDetail;