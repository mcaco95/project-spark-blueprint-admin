
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { FileType, Folder, FileViewMode, FileTag } from '@/types/file';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

interface FileContextType {
  files: FileType[];
  folders: Folder[];
  tags: FileTag[];
  currentFolder: Folder | null;
  viewMode: FileViewMode;
  uploadFile: (file: File, folderId: string | null, projectId: string | null) => Promise<FileType>;
  createFolder: (name: string, parentId: string | null, projectId: string | null) => Folder;
  deleteFile: (fileId: string) => void;
  deleteFolder: (folderId: string) => void;
  updateFile: (file: FileType) => void;
  updateFolder: (folder: Folder) => void;
  setCurrentFolder: (folder: Folder | null) => void;
  setViewMode: (mode: FileViewMode) => void;
  getFilesByFolder: (folderId: string | null) => FileType[];
  getSubFolders: (parentId: string | null) => Folder[];
  addTag: (tag: Omit<FileTag, 'id'>) => FileTag;
  removeTag: (tagId: string) => void;
  addFileToFavorites: (fileId: string) => void;
  removeFileFromFavorites: (fileId: string) => void;
  getFavoriteFiles: () => FileType[];
}

// Sample initial data
const initialFiles: FileType[] = [];
const initialFolders: Folder[] = [
  {
    id: 'root',
    name: 'Root',
    parentId: null,
    projectId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    path: '/'
  }
];
const initialTags: FileTag[] = [
  { id: 'tag1', name: 'Important', color: '#ff0000' },
  { id: 'tag2', name: 'Draft', color: '#0000ff' },
  { id: 'tag3', name: 'Completed', color: '#00ff00' }
];

const FileContext = createContext<FileContextType | undefined>(undefined);

export const FileProvider = ({ children }: { children: ReactNode }) => {
  const [files, setFiles] = useState<FileType[]>(initialFiles);
  const [folders, setFolders] = useState<Folder[]>(initialFolders);
  const [tags, setTags] = useState<FileTag[]>(initialTags);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(initialFolders[0]);
  const [viewMode, setViewMode] = useState<FileViewMode>('grid');

  const uploadFile = async (file: File, folderId: string | null, projectId: string | null): Promise<FileType> => {
    // In a real app, this would upload to a server/storage service
    // For now, we'll just simulate the upload
    
    const fileUrl = URL.createObjectURL(file);
    
    const newFile: FileType = {
      id: uuidv4(),
      name: file.name,
      type: file.type,
      size: file.size,
      url: fileUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'Current User', // Would come from auth context in real app
      folderId,
      projectId,
      tags: [],
      favorite: false
    };
    
    setFiles(prev => [...prev, newFile]);
    toast.success(`File ${file.name} uploaded successfully`);
    
    return newFile;
  };

  const createFolder = (name: string, parentId: string | null, projectId: string | null): Folder => {
    // Find parent path to construct new folder path
    const parentFolder = parentId ? folders.find(f => f.id === parentId) : initialFolders[0];
    const path = parentFolder ? `${parentFolder.path}${name}/` : `/${name}/`;
    
    const newFolder: Folder = {
      id: uuidv4(),
      name,
      parentId,
      projectId,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'Current User', // Would come from auth context in real app
      path
    };
    
    setFolders(prev => [...prev, newFolder]);
    toast.success(`Folder ${name} created`);
    
    return newFolder;
  };

  const deleteFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
    toast.success('File deleted');
  };

  const deleteFolder = (folderId: string) => {
    // First check if folder has files or subfolders
    const hasFiles = files.some(file => file.folderId === folderId);
    const hasSubFolders = folders.some(folder => folder.parentId === folderId);
    
    if (hasFiles || hasSubFolders) {
      toast.error('Cannot delete folder with files or subfolders');
      return;
    }
    
    setFolders(prev => prev.filter(folder => folder.id !== folderId));
    toast.success('Folder deleted');
  };

  const updateFile = (file: FileType) => {
    setFiles(prev => prev.map(f => f.id === file.id ? {...file, updatedAt: new Date()} : f));
    toast.success(`File ${file.name} updated`);
  };

  const updateFolder = (folder: Folder) => {
    setFolders(prev => prev.map(f => f.id === folder.id ? {...folder, updatedAt: new Date()} : f));
    toast.success(`Folder ${folder.name} updated`);
  };

  const getFilesByFolder = (folderId: string | null) => {
    return files.filter(file => file.folderId === folderId);
  };

  const getSubFolders = (parentId: string | null) => {
    return folders.filter(folder => folder.parentId === parentId);
  };

  const addTag = (tag: Omit<FileTag, 'id'>) => {
    const newTag = { ...tag, id: uuidv4() };
    setTags(prev => [...prev, newTag]);
    return newTag;
  };

  const removeTag = (tagId: string) => {
    setTags(prev => prev.filter(tag => tag.id !== tagId));
    
    // Also remove this tag from any files that have it
    setFiles(prev => 
      prev.map(file => ({
        ...file,
        tags: file.tags?.filter(t => t !== tagId)
      }))
    );
  };

  const addFileToFavorites = (fileId: string) => {
    setFiles(prev => 
      prev.map(file => 
        file.id === fileId ? { ...file, favorite: true } : file
      )
    );
    toast.success('Added to favorites');
  };

  const removeFileFromFavorites = (fileId: string) => {
    setFiles(prev => 
      prev.map(file => 
        file.id === fileId ? { ...file, favorite: false } : file
      )
    );
    toast.success('Removed from favorites');
  };

  const getFavoriteFiles = () => {
    return files.filter(file => file.favorite === true);
  };

  return (
    <FileContext.Provider value={{
      files,
      folders,
      tags,
      currentFolder,
      viewMode,
      uploadFile,
      createFolder,
      deleteFile,
      deleteFolder,
      updateFile,
      updateFolder,
      setCurrentFolder,
      setViewMode,
      getFilesByFolder,
      getSubFolders,
      addTag,
      removeTag,
      addFileToFavorites,
      removeFileFromFavorites,
      getFavoriteFiles
    }}>
      {children}
    </FileContext.Provider>
  );
};

export const useFileContext = () => {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error('useFileContext must be used within a FileProvider');
  }
  return context;
};
