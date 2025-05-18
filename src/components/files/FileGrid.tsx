
import { FileType } from '@/types/file';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { formatFileSize, getFileTypeIcon } from '@/lib/file-utils';
import { formatDistance } from 'date-fns';
import { useFileContext } from '@/contexts/files/FileContext';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Download, Trash2, Edit, ChevronDown } from 'lucide-react';

interface FileGridProps {
  files: FileType[];
}

export function FileGrid({ files }: FileGridProps) {
  const { downloadFile, deleteFile } = useFileContext();
  
  if (files.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">No files found</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {files.map(file => (
        <Card key={file.id} className="overflow-hidden group">
          <div className="relative h-32 bg-muted flex items-center justify-center">
            {file.thumbnail ? (
              <img 
                src={file.thumbnail} 
                alt={file.name} 
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="text-4xl">{getFileTypeIcon(file.type)}</div>
            )}
          </div>
          <CardContent className="py-3">
            <div className="truncate font-medium">{file.name}</div>
            <div className="text-xs text-muted-foreground flex justify-between">
              <span>{formatFileSize(file.size)}</span>
              <span>{formatDistance(new Date(file.updatedAt), new Date(), { addSuffix: true })}</span>
            </div>
          </CardContent>
          <CardFooter className="py-2 px-1 border-t">
            <div className="w-full flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => downloadFile(file.id)}>
                    <Download className="h-4 w-4 mr-2" /> Download
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Edit className="h-4 w-4 mr-2" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => deleteFile(file.id)}>
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
