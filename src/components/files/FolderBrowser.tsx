
import { Button } from '@/components/ui/button';
import { Folder } from '@/types/file';
import { ChevronRight, ChevronUp, Folder as FolderIcon } from 'lucide-react';

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
  return (
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
            <Button
              key={folder.id}
              variant="outline"
              className="h-16 flex items-center justify-start p-4 hover:bg-muted"
              onClick={() => onFolderClick(folder.id)}
            >
              <FolderIcon className="h-6 w-6 mr-3 text-amber-500" />
              <div className="truncate">{folder.name}</div>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
