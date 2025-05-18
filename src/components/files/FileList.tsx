
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
import { Download, Trash2 } from 'lucide-react';

interface FileListProps {
  files: FileType[];
}

export function FileList({ files }: FileListProps) {
  const { downloadFile, deleteFile } = useFileContext();

  if (files.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">No files found</div>;
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Modified</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map(file => (
            <TableRow key={file.id}>
              <TableCell className="font-medium">
                <div className="flex items-center">
                  <span className="mr-2">{getFileTypeIcon(file.type)}</span>
                  <span className="truncate max-w-[200px]">{file.name}</span>
                </div>
              </TableCell>
              <TableCell>{formatFileSize(file.size)}</TableCell>
              <TableCell>{file.type}</TableCell>
              <TableCell>{format(new Date(file.updatedAt), 'MMM dd, yyyy')}</TableCell>
              <TableCell>{file.createdBy}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => downloadFile(file.id)}
                    className="h-8 w-8"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteFile(file.id)}
                    className="h-8 w-8"
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
  );
}
