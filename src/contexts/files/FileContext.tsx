
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { FileType, Folder } from '@/types/file';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { initialFiles, initialFolders } from './mockFileData';

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
}

const FileContext = createContext<FileContextType | undefined>(undefined);

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
      createdBy: 'Current User', // In a real app, this would be the current user
      folderId,
      projectId,
    };
    
    setFiles(prev => [...prev, newFile]);
    toast.success(`File uploaded: ${file.name}`);
    
    return newFile;
  };
  
  const downloadFile = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) {
      toast.error('File not found');
      return;
    }
    
    // In a real app, this would trigger a file download
    // For now, we'll just open the URL in a new tab
    window.open(file.url, '_blank');
    toast.success(`Downloading: ${file.name}`);
  };
  
  const deleteFile = (fileId: string) => {
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
      createdBy: 'Current User', // In a real app, this would be the current user
      path: folderData.path || folderData.name || 'New Folder',
    };
    
    setFolders(prev => [...prev, newFolder]);
    toast.success(`Folder created: ${newFolder.name}`);
    
    return newFolder;
  };
  
  const deleteFolder = (folderId: string) => {
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
        deleteSubfolders(subfolder.id);
      }
    };
    
    deleteSubfolders(folderId);
    toast.success('Folder deleted');
  };
  
  const getFilesByFolder = (folderId: string | null) => {
    return files.filter(file => file.folderId === folderId);
  };
  
  const getFoldersByParent = (parentId: string | null) => {
    return folders.filter(folder => folder.parentId === parentId);
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
