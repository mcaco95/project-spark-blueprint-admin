
import { MainLayout } from '@/components/layout/MainLayout';
import { FileExplorer } from '@/components/files/FileExplorer';
import { FileUploader } from '@/components/files/FileUploader';
import { Card, CardContent } from '@/components/ui/card';
import { FileProvider } from '@/contexts/files/FileContext';

const FileManager = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">File Manager</h1>
          <p className="text-muted-foreground mt-2">
            Upload, organize and share your project files
          </p>
        </div>
        
        <FileProvider>
          <div className="space-y-6">
            <Card className="border shadow-sm">
              <CardContent className="p-6">
                <FileExplorer />
              </CardContent>
            </Card>
          </div>
        </FileProvider>
      </div>
    </MainLayout>
  );
};

export default FileManager;
