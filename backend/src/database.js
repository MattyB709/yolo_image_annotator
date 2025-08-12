"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAnnotationsByImage = exports.deleteAnnotation = exports.updateAnnotation = exports.getAnnotation = exports.getAnnotations = exports.createAnnotation = exports.deleteImage = exports.getImage = exports.getImages = exports.createImage = exports.updateProjectClasses = exports.deleteProject = exports.getProject = exports.getProjects = exports.createProject = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = require("path");
const db = new better_sqlite3_1.default((0, path_1.join)(__dirname, '../../database/annotations.db'));
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
exports.createProject = db.prepare(`
  INSERT INTO projects (name, class_definitions) VALUES (?, ?)
`);
exports.getProjects = db.prepare(`
  SELECT * FROM projects ORDER BY created_at DESC
`);
exports.getProject = db.prepare(`
  SELECT * FROM projects WHERE id = ?
`);
exports.deleteProject = db.prepare(`
  DELETE FROM projects WHERE id = ?
`);
exports.updateProjectClasses = db.prepare(`
  UPDATE projects SET class_definitions = ? WHERE id = ?
`);
exports.createImage = db.prepare(`
  INSERT INTO images (project_id, filename, original_name, width, height)
  VALUES (?, ?, ?, ?, ?)
`);
exports.getImages = db.prepare(`
  SELECT * FROM images WHERE project_id = ? ORDER BY uploaded_at DESC
`);
exports.getImage = db.prepare(`
  SELECT * FROM images WHERE id = ?
`);
exports.deleteImage = db.prepare(`
  DELETE FROM images WHERE id = ?
`);
exports.createAnnotation = db.prepare(`
  INSERT INTO annotations (image_id, class_id, x_center, y_center, width, height)
  VALUES (?, ?, ?, ?, ?, ?)
`);
exports.getAnnotations = db.prepare(`
  SELECT * FROM annotations WHERE image_id = ? ORDER BY created_at DESC
`);
exports.getAnnotation = db.prepare(`
  SELECT * FROM annotations WHERE id = ?
`);
exports.updateAnnotation = db.prepare(`
  UPDATE annotations SET class_id = ?, x_center = ?, y_center = ?, width = ?, height = ?
  WHERE id = ?
`);
exports.deleteAnnotation = db.prepare(`
  DELETE FROM annotations WHERE id = ?
`);
exports.deleteAnnotationsByImage = db.prepare(`
  DELETE FROM annotations WHERE image_id = ?
`);
exports.default = db;
//# sourceMappingURL=database.js.map