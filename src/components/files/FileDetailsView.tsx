
import { useState } from 'react';
import { FileType } from '@/types/file';
import { formatFileSize, getFileTypeIcon } from '@/lib/file-utils';
import { format } from 'date-fns';
import { useFileContext } from '@/contexts/files/FileContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Download, 
  Trash2, 
  Edit, 
  Users, 
  Save, 
  X,
  Clock,
  Info,
  BarChart 
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface FileDetailsViewProps {
  file: FileType;
  onClose: () => void;
}

export function FileDetailsView({ file, onClose }: FileDetailsViewProps) {
  const { downloadFile, deleteFile, renameFile, getFileActivities, getFileStats } = useFileContext();
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(file.name);
  const [newDescription, setNewDescription] = useState(file.description || '');

  const activities = getFileActivities(file.id);
  const stats = getFileStats(file.id);
  
  const handleSave = () => {
    renameFile(file.id, newName);
    setIsEditing(false);
  };
  
  const handleDelete = () => {
    deleteFile(file.id);
    onClose();
  };
  
  const FileMeta = () => (
    <div className="space-y-4">
      {isEditing ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="filename">File Name</Label>
            <Input 
              id="filename" 
              value={newName} 
              onChange={e => setNewName(e.target.value)} 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input 
              id="description" 
              value={newDescription} 
              onChange={e => setNewDescription(e.target.value)} 
            />
          </div>
          
          <div className="flex space-x-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
              <X className="h-4 w-4 mr-2" /> Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" /> Save
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold truncate">{file.name}</h2>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" /> Edit
            </Button>
          </div>
          
          {file.description && (
            <p className="text-muted-foreground">{file.description}</p>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Type</h3>
              <p>{file.type}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Size</h3>
              <p>{formatFileSize(file.size)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
              <p>{format(new Date(file.createdAt), 'MMM dd, yyyy')}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Last Modified</h3>
              <p>{format(new Date(file.updatedAt), 'MMM dd, yyyy')}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Created By</h3>
              <p>{file.createdBy}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Access Count</h3>
              <p>{file.accessCount || 0}</p>
            </div>
          </div>
          
          <div className="flex space-x-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => downloadFile(file.id)}>
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
  
  const FileHistory = () => (
    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
      {activities.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">No activity recorded yet</p>
      ) : (
        <div className="space-y-4">
          {activities.map(activity => (
            <div key={activity.id} className="flex items-start space-x-3 pb-3 border-b border-border last:border-0">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{activity.performedBy.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="font-medium">{activity.performedBy}</span>{' '}
                  {activity.activityType === 'create' && 'uploaded this file'}
                  {activity.activityType === 'view' && 'viewed this file'}
                  {activity.activityType === 'download' && 'downloaded this file'}
                  {activity.activityType === 'edit' && 'edited this file'}
                  {activity.activityType === 'delete' && 'deleted this file'}
                  {activity.activityType === 'rename' && 'renamed this file'}
                  {activity.activityType === 'move' && 'moved this file'}
                  {activity.activityType === 'share' && 'shared this file'}
                  {activity.activityType === 'permission_change' && 'changed permissions'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(activity.performedAt), 'MMM dd, yyyy HH:mm')}
                </p>
                {activity.details && (
                  <p className="text-xs">{activity.details}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
  
  const FilePermissions = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Users with Access</h3>
        <Button size="sm">
          <Users className="h-4 w-4 mr-2" /> Share
        </Button>
      </div>
      
      {!file.permissions || file.permissions.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">No permissions set</p>
      ) : (
        <div className="space-y-2">
          {file.permissions.map(permission => (
            <div key={permission.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{permission.userId.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p>{permission.userName || permission.userId}</p>
                  <p className="text-xs text-muted-foreground">{permission.permission}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      
      <Separator />
      
      <div className="pt-2">
        <h3 className="text-lg font-medium mb-4">Permission Settings</h3>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p>Allow Download</p>
              <p className="text-xs text-muted-foreground">Users can download this file</p>
            </div>
            <div>
              <Button variant="outline" size="sm">Toggle</Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p>Require Authentication</p>
              <p className="text-xs text-muted-foreground">Only logged in users can access</p>
            </div>
            <div>
              <Button variant="outline" size="sm">Toggle</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  const FileAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.views || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.downloads || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Edits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.edits || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unique Viewers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.mostFrequentViewers?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-2">Most Active Users</h3>
        {stats.mostFrequentViewers && stats.mostFrequentViewers.length > 0 ? (
          <div className="space-y-2">
            {stats.mostFrequentViewers.map((viewer: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{viewer.userId.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p>{viewer.userName || viewer.userId}</p>
                  </div>
                </div>
                <div className="text-sm">{viewer.count} actions</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-2">No user activity data</p>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={!!file} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <span className="mr-2">{getFileTypeIcon(file.type)}</span>
            File Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="info">
            <TabsList className="mb-4">
              <TabsTrigger value="info">
                <Info className="h-4 w-4 mr-2" /> Details
              </TabsTrigger>
              <TabsTrigger value="history">
                <Clock className="h-4 w-4 mr-2" /> Activity
              </TabsTrigger>
              <TabsTrigger value="permissions">
                <Users className="h-4 w-4 mr-2" /> Sharing
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart className="h-4 w-4 mr-2" /> Analytics
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="info" className="space-y-4">
              <FileMeta />
            </TabsContent>
            
            <TabsContent value="history">
              <FileHistory />
            </TabsContent>
            
            <TabsContent value="permissions">
              <FilePermissions />
            </TabsContent>
            
            <TabsContent value="analytics">
              <FileAnalytics />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
