
import { useState } from 'react';
import { FileType } from '@/types/file';
import { formatFileSize, getFileTypeIcon } from '@/lib/file-utils';
import { format } from 'date-fns';
import { useFileContext } from '@/contexts/files/FileContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Trash2, 
  Share2, 
  Info,
  Users
} from 'lucide-react';
import { FileDetailsView } from './FileDetailsView';
import { FileShareDialog } from './FileShareDialog';

interface FileListProps {
  files: FileType[];
}

export function FileList({ files }: FileListProps) {
  const { downloadFile, deleteFile } = useFileContext();
  const [selectedFile, setSelectedFile] = useState<FileType | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  if (files.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">No files found</div>;
  }

  return (
    <>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Modified</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map(file => (
              <TableRow key={file.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium" onClick={() => setSelectedFile(file)}>
                  <div className="flex items-center">
                    <span className="mr-2">{getFileTypeIcon(file.type)}</span>
                    <span className="truncate max-w-[200px]">{file.name}</span>
                  </div>
                </TableCell>
                <TableCell>{formatFileSize(file.size)}</TableCell>
                <TableCell>{file.type}</TableCell>
                <TableCell>{format(new Date(file.updatedAt), 'MMM dd, yyyy')}</TableCell>
                <TableCell>{file.createdBy}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    {file.accessCount && file.accessCount > 0 ? (
                      <Badge variant="outline" className="text-xs">
                        {file.accessCount} {file.accessCount === 1 ? 'view' : 'views'}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        No views
                      </Badge>
                    )}
                    
                    {file.permissions && file.permissions.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {file.permissions.length}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedFile(file)}
                      className="h-8 w-8"
                      title="View Details"
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => downloadFile(file.id)}
                      className="h-8 w-8"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsShareDialogOpen(true)}
                      className="h-8 w-8"
                      title="Share"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteFile(file.id)}
                      className="h-8 w-8"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {selectedFile && (
        <FileDetailsView 
          file={selectedFile} 
          onClose={() => setSelectedFile(null)} 
        />
      )}
      
      {selectedFile && isShareDialogOpen && (
        <FileShareDialog
          isOpen={isShareDialogOpen}
          onClose={() => setIsShareDialogOpen(false)}
          item={selectedFile}
          type="file"
        />
      )}
    </>
  );
}
