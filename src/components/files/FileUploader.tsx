
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, X, File as FileIcon } from 'lucide-react';
import { useFileContext } from '@/contexts/files/FileContext';
import { toast } from 'sonner';

interface FileUploaderProps {
  folderId: string | null;
  projectId: string | null;
  onUploadComplete?: () => void;
}

export function FileUploader({ folderId, projectId, onUploadComplete }: FileUploaderProps) {
  const { uploadFile } = useFileContext();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setIsUploading(true);
    setProgress(0);

    // Upload files one by one
    for (let i = 0; i < selectedFiles.length; i++) {
      try {
        await uploadFile(selectedFiles[i], folderId, projectId);
        // Update progress
        setProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
      } catch (error) {
        console.error('Error uploading file:', error);
        toast.error(`Error uploading ${selectedFiles[i].name}`);
      }
    }

    setIsUploading(false);
    setSelectedFiles([]);
    if (onUploadComplete) {
      onUploadComplete();
    }
  };

  const cancelUpload = () => {
    setIsUploading(false);
    setSelectedFiles([]);
    setProgress(0);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        multiple 
      />
      
      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={handleFileSelect}
      >
        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Click to select files or drag files here</p>
      </div>
      
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="font-medium">Selected files ({selectedFiles.length})</p>
          <div className="max-h-40 overflow-y-auto space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                <div className="flex items-center">
                  <FileIcon className="h-4 w-4 mr-2" />
                  <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeFile(index)} disabled={isUploading}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {isUploading && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-center">{progress}% uploaded</p>
        </div>
      )}
      
      <div className="flex space-x-2 justify-end">
        {isUploading ? (
          <Button variant="outline" onClick={cancelUpload}>Cancel</Button>
        ) : (
          <Button onClick={handleUpload} disabled={selectedFiles.length === 0}>
            <Upload className="h-4 w-4 mr-2" /> Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}
          </Button>
        )}
      </div>
    </div>
  );
}
