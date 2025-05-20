
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Folder } from '@/types/file';
import { ChevronRight, ChevronUp, Folder as FolderIcon, Share2, Users } from 'lucide-react';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { Badge } from '@/components/ui/badge';
import { FileShareDialog } from './FileShareDialog';

interface FolderBrowserProps {
  folders: Folder[];
  currentFolder: string | null;
  folderPath: Folder[];
  subFolders: Folder[];
  onFolderClick: (folderId: string) => void;
  onFolderUp: () => void;
  onPathClick: (folderId: string | null) => void;
}

export function FolderBrowser({
  folders,
  currentFolder,
  folderPath,
  subFolders,
  onFolderClick,
  onFolderUp,
  onPathClick
}: FolderBrowserProps) {
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  
  const handleShareFolder = (folder: Folder, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent folder navigation
    setSelectedFolder(folder);
    setIsShareDialogOpen(true);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center space-x-1 text-sm">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
            onClick={() => onPathClick(null)}
          >
            Home
          </Button>
          
          {folderPath.map((folder, index) => (
            <div key={folder.id} className="flex items-center">
              <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-muted-foreground hover:text-foreground"
                onClick={() => onPathClick(folder.id)}
              >
                {folder.name}
              </Button>
            </div>
          ))}
        </div>
        
        {currentFolder && (
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center"
              onClick={onFolderUp}
            >
              <ChevronUp className="h-4 w-4 mr-2" />
              Up
            </Button>
          </div>
        )}
        
        {subFolders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {subFolders.map(folder => (
              <ContextMenu key={folder.id}>
                <ContextMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-16 flex items-center justify-start p-4 hover:bg-muted group relative w-full"
                    onClick={() => onFolderClick(folder.id)}
                  >
                    <FolderIcon className="h-6 w-6 mr-3 text-amber-500" />
                    <div className="truncate flex-1">{folder.name}</div>
                    
                    {folder.permissions && folder.permissions.length > 0 && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {folder.permissions.length}
                      </Badge>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 absolute right-2"
                      onClick={(e) => handleShareFolder(folder, e)}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </Button>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => onFolderClick(folder.id)}>Open</ContextMenuItem>
                  <ContextMenuItem onClick={() => { 
                    setSelectedFolder(folder);
                    setIsShareDialogOpen(true);
                  }}>Share</ContextMenuItem>
                  <ContextMenuItem>Rename</ContextMenuItem>
                  <ContextMenuItem>Delete</ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>
        )}
      </div>
      
      {selectedFolder && isShareDialogOpen && (
        <FileShareDialog
          isOpen={isShareDialogOpen}
          onClose={() => setIsShareDialogOpen(false)}
          item={selectedFolder}
          type="folder"
        />
      )}
    </>
  );
}
