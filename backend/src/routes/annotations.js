"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../database");
const router = (0, express_1.Router)();
router.get('/image/:imageId', (req, res) => {
    try {
        const annotations = database_1.getAnnotations.all(req.params.imageId);
        res.json(annotations);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch annotations' });
    }
});
router.post('/image/:imageId', (req, res) => {
    try {
        const { imageId } = req.params;
        const { class_id, x_center, y_center, width, height } = req.body;
        if (typeof class_id !== 'number' ||
            typeof x_center !== 'number' ||
            typeof y_center !== 'number' ||
            typeof width !== 'number' ||
            typeof height !== 'number') {
            return res.status(400).json({
                error: 'All annotation fields must be numbers'
            });
        }
        if (x_center < 0 || x_center > 1 || y_center < 0 || y_center > 1 ||
            width < 0 || width > 1 || height < 0 || height > 1) {
            return res.status(400).json({
                error: 'Coordinates must be normalized between 0 and 1'
            });
        }
        const result = database_1.createAnnotation.run(imageId, class_id, x_center, y_center, width, height);
        res.status(201).json({
            id: result.lastInsertRowid,
            image_id: parseInt(imageId),
            class_id,
            x_center,
            y_center,
            width,
            height
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create annotation' });
    }
});
router.get('/:id', (req, res) => {
    try {
        const annotation = database_1.getAnnotation.get(req.params.id);
        if (!annotation) {
            return res.status(404).json({ error: 'Annotation not found' });
        }
        res.json(annotation);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch annotation' });
    }
});
router.put('/:id', (req, res) => {
    try {
        const { class_id, x_center, y_center, width, height } = req.body;
        if (typeof class_id !== 'number' ||
            typeof x_center !== 'number' ||
            typeof y_center !== 'number' ||
            typeof width !== 'number' ||
            typeof height !== 'number') {
            return res.status(400).json({
                error: 'All annotation fields must be numbers'
            });
        }
        if (x_center < 0 || x_center > 1 || y_center < 0 || y_center > 1 ||
            width < 0 || width > 1 || height < 0 || height > 1) {
            return res.status(400).json({
                error: 'Coordinates must be normalized between 0 and 1'
            });
        }
        const result = database_1.updateAnnotation.run(class_id, x_center, y_center, width, height, req.params.id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Annotation not found' });
        }
        res.json({
            id: parseInt(req.params.id),
            class_id,
            x_center,
            y_center,
            width,
            height
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update annotation' });
    }
});
router.delete('/:id', (req, res) => {
    try {
        const result = database_1.deleteAnnotation.run(req.params.id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Annotation not found' });
        }
        res.json({ message: 'Annotation deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete annotation' });
    }
});
exports.default = router;
//# sourceMappingURL=annotations.js.map