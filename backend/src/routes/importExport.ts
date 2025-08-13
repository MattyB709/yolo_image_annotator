import { Router } from 'express';
import multer from 'multer';
import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, copyFileSync, rmSync } from 'fs';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import archiver from 'archiver';
import AdmZip from 'adm-zip';
import { 
  getProject, 
  createImage, 
  createAnnotation, 
  getImages, 
  getAnnotations,
  Project,
  Image,
  Annotation,
  ClassDefinition
} from '../database';

const router = Router();

const upload = multer({ dest: 'temp_uploads/' });

router.post('/projects/:id/import-yolo', upload.single('dataset'), async (req, res) => {
  try {
    const { id } = req.params;
    const project = getProject.get(parseInt(id)) as Project;
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No dataset file provided' });
    }

    const tempExtractPath = join(__dirname, '../../../temp_extract', uuidv4());
    mkdirSync(tempExtractPath, { recursive: true });

    try {
      // Extract zip file
      const zip = new AdmZip(req.file.path);
      zip.extractAllTo(tempExtractPath, true);

      // Look for standard YOLO structure: images/ and labels/ folders
      const extractedContents = readdirSync(tempExtractPath);
      let imagesDir = '';
      let labelsDir = '';
      let classesFile = '';

      // Find directories and files
      for (const item of extractedContents) {
        const itemPath = join(tempExtractPath, item);
        if (item.toLowerCase().includes('image') || item === 'train') {
          imagesDir = itemPath;
        } else if (item.toLowerCase().includes('label') || item.toLowerCase().includes('annotation')) {
          labelsDir = itemPath;
        } else if (item.toLowerCase() === 'classes.txt' || item.toLowerCase() === 'names.txt') {
          classesFile = itemPath;
        }
      }

      // Handle nested structure (images/train/, labels/train/)
      if (imagesDir && existsSync(join(imagesDir, 'train'))) {
        imagesDir = join(imagesDir, 'train');
      }
      if (labelsDir && existsSync(join(labelsDir, 'train'))) {
        labelsDir = join(labelsDir, 'train');
      }

      if (!imagesDir || !existsSync(imagesDir)) {
        return res.status(400).json({ error: 'No images directory found in dataset' });
      }

      if (!labelsDir || !existsSync(labelsDir)) {
        return res.status(400).json({ error: 'No labels directory found in dataset' });
      }

      // Read class names if available
      let classNames: string[] = [];
      if (classesFile && existsSync(classesFile)) {
        const classContent = readFileSync(classesFile, 'utf8');
        classNames = classContent.trim().split('\n').filter(name => name.trim());
      }

      // Get image files
      const imageFiles = readdirSync(imagesDir).filter(file => 
        /\.(jpg|jpeg|png)$/i.test(file)
      );

      if (imageFiles.length === 0) {
        return res.status(400).json({ error: 'No valid image files found in dataset' });
      }

      const importResults = {
        imagesImported: 0,
        annotationsImported: 0,
        classesFound: classNames.length,
        errors: [] as string[]
      };

      // Create project upload directory
      const projectUploadDir = join(__dirname, '../../../uploads', `project_${id}`);
      mkdirSync(projectUploadDir, { recursive: true });

      // Process each image
      for (const imageFile of imageFiles) {
        try {
          const imagePath = join(imagesDir, imageFile);
          const labelFile = imageFile.replace(/\.(jpg|jpeg|png)$/i, '.txt');
          const labelPath = join(labelsDir, labelFile);

          // Get image metadata
          const metadata = await sharp(imagePath).metadata();
          if (!metadata.width || !metadata.height) {
            importResults.errors.push(`Could not read dimensions for ${imageFile}`);
            continue;
          }

          // Copy image to project directory
          const newFilename = `${uuidv4()}.${imageFile.split('.').pop()}`;
          const newImagePath = join(projectUploadDir, newFilename);
          copyFileSync(imagePath, newImagePath);

          // Create image record
          const imageResult = createImage.run(
            id,
            newFilename,
            imageFile,
            metadata.width,
            metadata.height
          );

          const imageId = imageResult.lastInsertRowid as number;
          importResults.imagesImported++;

          // Process annotations if label file exists
          if (existsSync(labelPath)) {
            const labelContent = readFileSync(labelPath, 'utf8').trim();
            if (labelContent) {
              const lines = labelContent.split('\n');
              
              for (const line of lines) {
                const parts = line.trim().split(/\s+/);
                if (parts.length === 5) {
                  const [classId, xCenter, yCenter, width, height] = parts.map(Number);
                  
                  if (!isNaN(classId) && !isNaN(xCenter) && !isNaN(yCenter) && 
                      !isNaN(width) && !isNaN(height)) {
                    
                    createAnnotation.run(
                      imageId,
                      classId,
                      xCenter,
                      yCenter,
                      width,
                      height
                    );
                    
                    importResults.annotationsImported++;
                  }
                }
              }
            }
          }
        } catch (error) {
          importResults.errors.push(`Error processing ${imageFile}: ${error}`);
        }
      }

      // Clean up temp files
      rmSync(tempExtractPath, { recursive: true, force: true });
      rmSync(req.file.path, { force: true });

      res.json({
        success: true,
        message: 'YOLO dataset imported successfully',
        results: importResults
      });

    } catch (extractError) {
      // Clean up on error
      rmSync(tempExtractPath, { recursive: true, force: true });
      rmSync(req.file.path, { force: true });
      throw extractError;
    }

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Failed to import dataset' });
  }
});

