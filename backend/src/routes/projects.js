"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../database");
const router = (0, express_1.Router)();
router.get('/', (req, res) => {
    try {
        const projects = database_1.getProjects.all();
        const projectsWithClasses = projects.map(project => ({
            ...project,
            class_definitions: JSON.parse(project.class_definitions)
        }));
        res.json(projectsWithClasses);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});
router.post('/', (req, res) => {
    try {
        const { name, classes = [] } = req.body;
        if (!name || typeof name !== 'string') {
            return res.status(400).json({ error: 'Project name is required' });
        }
        const classDefinitions = classes.map((className, index) => ({
            id: index,
            name: className,
            color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`
        }));
        const result = database_1.createProject.run(name, JSON.stringify(classDefinitions));
        res.status(201).json({
            id: result.lastInsertRowid,
            name,
            class_definitions: classDefinitions
        });
    }
    catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            res.status(400).json({ error: 'Project name already exists' });
        }
        else {
            res.status(500).json({ error: 'Failed to create project' });
        }
    }
});
router.get('/:id', (req, res) => {
    try {
        const project = database_1.getProject.get(req.params.id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        const projectWithClasses = {
            ...project,
            class_definitions: JSON.parse(project.class_definitions)
        };
        res.json(projectWithClasses);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});
router.put('/:id/classes', (req, res) => {
    try {
        const { classes } = req.body;
        if (!Array.isArray(classes)) {
            return res.status(400).json({ error: 'Classes must be an array' });
        }
        const classDefinitions = classes.map((className, index) => ({
            id: index,
            name: className,
            color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`
        }));
        database_1.updateProjectClasses.run(JSON.stringify(classDefinitions), req.params.id);
        res.json({ class_definitions: classDefinitions });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update project classes' });
    }
});
router.delete('/:id', (req, res) => {
    try {
        const result = database_1.deleteProject.run(req.params.id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json({ message: 'Project deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete project' });
    }
});
exports.default = router;
//# sourceMappingURL=projects.js.map