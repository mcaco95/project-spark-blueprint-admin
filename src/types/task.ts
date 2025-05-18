
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: Date;
  assignee?: string;
}

export interface TimelineTask {
  id: string;
  title: string;
  project: string;
  projectId: string | null;
  date: string;
  time: string;
  duration: number;
  assignees: string[];
  description?: string;
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  comments?: TaskComment[];
}

export interface TaskComment {
  id: string;
  content?: string;
  text?: string;
  author: string;
  createdAt: Date;
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
