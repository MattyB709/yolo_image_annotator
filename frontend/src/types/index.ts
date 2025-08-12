export interface ClassDefinition {
  id: number;
  name: string;
  color: string;
}

export interface Project {
  id: number;
  name: string;
  created_at: string;
  class_definitions: ClassDefinition[];
}

export interface Image {
  id: number;
  project_id: number;
  filename: string;
  original_name: string;
  width: number;
  height: number;
  uploaded_at: string;
}

export interface Annotation {
  id: number;
  image_id: number;
  class_id: number;
  x_center: number;
  y_center: number;
  width: number;
  height: number;
  created_at: string;
}