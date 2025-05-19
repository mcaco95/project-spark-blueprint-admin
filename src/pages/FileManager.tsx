
import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { FileExplorer } from '@/components/files/FileExplorer';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileProvider } from '@/contexts/files/FileContext';
import { FileActivityFeed } from '@/components/files/FileActivityFeed';
import { Files, Clock, FolderTree } from 'lucide-react';
import { FileHierarchyView } from '@/components/files/FileHierarchyView';
import { HierarchyBreadcrumbs } from '@/components/hierarchy/HierarchyBreadcrumbs';
import { FileType, Folder } from '@/types/file';

const FileManager = () => {
  const [activeTab, setActiveTab] = useState('files');
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<FileType | Folder | null>(null);
  
  const handleNavigate = (path: string[], index: number) => {
    setCurrentPath(path);
    // Logic to navigate to the selected directory would be implemented here
  };
  
  const handleCreateFolder = (parentId: string | null) => {
    // This would be implemented with your file context
    console.log("Create folder with parent:", parentId);
  };
  
  const handleUploadFile = (folderId: string | null) => {
    // This would be implemented with your file context
    console.log("Upload file to folder:", folderId);
  };
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">File Manager</h1>
          <p className="text-muted-foreground mt-2">
            Upload, organize, share and track your project files
          </p>
        </div>
        
        <FileProvider>
          <Tabs 
            defaultValue="files" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <TabsList>
              <TabsTrigger value="files">
                <Files className="h-4 w-4 mr-2" /> Files
              </TabsTrigger>
              <TabsTrigger value="hierarchy">
                <FolderTree className="h-4 w-4 mr-2" /> Hierarchy
              </TabsTrigger>
              <TabsTrigger value="activity">
                <Clock className="h-4 w-4 mr-2" /> Activity
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="files" className="space-y-4">
              <Card className="border shadow-sm">
                <CardContent className="p-6">
                  <FileExplorer />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="hierarchy" className="space-y-4">
              <Card className="border shadow-sm">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <HierarchyBreadcrumbs 
                      path={currentPath}
                      onNavigate={handleNavigate}
                      className="mb-4"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-1">
                      {/* This component would need actual files and folders data from your context */}
                      <FileHierarchyView 
                        files={[]} 
                        folders={[]} 
                        selectedItem={selectedItem}
                        onSelectItem={setSelectedItem}
                        onCreateFolder={handleCreateFolder}
                        onUploadFile={handleUploadFile}
                      />
                    </div>
                    <div className="md:col-span-3">
                      {selectedItem ? (
                        <div className="bg-muted/50 p-4 rounded-md">
                          <h3 className="text-lg font-medium mb-2">
                            {'name' in selectedItem ? selectedItem.name : 'Selected Item'}
                          </h3>
                          <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                            {JSON.stringify(selectedItem, null, 2)}
                          </pre>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-64 bg-muted/50 rounded-md">
                          <p className="text-muted-foreground">Select a file or folder to view details</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="activity" className="space-y-4">
              <FileActivityFeed showHeader={false} />
            </TabsContent>
          </Tabs>
        </FileProvider>
      </div>
    </MainLayout>
  );
};

export default FileManager;
