
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { FileType, Folder, FileViewMode, FileActivity, FilePermission, FolderPermission } from '@/types/file';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { initialFiles, initialFolders } from './mockFileData';
import { activityLogger } from '@/services/ActivityLogger';
import { permissionService } from '@/services/PermissionService';

interface FileContextType {
  files: FileType[];
  folders: Folder[];
  uploadFile: (file: File, folderId: string | null, projectId: string | null) => Promise<FileType>;
  downloadFile: (fileId: string) => void;
  deleteFile: (fileId: string) => void;
  createFolder: (folderData: Partial<Folder>) => Promise<Folder>;
  deleteFolder: (folderId: string) => void;
  getFilesByFolder: (folderId: string | null) => FileType[];
  getFoldersByParent: (parentId: string | null) => Folder[];
  getFileActivities: (fileId: string) => FileActivity[];
  getFileStats: (fileId: string) => any;
  shareFile: (fileId: string, userId: string, permission: FilePermission['permission']) => void;
  shareFolder: (folderId: string, userId: string, permission: FolderPermission['permission'], inherit: boolean) => void;
  removeFilePermission: (fileId: string, userId: string) => void;
  removeFolderPermission: (folderId: string, userId: string) => void;
  checkFilePermission: (fileId: string, userId: string, permission: FilePermission['permission']) => boolean;
  checkFolderPermission: (folderId: string, userId: string, permission: FolderPermission['permission']) => boolean;
  getRecentActivity: (limit?: number) => FileActivity[];
  renameFile: (fileId: string, newName: string) => void;
  moveFile: (fileId: string, newFolderId: string | null) => void;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

// Mock current user
const currentUser = {
  id: 'current-user',
  name: 'Current User',
  email: 'user@example.com'
};

export const FileProvider = ({ children }: { children: ReactNode }) => {
  const [files, setFiles] = useState<FileType[]>(initialFiles);
  const [folders, setFolders] = useState<Folder[]>(initialFolders);

  const uploadFile = async (file: File, folderId: string | null, projectId: string | null): Promise<FileType> => {
    // In a real app, this would upload to a server
    // For now, we'll create a mock file object
    
    // Create a file URL (in a real app, this would be the URL from the server)
    const fileUrl = URL.createObjectURL(file);
    
    // Create a thumbnail for images
    let thumbnail: string | undefined;
    if (file.type.startsWith('image/')) {
      thumbnail = fileUrl;
    }
    
    const newFile: FileType = {
      id: `file-${uuidv4()}`,
      name: file.name,
      type: file.type,
      size: file.size,
      url: fileUrl,
      thumbnail,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: currentUser.id,
      folderId,
      projectId,
      accessCount: 0
    };
    
    setFiles(prev => [...prev, newFile]);
    
    // Log activity
    activityLogger.logFileActivity(
      newFile.id,
      newFile.name,
      'create',
      currentUser.id,
      `File uploaded by ${currentUser.name}`,
      { size: file.size, type: file.type }
    );
    
    toast.success(`File uploaded: ${file.name}`);
    
    return newFile;
  };
  
  const downloadFile = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) {
      toast.error('File not found');
      return;
    }
    
    // Check permission
    if (!permissionService.checkFilePermission(file, currentUser.id, 'view')) {
      toast.error('You do not have permission to download this file');
      return;
    }
    
    // Log activity
    activityLogger.logFileActivity(
      file.id,
      file.name,
      'download',
      currentUser.id,
      `File downloaded by ${currentUser.name}`
    );
    
