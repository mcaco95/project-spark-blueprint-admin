export type ProjectStatus = 'planning' | 'active' | 'completed' | 'on-hold';
export type ProjectPriority = 'low' | 'medium' | 'high';
export type ProjectRole = 'viewer' | 'editor' | 'admin';

// Import UserSimple from task.ts
import { UserSimple } from './task';

export interface Project {
  id: string;
  name: string;
  description?: string;
  startDate: string | Date;
  endDate?: string | Date;
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: number;
  teamMembers: string[];
  owner: UserSimple;
  createdBy: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  tasks?: Task[];
  comments?: ProjectComment[];
  tags?: string[];
  
  // Project hierarchy fields
  parentId?: string | null;
  path?: string;
  level?: number;
  subProjects?: string[];

  // Additional backend fields
  ownerId: string;
  createdById: string;
  updatedById?: string;
  deletedAt?: string | Date;
}

export interface ProjectComment {
  id: string;
  text: string;
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

export interface MessageChannel {
  id: string;
  name: string;
  description?: string;
  type: 'project' | 'task' | 'general' | 'direct';
  members: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
  relatedProjectId?: string;
  relatedTaskId?: string;
  isPrivate: boolean;
  messages?: Message[];
}

export interface Message {
  id: string;
  text: string;
  author: string;
  channelId: string;
  createdAt: Date;
  updatedAt?: Date;
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
  isPinned?: boolean;
  parentMessageId?: string; // For threaded replies
}

// Import Task from task.ts to ensure proper linking
import { Task } from './task';
