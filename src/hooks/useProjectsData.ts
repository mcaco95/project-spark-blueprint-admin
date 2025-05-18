
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Project } from '@/types/project';

// Enhanced mock projects data for demo
const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Website Redesign',
    description: 'Complete overhaul of company website with modern design and improved UX',
    startDate: new Date('2025-01-15'),
    endDate: new Date('2025-03-30'),
    status: 'active',
    priority: 'high',
    progress: 65,
    teamMembers: ['User 1', 'User 2', 'User 3'],
    createdBy: 'Admin User',
    createdAt: new Date('2025-01-01'),
    tasks: [
      { id: '1-1', title: 'Create wireframes', assignees: ['User 1'], dueDate: new Date('2025-01-25'), status: 'completed' },
      { id: '1-2', title: 'Design homepage', assignees: ['User 2'], dueDate: new Date('2025-02-10'), status: 'in-progress' },
      { id: '1-3', title: 'Implement responsive layout', assignees: ['User 3'], dueDate: new Date('2025-03-15'), status: 'todo' },
    ],
    comments: [
      { id: '1', text: 'Let\'s focus on mobile-first approach @User2', author: 'User 1', createdAt: new Date('2025-01-05') },
      { id: '2', text: '@User1 I agree, I\'ll update the wireframes', author: 'User 2', createdAt: new Date('2025-01-06') },
    ],
  },
  {
    id: '2',
    name: 'Mobile App Development',
    description: 'Build native mobile apps for iOS and Android platforms',
    startDate: new Date('2025-02-01'),
    endDate: new Date('2025-06-30'),
    status: 'planning',
    priority: 'high',
    progress: 20,
    teamMembers: ['User 2', 'User 4'],
    createdBy: 'Admin User',
    createdAt: new Date('2025-01-15'),
    tasks: [
      { id: '2-1', title: 'Define app requirements', assignees: ['User 2'], dueDate: new Date('2025-02-15'), status: 'completed' },
      { id: '2-2', title: 'Create app architecture', assignees: ['User 4'], dueDate: new Date('2025-03-01'), status: 'todo' },
    ],
    comments: [
      { id: '1', text: 'We should consider using React Native @User4', author: 'User 2', createdAt: new Date('2025-01-20') },
    ],
  },
  {
    id: '3',
    name: 'Marketing Campaign',
    description: 'Q2 digital marketing campaign focusing on social media and content marketing',
    startDate: new Date('2025-04-01'),
    endDate: new Date('2025-06-30'),
    status: 'planning',
    priority: 'medium',
    progress: 10,
    teamMembers: ['User 5'],
    createdBy: 'Regular User',
    createdAt: new Date('2025-03-15'),
    tasks: [
      { id: '3-1', title: 'Market research', assignees: ['User 5'], dueDate: new Date('2025-04-15'), status: 'todo' },
    ],
  },
  {
    id: '4',
    name: 'Database Migration',
    description: 'Migrate from MySQL to PostgreSQL and optimize queries',
    startDate: new Date('2025-02-15'),
    endDate: new Date('2025-03-15'),
    status: 'completed',
    priority: 'medium',
    progress: 100,
    teamMembers: ['User 3', 'User 6'],
    createdBy: 'Admin User',
    createdAt: new Date('2025-01-30'),
    updatedAt: new Date('2025-03-15'),
    tasks: [
      { id: '4-1', title: 'Data schema conversion', assignees: ['User 3'], dueDate: new Date('2025-02-25'), status: 'completed' },
      { id: '4-2', title: 'Test data integrity', assignees: ['User 6'], dueDate: new Date('2025-03-10'), status: 'completed' },
    ],
  },
  {
    id: '5',
    name: 'Product Launch',
    description: 'Prepare and execute launch of new product line',
    startDate: new Date('2025-05-01'),
    endDate: new Date('2025-06-15'),
    status: 'on-hold',
    priority: 'high',
    progress: 45,
    teamMembers: ['User 1', 'User 5', 'User 7'],
    createdBy: 'Regular User',
    createdAt: new Date('2025-02-28'),
    updatedAt: new Date('2025-04-10'),
    tasks: [
      { id: '5-1', title: 'Finalize product specs', assignees: ['User 1'], dueDate: new Date('2025-05-10'), status: 'in-progress' },
      { id: '5-2', title: 'Prepare marketing materials', assignees: ['User 5'], dueDate: new Date('2025-05-25'), status: 'todo' },
      { id: '5-3', title: 'Plan launch event', assignees: ['User 7'], dueDate: new Date('2025-06-01'), status: 'todo' },
    ],
  },
  {
    id: '6',
    name: 'Annual Business Strategy',
    description: 'Define company goals and strategic initiatives for the upcoming year',
    startDate: new Date('2025-10-01'),
    endDate: new Date('2025-12-15'),
    status: 'planning',
    priority: 'high',
    progress: 5,
    teamMembers: ['User 1', 'User 7', 'User 8'],
    createdBy: 'Admin User',
    createdAt: new Date('2025-09-15'),
    tasks: [
      { id: '6-1', title: 'Market analysis', assignees: ['User 8'], dueDate: new Date('2025-10-20'), status: 'todo' },
      { id: '6-2', title: 'SWOT analysis', assignees: ['User 7'], dueDate: new Date('2025-11-05'), status: 'todo' },
      { id: '6-3', title: 'Strategic planning workshop', assignees: ['User 1', 'User 7', 'User 8'], dueDate: new Date('2025-11-15'), status: 'todo' },
    ],
  },
];

export function useProjectsData() {
  const [projects, setProjects] = useState<Project[]>(mockProjects);

  const addProject = (projectData: Omit<Project, 'id' | 'createdAt'>) => {
    const newProject: Project = {
      ...projectData,
      id: uuidv4(),
      createdAt: new Date(),
      tasks: projectData.tasks || [],
      comments: projectData.comments || [],
    };
    setProjects([...projects, newProject]);
    return newProject;
  };

  const updateProject = (projectData: Project) => {
    setProjects(projects.map(project => 
      project.id === projectData.id 
        ? { ...projectData, updatedAt: new Date() } 
        : project
    ));
    return projectData;
  };

  const deleteProject = (projectId: string) => {
    setProjects(projects.filter(project => project.id !== projectId));
  };

  const getProjectById = (projectId: string) => {
    return projects.find(project => project.id === projectId) || null;
  };

  return {
    projects,
    addProject,
    updateProject,
    deleteProject,
    getProjectById
  };
}
