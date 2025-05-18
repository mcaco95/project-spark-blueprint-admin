
import { MainLayout } from '@/components/layout/MainLayout';

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
        
        <div className="p-8 text-center">
          <p className="text-muted-foreground">File manager coming soon</p>
        </div>
      </div>
    </MainLayout>
  );
};

export default FileManager;
