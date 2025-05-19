
import { useState } from 'react';
import { useFileContext } from '@/contexts/files/FileContext';
import { FileType, Folder, FilePermission } from '@/types/file';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Share2, Users, Link, Mail } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

interface FileShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: FileType | Folder;
  type: 'file' | 'folder';
}

// Mock users for demonstration
const mockUsers = [
  { id: 'user-1', name: 'John Doe', email: 'john@example.com', avatar: 'JD' },
  { id: 'user-2', name: 'Jane Smith', email: 'jane@example.com', avatar: 'JS' },
  { id: 'user-3', name: 'Mike Johnson', email: 'mike@example.com', avatar: 'MJ' },
  { id: 'user-4', name: 'Emily Davis', email: 'emily@example.com', avatar: 'ED' },
];

export function FileShareDialog({ isOpen, onClose, item, type }: FileShareDialogProps) {
  const { shareFile, shareFolder, removeFilePermission, removeFolderPermission } = useFileContext();
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedPermission, setSelectedPermission] = useState<FilePermission['permission']>('view');
  const [inheritPermissions, setInheritPermissions] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  
  const handleShare = () => {
    if (!selectedUser) {
      toast.error('Please select a user');
      return;
    }
    
    if (type === 'file') {
      shareFile(item.id, selectedUser, selectedPermission);
    } else {
      shareFolder(item.id, selectedUser, selectedPermission, inheritPermissions);
    }
    
    setSelectedUser('');
    setSelectedPermission('view');
  };
  
  const handleInviteByEmail = () => {
    if (!emailInput || !emailInput.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }
    
    // This would normally create a new user or send an invite
    toast.success(`Invitation sent to ${emailInput}`);
    setEmailInput('');
  };
  
  const handleRemovePermission = (userId: string) => {
    if (type === 'file') {
      removeFilePermission(item.id, userId);
    } else {
      removeFolderPermission(item.id, userId);
    }
  };
  
  // Get existing permissions
  const permissions = item.permissions || [];

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Share2 className="mr-2 h-5 w-5" />
            Share {type === 'file' ? 'File' : 'Folder'}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="users">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" /> Users
            </TabsTrigger>
            <TabsTrigger value="link">
              <Link className="h-4 w-4 mr-2" /> Link
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="h-4 w-4 mr-2" /> Email
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="space-y-4">
            <div className="flex space-x-2">
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {mockUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarFallback>{user.avatar}</AvatarFallback>
                        </Avatar>
                        <span>{user.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedPermission} onValueChange={(value) => setSelectedPermission(value as FilePermission['permission'])}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Permission" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              
              <Button onClick={handleShare}>Share</Button>
            </div>
            
            {type === 'folder' && (
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="inherit" 
                  checked={inheritPermissions}
                  onCheckedChange={(checked) => setInheritPermissions(!!checked)}
                />
                <Label htmlFor="inherit">Apply to all subfolders and files</Label>
              </div>
            )}
            
            <div className="border rounded-md">
              <div className="p-2 bg-muted font-medium">Current Access</div>
              
              {permissions.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No users have access yet
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {permissions.map(permission => {
                    const user = mockUsers.find(u => u.id === permission.userId);
                    return (
                      <div key={permission.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-3">
                            <AvatarFallback>
                              {user ? user.avatar : permission.userId.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p>{user ? user.name : permission.userId}</p>
                            <p className="text-xs text-muted-foreground">{permission.permission}</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRemovePermission(permission.userId)}
                        >
                          Remove
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="link" className="space-y-4">
            <div className="space-y-2">
              <Label>Share Link</Label>
              <div className="flex space-x-2">
                <Input 
                  value={`https://example.com/share/${item.id}`} 
                  readOnly 
                />
                <Button>Copy</Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Link Permissions</Label>
              <Select defaultValue="view">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View only</SelectItem>
                  <SelectItem value="edit">Can edit</SelectItem>
                  <SelectItem value="download">Can download</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Link Expiration</Label>
              <Select defaultValue="never">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1day">1 Day</SelectItem>
                  <SelectItem value="7days">7 Days</SelectItem>
                  <SelectItem value="30days">30 Days</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
          
          <TabsContent value="email" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex space-x-2">
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="Enter email address"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                />
                <Button onClick={handleInviteByEmail}>Send</Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Permission Level</Label>
              <Select defaultValue="view">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Input 
                id="message" 
                placeholder="Add a personal message"
              />
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