    // Update access count
    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, accessCount: (f.accessCount || 0) + 1, lastAccessedAt: new Date() } 
        : f
    ));
    
    // In a real app, this would trigger a file download
    // For now, we'll just open the URL in a new tab
    window.open(file.url, '_blank');
    toast.success(`Downloading: ${file.name}`);
  };
  
  const deleteFile = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) {
      toast.error('File not found');
      return;
    }
    
    // Check permission
    if (!permissionService.checkFilePermission(file, currentUser.id, 'delete')) {
      toast.error('You do not have permission to delete this file');
      return;
    }
    
    // Log activity
    activityLogger.logFileActivity(
      file.id,
      file.name,
      'delete',
      currentUser.id,
      `File deleted by ${currentUser.name}`
    );
    
    setFiles(prev => prev.filter(f => f.id !== fileId));
    toast.success('File deleted');
  };
  
  const createFolder = async (folderData: Partial<Folder>): Promise<Folder> => {
    const now = new Date();
    
    const newFolder: Folder = {
      id: `folder-${uuidv4()}`,
      name: folderData.name || 'New Folder',
      parentId: folderData.parentId || null,
      projectId: folderData.projectId || null,
      createdAt: now,
      updatedAt: now,
      createdBy: currentUser.id,
      path: folderData.path || folderData.name || 'New Folder',
    };
    
    // Check parent folder permission if it exists
    if (newFolder.parentId) {
      const parentFolder = folders.find(f => f.id === newFolder.parentId);
      if (parentFolder && !permissionService.checkFolderPermission(parentFolder, currentUser.id, 'edit', folders)) {
        toast.error('You do not have permission to create folders here');
        throw new Error('Permission denied');
      }
    }
    
    setFolders(prev => [...prev, newFolder]);
    
    // Log activity
    activityLogger.logFolderActivity(
      newFolder,
      'create',
      currentUser.id,
      `Folder created by ${currentUser.name}`
    );
    
    toast.success(`Folder created: ${newFolder.name}`);
    
    return newFolder;
  };
  
  const deleteFolder = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) {
      toast.error('Folder not found');
      return;
    }
    
    // Check permission
    if (!permissionService.checkFolderPermission(folder, currentUser.id, 'delete', folders)) {
      toast.error('You do not have permission to delete this folder');
      return;
    }
    
    // Log activity
    activityLogger.logFolderActivity(
      folder,
      'delete',
      currentUser.id,
      `Folder deleted by ${currentUser.name}`
    );
    
    // Delete the folder
    setFolders(prev => prev.filter(f => f.id !== folderId));
    
    // Delete all files in the folder
    setFiles(prev => prev.filter(f => f.folderId !== folderId));
    
    // Find and delete all subfolders recursively
    const deleteSubfolders = (parentId: string) => {
      const subfolders = folders.filter(f => f.parentId === parentId);
      
      for (const subfolder of subfolders) {
        setFolders(prev => prev.filter(f => f.id !== subfolder.id));
        setFiles(prev => prev.filter(f => f.folderId !== subfolder.id));
        
        // Log activity
        activityLogger.logFolderActivity(
          subfolder,
          'delete',
          currentUser.id,
          `Folder deleted as part of parent folder deletion`
        );
        
        deleteSubfolders(subfolder.id);
      }
    };
    
    deleteSubfolders(folderId);
    toast.success('Folder deleted');
  };
  
  const getFilesByFolder = (folderId: string | null) => {
    return files.filter(file => {
      const inCorrectFolder = file.folderId === folderId;
      const hasPermission = permissionService.checkFilePermission(file, currentUser.id, 'view');
      return inCorrectFolder && hasPermission;
    });
  };
  
  const getFoldersByParent = (parentId: string | null) => {
    return folders.filter(folder => {
      const hasCorrectParent = folder.parentId === parentId;
      const hasPermission = permissionService.checkFolderPermission(folder, currentUser.id, 'view', folders);
      return hasCorrectParent && hasPermission;
    });
  };
  
  const getFileActivities = (fileId: string) => {
    return activityLogger.getFileActivities(fileId);
  };
  
  const getFileStats = (fileId: string) => {
    return activityLogger.getActivityStats(fileId);
  };
  
  const shareFile = (fileId: string, userId: string, permission: FilePermission['permission']) => {
    const file = files.find(f => f.id === fileId);
    if (!file) {
      toast.error('File not found');
      return;
    }
    
    // Check if current user has admin rights
    if (!permissionService.checkFilePermission(file, currentUser.id, 'admin')) {
      toast.error('You do not have permission to share this file');
      return;
    }
    
    const newPermission = permissionService.addFilePermission(file, userId, permission, currentUser.id);
    
    // Update file in state
    setFiles(prev => prev.map(f => f.id === fileId ? file : f));
    
    // Log activity
    activityLogger.logFileActivity(
      file.id,
      file.name,
      'share',
      currentUser.id,
      `File shared with user ${userId} with ${permission} permission`,
      { userId, permission }
    );
    
    toast.success(`File shared with user`);
    return newPermission;
  };
  
  const shareFolder = (folderId: string, userId: string, permission: FolderPermission['permission'], inherit: boolean) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) {
      toast.error('Folder not found');
      return;
    }
    
    // Check if current user has admin rights
    if (!permissionService.checkFolderPermission(folder, currentUser.id, 'admin', folders)) {
      toast.error('You do not have permission to share this folder');
      return;
    }
    
    const newPermission = permissionService.addFolderPermission(folder, userId, permission, currentUser.id, inherit);
    
    // Update folder in state
    setFolders(prev => prev.map(f => f.id === folderId ? folder : f));
    
    // Log activity
    activityLogger.logFolderActivity(
      folder,
      'share',
      currentUser.id,
      `Folder shared with user ${userId} with ${permission} permission${inherit ? ' (inherited)' : ''}`,
      { userId, permission, inherit }
    );
    
    toast.success(`Folder shared with user`);
    return newPermission;
  };
  
  const removeFilePermission = (fileId: string, userId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) {
      toast.error('File not found');
      return;
    }
    
    // Check if current user has admin rights
    if (!permissionService.checkFilePermission(file, currentUser.id, 'admin')) {
      toast.error('You do not have permission to modify sharing settings');
      return;
    }
    
    permissionService.removeFilePermission(file, userId);
    
    // Update file in state
    setFiles(prev => prev.map(f => f.id === fileId ? file : f));
    
    // Log activity
    activityLogger.logFileActivity(
      file.id,
      file.name,
      'permission_change',
      currentUser.id,
      `Permission removed for user ${userId}`,
      { userId }
    );
    
    toast.success('Permission removed');
  };
  
  const removeFolderPermission = (folderId: string, userId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) {
      toast.error('Folder not found');
      return;
    }
    
    // Check if current user has admin rights
    if (!permissionService.checkFolderPermission(folder, currentUser.id, 'admin', folders)) {
      toast.error('You do not have permission to modify sharing settings');
      return;
    }
    
    permissionService.removeFolderPermission(folder, userId);
    
    // Update folder in state
    setFolders(prev => prev.map(f => f.id === folderId ? folder : f));
    
    // Log activity
    activityLogger.logFolderActivity(
      folder,
      'permission_change',
      currentUser.id,
      `Permission removed for user ${userId}`,
      { userId }
    );
    
    toast.success('Permission removed');
  };
  
  const checkFilePermission = (fileId: string, userId: string, permission: FilePermission['permission']) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return false;
    return permissionService.checkFilePermission(file, userId, permission);
  };
  
  const checkFolderPermission = (folderId: string, userId: string, permission: FolderPermission['permission']) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return false;
    return permissionService.checkFolderPermission(folder, userId, permission, folders);
  };
  
  const getRecentActivity = (limit: number = 50) => {
    return activityLogger.getActivities(limit);
  };
  
  const renameFile = (fileId: string, newName: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) {
      toast.error('File not found');
      return;
    }
    
    // Check permission
    if (!permissionService.checkFilePermission(file, currentUser.id, 'edit')) {
      toast.error('You do not have permission to rename this file');
      return;
    }
    
    const oldName = file.name;
    
    // Update file
    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, name: newName, updatedAt: new Date() } 
        : f
    ));
    
    // Log activity
    activityLogger.logFileActivity(
      file.id,
      newName,
      'rename',
      currentUser.id,
      `File renamed from "${oldName}" to "${newName}"`,
      { oldName, newName }
    );
    
    toast.success(`File renamed to ${newName}`);
  };
  
  const moveFile = (fileId: string, newFolderId: string | null) => {
    const file = files.find(f => f.id === fileId);
    if (!file) {
      toast.error('File not found');
      return;
    }
    
    // Check permission for source and destination
    if (!permissionService.checkFilePermission(file, currentUser.id, 'edit')) {
      toast.error('You do not have permission to move this file');
      return;
    }
    
    if (newFolderId) {
      const targetFolder = folders.find(f => f.id === newFolderId);
      if (!targetFolder) {
        toast.error('Target folder not found');
        return;
      }
      
      if (!permissionService.checkFolderPermission(targetFolder, currentUser.id, 'edit', folders)) {
        toast.error('You do not have permission to move files to the target folder');
        return;
      }
    }
    
    const oldFolderId = file.folderId;
    
    // Update file
    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, folderId: newFolderId, updatedAt: new Date() } 
        : f
    ));
    
    // Log activity
    activityLogger.logFileActivity(
      file.id,
      file.name,
      'move',
      currentUser.id,
      `File moved to ${newFolderId ? 'folder' : 'root'}`,
      { oldFolderId, newFolderId }
    );
    
    toast.success(`File moved successfully`);
  };
  
  return (
    <FileContext.Provider value={{
      files,
      folders,
      uploadFile,
      downloadFile,
      deleteFile,
      createFolder,
      deleteFolder,
      getFilesByFolder,
      getFoldersByParent,
      getFileActivities,
      getFileStats,
      shareFile,
      shareFolder,
      removeFilePermission,
      removeFolderPermission,
      checkFilePermission,
      checkFolderPermission,
      getRecentActivity,
      renameFile,
      moveFile,
    }}>
      {children}
    </FileContext.Provider>
  );
};

export const useFileContext = () => {
  const context = useContext(FileContext);
  if (context === undefined) {
    throw new Error('useFileContext must be used within a FileProvider');
  }
  return context;
};
