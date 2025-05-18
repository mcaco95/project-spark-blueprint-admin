
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
  dueDate?: Date;
  projectId?: string | null;
  project?: string;
  assignees: string[];
  
  // Date and time properties (optional)
  startDate?: Date | string;
  endDate?: Date | string;
  duration?: number;
  time?: string;
  date?: string;
  
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  comments?: TaskComment[];
  color?: string; // Support for custom task colors
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

export type ViewMode = 'kanban' | 'list' | 'calendar' | 'timeline';
