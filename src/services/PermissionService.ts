
import { v4 as uuidv4 } from 'uuid';
import { FileType, Folder, FilePermission, FolderPermission } from '@/types/file';

class PermissionService {
  checkFilePermission(
    file: FileType,
    userId: string,
    requiredPermission: 'view' | 'edit' | 'delete' | 'admin'
  ): boolean {
    // File owner has all permissions
    if (file.createdBy === userId) {
      return true;
    }
    
    // Check direct file permissions
    if (file.permissions) {
      const userPermission = file.permissions.find(p => p.userId === userId);
      if (userPermission) {
        if (userPermission.permission === 'admin') return true;
        if (userPermission.permission === requiredPermission) return true;
        if (requiredPermission === 'view' && 
            (userPermission.permission === 'edit' || userPermission.permission === 'delete')) return true;
        if (requiredPermission === 'edit' && userPermission.permission === 'delete') return true;
      }
    }
    
    return false;
  }
  
  checkFolderPermission(
    folder: Folder,
    userId: string,
    requiredPermission: 'view' | 'edit' | 'delete' | 'admin',
    allFolders: Folder[]
  ): boolean {
    // Folder owner has all permissions
    if (folder.createdBy === userId) {
      return true;
    }
    
    // Check direct folder permissions
    if (folder.permissions) {
      const userPermission = folder.permissions.find(p => p.userId === userId);
      if (userPermission) {
        if (userPermission.permission === 'admin') return true;
        if (userPermission.permission === requiredPermission) return true;
        if (requiredPermission === 'view' && 
            (userPermission.permission === 'edit' || userPermission.permission === 'delete')) return true;
        if (requiredPermission === 'edit' && userPermission.permission === 'delete') return true;
      }
    }
    
    // If not found, check parent folders (inheritance)
    if (folder.parentId) {
      const parentFolder = allFolders.find(f => f.id === folder.parentId);
      if (parentFolder) {
        const parentPermissions = parentFolder.permissions || [];
        const inheritedPermission = parentPermissions.find(p => p.userId === userId && p.inherit);
        if (inheritedPermission) {
          if (inheritedPermission.permission === 'admin') return true;
          if (inheritedPermission.permission === requiredPermission) return true;
          if (requiredPermission === 'view' && 
              (inheritedPermission.permission === 'edit' || inheritedPermission.permission === 'delete')) return true;
          if (requiredPermission === 'edit' && inheritedPermission.permission === 'delete') return true;
        }
        
        // Recursively check parent folder
        return this.checkFolderPermission(parentFolder, userId, requiredPermission, allFolders);
      }
    }
    
    return false;
  }
  
  addFilePermission(
    file: FileType,
    userId: string,
    permission: 'view' | 'edit' | 'delete' | 'admin',
    grantedBy: string
  ): FilePermission {
    if (!file.permissions) {
      file.permissions = [];
    }
    
    // Remove existing permission for this user if any
    file.permissions = file.permissions.filter(p => p.userId !== userId);
    
    // Add new permission
    const newPermission: FilePermission = {
      id: uuidv4(),
      userId,
      fileId: file.id,
      permission,
      createdAt: new Date(),
      createdBy: grantedBy
    };
    
    file.permissions.push(newPermission);
    return newPermission;
  }
  
  addFolderPermission(
    folder: Folder,
    userId: string,
    permission: 'view' | 'edit' | 'delete' | 'admin',
    grantedBy: string,
    inherit: boolean = true
  ): FolderPermission {
    if (!folder.permissions) {
      folder.permissions = [];
    }
    
    // Remove existing permission for this user if any
    folder.permissions = folder.permissions.filter(p => p.userId !== userId);
    
    // Add new permission
    const newPermission: FolderPermission = {
      id: uuidv4(),
      userId,
      folderId: folder.id,
      permission,
      createdAt: new Date(),
      createdBy: grantedBy,
      inherit
    };
    
    folder.permissions.push(newPermission);
    return newPermission;
  }
  
  removeFilePermission(file: FileType, userId: string) {
    if (!file.permissions) return;
    file.permissions = file.permissions.filter(p => p.userId !== userId);
  }
  
  removeFolderPermission(folder: Folder, userId: string) {
    if (!folder.permissions) return;
    folder.permissions = folder.permissions.filter(p => p.userId !== userId);
  }
}

export const permissionService = new PermissionService();
