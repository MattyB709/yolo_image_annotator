# Phase 3 Testing Instructions: Image Upload & Display

## Prerequisites
- Backend server running on http://localhost:5000
- Frontend server running on http://localhost:3000
- At least one project created with some classes defined

## Test Scenarios

### 1. Image Upload Interface
**Location:** Project Detail → Images Tab → Upload Section

**What to look for:**
- [ ] Drag & drop area with clear visual feedback
- [ ] Click to select files functionality
- [ ] File type validation (only JPG, JPEG, PNG allowed)
- [ ] File size validation (10MB limit per file)
- [ ] Multiple file selection support
- [ ] Upload progress indication
- [ ] Error handling for invalid files
- [ ] Success feedback after upload

**Test Steps:**
1. Navigate to a project detail page
2. Click "Images" tab
3. Try uploading valid images (JPG, PNG)
4. Try uploading invalid files (PDF, GIF, etc.) - should show error
5. Try uploading oversized files - should show error
6. Test drag & drop functionality
7. Upload multiple images at once

### 2. Image Gallery Display
**Location:** Project Detail → Images Tab → Gallery Section

**What to look for:**
- [ ] Grid layout showing image thumbnails
- [ ] Image metadata display (name, dimensions, upload date)
- [ ] Thumbnail generation and loading
- [ ] Selection checkboxes on images
- [ ] Bulk selection controls (Select All, Clear Selection)
- [ ] Delete functionality (single and bulk)
- [ ] Empty state when no images
- [ ] Loading states during operations

**Test Steps:**
1. Upload several images to a project
2. Verify thumbnails load correctly
3. Test individual image selection
4. Test "Select All" and "Clear Selection"
5. Test bulk delete functionality
6. Test individual image delete
7. Verify confirmation dialogs for deletions

### 3. Image Viewer (Lightbox)
**Location:** Click any image in the gallery

**What to look for:**
- [ ] Full-screen modal overlay
- [ ] High-resolution image display
- [ ] Zoom in/out controls
- [ ] Pan functionality when zoomed
- [ ] Fit to screen and 1:1 zoom buttons
- [ ] Navigation between images (Previous/Next)
- [ ] Keyboard shortcuts work
- [ ] Image metadata in header
- [ ] Mouse wheel zoom
- [ ] Drag to pan when zoomed

**Test Steps:**
1. Click on an image in the gallery
2. Test all zoom controls (+, -, Fit, 1:1)
3. Zoom in and test panning with mouse drag
4. Use mouse wheel to zoom
5. Test navigation with Previous/Next buttons
6. Test keyboard shortcuts:
   - ESC (close)
   - Arrow keys (navigate)
   - +/- (zoom)
   - 0 (reset zoom)
   - F (fit to screen)
7. Test navigation with multiple images

### 4. API Endpoints Testing

**Image Upload API:**
```bash
# Test image upload (requires multipart form data)
curl -X POST -F "images=@test-image.jpg" \
  http://localhost:5000/api/images/project/1/upload
```

**Image Listing API:**
```bash
# Test image listing
curl http://localhost:5000/api/images/project/1
```

**Thumbnail API:**
```bash
# Test thumbnail generation
curl http://localhost:5000/api/thumbnails/1/medium
```

**Image Delete API:**
```bash
# Test image deletion
curl -X DELETE http://localhost:5000/api/images/1
```

### 5. Thumbnail System
**What to test:**
- [ ] Thumbnails generate automatically on first request
- [ ] Three sizes available (small, medium, large)
- [ ] Caching works (subsequent requests are fast)
- [ ] Fallback to original image if thumbnail fails
- [ ] Proper image aspect ratio preservation

**Test Steps:**
1. Upload images and note thumbnail load times
2. Refresh page and verify thumbnails load faster (cached)
3. Test different thumbnail sizes in URLs:
   - `/api/thumbnails/[imageId]/small`
   - `/api/thumbnails/[imageId]/medium`
   - `/api/thumbnails/[imageId]/large`

### 6. File Storage Structure
**What to verify:**
- [ ] Images stored in project-specific folders
- [ ] Thumbnails stored in separate directory structure
- [ ] Original filenames preserved in database
- [ ] Unique filenames generated to prevent conflicts

**Expected structure:**
```
uploads/
├── project_1/
│   ├── [uuid1].jpg
│   ├── [uuid2].png
│   └── ...
├── thumbnails/
│   ├── small/
│   ├── medium/
│   └── large/
└── ...
```

### 7. Error Handling & Edge Cases

**Test scenarios:**
- [ ] Network disconnection during upload
- [ ] Server restart with images in progress
- [ ] Corrupted image files
- [ ] Very large image dimensions (>10k pixels)
- [ ] Images with special characters in names
- [ ] Simultaneous uploads from multiple users

### 8. Performance Testing

**What to measure:**
- [ ] Upload speed for various file sizes
- [ ] Thumbnail generation time
- [ ] Gallery load time with many images
- [ ] Memory usage during bulk operations
- [ ] Response times for image operations

**Target performance:**
- Uploads: <30 seconds for 5MB images
- Thumbnail generation: <3 seconds
- Gallery with 50+ images: <5 seconds load
- Image viewer: <2 seconds to open

### 9. Cross-browser Compatibility

**Test on:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (if available)
- [ ] Edge (latest)

**Focus areas:**
- File upload interface
- Drag & drop functionality
- Image display quality
- Keyboard shortcuts
- Touch gestures (mobile)

### 10. Integration with Existing Features

**Verify compatibility:**
- [ ] Project deletion removes associated images
- [ ] Class tab switching maintains state
- [ ] Image count updates in project info
- [ ] Navigation breadcrumbs work correctly
- [ ] Project list shows updated image counts

## Expected Results

### Success Criteria:
- All image formats (JPG, JPEG, PNG) upload successfully
- Thumbnails generate automatically and display correctly
- Image viewer provides smooth navigation and zoom
- File validation prevents invalid uploads
- Bulk operations work efficiently
- No memory leaks during extended usage
- Professional, responsive UI on all screen sizes

### Error Scenarios Should Show:
- Clear error messages for invalid files
- Network error handling during uploads
- Graceful degradation when server is unavailable
- Confirmation dialogs for destructive actions

## Testing Checklist

- [ ] Upload various image formats and sizes
- [ ] Test drag & drop with multiple files
- [ ] Verify thumbnail generation and caching
- [ ] Test image viewer on different image sizes
- [ ] Confirm keyboard shortcuts work in viewer
- [ ] Test bulk selection and deletion
- [ ] Verify project integration (tabs, counts)
- [ ] Test error scenarios (invalid files, network issues)
- [ ] Check performance with many images
- [ ] Verify responsive design on mobile

## Known Limitations

1. **File size limit:** 10MB per image
2. **Supported formats:** JPG, JPEG, PNG only
3. **Thumbnail caching:** Server restart clears memory cache
4. **Concurrent uploads:** May impact performance

## Next Phase Preview

After Phase 3 is complete, Phase 4 will add:
- Canvas-based annotation drawing
- Bounding box creation and editing
- CVAT-style annotation panel on the right
- YOLO coordinate conversion and export