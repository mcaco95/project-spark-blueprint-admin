
export type ProjectStatus = 'planning' | 'active' | 'completed' | 'on-hold';
export type ProjectPriority = 'low' | 'medium' | 'high';

export interface Project {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: number;
  teamMembers: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
  tasks?: Task[];
  comments?: ProjectComment[];
}

export interface ProjectComment {
  id: string;
  text: string;
  author: string;
  createdAt: Date;
  mentions?: string[];
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  tags: string[];
  tasks: {
    name: string;
    description: string;
    status: string;
    estimatedHours: number;
  }[];
  createdBy: string;
  createdAt: Date;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  department?: string;
  position?: string;
  skills?: string[];
}

// Import Task from task.ts to ensure proper linking
import { Task } from './task';
