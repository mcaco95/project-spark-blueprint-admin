
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface NewFolderFormProps {
  onSubmit: (name: string) => void;
  currentPath: string;
}

export function NewFolderForm({ onSubmit, currentPath }: NewFolderFormProps) {
  const [folderName, setFolderName] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!folderName.trim()) {
      setError('Folder name cannot be empty');
      return;
    }
    
    // Check for invalid characters in folder name
    if (/[<>:"\/\\|?*]/.test(folderName)) {
      setError('Folder name contains invalid characters');
      return;
    }
    
    onSubmit(folderName);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="path">Location</Label>
        <Input id="path" value={currentPath || 'Home'} disabled />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="name">Folder Name</Label>
        <Input 
          id="name"
          value={folderName}
          onChange={(e) => {
            setFolderName(e.target.value);
            setError(null);
          }}
          placeholder="Enter folder name"
          autoFocus
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="submit">Create Folder</Button>
      </div>
    </form>
  );
}
