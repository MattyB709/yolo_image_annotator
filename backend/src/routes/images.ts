import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { join } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { 
  createImage, 
  getImages, 
  getImage, 
  deleteImage, 
  deleteAnnotationsByImage,
  Image
} from '../database';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const projectId = req.params.projectId || req.body.projectId;
    const uploadPath = join(__dirname, '../../../uploads', `project_${projectId}`);
    
    if (!existsSync(uploadPath)) {
      mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const extension = file.originalname.split('.').pop();
    const filename = `${uuidv4()}.${extension}`;
    cb(null, filename);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, JPEG, and PNG files are allowed'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.get('/project/:projectId', (req, res) => {
  try {
    const images = getImages.all(parseInt(req.params.projectId));
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

router.post('/project/:projectId/upload', upload.array('images'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const results = [];
    
    for (const file of files) {
      try {
        const metadata = await sharp(file.path).metadata();
        const { width, height } = metadata;
        
        if (!width || !height) {
          throw new Error('Could not determine image dimensions');
        }

        const result = createImage.run(
          projectId,
          file.filename,
          file.originalname,
          width,
          height
        );

        results.push({
          id: result.lastInsertRowid,
          filename: file.filename,
          original_name: file.originalname,
          width,
          height
        });
      } catch (error) {
        console.error(`Error processing ${file.originalname}:`, error);
      }
    }
    
    res.status(201).json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const image = getImage.get(parseInt(req.params.id));
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    res.json(image);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const image = getImage.get(parseInt(req.params.id)) as Image;
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    deleteAnnotationsByImage.run(parseInt(req.params.id));
    
    const result = deleteImage.run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    try {
      const imagePath = join(__dirname, '../../../uploads', `project_${image.project_id}`, image.filename);
      if (existsSync(imagePath)) {
        unlinkSync(imagePath);
      }
    } catch (fileError) {
      console.error('Error deleting file:', fileError);
    }
    
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

export default router;