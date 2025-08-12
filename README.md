# YOLO Image Annotation Tool

web based yolo image annotator. Vibe coded this with claude code. Works pretty well

## Features

- Create projects with custom classes
- Upload and annotate images with bounding boxes
- Import/export YOLO format datasets
- Intuitive canvas-based annotation interface
- Real-time annotation editing and management

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd img_annotate

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Start the Application

You need to run both the backend and frontend in separate terminals:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
This starts the backend API server on `http://localhost:5001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```
This starts the React frontend on `http://localhost:3000`

### 3. Access the Application

Open your browser and go to `http://localhost:3000`

## Database Setup

The database (SQLite) is **automatically created** when you first start the backend. No manual setup required!

- Database file: `database/annotations.db`
- Tables are created automatically on first run
- All necessary directories (`uploads/`, `database/`) are created as needed

## Project Structure

```
img_annotate/
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API calls
│   │   └── types/         # TypeScript types
│   └── package.json
├── backend/           # Express.js API server
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── database.ts    # Database setup & queries
│   │   └── index.ts       # Server entry point
│   └── package.json
├── database/          # SQLite database files (auto-created)
├── uploads/           # Project images and exports (auto-created)
└── temp_extract/      # Temporary extraction folder (auto-created)
```

## Available Scripts

### Backend
- `npm run dev` - Start development server with auto-reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server (requires build first)
- `npm test` - Run tests

### Frontend
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

## Development Workflow

1. **Create a Project**: Add project name and define classes
2. **Upload Images**: Drag and drop images into your project
3. **Annotate**: Click and drag to draw bounding boxes
4. **Export**: Download your annotations in YOLO format

## API Endpoints

- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id/images` - Get project images
- `POST /api/projects/:id/images/upload` - Upload images
- `GET /api/images/:id/annotations` - Get image annotations
- `POST /api/images/:id/annotations` - Create annotation
- `POST /api/projects/:id/import-yolo` - Import YOLO dataset
- `GET /api/projects/:id/export-yolo` - Export YOLO dataset

## Keyboard Shortcuts

- `ESC` - Close annotation interface or deselect
- `←/→` - Navigate between images
- `1-9` - Select annotation classes
- `Delete/Backspace` - Delete selected annotation

## Troubleshooting

### Common Issues

1. **Port conflicts**: Backend runs on 5001, frontend on 3000
2. **Database errors**: Ensure `database/` directory exists
3. **Upload errors**: Ensure `uploads/` directory exists
4. **Build errors**: Run `npm install` in both directories

### Clean Setup
If you encounter issues, try:
```bash
# Clean backend
cd backend
rm -rf node_modules dist
npm install
npm run build

# Clean frontend
cd ../frontend
rm -rf node_modules build
npm install
```

## Production Deployment

1. Build both applications:
```bash
cd backend && npm run build
cd ../frontend && npm run build
```

2. Serve the built files with a web server like nginx
3. Configure environment variables for production URLs
