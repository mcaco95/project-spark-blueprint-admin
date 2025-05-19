
export interface TaskComment {
  id: string;
  content?: string;
  text?: string;
  author: string;
  createdAt: Date;
  mentions?: string[];
  attachments?: {
    name: string;
    url: string;
    type: string;
  }[];
  reactions?: {
    emoji: string;
    count: number;
    users: string[];
  }[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'review' | 'done' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: Date; // Still optional but will be required for regular tasks in UI
  projectId?: string | null;
  project?: string;
  assignees: string[];
  
  // Task type to differentiate between regular tasks and meetings
  taskType: 'task' | 'meeting';
  
  // Date and time properties (required for meetings)
  startDate?: Date | string;
  endDate?: Date | string;
  duration?: number;
  time?: string;
  date?: string;
  
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  comments?: TaskComment[];
  color?: string; // Support for custom task colors
  
  // Dependency management
  dependencies?: string[]; // IDs of tasks that this task depends on
  dependents?: string[];   // IDs of tasks that depend on this task
  dependencyType?: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';
  
  // Temporary properties to support transition
  showInKanban?: boolean;
  showInTimeline?: boolean;
}

export interface Column {
  id: string;
  title: string;
  taskIds: string[];
}

export interface Board {
  tasks: Record<string, Task>;
  columns: Record<string, Column>;
  columnOrder: string[];
}

export interface Notification {
  id: string;
  type: 'mention' | 'assignment' | 'deadline' | 'comment' | 'system';
  title: string;
  message: string;
  relatedTo?: {
    type: 'project' | 'task' | 'comment';
    id: string;
  };
  isRead: boolean;
  createdAt: Date;
}

// Update ViewMode to include the timeline-specific view modes
export type ViewMode = 'kanban' | 'list' | 'calendar' | 'timeline' | 'day' | 'week' | 'month' | 'quarter' | 'year';
