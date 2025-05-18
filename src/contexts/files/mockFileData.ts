
import { FileType, Folder } from '@/types/file';
import { v4 as uuidv4 } from 'uuid';

// Generate a static date for consistency
const now = new Date();
const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

export const initialFolders: Folder[] = [
  {
    id: 'folder-1',
    name: 'Documents',
    parentId: null,
    projectId: null,
    createdAt: oneWeekAgo,
    updatedAt: oneWeekAgo,
    createdBy: 'Admin User',
    path: 'Documents'
  },
  {
    id: 'folder-2',
    name: 'Images',
    parentId: null,
    projectId: null,
    createdAt: oneWeekAgo,
    updatedAt: oneWeekAgo,
    createdBy: 'Admin User',
    path: 'Images'
  },
  {
    id: 'folder-3',
    name: 'Project Specs',
    parentId: 'folder-1',
    projectId: null,
    createdAt: oneWeekAgo,
    updatedAt: oneWeekAgo,
    createdBy: 'Admin User',
    path: 'Documents/Project Specs'
  },
  {
    id: 'folder-4',
    name: 'Reports',
    parentId: 'folder-1',
    projectId: null,
    createdAt: oneWeekAgo,
    updatedAt: oneWeekAgo,
    createdBy: 'Admin User',
    path: 'Documents/Reports'
  },
  {
    id: 'folder-5',
    name: 'Screenshots',
    parentId: 'folder-2',
    projectId: null,
    createdAt: oneWeekAgo,
    updatedAt: oneWeekAgo,
    createdBy: 'Admin User',
    path: 'Images/Screenshots'
  }
];

export const initialFiles: FileType[] = [
  {
    id: 'file-1',
    name: 'Project Requirements.pdf',
    type: 'application/pdf',
    size: 1024 * 1024 * 2.5, // 2.5 MB
    url: '/placeholder.svg',
    createdAt: oneWeekAgo,
    updatedAt: oneWeekAgo,
    createdBy: 'Admin User',
    folderId: 'folder-3',
    projectId: null,
    tags: ['requirements', 'documentation'],
    description: 'Project requirements document'
  },
  {
    id: 'file-2',
    name: 'Design Mockup.png',
    type: 'image/png',
    size: 1024 * 1024 * 3.7, // 3.7 MB
    url: '/placeholder.svg',
    thumbnail: '/placeholder.svg',
    createdAt: twoDaysAgo,
    updatedAt: twoDaysAgo,
    createdBy: 'Designer User',
    folderId: 'folder-5',
    projectId: null,
    tags: ['design', 'mockup'],
    description: 'Website design mockup'
  },
  {
    id: 'file-3',
    name: 'Project Timeline.xlsx',
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 1024 * 512, // 512 KB
    url: '/placeholder.svg',
    createdAt: oneDayAgo,
    updatedAt: oneDayAgo,
    createdBy: 'Project Manager',
    folderId: 'folder-1',
    projectId: null,
    tags: ['timeline', 'project management'],
    description: 'Project timeline and milestones'
  },
  {
    id: 'file-4',
    name: 'Meeting Notes.docx',
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 1024 * 256, // 256 KB
    url: '/placeholder.svg',
    createdAt: oneHourAgo,
    updatedAt: oneHourAgo,
    createdBy: 'Admin User',
    folderId: 'folder-4',
    projectId: null,
    tags: ['meeting', 'notes'],
    description: 'Notes from the last project meeting'
  },
  {
    id: 'file-5',
    name: 'Logo.svg',
    type: 'image/svg+xml',
    size: 1024 * 15, // 15 KB
    url: '/placeholder.svg',
    thumbnail: '/placeholder.svg',
    createdAt: twoDaysAgo,
    updatedAt: twoDaysAgo,
    createdBy: 'Designer User',
    folderId: 'folder-2',
    projectId: null,
    tags: ['logo', 'branding'],
    description: 'Company logo in SVG format'
  },
  {
    id: 'file-6',
    name: 'API Documentation.pdf',
    type: 'application/pdf',
    size: 1024 * 1024 * 1.2, // 1.2 MB
    url: '/placeholder.svg',
    createdAt: twoDaysAgo,
    updatedAt: twoDaysAgo,
    createdBy: 'Developer User',
    folderId: 'folder-3',
    projectId: null,
    tags: ['api', 'documentation'],
    description: 'API documentation for developers'
  },
  {
    id: 'file-7',
    name: 'Project Presentation.pptx',
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    size: 1024 * 1024 * 5.8, // 5.8 MB
    url: '/placeholder.svg',
    createdAt: oneDayAgo,
    updatedAt: oneDayAgo,
    createdBy: 'Project Manager',
    folderId: 'folder-1',
    projectId: null,
    tags: ['presentation', 'client'],
    description: 'Client presentation deck'
  }
];
