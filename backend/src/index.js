"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const multer_1 = __importDefault(require("multer"));
const path_1 = require("path");
const fs_1 = require("fs");
const sharp_1 = __importDefault(require("sharp"));
const projects_1 = __importDefault(require("./routes/projects"));
const images_1 = __importDefault(require("./routes/images"));
const annotations_1 = __importDefault(require("./routes/annotations"));
const importExport_1 = __importDefault(require("./routes/importExport"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const uploadsDir = (0, path_1.join)(__dirname, '../../uploads');
if (!(0, fs_1.existsSync)(uploadsDir)) {
    (0, fs_1.mkdirSync)(uploadsDir, { recursive: true });
}
app.use('/uploads', express_1.default.static(uploadsDir));
app.use('/api/projects', projects_1.default);
app.use('/api/images', images_1.default);
app.use('/api/annotations', annotations_1.default);
app.use('/api', importExport_1.default);
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'YOLO Annotation Tool API' });
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map