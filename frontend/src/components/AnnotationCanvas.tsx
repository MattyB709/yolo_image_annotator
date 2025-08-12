import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Image, Annotation, ClassDefinition } from '../types';
import { imageApi, annotationApi } from '../services/api';

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  classId?: number;
  isDrawing?: boolean;
}

interface AnnotationCanvasProps {
  image: Image;
  annotations: Annotation[];
  classDefinitions: ClassDefinition[];
  selectedClassId: number;
  onAnnotationsChange: (annotations: Annotation[]) => void;
  onAnnotationSelect: (annotation: Annotation | null) => void;
  selectedAnnotation: Annotation | null;
}

const AnnotationCanvas: React.FC<AnnotationCanvasProps> = ({
  image,
  annotations,
  classDefinitions,
  selectedClassId,
  onAnnotationsChange,
  onAnnotationSelect,
  selectedAnnotation
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingBox, setDrawingBox] = useState<BoundingBox | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  
  // Box editing states
  const [isEditing, setIsEditing] = useState(false);
  const [editMode, setEditMode] = useState<'move' | 'resize' | null>(null);
  const [resizeHandle, setResizeHandle] = useState<'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null>(null);
  const [editStartPos, setEditStartPos] = useState({ x: 0, y: 0 });
  const [originalBox, setOriginalBox] = useState<BoundingBox | null>(null);

  // Convert screen coordinates to image coordinates
  const screenToImage = useCallback((screenX: number, screenY: number) => {
    if (!canvasRef.current || !imageLoaded) return { x: 0, y: 0 };
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const canvasX = screenX - rect.left;
    const canvasY = screenY - rect.top;
    
    // Account for zoom and pan
    const imageX = (canvasX - pan.x) / zoom;
    const imageY = (canvasY - pan.y) / zoom;
    
    return {
      x: Math.max(0, Math.min(image.width, imageX)),
      y: Math.max(0, Math.min(image.height, imageY))
    };
  }, [zoom, pan, image.width, image.height, imageLoaded]);

  // Convert image coordinates to screen coordinates  
  const imageToScreen = useCallback((imageX: number, imageY: number) => {
    return {
      x: imageX * zoom + pan.x,
      y: imageY * zoom + pan.y
    };
  }, [zoom, pan]);

  // Convert YOLO normalized coordinates to image coordinates
  const yoloToImage = useCallback((yoloBbox: Annotation) => {
    return {
      x: (yoloBbox.x_center - yoloBbox.width / 2) * image.width,
      y: (yoloBbox.y_center - yoloBbox.height / 2) * image.height,
      width: yoloBbox.width * image.width,
      height: yoloBbox.height * image.height
    };
  }, [image.width, image.height]);

  // Convert image coordinates to YOLO normalized coordinates
  const imageToYolo = useCallback((bbox: BoundingBox) => {
    return {
      x_center: (bbox.x + bbox.width / 2) / image.width,
      y_center: (bbox.y + bbox.height / 2) / image.height,
      width: bbox.width / image.width,
      height: bbox.height / image.height
    };
  }, [image.width, image.height]);

  // Helper function to get resize handle areas for selected annotation
  const getResizeHandles = useCallback((bbox: BoundingBox) => {
    const handleSize = 8;
    const screenPos = imageToScreen(bbox.x, bbox.y);
    const screenSize = {
      width: bbox.width * zoom,
      height: bbox.height * zoom
    };
    
    return {
      nw: { x: screenPos.x - handleSize/2, y: screenPos.y - handleSize/2, width: handleSize, height: handleSize },
      ne: { x: screenPos.x + screenSize.width - handleSize/2, y: screenPos.y - handleSize/2, width: handleSize, height: handleSize },
      sw: { x: screenPos.x - handleSize/2, y: screenPos.y + screenSize.height - handleSize/2, width: handleSize, height: handleSize },
      se: { x: screenPos.x + screenSize.width - handleSize/2, y: screenPos.y + screenSize.height - handleSize/2, width: handleSize, height: handleSize },
      n: { x: screenPos.x + screenSize.width/2 - handleSize/2, y: screenPos.y - handleSize/2, width: handleSize, height: handleSize },
      s: { x: screenPos.x + screenSize.width/2 - handleSize/2, y: screenPos.y + screenSize.height - handleSize/2, width: handleSize, height: handleSize },
      e: { x: screenPos.x + screenSize.width - handleSize/2, y: screenPos.y + screenSize.height/2 - handleSize/2, width: handleSize, height: handleSize },
      w: { x: screenPos.x - handleSize/2, y: screenPos.y + screenSize.height/2 - handleSize/2, width: handleSize, height: handleSize }
    };
  }, [imageToScreen, zoom]);

  // Check if point is within a resize handle
  const getHandleAtPoint = useCallback((screenX: number, screenY: number, bbox: BoundingBox) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    const canvasX = screenX - rect.left;
    const canvasY = screenY - rect.top;
    
    const handles = getResizeHandles(bbox);
    
    for (const [handleName, handle] of Object.entries(handles)) {
      if (canvasX >= handle.x && canvasX <= handle.x + handle.width &&
          canvasY >= handle.y && canvasY <= handle.y + handle.height) {
        return handleName as 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';
      }
    }
    
    return null;
  }, [getResizeHandles]);

  // Check if point is within annotation bounds (for moving)
  const isPointInAnnotation = useCallback((imageX: number, imageY: number, annotation: Annotation) => {
    const bbox = yoloToImage(annotation);
    return imageX >= bbox.x && imageX <= bbox.x + bbox.width &&
           imageY >= bbox.y && imageY <= bbox.y + bbox.height;
  }, [yoloToImage]);

  // Fit image to canvas
  const fitToCanvas = useCallback(() => {
    if (!containerRef.current || !imageLoaded) {
      console.log('fitToCanvas: containerRef or imageLoaded not ready', { 
        hasContainer: !!containerRef.current, 
        imageLoaded 
      });
      return;
    }
    
    const container = containerRef.current;
    const containerWidth = container.clientWidth - 20; // Account for padding
    const containerHeight = container.clientHeight - 20;
    
    console.log('fitToCanvas: container dimensions', { 
      containerWidth, 
      containerHeight, 
      imageWidth: image.width, 
      imageHeight: image.height 
    });
    
    if (containerWidth <= 0 || containerHeight <= 0) {
      console.log('fitToCanvas: container has no dimensions, retrying...');
      setTimeout(() => fitToCanvas(), 100);
      return;
    }
    
    const scaleX = containerWidth / image.width;
    const scaleY = containerHeight / image.height;
    const scale = Math.min(scaleX, scaleY, 1);
    
    setZoom(scale);
    setPan({
      x: (containerWidth - image.width * scale) / 2,
      y: (containerHeight - image.height * scale) / 2
    });
    
    setCanvasSize({
      width: containerWidth,
      height: containerHeight
    });
    
    console.log('fitToCanvas: set dimensions', { scale, canvasSize: { width: containerWidth, height: containerHeight } });
  }, [image.width, image.height, imageLoaded]);

  // Draw on canvas
  const draw = useCallback(() => {
    if (!canvasRef.current || !imageRef.current || !imageLoaded) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw image
    ctx.drawImage(
      imageRef.current,
      pan.x,
      pan.y,
      image.width * zoom,
      image.height * zoom
    );
    
    // Draw existing annotations
    annotations.forEach((annotation) => {
      const bbox = yoloToImage(annotation);
      const screenPos = imageToScreen(bbox.x, bbox.y);
      const screenSize = {
        width: bbox.width * zoom,
        height: bbox.height * zoom
      };
      
      const classDef = classDefinitions.find(c => c.id === annotation.class_id);
      const color = classDef?.color || '#ff0000';
      const isSelected = selectedAnnotation?.id === annotation.id;
      
      // Draw bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.setLineDash(isSelected ? [5, 5] : []);
      ctx.strokeRect(screenPos.x, screenPos.y, screenSize.width, screenSize.height);
      
      // Draw class label
      if (classDef) {
        ctx.fillStyle = color;
        ctx.fillRect(screenPos.x, screenPos.y - 20, ctx.measureText(classDef.name).width + 10, 20);
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(classDef.name, screenPos.x + 5, screenPos.y - 5);
      }
      
      // Draw resize handles for selected annotation
      if (isSelected) {
        const handles = getResizeHandles(bbox);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        
        Object.values(handles).forEach(handle => {
          ctx.fillRect(handle.x, handle.y, handle.width, handle.height);
          ctx.strokeRect(handle.x, handle.y, handle.width, handle.height);
        });
      }
      
      ctx.setLineDash([]);
    });
    
    // Draw current drawing box
    if (drawingBox && isDrawing) {
      const screenStart = imageToScreen(drawingBox.x, drawingBox.y);
      const screenSize = {
        width: drawingBox.width * zoom,
        height: drawingBox.height * zoom
      };
      
      const selectedClass = classDefinitions.find(c => c.id === selectedClassId);
      const color = selectedClass?.color || '#00ff00';
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(screenStart.x, screenStart.y, screenSize.width, screenSize.height);
      ctx.setLineDash([]);
    }
  }, [
    annotations,
    classDefinitions,
    selectedClassId,
    selectedAnnotation,
    drawingBox,
    isDrawing,
    zoom,
    pan,
    imageLoaded,
    image.width,
    image.height,
    imageToScreen,
    yoloToImage,
    getResizeHandles
  ]);

  // Handle mouse down
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const imageCoords = screenToImage(e.clientX, e.clientY);
    
    // First check if we're clicking on a resize handle of the selected annotation
    if (selectedAnnotation) {
      const selectedBbox = yoloToImage(selectedAnnotation);
      const handle = getHandleAtPoint(e.clientX, e.clientY, selectedBbox);
      
      if (handle) {
        // Start resizing
        setIsEditing(true);
        setEditMode('resize');
        setResizeHandle(handle);
        setEditStartPos(imageCoords);
        setOriginalBox({
          x: selectedBbox.x,
          y: selectedBbox.y,
          width: selectedBbox.width,
          height: selectedBbox.height
        });
        return;
      }
      
      // Check if clicking within the selected annotation (for moving)
      if (isPointInAnnotation(imageCoords.x, imageCoords.y, selectedAnnotation)) {
        setIsEditing(true);
        setEditMode('move');
        setEditStartPos(imageCoords);
        setOriginalBox({
          x: selectedBbox.x,
          y: selectedBbox.y,
          width: selectedBbox.width,
          height: selectedBbox.height
        });
        return;
      }
    }
    
    // Check if clicking on any other annotation
    let clickedAnnotation: Annotation | null = null;
    for (const annotation of annotations) {
      if (isPointInAnnotation(imageCoords.x, imageCoords.y, annotation)) {
        clickedAnnotation = annotation;
        break;
      }
    }
    
    if (clickedAnnotation) {
      // Select existing annotation
      onAnnotationSelect(clickedAnnotation);
    } else {
      // Start drawing new annotation
      onAnnotationSelect(null);
      setIsDrawing(true);
      setDrawingBox({
        x: imageCoords.x,
        y: imageCoords.y,
        width: 0,
        height: 0,
        classId: selectedClassId
      });
    }
  };

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const imageCoords = screenToImage(e.clientX, e.clientY);
    
    if (isDrawing && drawingBox) {
      // Drawing new annotation
      setDrawingBox({
        ...drawingBox,
        width: Math.abs(imageCoords.x - drawingBox.x),
        height: Math.abs(imageCoords.y - drawingBox.y),
        x: Math.min(drawingBox.x, imageCoords.x),
        y: Math.min(drawingBox.y, imageCoords.y)
      });
    } else if (isEditing && selectedAnnotation && originalBox) {
      // Editing existing annotation
      const dx = imageCoords.x - editStartPos.x;
      const dy = imageCoords.y - editStartPos.y;
      
      if (editMode === 'move') {
        // Move the annotation
        const newX = Math.max(0, Math.min(image.width - originalBox.width, originalBox.x + dx));
        const newY = Math.max(0, Math.min(image.height - originalBox.height, originalBox.y + dy));
        
        const newAnnotation = {
          ...selectedAnnotation,
          ...imageToYolo({
            x: newX,
            y: newY,
            width: originalBox.width,
            height: originalBox.height
          })
        };
        
        // Update annotations array and selected annotation
        const updatedAnnotations = annotations.map(a => 
          a.id === selectedAnnotation.id ? newAnnotation : a
        );
        onAnnotationsChange(updatedAnnotations);
        onAnnotationSelect(newAnnotation);
        
      } else if (editMode === 'resize' && resizeHandle) {
        // Resize the annotation
        let newBox = { ...originalBox };
        
        switch (resizeHandle) {
          case 'nw':
            newBox.width = Math.max(10, originalBox.width - dx);
            newBox.height = Math.max(10, originalBox.height - dy);
            newBox.x = originalBox.x + originalBox.width - newBox.width;
            newBox.y = originalBox.y + originalBox.height - newBox.height;
            break;
          case 'ne':
            newBox.width = Math.max(10, originalBox.width + dx);
            newBox.height = Math.max(10, originalBox.height - dy);
            newBox.y = originalBox.y + originalBox.height - newBox.height;
            break;
          case 'sw':
            newBox.width = Math.max(10, originalBox.width - dx);
            newBox.height = Math.max(10, originalBox.height + dy);
            newBox.x = originalBox.x + originalBox.width - newBox.width;
            break;
          case 'se':
            newBox.width = Math.max(10, originalBox.width + dx);
            newBox.height = Math.max(10, originalBox.height + dy);
            break;
          case 'n':
            newBox.height = Math.max(10, originalBox.height - dy);
            newBox.y = originalBox.y + originalBox.height - newBox.height;
            break;
          case 's':
            newBox.height = Math.max(10, originalBox.height + dy);
            break;
          case 'e':
            newBox.width = Math.max(10, originalBox.width + dx);
            break;
          case 'w':
            newBox.width = Math.max(10, originalBox.width - dx);
            newBox.x = originalBox.x + originalBox.width - newBox.width;
            break;
        }
        
        // Clamp to image boundaries
        newBox.x = Math.max(0, Math.min(image.width - newBox.width, newBox.x));
        newBox.y = Math.max(0, Math.min(image.height - newBox.height, newBox.y));
        
        const newAnnotation = {
          ...selectedAnnotation,
          ...imageToYolo(newBox)
        };
        
        // Update annotations array and selected annotation
        const updatedAnnotations = annotations.map(a => 
          a.id === selectedAnnotation.id ? newAnnotation : a
        );
        onAnnotationsChange(updatedAnnotations);
        onAnnotationSelect(newAnnotation);
      }
    } else {
      // Update cursor based on hover state
      if (selectedAnnotation && canvasRef.current) {
        const selectedBbox = yoloToImage(selectedAnnotation);
        const handle = getHandleAtPoint(e.clientX, e.clientY, selectedBbox);
        
        if (handle) {
          // Set resize cursor
          const cursors = {
            nw: 'nw-resize', ne: 'ne-resize', sw: 'sw-resize', se: 'se-resize',
            n: 'n-resize', s: 's-resize', e: 'e-resize', w: 'w-resize'
          };
          canvasRef.current.style.cursor = cursors[handle];
        } else if (isPointInAnnotation(imageCoords.x, imageCoords.y, selectedAnnotation)) {
          canvasRef.current.style.cursor = 'move';
        } else {
          canvasRef.current.style.cursor = 'default';
        }
      }
    }
  };

  // Handle mouse up
  const handleMouseUp = async () => {
    if (isDrawing && drawingBox && drawingBox.width > 10 && drawingBox.height > 10) {
      // Create new annotation
      const yoloCoords = imageToYolo(drawingBox);
      
      try {
        const newAnnotation = await annotationApi.createAnnotation(image.id, {
          class_id: selectedClassId,
          ...yoloCoords
        });
        
        onAnnotationsChange([...annotations, newAnnotation]);
      } catch (error) {
        console.error('Failed to create annotation:', error);
        alert('Failed to create annotation. Please try again.');
      }
    } else if (isEditing && selectedAnnotation) {
      // Save the edited annotation to the backend
      try {
        const updatedAnnotation = await annotationApi.updateAnnotation(selectedAnnotation.id, {
          class_id: selectedAnnotation.class_id,
          x_center: selectedAnnotation.x_center,
          y_center: selectedAnnotation.y_center,
          width: selectedAnnotation.width,
          height: selectedAnnotation.height
        });
        
        // Update the annotation in our local state
        const updatedAnnotations = annotations.map(a => 
          a.id === selectedAnnotation.id ? updatedAnnotation : a
        );
        onAnnotationsChange(updatedAnnotations);
      } catch (error) {
        console.error('Failed to update annotation:', error);
        alert('Failed to update annotation. Please try again.');
      }
    }
    
    // Reset all editing states
    setIsDrawing(false);
    setDrawingBox(null);
    setIsEditing(false);
    setEditMode(null);
    setResizeHandle(null);
    setOriginalBox(null);
  };

  // Handle zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newZoom = Math.max(0.1, Math.min(5, zoom + delta));
    setZoom(newZoom);
  };

  // Initialize canvas and fit image
  useEffect(() => {
    if (imageLoaded) {
      fitToCanvas();
    }
  }, [imageLoaded, fitToCanvas]);

  // Redraw canvas when dependencies change
  useEffect(() => {
    draw();
  }, [draw]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (imageLoaded) {
        fitToCanvas();
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [imageLoaded, fitToCanvas]);

  return (
    <div 
      ref={containerRef}
      className="annotation-canvas-container"
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        cursor: isDrawing ? 'crosshair' : (isEditing ? (editMode === 'move' ? 'move' : 'pointer') : 'default')
      }}
    >
      {/* Hidden image for loading */}
      <img
        ref={imageRef}
        src={imageApi.getImageUrl(image.project_id, image.filename)}
        alt={image.original_name}
        style={{ display: 'none' }}
        onLoad={() => {
          console.log('Image loaded successfully:', imageApi.getImageUrl(image.project_id, image.filename));
          setImageLoaded(true);
        }}
        onError={(e) => {
          console.error('Failed to load image:', imageApi.getImageUrl(image.project_id, image.filename));
          console.error('Error event:', e);
        }}
      />
      
      {/* Canvas */}
      {!imageLoaded && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '1.1rem',
          color: '#666',
          zIndex: 10
        }}>
          Loading image...
        </div>
      )}
      
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        style={{
          display: 'block',
          border: '1px solid #ddd',
          borderRadius: '4px',
          opacity: imageLoaded ? 1 : 0.3
        }}
      />
      
      {/* Zoom controls */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: '4px',
        padding: '5px'
      }}>
        <button
          onClick={() => setZoom(prev => Math.min(prev * 1.2, 5))}
          style={{
            background: '#1976d2',
            border: 'none',
            color: 'white',
            padding: '5px 8px',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          +
        </button>
        <div style={{ color: 'white', fontSize: '12px', textAlign: 'center' }}>
          {Math.round(zoom * 100)}%
        </div>
        <button
          onClick={() => setZoom(prev => Math.max(prev / 1.2, 0.1))}
          style={{
            background: '#1976d2',
            border: 'none',
            color: 'white',
            padding: '5px 8px',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          -
        </button>
        <button
          onClick={fitToCanvas}
          style={{
            background: '#1976d2',
            border: 'none',
            color: 'white',
            padding: '5px 8px',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '10px'
          }}
        >
          Fit
        </button>
      </div>
    </div>
  );
};

export default AnnotationCanvas;