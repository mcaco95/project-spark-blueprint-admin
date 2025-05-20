
import { useState } from 'react';
import { FileGrid } from './FileGrid';
import { FileList } from './FileList';
import { FolderBrowser } from './FolderBrowser';
import { Button } from '@/components/ui/button';
import { FileUploader } from '@/components/files/FileUploader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileType, Folder, FileViewMode } from '@/types/file';
import { useFileContext } from '@/contexts/files/FileContext';
import { LayoutGrid, List, FolderPlus, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { NewFolderForm } from './NewFolderForm';

export function FileExplorer() {
  const { files, folders, createFolder } = useFileContext();
  const [viewMode, setViewMode] = useState<FileViewMode>('grid');
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  
  // Filter files based on current folder and search query
  const filteredFiles = files.filter(file => {
    const matchesFolder = file.folderId === currentFolder;
    const matchesSearch = searchQuery.length === 0 || 
      file.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });
  
  // Get subfolders of current folder
  const subFolders = folders.filter(folder => folder.parentId === currentFolder);
  
  // Get current folder object
  const folderObject = currentFolder ? folders.find(f => f.id === currentFolder) : null;
  
  // Get folder path
  const getFolderPath = (folderId: string | null): Folder[] => {
    if (!folderId) return [];
    
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return [];
    
    if (!folder.parentId) return [folder];
    
    return [...getFolderPath(folder.parentId), folder];
  };
  
  const folderPath = getFolderPath(currentFolder);
  
  const handleFolderClick = (folderId: string) => {
    setCurrentFolder(folderId);
  };
  
  const handleFolderUp = () => {
    if (folderObject?.parentId) {
      setCurrentFolder(folderObject.parentId);
    } else {
      setCurrentFolder(null); // Go to root
    }
  };
  
  const handlePathClick = (folderId: string | null) => {
    setCurrentFolder(folderId);
  };

  const handleFileSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleCreateFolder = async (name: string) => {
    await createFolder({
      name,
      parentId: currentFolder,
      path: folderPath.map(f => f.name).join('/') + (folderPath.length > 0 ? '/' : '') + name
    });
    setIsNewFolderOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Search files..."
            className="px-3 py-1 border rounded-md w-full sm:w-64"
            value={searchQuery}
            onChange={handleFileSearch}
          />
          <Tabs defaultValue={viewMode} onValueChange={(value) => setViewMode(value as FileViewMode)}>
            <TabsList>
              <TabsTrigger value="grid">
                <LayoutGrid className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="list">
                <List className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="flex space-x-2">
          <Dialog open={isNewFolderOpen} onOpenChange={setIsNewFolderOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
              </DialogHeader>
              <NewFolderForm 
                onSubmit={handleCreateFolder}
                currentPath={folderPath.map(f => f.name).join('/')}
              />
            </DialogContent>
          </Dialog>
          
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Files</DialogTitle>
              </DialogHeader>
              <FileUploader 
                folderId={currentFolder} 
                projectId={null} 
                onUploadComplete={() => setIsUploadOpen(false)} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <FolderBrowser 
        folders={folders}
        currentFolder={currentFolder}
        folderPath={folderPath}
        onFolderClick={handleFolderClick}
        onFolderUp={handleFolderUp}
        onPathClick={handlePathClick}
        subFolders={subFolders}
      />
      
      <Tabs defaultValue={viewMode} className="w-full">
        <TabsContent value="grid" className="mt-0">
          <FileGrid files={filteredFiles} />
        </TabsContent>
        <TabsContent value="list" className="mt-0">
          <FileList files={filteredFiles} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
