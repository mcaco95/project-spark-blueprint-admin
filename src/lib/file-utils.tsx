
import { File, FileArchive, FileText, Image, Music, Video, FileQuestion } from 'lucide-react';

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return bytes + ' B';
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + ' KB';
  } else if (bytes < 1024 * 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  } else {
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  }
}

export function getFileTypeIcon(mimeType: string): React.ReactNode {
  if (mimeType.startsWith('image/')) {
    return <Image className="h-8 w-8" />;
  } else if (mimeType.startsWith('video/')) {
    return <Video className="h-8 w-8" />;
  } else if (mimeType.startsWith('audio/')) {
    return <Music className="h-8 w-8" />;
  } else if (mimeType.startsWith('text/')) {
    return <FileText className="h-8 w-8" />;
  } else if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar') || mimeType.includes('gz')) {
    return <FileArchive className="h-8 w-8" />;
  } else if (mimeType.includes('pdf')) {
    return <FileText className="h-8 w-8" />;
  } else if (mimeType.includes('document') || mimeType.includes('sheet') || mimeType.includes('presentation')) {
    return <FileText className="h-8 w-8" />;
  }
  
  return <FileQuestion className="h-8 w-8" />;
}
