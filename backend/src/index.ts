import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import sharp from 'sharp';
import projectRoutes from './routes/projects';
import imageRoutes from './routes/images';
import annotationRoutes from './routes/annotations';
import importExportRoutes from './routes/importExport';
import thumbnailRoutes from './routes/thumbnails';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uploadsDir = join(__dirname, '../../uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static(uploadsDir));

app.use('/api/projects', projectRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/annotations', annotationRoutes);
app.use('/api/thumbnails', thumbnailRoutes);
app.use('/api', importExportRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'YOLO Annotation Tool API' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});