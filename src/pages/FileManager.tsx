
import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { FileExplorer } from '@/components/files/FileExplorer';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileProvider } from '@/contexts/files/FileContext';
import { FileActivityFeed } from '@/components/files/FileActivityFeed';
import { Files, Clock } from 'lucide-react';

const FileManager = () => {
  const [activeTab, setActiveTab] = useState('files');
  
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
