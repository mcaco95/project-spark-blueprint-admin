
export interface FileType {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  folderId: string | null;
  projectId: string | null;
  tags?: string[];
  description?: string;
  sharedWith?: string[];
  thumbnail?: string;
  favorite?: boolean;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  projectId: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  path: string;
}

export type FileViewMode = 'grid' | 'list' | 'details';

export interface FilePermission {
  userId: string;
  fileId: string;
  permission: 'view' | 'edit' | 'delete' | 'admin';
}

export interface FileTag {
  id: string;
  name: string;
  color: string;
}
