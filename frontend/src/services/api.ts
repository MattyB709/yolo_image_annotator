import axios from 'axios';
import { Project, ClassDefinition, Image, Annotation } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const projectApi = {
  // Get all projects
  getProjects: async (): Promise<Project[]> => {
    const response = await api.get('/projects');
    return response.data;
  },

  // Get specific project
  getProject: async (id: number): Promise<Project> => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  // Create new project
  createProject: async (data: { name: string; classes: string[] }): Promise<Project> => {
    const response = await api.post('/projects', data);
    return response.data;
  },

  // Update project classes
  updateProjectClasses: async (id: number, classes: string[]): Promise<{ class_definitions: ClassDefinition[] }> => {
    const response = await api.put(`/projects/${id}/classes`, { classes });
    return response.data;
  },

  // Delete project
  deleteProject: async (id: number): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },
};

export const imageApi = {
  // Get images for a project
  getImages: async (projectId: number): Promise<Image[]> => {
    const response = await api.get(`/images/project/${projectId}`);
    return response.data;
  },

  // Upload images to a project
  uploadImages: async (projectId: number, files: FileList): Promise<Image[]> => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('images', file);
    });

    const response = await api.post(`/images/project/${projectId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete an image
  deleteImage: async (imageId: number): Promise<void> => {
    await api.delete(`/images/${imageId}`);
  },

  // Get image URL
  getImageUrl: (projectId: number, filename: string): string => {
    return `${API_BASE_URL.replace('/api', '')}/uploads/project_${projectId}/${filename}`;
  },

  // Get thumbnail URL
  getThumbnailUrl: (imageId: number, size: 'small' | 'medium' | 'large' = 'medium'): string => {
    return `${API_BASE_URL}/thumbnails/${imageId}/${size}`;
  },
};

export const annotationApi = {
  // Get annotations for an image
  getAnnotations: async (imageId: number): Promise<Annotation[]> => {
    const response = await api.get(`/annotations/image/${imageId}`);
    return response.data;
  },

  // Create new annotation
  createAnnotation: async (imageId: number, annotation: {
    class_id: number;
    x_center: number;
    y_center: number;
    width: number;
    height: number;
  }): Promise<Annotation> => {
    const response = await api.post(`/annotations/image/${imageId}`, annotation);
    return response.data;
  },

  // Update existing annotation
  updateAnnotation: async (annotationId: number, annotation: {
    class_id: number;
    x_center: number;
    y_center: number;
    width: number;
    height: number;
  }): Promise<Annotation> => {
    const response = await api.put(`/annotations/${annotationId}`, annotation);
    return response.data;
  },

  // Delete annotation
  deleteAnnotation: async (annotationId: number): Promise<void> => {
    await api.delete(`/annotations/${annotationId}`);
  },
};

export const importExportApi = {
  // Import YOLO dataset
  importYoloDataset: async (projectId: number, file: File): Promise<{
    success: boolean;
    message: string;
    results: {
      imagesImported: number;
      annotationsImported: number;
      classesFound: number;
      errors: string[];
    };
  }> => {
    const formData = new FormData();
    formData.append('dataset', file);

    const response = await api.post(`/projects/${projectId}/import-yolo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Export YOLO dataset
  exportYoloDataset: async (projectId: number): Promise<Blob> => {
    const response = await api.get(`/projects/${projectId}/export-yolo`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Get export URL for direct download
  getExportUrl: (projectId: number): string => {
    return `${API_BASE_URL}/projects/${projectId}/export-yolo`;
  },
};

export default api;