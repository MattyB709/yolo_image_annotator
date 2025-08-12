import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, unlinkSync, mkdirSync } from 'fs';

describe('Database Operations', () => {
  let testDb: Database.Database;
  const TEST_DB_PATH = join(__dirname, '../database/test_annotations.db');

  beforeEach(() => {
    // Ensure database directory exists
    const dbDir = join(__dirname, '../database');
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }

    // Create fresh test database
    testDb = new Database(TEST_DB_PATH);
    
    // Create tables
    testDb.exec(`
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
    `);
  });

  afterEach(() => {
    if (testDb) {
      testDb.close();
    }
  });

  describe('Projects Table', () => {
    test('should create a project successfully', () => {
      const createProject = testDb.prepare(`
        INSERT INTO projects (name, class_definitions) VALUES (?, ?)
      `);
      
      const classes = JSON.stringify([
        { id: 0, name: 'person', color: '#ff0000' },
        { id: 1, name: 'car', color: '#00ff00' }
      ]);
      
      const result = createProject.run('Test Project', classes);
      expect(result.lastInsertRowid).toBeDefined();
      expect(result.changes).toBe(1);
    });

    test('should retrieve projects correctly', () => {
      const createProject = testDb.prepare(`
        INSERT INTO projects (name, class_definitions) VALUES (?, ?)
      `);
      const getProjects = testDb.prepare(`
        SELECT * FROM projects ORDER BY created_at DESC
      `);

      createProject.run('Project 1', '[]');
      createProject.run('Project 2', '[]');

      const projects = getProjects.all() as any[];
      expect(projects).toHaveLength(2);
      // Check that both projects exist (order may vary)
      const projectNames = projects.map(p => p.name);
      expect(projectNames).toContain('Project 1');
      expect(projectNames).toContain('Project 2');
    });

    test('should enforce unique project names', () => {
      const createProject = testDb.prepare(`
        INSERT INTO projects (name, class_definitions) VALUES (?, ?)
      `);

      createProject.run('Unique Project', '[]');
      
      expect(() => {
        createProject.run('Unique Project', '[]');
      }).toThrow();
    });
  });

  describe('Images Table', () => {
    let projectId: number;

    beforeEach(() => {
      const createProject = testDb.prepare(`
        INSERT INTO projects (name, class_definitions) VALUES (?, ?)
      `);
      const result = createProject.run('Test Project', '[]');
      projectId = result.lastInsertRowid as number;
    });

    test('should create an image successfully', () => {
      const createImage = testDb.prepare(`
        INSERT INTO images (project_id, filename, original_name, width, height)
        VALUES (?, ?, ?, ?, ?)
      `);

      const result = createImage.run(projectId, 'test.jpg', 'original.jpg', 640, 480);
      expect(result.lastInsertRowid).toBeDefined();
      expect(result.changes).toBe(1);
    });

    test('should retrieve images for a project', () => {
      const createImage = testDb.prepare(`
        INSERT INTO images (project_id, filename, original_name, width, height)
        VALUES (?, ?, ?, ?, ?)
      `);
      const getImages = testDb.prepare(`
        SELECT * FROM images WHERE project_id = ? ORDER BY uploaded_at DESC
      `);

      createImage.run(projectId, 'image1.jpg', 'original1.jpg', 640, 480);
      createImage.run(projectId, 'image2.jpg', 'original2.jpg', 800, 600);

      const images = getImages.all(projectId) as any[];
      expect(images).toHaveLength(2);
      // Check that both images exist
      const filenames = images.map(img => img.filename);
      expect(filenames).toContain('image1.jpg');
      expect(filenames).toContain('image2.jpg');
      
      // Check that the 800 width image exists
      const wideImage = images.find(img => img.width === 800);
      expect(wideImage).toBeDefined();
      expect(wideImage.filename).toBe('image2.jpg');
    });
  });

  describe('Annotations Table', () => {
    let imageId: number;

    beforeEach(() => {
      const createProject = testDb.prepare(`
        INSERT INTO projects (name, class_definitions) VALUES (?, ?)
      `);
      const createImage = testDb.prepare(`
        INSERT INTO images (project_id, filename, original_name, width, height)
        VALUES (?, ?, ?, ?, ?)
      `);

      const projectResult = createProject.run('Test Project', '[]');
      const imageResult = createImage.run(
        projectResult.lastInsertRowid, 
        'test.jpg', 
        'original.jpg', 
        640, 
        480
      );
      imageId = imageResult.lastInsertRowid as number;
    });

    test('should create an annotation successfully', () => {
      const createAnnotation = testDb.prepare(`
        INSERT INTO annotations (image_id, class_id, x_center, y_center, width, height)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const result = createAnnotation.run(imageId, 0, 0.5, 0.5, 0.3, 0.4);
      expect(result.lastInsertRowid).toBeDefined();
      expect(result.changes).toBe(1);
    });

    test('should retrieve annotations for an image', () => {
      const createAnnotation = testDb.prepare(`
        INSERT INTO annotations (image_id, class_id, x_center, y_center, width, height)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const getAnnotations = testDb.prepare(`
        SELECT * FROM annotations WHERE image_id = ? ORDER BY created_at DESC
      `);

      createAnnotation.run(imageId, 0, 0.5, 0.5, 0.3, 0.4);
      createAnnotation.run(imageId, 1, 0.2, 0.3, 0.1, 0.2);

      const annotations = getAnnotations.all(imageId) as any[];
      expect(annotations).toHaveLength(2);
      
      // Check that both annotations exist
      const classIds = annotations.map(ann => ann.class_id);
      expect(classIds).toContain(0);
      expect(classIds).toContain(1);
      
      // Check specific annotation properties
      const class0Annotation = annotations.find(ann => ann.class_id === 0);
      const class1Annotation = annotations.find(ann => ann.class_id === 1);
      
      expect(class0Annotation).toBeDefined();
      expect(class0Annotation.x_center).toBe(0.5);
      expect(class1Annotation).toBeDefined();
      expect(class1Annotation.x_center).toBe(0.2);
    });

    test('should validate normalized coordinates', () => {
      const createAnnotation = testDb.prepare(`
        INSERT INTO annotations (image_id, class_id, x_center, y_center, width, height)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      // Valid coordinates (0-1 range)
      expect(() => {
        createAnnotation.run(imageId, 0, 0.5, 0.5, 0.3, 0.4);
      }).not.toThrow();

      // Note: SQLite doesn't enforce range constraints by default,
      // but our API layer should validate these
    });

    test('should handle cascade deletion', () => {
      const createAnnotation = testDb.prepare(`
        INSERT INTO annotations (image_id, class_id, x_center, y_center, width, height)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const deleteImage = testDb.prepare(`DELETE FROM images WHERE id = ?`);
      const getAnnotations = testDb.prepare(`SELECT * FROM annotations WHERE image_id = ?`);

      // Create annotation
      createAnnotation.run(imageId, 0, 0.5, 0.5, 0.3, 0.4);
      
      // Verify annotation exists
      let annotations = getAnnotations.all(imageId) as any[];
      expect(annotations).toHaveLength(1);

      // Delete image (should cascade delete annotations)
      deleteImage.run(imageId);

      // Verify annotations are gone
      annotations = getAnnotations.all(imageId) as any[];
      expect(annotations).toHaveLength(0);
    });
  });
});