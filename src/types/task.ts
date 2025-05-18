
export interface TaskComment {
  id: string;
  content?: string;
  text?: string;
  author: string;
  createdAt: Date;
  mentions?: string[];
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
  startDate?: Date | string;
  endDate?: Date | string;
  duration?: number;
  time?: string;
  date?: string;
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  comments?: TaskComment[];
}

export interface TimelineTask extends Task {
  date: string;
  time: string;
  duration: number;
  project: string;
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

export type ViewMode = 'day' | 'week' | 'month' | 'quarter' | 'year';
