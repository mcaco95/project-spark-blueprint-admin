
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
