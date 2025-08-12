declare const db: any;
export interface Project {
    id: number;
    name: string;
    created_at: string;
    class_definitions: string;
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
export interface ClassDefinition {
    id: number;
    name: string;
    color: string;
}
export declare const createProject: any;
export declare const getProjects: any;
export declare const getProject: any;
export declare const deleteProject: any;
export declare const updateProjectClasses: any;
export declare const createImage: any;
export declare const getImages: any;
export declare const getImage: any;
export declare const deleteImage: any;
export declare const createAnnotation: any;
export declare const getAnnotations: any;
export declare const getAnnotation: any;
export declare const updateAnnotation: any;
export declare const deleteAnnotation: any;
export declare const deleteAnnotationsByImage: any;
export default db;
//# sourceMappingURL=database.d.ts.map