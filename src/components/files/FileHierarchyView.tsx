
import React, { useState, useEffect } from 'react';
import { Folder, ChevronRight, ChevronDown, FileText, Plus, FolderPlus, Upload } from 'lucide-react';
import { FileType, Folder as FolderType } from '@/types/file';
import { Button } from '@/components/ui/button';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/file-utils';

interface FileHierarchyViewProps {
  files: FileType[];
  folders: FolderType[];
  selectedItem?: FileType | FolderType | null;
  onSelectItem: (item: FileType | FolderType | null) => void;
  onCreateFolder: (parentId: string | null) => void;
  onUploadFile: (folderId: string | null) => void;
}

export function FileHierarchyView({
  files,
  folders,
  selectedItem,
  onSelectItem,
  onCreateFolder,
  onUploadFile
}: FileHierarchyViewProps) {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [rootFolders, setRootFolders] = useState<FolderType[]>([]);
  const [rootFiles, setRootFiles] = useState<FileType[]>([]);

  useEffect(() => {
    // Identify root folders and files (those with no parent folder)
    setRootFolders(folders.filter(folder => !folder.parentId));
    setRootFiles(files.filter(file => !file.folderId));
  }, [folders, files]);

  const toggleFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const getChildrenForFolder = (folderId: string) => {
    const childFolders = folders.filter(folder => folder.parentId === folderId);
    const childFiles = files.filter(file => file.folderId === folderId);
    return { childFolders, childFiles };
  };

  const renderFolder = (folder: FolderType, level = 0) => {
    const { childFolders, childFiles } = getChildrenForFolder(folder.id);
    const isExpanded = expandedFolders[folder.id];
    const isSelected = selectedItem && 'path' in selectedItem && selectedItem.id === folder.id;

    return (
      <div key={folder.id} className="select-none">
        <ContextMenu>
          <ContextMenuTrigger>
            <div 
              className={cn(
                "flex items-center py-1 px-2 rounded-md cursor-pointer",
                isSelected ? "bg-muted" : "hover:bg-muted/50",
                level > 0 ? `ml-${level * 4}` : ""
              )}
              style={{ marginLeft: `${level * 16}px` }}
              onClick={() => onSelectItem(folder)}
            >
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-5 w-5 p-0 mr-1"
                onClick={(e) => toggleFolder(folder.id, e)}
              >
                {childFolders.length > 0 || childFiles.length > 0 ? (
                  isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                ) : (
                  <span className="h-4 w-4" />
                )}
              </Button>
              <Folder className="h-4 w-4 mr-2 text-blue-500" />
              <span className="text-sm truncate">{folder.name}</span>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={() => onCreateFolder(folder.id)}>
              <FolderPlus className="h-4 w-4 mr-2" /> New Folder
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onUploadFile(folder.id)}>
              <Upload className="h-4 w-4 mr-2" /> Upload Files
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        {isExpanded && (
          <>
            {childFolders.map(childFolder => renderFolder(childFolder, level + 1))}
            {childFiles.map(file => renderFile(file, level + 1))}
          </>
        )}
      </div>
    );
  };

  const renderFile = (file: FileType, level = 0) => {
    const isSelected = selectedItem && 'url' in selectedItem && selectedItem.id === file.id;

    return (
      <div
        key={file.id}
        className={cn(
          "flex items-center py-1 px-2 rounded-md cursor-pointer",
          isSelected ? "bg-muted" : "hover:bg-muted/50"
        )}
        style={{ marginLeft: `${level * 16 + 20}px` }}
        onClick={() => onSelectItem(file)}
      >
        <FileText className="h-4 w-4 mr-2 text-gray-500" />
        <div className="flex-1 min-w-0">
          <div className="text-sm truncate">{file.name}</div>
          <div className="text-xs text-muted-foreground">{formatFileSize(file.size)}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="file-hierarchy border rounded-md p-2 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium">File Explorer</h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => onCreateFolder(null)} title="New Folder">
            <FolderPlus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onUploadFile(null)} title="Upload File">
            <Upload className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {rootFolders.map(folder => renderFolder(folder))}
      {rootFiles.map(file => renderFile(file))}

      {rootFolders.length === 0 && rootFiles.length === 0 && (
        <div className="text-center p-6 text-muted-foreground">
          <p className="mb-2">No files or folders yet</p>
          <div className="flex justify-center gap-2">
            <Button size="sm" variant="outline" onClick={() => onCreateFolder(null)}>
              <FolderPlus className="h-4 w-4 mr-2" /> New Folder
            </Button>
            <Button size="sm" variant="outline" onClick={() => onUploadFile(null)}>
              <Upload className="h-4 w-4 mr-2" /> Upload Files
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
