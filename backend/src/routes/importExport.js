"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = require("path");
const fs_1 = require("fs");
const sharp_1 = __importDefault(require("sharp"));
const uuid_1 = require("uuid");
const archiver_1 = __importDefault(require("archiver"));
const database_1 = require("../database");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ dest: 'temp_uploads/' });
router.post('/projects/:id/import-yolo', upload.single('dataset'), async (req, res) => {
    // This will be implemented later - placeholder for now
    res.status(501).json({ error: 'Import functionality coming soon' });
});
router.get('/projects/:id/export-yolo', async (req, res) => {
    try {
        const { id } = req.params;
        const project = database_1.getProject.get(id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        const images = database_1.getImages.all(id);
        if (images.length === 0) {
            return res.status(400).json({ error: 'No images in project' });
        }
        const exportDir = (0, path_1.join)(__dirname, '../../../uploads', `export_${(0, uuid_1.v4)()}`);
        const imagesDir = (0, path_1.join)(exportDir, 'images', 'train');
        const labelsDir = (0, path_1.join)(exportDir, 'labels', 'train');
        (0, fs_1.mkdirSync)(imagesDir, { recursive: true });
        (0, fs_1.mkdirSync)(labelsDir, { recursive: true });
        const classDefinitions = JSON.parse(project.class_definitions);
        for (let i = 0; i < images.length; i++) {
            const image = images[i];
            const annotations = database_1.getAnnotations.all(image.id);
            const sourceImagePath = (0, path_1.join)(__dirname, '../../../uploads', `project_${id}`, image.filename);
            const targetImageName = `${i + 1}.jpg`;
            const targetImagePath = (0, path_1.join)(imagesDir, targetImageName);
            const targetLabelPath = (0, path_1.join)(labelsDir, `${i + 1}.txt`);
            if ((0, fs_1.existsSync)(sourceImagePath)) {
                (0, fs_1.copyFileSync)(sourceImagePath, targetImagePath);
            }
            const labelContent = annotations.map(annotation => `${annotation.class_id} ${annotation.x_center} ${annotation.y_center} ${annotation.width} ${annotation.height}`).join('\n');
            (0, fs_1.writeFileSync)(targetLabelPath, labelContent);
        }
        const classesContent = classDefinitions.map((cls) => cls.name).join('\n');
        (0, fs_1.writeFileSync)((0, path_1.join)(exportDir, 'classes.txt'), classesContent);
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${project.name}_yolo_dataset.zip"`);
        const archive = (0, archiver_1.default)('zip');
        archive.pipe(res);
        archive.directory(exportDir, false);
        archive.finalize();
    }
    catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Failed to export dataset' });
    }
});
exports.default = router;
//# sourceMappingURL=importExport.js.map