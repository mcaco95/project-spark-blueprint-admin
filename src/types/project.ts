
export type ProjectStatus = 'planning' | 'active' | 'completed' | 'on-hold';
export type ProjectPriority = 'low' | 'medium' | 'high';

export interface ProjectTask {
  id: string;
  title: string;
  description?: string;
  assignedTo: string[];
  dueDate?: Date;
  status: 'todo' | 'in-progress' | 'review' | 'completed';
  priority?: 'low' | 'medium' | 'high';
}

export interface ProjectComment {
  id: string;
  text: string;
  author: string;
  createdAt: Date;
  mentions?: string[];
}

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
  tasks?: ProjectTask[];
  comments?: ProjectComment[];
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
