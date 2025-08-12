# Phase 2 UI Testing Instructions

## Prerequisites
- Backend server running on http://localhost:5000 
- Frontend server running on http://localhost:3000

## Test Scenarios

### 1. Project List Page (http://localhost:3000)
**What to look for:**
- [ ] Page loads without errors
- [ ] Header shows "YOLO Annotation Tool"
- [ ] "Create Project" button is visible
- [ ] If projects exist: Grid layout showing project cards
- [ ] Each project card shows: name, creation date, class tags, class count, delete button
- [ ] If no projects: Empty state with "Create Project" button
- [ ] Clicking project card navigates to project detail
- [ ] Delete button works (shows confirmation dialog)

**Test Steps:**
1. Open http://localhost:3000
2. Check page layout and styling
3. Try creating a new project
4. Verify project appears in list
5. Click on project to navigate to detail page

### 2. Create Project Modal
**What to look for:**
- [ ] Modal opens when clicking "Create Project"
- [ ] Form has project name field (required)
- [ ] Form has class fields (at least one required)
- [ ] Can add/remove class fields
- [ ] "Cancel" button closes modal
- [ ] "Create Project" button submits form
- [ ] Shows loading state during creation
- [ ] Shows error messages for validation failures
- [ ] Closes and refreshes list on success

**Test Steps:**
1. Click "Create Project" button
2. Try submitting empty form (should show validation errors)
3. Fill in project name and some classes
4. Test add/remove class functionality
5. Submit and verify project is created

### 3. Project Detail Page (http://localhost:3000/projects/:id)
**What to look for:**
- [ ] Breadcrumb navigation (Back to Projects button)
- [ ] Project name displayed
- [ ] Project information card showing name, creation date, class count
- [ ] Class Management section
- [ ] Delete Project button (with confirmation)
- [ ] Images section placeholder

**Test Steps:**
1. Navigate to project detail from project list
2. Verify all information displays correctly
3. Test back navigation
4. Test project deletion

### 4. Class Management
**What to look for:**
- [ ] Shows current classes with colored tags and IDs
- [ ] "Edit Classes" button when classes exist
- [ ] "Add Classes" button when no classes exist
- [ ] Edit mode allows adding/removing/modifying classes
- [ ] Save/Cancel buttons in edit mode
- [ ] Shows loading state during save
- [ ] Updates class display after save
- [ ] YOLO format info box explains class IDs

**Test Steps:**
1. Navigate to project with classes
2. Click "Edit Classes"
3. Modify some class names
4. Add new classes
5. Remove some classes
6. Save changes and verify they persist

### 5. Error Handling
**What to look for:**
- [ ] Network errors show friendly messages
- [ ] Loading states during API calls
- [ ] 404 errors handled gracefully
- [ ] Form validation prevents invalid submissions
- [ ] Server errors display user-friendly messages

**Test Steps:**
1. Stop backend server and try to load projects
2. Try invalid project ID in URL
3. Try creating duplicate project name
4. Test with empty/invalid form data

### 6. Responsive Design
**What to look for:**
- [ ] Works on different screen sizes
- [ ] Mobile-friendly layout
- [ ] Buttons and forms are touch-friendly
- [ ] No horizontal scrolling on mobile

**Test Steps:**
1. Resize browser window
2. Test on mobile viewport sizes
3. Verify usability on touch devices

## Expected Behavior

### Success Cases:
- All pages load without JavaScript errors
- Smooth navigation between pages
- Forms submit successfully with valid data
- Real-time updates after data changes
- Professional, clean UI similar to CVAT style

### Error Cases:
- Clear error messages for network issues
- Form validation prevents bad data
- Graceful degradation when server is down
- No crashes or broken states

## Performance Notes:
- Initial page load should be under 3 seconds
- Navigation should be instant (client-side routing)
- API calls should complete within 2 seconds
- No memory leaks during extended usage

## Browser Compatibility:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)