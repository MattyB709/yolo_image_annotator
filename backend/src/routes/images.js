"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const sharp_1 = __importDefault(require("sharp"));
const path_1 = require("path");
const fs_1 = require("fs");
const uuid_1 = require("uuid");
const database_1 = require("../database");
const router = (0, express_1.Router)();
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const projectId = req.params.projectId || req.body.projectId;
        const uploadPath = (0, path_1.join)(__dirname, '../../../uploads', `project_${projectId}`);
        if (!(0, fs_1.existsSync)(uploadPath)) {
            (0, fs_1.mkdirSync)(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const extension = file.originalname.split('.').pop();
        const filename = `${(0, uuid_1.v4)()}.${extension}`;
        cb(null, filename);
    }
});
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Only JPG, JPEG, and PNG files are allowed'), false);
    }
};
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});
router.get('/project/:projectId', (req, res) => {
    try {
        const images = database_1.getImages.all(req.params.projectId);
        res.json(images);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch images' });
    }
});
router.post('/project/:projectId/upload', upload.array('images'), async (req, res) => {
    try {
        const { projectId } = req.params;
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }
        const results = [];
        for (const file of files) {
            try {
                const metadata = await (0, sharp_1.default)(file.path).metadata();
                const { width, height } = metadata;
                if (!width || !height) {
                    throw new Error('Could not determine image dimensions');
                }
                const result = database_1.createImage.run(projectId, file.filename, file.originalname, width, height);
                results.push({
                    id: result.lastInsertRowid,
                    filename: file.filename,
                    original_name: file.originalname,
                    width,
                    height
                });
            }
            catch (error) {
                console.error(`Error processing ${file.originalname}:`, error);
            }
        }
        res.status(201).json(results);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to upload images' });
    }
});
router.get('/:id', (req, res) => {
    try {
        const image = database_1.getImage.get(req.params.id);
        if (!image) {
            return res.status(404).json({ error: 'Image not found' });
        }
        res.json(image);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch image' });
    }
});
router.delete('/:id', (req, res) => {
    try {
        const image = database_1.getImage.get(req.params.id);
        if (!image) {
            return res.status(404).json({ error: 'Image not found' });
        }
        database_1.deleteAnnotationsByImage.run(req.params.id);
        const result = database_1.deleteImage.run(req.params.id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Image not found' });
        }
        try {
            const imagePath = (0, path_1.join)(__dirname, '../../../uploads', `project_${image.project_id}`, image.filename);
            if ((0, fs_1.existsSync)(imagePath)) {
                (0, fs_1.unlinkSync)(imagePath);
            }
        }
        catch (fileError) {
            console.error('Error deleting file:', fileError);
        }
        res.json({ message: 'Image deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete image' });
    }
});
exports.default = router;
//# sourceMappingURL=images.js.map