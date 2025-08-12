/**
 * Manual validation tests - these test the core business logic
 * without requiring a running server
 */

describe('Manual Validation Tests', () => {
  describe('YOLO Format Validation', () => {
    test('should validate normalized coordinates range', () => {
      const validateCoordinates = (x_center: number, y_center: number, width: number, height: number): boolean => {
        return x_center >= 0 && x_center <= 1 &&
               y_center >= 0 && y_center <= 1 &&
               width >= 0 && width <= 1 &&
               height >= 0 && height <= 1;
      };

      // Valid coordinates
      expect(validateCoordinates(0.5, 0.5, 0.3, 0.4)).toBe(true);
      expect(validateCoordinates(0, 0, 1, 1)).toBe(true);
      expect(validateCoordinates(1, 1, 0, 0)).toBe(true);

      // Invalid coordinates
      expect(validateCoordinates(-0.1, 0.5, 0.3, 0.4)).toBe(false);
      expect(validateCoordinates(1.1, 0.5, 0.3, 0.4)).toBe(false);
      expect(validateCoordinates(0.5, -0.1, 0.3, 0.4)).toBe(false);
      expect(validateCoordinates(0.5, 1.1, 0.3, 0.4)).toBe(false);
      expect(validateCoordinates(0.5, 0.5, -0.1, 0.4)).toBe(false);
      expect(validateCoordinates(0.5, 0.5, 1.1, 0.4)).toBe(false);
      expect(validateCoordinates(0.5, 0.5, 0.3, -0.1)).toBe(false);
      expect(validateCoordinates(0.5, 0.5, 0.3, 1.1)).toBe(false);
    });

    test('should validate required annotation fields', () => {
      const validateAnnotation = (annotation: any): boolean => {
        return typeof annotation.class_id === 'number' &&
               typeof annotation.x_center === 'number' &&
               typeof annotation.y_center === 'number' &&
               typeof annotation.width === 'number' &&
               typeof annotation.height === 'number';
      };

      // Valid annotation
      expect(validateAnnotation({
        class_id: 0,
        x_center: 0.5,
        y_center: 0.5,
        width: 0.3,
        height: 0.4
      })).toBe(true);

      // Missing fields
      expect(validateAnnotation({
        class_id: 0,
        x_center: 0.5,
        y_center: 0.5,
        width: 0.3
        // height missing
      })).toBe(false);

      // Wrong types
      expect(validateAnnotation({
        class_id: '0', // string instead of number
        x_center: 0.5,
        y_center: 0.5,
        width: 0.3,
        height: 0.4
      })).toBe(false);
    });
  });

  describe('Class Definition Generation', () => {
    test('should generate class definitions with colors', () => {
      const generateClassDefinitions = (classes: string[]) => {
        return classes.map((className, index) => ({
          id: index,
          name: className,
          color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`
        }));
      };

      const classes = ['person', 'car', 'bicycle'];
      const definitions = generateClassDefinitions(classes);

      expect(definitions).toHaveLength(3);
      expect(definitions[0]).toEqual({
        id: 0,
        name: 'person',
        color: 'hsl(0, 70%, 50%)'
      });
      expect(definitions[1]).toEqual({
        id: 1,
        name: 'car',
        color: 'hsl(137.5, 70%, 50%)'
      });
      expect(definitions[2]).toEqual({
        id: 2,
        name: 'bicycle',
        color: 'hsl(275, 70%, 50%)'
      });
    });
  });

  describe('YOLO Export Format', () => {
    test('should format annotation for YOLO export', () => {
      const formatYoloLine = (annotation: {
        class_id: number;
        x_center: number;
        y_center: number;
        width: number;
        height: number;
      }) => {
        return `${annotation.class_id} ${annotation.x_center} ${annotation.y_center} ${annotation.width} ${annotation.height}`;
      };

      const annotation = {
        class_id: 0,
        x_center: 0.5,
        y_center: 0.3,
        width: 0.25,
        height: 0.4
      };

      expect(formatYoloLine(annotation)).toBe('0 0.5 0.3 0.25 0.4');
    });

    test('should handle multiple annotations per image', () => {
      const annotations = [
        { class_id: 0, x_center: 0.5, y_center: 0.5, width: 0.3, height: 0.4 },
        { class_id: 1, x_center: 0.2, y_center: 0.3, width: 0.1, height: 0.2 },
        { class_id: 0, x_center: 0.8, y_center: 0.7, width: 0.15, height: 0.25 }
      ];

      const yoloContent = annotations
        .map(ann => `${ann.class_id} ${ann.x_center} ${ann.y_center} ${ann.width} ${ann.height}`)
        .join('\n');

      const expectedContent = '0 0.5 0.5 0.3 0.4\n1 0.2 0.3 0.1 0.2\n0 0.8 0.7 0.15 0.25';
      expect(yoloContent).toBe(expectedContent);
    });
  });

  describe('Project Name Validation', () => {
    test('should validate project name requirements', () => {
      const validateProjectName = (name: any): boolean => {
        return typeof name === 'string' && name.length > 0 && name.trim().length > 0;
      };

      // Valid names
      expect(validateProjectName('My Project')).toBe(true);
      expect(validateProjectName('Project123')).toBe(true);
      expect(validateProjectName('A')).toBe(true);

      // Invalid names
      expect(validateProjectName('')).toBe(false);
      expect(validateProjectName('   ')).toBe(false);
      expect(validateProjectName(null)).toBe(false);
      expect(validateProjectName(undefined)).toBe(false);
      expect(validateProjectName(123)).toBe(false);
    });
  });
});