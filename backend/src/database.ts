import Database from 'better-sqlite3';
import { join } from 'path';

const db = new Database(join(__dirname, '../../database/annotations.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    class_definitions TEXT DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS annotations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    x_center REAL NOT NULL,
    y_center REAL NOT NULL,
    width REAL NOT NULL,
    height REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (image_id) REFERENCES images (id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_images_project_id ON images(project_id);
  CREATE INDEX IF NOT EXISTS idx_annotations_image_id ON annotations(image_id);
`);

export interface Project {
  id: number;
  name: string;
  created_at: string;
  class_definitions: string;
}

export interface Image {
  id: number;
  project_id: number;
  filename: string;
  original_name: string;
  width: number;
  height: number;
  uploaded_at: string;
}

export interface Annotation {
  id: number;
  image_id: number;
  class_id: number;
  x_center: number;
  y_center: number;
  width: number;
  height: number;
  created_at: string;
}

export interface ClassDefinition {
  id: number;
  name: string;
  color: string;
}

export const createProject = db.prepare(`
  INSERT INTO projects (name, class_definitions) VALUES (?, ?)
`);

export const getProjects = db.prepare(`
  SELECT * FROM projects ORDER BY created_at DESC
`);

export const getProject = db.prepare(`
  SELECT * FROM projects WHERE id = ?
`);

export const deleteProject = db.prepare(`
  DELETE FROM projects WHERE id = ?
`);

export const updateProjectClasses = db.prepare(`
  UPDATE projects SET class_definitions = ? WHERE id = ?
`);

export const createImage = db.prepare(`
  INSERT INTO images (project_id, filename, original_name, width, height)
  VALUES (?, ?, ?, ?, ?)
`);

export const getImages = db.prepare(`
  SELECT * FROM images WHERE project_id = ? ORDER BY uploaded_at DESC
`);

export const getImage = db.prepare(`
  SELECT * FROM images WHERE id = ?
`);

export const deleteImage = db.prepare(`
  DELETE FROM images WHERE id = ?
`);

export const createAnnotation = db.prepare(`
  INSERT INTO annotations (image_id, class_id, x_center, y_center, width, height)
  VALUES (?, ?, ?, ?, ?, ?)
`);

export const getAnnotations = db.prepare(`
  SELECT * FROM annotations WHERE image_id = ? ORDER BY created_at DESC
`);

export const getAnnotation = db.prepare(`
  SELECT * FROM annotations WHERE id = ?
`);

export const updateAnnotation = db.prepare(`
  UPDATE annotations SET class_id = ?, x_center = ?, y_center = ?, width = ?, height = ?
  WHERE id = ?
`);

export const deleteAnnotation = db.prepare(`
  DELETE FROM annotations WHERE id = ?
`);

export const deleteAnnotationsByImage = db.prepare(`
  DELETE FROM annotations WHERE image_id = ?
`);

export default db;