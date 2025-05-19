
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
  permissions?: FilePermission[];
  accessCount?: number;
  lastAccessedAt?: Date;
  versionHistory?: FileVersion[];
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
  permissions?: FolderPermission[];
}

export type FileViewMode = 'grid' | 'list' | 'details';

export interface FilePermission {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  fileId: string;
  permission: 'view' | 'edit' | 'delete' | 'admin';
  createdAt: Date;
  createdBy: string;
}

export interface FolderPermission {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  folderId: string;
  permission: 'view' | 'edit' | 'delete' | 'admin';
  createdAt: Date;
  createdBy: string;
  inherit: boolean; // Whether child files/folders inherit this permission
}

export interface FileTag {
  id: string;
  name: string;
  color: string;
}

export interface FileVersion {
  id: string;
  fileId: string;
  versionNumber: number;
  size: number;
  url: string;
  createdAt: Date;
  createdBy: string;
  changes?: string;
}

export interface FileActivity {
  id: string;
  fileId: string;
  fileName: string;
  activityType: 'create' | 'view' | 'download' | 'edit' | 'delete' | 'rename' | 'move' | 'share' | 'permission_change';
  performedBy: string;
  performedAt: Date;
  details?: string;
  metadata?: Record<string, any>;
}

export interface FileStats {
  fileId: string;
  totalViews: number;
  totalDownloads: number;
  totalEdits: number;
  lastViewed?: Date;
  lastDownloaded?: Date;
  lastEdited?: Date;
  mostFrequentViewers: Array<{userId: string, userName: string, count: number}>;
  mostActiveHours: Array<{hour: number, count: number}>;
}