router.get('/projects/:id/export-yolo', async (req, res) => {
  try {
    const { id } = req.params;
    const project = getProject.get(parseInt(id)) as Project;
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const images = getImages.all(parseInt(id)) as Image[];
    if (images.length === 0) {
      return res.status(400).json({ error: 'No images in project' });
    }

    const exportDir = join(__dirname, '../../../uploads', `export_${uuidv4()}`);
    const imagesDir = join(exportDir, 'images', 'train');
    const labelsDir = join(exportDir, 'labels', 'train');

    mkdirSync(imagesDir, { recursive: true });
    mkdirSync(labelsDir, { recursive: true });

    const classDefinitions = JSON.parse(project.class_definitions);
    let exportedCount = 0;
    const trainPaths = new Set<string>();
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i] as Image;
      const annotations = getAnnotations.all(image.id) as Annotation[];
      
      const sourceImagePath = join(__dirname, '../../../uploads', `project_${id}`, image.filename);
      
      if (!existsSync(sourceImagePath)) {
        console.warn(`Source image not found: ${sourceImagePath}`);
        continue;
      }

      // Use original filename for exported files
      const targetImageName = image.original_name;
      const targetImagePath = join(imagesDir, targetImageName);
      const targetLabelPath = join(labelsDir, targetImageName.replace(/\.(jpg|jpeg|png)$/i, '.txt'));

      try {
        // Copy image preserving original format and filename
        copyFileSync(sourceImagePath, targetImagePath);

        // Create label file content
        const labelContent = annotations.map((annotation: Annotation) => {
          // Ensure coordinates are properly formatted with sufficient precision
          const x_center = Number(annotation.x_center.toFixed(6));
          const y_center = Number(annotation.y_center.toFixed(6));
          const width = Number(annotation.width.toFixed(6));
          const height = Number(annotation.height.toFixed(6));
          
          return `${annotation.class_id} ${x_center} ${y_center} ${width} ${height}`;
        }).join('\n');
        
        writeFileSync(targetLabelPath, labelContent);
        
        // Only add to train paths after successful export (and count unique exports)
        const pathToAdd = `images/train/${targetImageName}`;
        const wasNewPath = !trainPaths.has(pathToAdd);
        trainPaths.add(pathToAdd);
        
        // Only increment counter for truly new files
        if (wasNewPath) {
          exportedCount++;
        }
        
      } catch (error) {
        console.error(`Error processing image ${image.filename}:`, error);
      }
    }

    if (exportedCount === 0) {
      return res.status(400).json({ error: 'No images could be exported' });
    }

    // Create train.txt file with image paths
    const trainContent = Array.from(trainPaths).join('\n');
    writeFileSync(join(exportDir, 'train.txt'), trainContent);

    // Create classes.txt file
    const classesContent = classDefinitions.map((cls: ClassDefinition) => cls.name).join('\n');
    writeFileSync(join(exportDir, 'classes.txt'), classesContent);

    // Create data.yaml file for easier YOLOv5/YOLOv8 usage
    const yamlContent = `# YOLO dataset configuration
train: images/train
val: images/train  # Using train set as val for this export
nc: ${classDefinitions.length}
names: [${classDefinitions.map((cls: ClassDefinition) => `'${cls.name}'`).join(', ')}]
`;
    writeFileSync(join(exportDir, 'data.yaml'), yamlContent);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${project.name}_yolo_dataset.zip"`);

    const archive = archiver('zip');
    archive.pipe(res);
    archive.directory(exportDir, false);
    
    // Clean up temp directory after archive is finalized
    archive.on('end', () => {
      setTimeout(() => {
        rmSync(exportDir, { recursive: true, force: true });
      }, 5000); // Wait 5 seconds to ensure download is complete
    });
    
    archive.finalize();

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export dataset' });
  }
});

export default router;