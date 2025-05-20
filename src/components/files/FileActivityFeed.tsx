
import { useState } from 'react';
import { useFileContext } from '@/contexts/files/FileContext';
import { formatDistance } from 'date-fns';
import { FileActivity } from '@/types/file';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Eye,
  Download,
  Edit,
  Trash2,
  Upload,
  FolderPlus,
  FolderX,
  Share2,
  FileText,
  Move
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface FileActivityFeedProps {
  limit?: number;
  showControls?: boolean;
  showHeader?: boolean;
  className?: string;
}

export function FileActivityFeed({ 
  limit = 10, 
  showControls = true, 
  showHeader = true,
  className = ''
}: FileActivityFeedProps) {
  const { getRecentActivity } = useFileContext();
  const [activityFilter, setActivityFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("all");
  
  const allActivities = getRecentActivity(50);
  
  // Apply filters
  const filteredActivities = allActivities.filter(activity => {
    // Filter by activity type
    if (activityFilter !== "all") {
      if (activityFilter === "view-download" && 
          activity.activityType !== "view" && 
          activity.activityType !== "download") {
        return false;
      }
      if (activityFilter === "create-upload" && 
          activity.activityType !== "create") {
        return false;
      }
      if (activityFilter === "edit" && 
          activity.activityType !== "edit" && 
          activity.activityType !== "rename") {
        return false;
      }
      if (activityFilter === "delete" && 
          activity.activityType !== "delete") {
        return false;
      }
      if (activityFilter === "share" && 
          activity.activityType !== "share" && 
          activity.activityType !== "permission_change") {
        return false;
      }
    }
    
    // Filter by time
    if (timeFilter !== "all") {
      const activityTime = new Date(activity.performedAt).getTime();
      const now = new Date().getTime();
      const hoursDiff = (now - activityTime) / (1000 * 60 * 60);
      
      if (timeFilter === "today" && hoursDiff > 24) {
        return false;
      }
      if (timeFilter === "week" && hoursDiff > 24 * 7) {
        return false;
      }
      if (timeFilter === "month" && hoursDiff > 24 * 30) {
        return false;
      }
    }
    
    return true;
  }).slice(0, limit);
  
  const getActivityIcon = (activity: FileActivity) => {
    switch (activity.activityType) {
      case 'view':
        return <Eye className="h-4 w-4" />;
      case 'download':
        return <Download className="h-4 w-4" />;
      case 'create':
        if (activity.metadata?.isFolder) {
          return <FolderPlus className="h-4 w-4" />;
        }
        return <Upload className="h-4 w-4" />;
      case 'edit':
      case 'rename':
        return <Edit className="h-4 w-4" />;
      case 'delete':
        if (activity.metadata?.isFolder) {
          return <FolderX className="h-4 w-4" />;
        }
        return <Trash2 className="h-4 w-4" />;
      case 'share':
      case 'permission_change':
        return <Share2 className="h-4 w-4" />;
      case 'move':
        return <Move className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };
  
  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Recent actions performed on files and folders</CardDescription>
        </CardHeader>
      )}
      
      <CardContent>
        {showControls && (
          <div className="flex space-x-2 mb-4">
            <Select value={activityFilter} onValueChange={setActivityFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Activity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="view-download">Views & Downloads</SelectItem>
                <SelectItem value="create-upload">Uploads</SelectItem>
                <SelectItem value="edit">Edits</SelectItem>
                <SelectItem value="delete">Deletions</SelectItem>
                <SelectItem value="share">Sharing</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Last 24 Hours</SelectItem>
                <SelectItem value="week">Past Week</SelectItem>
                <SelectItem value="month">Past Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No activity found
            </div>
          ) : (
            filteredActivities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-start space-x-3 pb-3 border-b border-border last:border-0"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{activity.performedBy.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <span className="font-medium">{activity.performedBy}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistance(new Date(activity.performedAt), new Date(), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="text-muted-foreground rounded-full bg-muted p-1">
                      {getActivityIcon(activity)}
                    </div>
                  </div>
                  
                  <p className="text-sm">
                    {activity.activityType === 'create' && (activity.metadata?.isFolder ? 'Created folder ' : 'Uploaded ')}
                    {activity.activityType === 'view' && 'Viewed '}
                    {activity.activityType === 'download' && 'Downloaded '}
                    {activity.activityType === 'edit' && 'Edited '}
                    {activity.activityType === 'rename' && 'Renamed '}
                    {activity.activityType === 'delete' && (activity.metadata?.isFolder ? 'Deleted folder ' : 'Deleted ')}
                    {activity.activityType === 'move' && 'Moved '}
                    {activity.activityType === 'share' && 'Shared '}
                    {activity.activityType === 'permission_change' && 'Modified permissions for '}
                    <span className="font-medium">{activity.fileName}</span>
                  </p>
                  
                  {activity.details && (
                    <p className="text-xs text-muted-foreground">{activity.details}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
