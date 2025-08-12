import { Router } from 'express';
import sharp from 'sharp';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { getImage, Image } from '../database';

const router = Router();

const THUMBNAIL_SIZES = {
  small: 150,
  medium: 300,
  large: 600
};

// Generate thumbnail endpoint
router.get('/:imageId/:size', async (req, res) => {
  try {
    const { imageId, size } = req.params;
    
    if (!Object.keys(THUMBNAIL_SIZES).includes(size)) {
      return res.status(400).json({ error: 'Invalid thumbnail size. Use: small, medium, large' });
    }

    const image = getImage.get(parseInt(imageId)) as Image;
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const thumbnailSize = THUMBNAIL_SIZES[size as keyof typeof THUMBNAIL_SIZES];
    const originalPath = join(__dirname, '../../../uploads', `project_${image.project_id}`, image.filename);
    const thumbnailDir = join(__dirname, '../../../uploads', 'thumbnails', size);
    const thumbnailPath = join(thumbnailDir, `${image.id}_${image.filename}`);

    // Create thumbnail directory if it doesn't exist
    if (!existsSync(thumbnailDir)) {
      mkdirSync(thumbnailDir, { recursive: true });
    }

    // Check if original image exists
    if (!existsSync(originalPath)) {
      return res.status(404).json({ error: 'Original image file not found' });
    }

    // Generate thumbnail if it doesn't exist or is older than original
    if (!existsSync(thumbnailPath)) {
      await sharp(originalPath)
        .resize(thumbnailSize, thumbnailSize, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 85 })
        .toFile(thumbnailPath);
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
    
    // Send thumbnail
    res.sendFile(thumbnailPath);

  } catch (error) {
    console.error('Thumbnail generation error:', error);
    res.status(500).json({ error: 'Failed to generate thumbnail' });
  }
});

export default router;