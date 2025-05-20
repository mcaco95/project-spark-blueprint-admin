
import { v4 as uuidv4 } from 'uuid';
import { FileActivity, FileType, Folder } from '@/types/file';

class ActivityLoggerService {
  private activities: FileActivity[] = [];

  logFileActivity(
    fileId: string, 
    fileName: string, 
    activityType: FileActivity['activityType'], 
    performedBy: string,
    details?: string,
    metadata?: Record<string, any>
  ): FileActivity {
    const activity: FileActivity = {
      id: uuidv4(),
      fileId,
      fileName,
      activityType,
      performedBy,
      performedAt: new Date(),
      details,
      metadata
    };
    
    this.activities.push(activity);
    return activity;
  }

  logFolderActivity(
    folder: Folder,
    activityType: FileActivity['activityType'],
    performedBy: string,
    details?: string,
    metadata?: Record<string, any>
  ): FileActivity {
    return this.logFileActivity(
      folder.id,
      folder.name,
      activityType,
      performedBy,
      details || `Folder ${activityType}`,
      { ...metadata, isFolder: true }
    );
  }

  getActivities(limit: number = 50, offset: number = 0): FileActivity[] {
    return this.activities
      .sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime())
      .slice(offset, offset + limit);
  }

  getFileActivities(fileId: string): FileActivity[] {
    return this.activities
      .filter(activity => activity.fileId === fileId)
      .sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime());
  }

  getUserActivities(userId: string): FileActivity[] {
    return this.activities
      .filter(activity => activity.performedBy === userId)
      .sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime());
  }

  getActivityStats(fileId: string) {
    const activities = this.getFileActivities(fileId);
    const views = activities.filter(a => a.activityType === 'view').length;
    const downloads = activities.filter(a => a.activityType === 'download').length;
    const edits = activities.filter(a => a.activityType === 'edit').length;
    
    // Group by user for most frequent viewers
    const userCounts: Record<string, {userId: string, count: number}> = {};
    activities.forEach(activity => {
      if (!userCounts[activity.performedBy]) {
        userCounts[activity.performedBy] = {
          userId: activity.performedBy,
          count: 0
        };
      }
      userCounts[activity.performedBy].count++;
    });
    
    const mostFrequentViewers = Object.values(userCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
      
    // Calculate most active hours
    const hourCounts = new Array(24).fill(0);
    activities.forEach(activity => {
      const hour = activity.performedAt.getHours();
      hourCounts[hour]++;
    });
    
    const mostActiveHours = hourCounts.map((count, hour) => ({ hour, count }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);
      
    return {
      views,
      downloads,
      edits,
      mostFrequentViewers,
      mostActiveHours
    };
  }
  
  clearActivities() {
    this.activities = [];
  }
}

export const activityLogger = new ActivityLoggerService();
