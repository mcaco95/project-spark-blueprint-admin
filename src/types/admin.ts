import { UserRole } from './auth';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'pending';
  lastLogin?: Date;
  createdAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemSetting {
  id: string;
  name: string;
  description: string;
  value: string | number | boolean;
  type: 'string' | 'number' | 'boolean';
  category: string;
}

export interface MetricData {
  label: string;
  value: number;
  description?: string;
}

export interface ChartData {
  name: string;
  value: number;
}

export interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  reviewTasks: number;
  overdueTasks: number;
  averageCompletionTime: number;
  taskVelocity: number;
  tasksByPriority: ChartData[];
  taskStatusDistribution: ChartData[];
  completionTrend: CompletionTrendData[];
  activeTasks: ActiveTask[];
  recentlyCompletedTasks: CompletedTask[];
  lastActiveDate: string | null;
  activeProjects: {
    id: string;
    name: string;
    description: string;
    status: string;
    endDate: string | null;
    progress: number;
  }[];
}

export interface CompletionTrendData {
  date: string;
  completed: number;
}

export interface ActiveTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  projectId: string;
  projectName: string | null;
}

export interface CompletedTask {
  id: string;
  title: string;
  completedDate: string;
  timeToComplete: number;
  projectId: string;
  projectName: string | null;
}

export interface UserPerformanceMetrics {
  userId: string;
  userName: string;
  metrics: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    reviewTasks: number;
    overdueTasks: number;
    taskStatusDistribution: ChartData[];
    tasksByPriority: ChartData[];
    activeTasks: ActiveTask[];
    activeProjects: {
      id: string;
      name: string;
      description: string;
      status: string;
      endDate: string | null;
      progress: number;
    }[];
    averageCompletionTime: number;
    taskVelocity: number;
    completionTrend: CompletionTrendData[];
    recentlyCompletedTasks: CompletedTask[];
    lastActiveDate: string | null;
  };
}

export interface TeamMetrics {
  topPerformers: UserPerformanceMetrics[];
  taskDistribution: {
    userId: string;
    userName: string;
    taskCount: number;
    taskStatusDistribution: ChartData[];
  }[];
  averageTasksPerUser: number;
  averageCompletionTime: number;
  taskCompletionTrend: {
    date: string;
    completed: number;
    total: number;
  }[];
}
