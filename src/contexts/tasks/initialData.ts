
import { Task, Board } from "@/types/task";

// Define initial columns structure
export const initialColumns = {
  'column-1': {
    id: 'column-1',
    title: 'To Do',
    taskIds: [],
  },
  'column-2': {
    id: 'column-2',
    title: 'In Progress',
    taskIds: [],
  },
  'column-3': {
    id: 'column-3',
    title: 'Review',
    taskIds: [],
  },
  'column-4': {
    id: 'column-4',
    title: 'Done',
    taskIds: [],
  },
};

export const initialBoard: Board = {
  tasks: {},
  columns: initialColumns,
  columnOrder: ['column-1', 'column-2', 'column-3', 'column-4'],
};

// Initial tasks data
export const initialTasks: Task[] = [
  // Previous kanban tasks
  {
    id: 'task-1',
    title: 'Create project plan',
    description: 'Define project scope, timeline, and resources',
    status: 'todo',
    priority: 'high',
    projectId: '1',
    project: 'Website Redesign',
    assignees: ['Admin User'],
    showInKanban: true,
    taskType: 'task'
  },
  {
    id: 'task-2',
    title: 'Set up development environment',
    description: 'Install necessary tools and dependencies',
    status: 'in-progress',
    priority: 'medium',
    projectId: '1',
    project: 'Website Redesign',
    assignees: ['Regular User'],
    showInKanban: true,
    taskType: 'task'
  },
  {
    id: 'task-3',
    title: 'Review initial mockups',
    description: 'Provide feedback on UI/UX design',
    status: 'review',
    priority: 'medium',
    projectId: '2',
    project: 'Mobile App Development',
    assignees: ['Admin User', 'Regular User'],
    showInKanban: true,
    taskType: 'task'
  },
  {
    id: 'task-4',
    title: 'Deploy MVP',
    description: 'Push initial version to staging',
    status: 'done',
    priority: 'high',
    projectId: '2',
    project: 'Mobile App Development',
    assignees: ['Project Manager'],
    showInKanban: true,
    taskType: 'task'
  },
  // Timeline tasks
  {
    id: 'timeline-1',
    title: 'Project kickoff meeting',
    project: 'Website Redesign',
    projectId: '1',
    date: '2025-05-20',
    time: '10:00',
    duration: 60,
    assignees: ['Admin User', 'Regular User'],
    description: 'Initial meeting to discuss project goals and timeline',
    status: 'completed',
    showInTimeline: true,
    taskType: 'meeting',
    comments: [
      { id: '1', author: 'Admin User', content: '@Regular User please prepare the requirements document', createdAt: new Date('2025-05-18') },
      { id: '2', author: 'Regular User', content: 'Will do. When do you need it by?', createdAt: new Date('2025-05-18') },
      { id: '3', author: 'Admin User', content: 'By tomorrow morning if possible. We need to review it before the meeting.', createdAt: new Date('2025-05-19') },
      { id: '4', author: 'Project Manager', content: 'Make sure to include the timeline estimates we discussed yesterday', createdAt: new Date('2025-05-19') }
    ]
  },
  {
    id: 'timeline-2',
    title: 'Design review',
    project: 'Mobile App Development',
    projectId: '2',
    date: '2025-05-21',
    time: '14:00',
    duration: 90,
    assignees: ['Regular User'],
    description: 'Review initial app designs and wireframes',
    status: 'completed',
    showInTimeline: true,
    taskType: 'meeting',
    comments: [
      { id: '1', author: 'Designer 1', content: "I've uploaded the latest mockups for review", createdAt: new Date('2025-05-20') },
      { id: '2', author: 'Project Manager', content: "Thanks! They look great. Let's discuss the navigation flow tomorrow.", createdAt: new Date('2025-05-20') }
    ]
  },
  // ... remaining timeline tasks with taskType added
  {
    id: 'timeline-3',
    title: 'Backend planning',
    project: 'Website Redesign',
    projectId: '1',
    date: '2025-05-22',
    time: '11:00',
    duration: 120,
    assignees: ['Admin User', 'Project Manager'],
    description: 'Plan API endpoints and database schema',
    status: 'in-progress',
    showInTimeline: true,
    taskType: 'meeting',
    comments: []
  },
  {
    id: 'timeline-4',
    title: 'Frontend development',
    project: 'Website Redesign',
    projectId: '1',
    date: '2025-05-23',
    time: '09:00',
    duration: 240,
    assignees: ['Regular User'],
    description: 'Implement UI components and integrate with backend',
    status: 'in-progress',
    showInTimeline: true,
    taskType: 'meeting',
    comments: []
  },
  {
    id: 'timeline-5',
    title: 'API testing',
    project: 'Mobile App Development',
    projectId: '2',
    date: '2025-05-24',
    time: '13:00',
    duration: 60,
    assignees: ['Admin User'],
    description: 'Test API endpoints for data retrieval and storage',
    status: 'review',
    showInTimeline: true,
    taskType: 'meeting',
    comments: []
  },
  {
    id: 'timeline-6',
    title: 'Code review',
    project: 'Website Redesign',
    projectId: '1',
    date: '2025-05-25',
    time: '15:00',
    duration: 120,
    assignees: ['Project Manager'],
    description: 'Review code for best practices and security vulnerabilities',
    status: 'review',
    showInTimeline: true,
    taskType: 'meeting',
    comments: []
  },
  {
    id: 'timeline-7',
    title: 'Bug fixing',
    project: 'Mobile App Development',
    projectId: '2',
    date: '2025-05-26',
    time: '10:00',
    duration: 180,
    assignees: ['Regular User'],
    description: 'Fix bugs reported during testing',
    status: 'in-progress',
    showInTimeline: true,
    taskType: 'meeting',
    comments: []
  },
  {
    id: 'timeline-8',
    title: 'Performance optimization',
    project: 'Website Redesign',
    projectId: '1',
    date: '2025-05-27',
    time: '14:00',
    duration: 90,
    assignees: ['Admin User'],
    description: 'Optimize website performance for speed and scalability',
    status: 'review',
    showInTimeline: true,
    taskType: 'meeting',
    comments: []
  },
  {
    id: 'timeline-9',
    title: 'User acceptance testing',
    project: 'Mobile App Development',
    projectId: '2',
    date: '2025-05-28',
    time: '11:00',
    duration: 120,
    assignees: ['Project Manager'],
    description: 'Conduct user acceptance testing to ensure the app meets user requirements',
    status: 'done',
    showInTimeline: true,
    taskType: 'meeting',
    comments: []
  },
  {
    id: 'timeline-10',
    title: 'Deployment to production',
    project: 'Website Redesign',
    projectId: '1',
    date: '2025-05-29',
    time: '16:00',
    duration: 60,
    assignees: ['Admin User'],
    description: 'Deploy the website to the production environment',
    status: 'completed',
    showInTimeline: true,
    taskType: 'meeting',
    comments: []
  }
];
