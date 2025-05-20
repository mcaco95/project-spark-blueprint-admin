// Define simple User and Project types similar to backend output
export interface UserSimple {
  id: string; // UUID
  name?: string | null;
  email: string;
}

export interface ProjectSimple {
  id: string; // UUID
  name: string;
}

// Simplified Task structure for nested dependencies
export interface TaskSimple {
  id: string; // UUID
  title: string;
  status: 'todo' | 'in-progress' | 'review' | 'done' | 'completed';
}

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
  id: string; // UUID, from backend
  title: string;
  description?: string | null;
  status: 'todo' | 'in-progress' | 'review' | 'done' | 'completed';
  priority?: 'low' | 'medium' | 'high' | null;
  
  // Date fields - API will send as ISO strings. Handle parsing in frontend.
  dueDate?: string | Date | null; // For 'task' type
  startDate?: string | Date | null; // For 'meeting' type
  endDate?: string | Date | null;   // For 'meeting' type
  
  project_id: string; // UUID, Non-optional: a task must belong to a project
  project: ProjectSimple; // Nested project info

  owner_id: string; // UUID, User who created the task
  owner: UserSimple; // Nested owner info

  assignees: UserSimple[]; // Array of assigned users
  
  taskType: 'task' | 'meeting';
  
  duration?: number | null; // Duration in minutes for meetings
  time?: string | null; // Optional: time for meetings, often part of startDate
  date?: string | null; // Optional: date for meetings, often part of startDate
  
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | null;
  comments?: TaskComment[];
  color?: string | null;
  
  // Dependency management
  dependencies?: TaskSimple[]; // Tasks this task depends on
  // dependents?: TaskSimple[];   // Tasks that depend on this task (can be added if API provides it)
  dependencyType?: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish' | null;
  
  created_at: string; // ISO datetime string from backend
  updated_at?: string | null; // ISO datetime string from backend

  // Temporary properties to support transition (can be removed later)
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
