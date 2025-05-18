
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Task, Board, Column } from '@/types/task';
import { toast } from 'sonner';

interface TaskContextType {
  board: Board;
  tasks: Task[];
  addTask: (task: Omit<Task, 'id'> & { id?: string }) => void;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (taskId: string, sourceColId: string, destColId: string, newIndex?: number) => void;
  getTasksByProject: (projectId: string | null) => Task[];
  getAllTasks: () => Task[];
  getTaskById: (taskId: string) => Task | undefined;
  getKanbanTasks: () => Task[];
  getTimelineTasks: () => Task[];
}

// Define initial columns structure
const initialColumns = {
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

const initialBoard: Board = {
  tasks: {},
  columns: initialColumns,
  columnOrder: ['column-1', 'column-2', 'column-3', 'column-4'],
};

// Initial tasks data
const initialTasks: Task[] = [
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
    showInKanban: true
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
    showInKanban: true
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
    showInKanban: true
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
    showInKanban: true
  },
  // Previous timeline tasks
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
    comments: [
      { id: '1', author: 'Admin User', content: '@Regular User please prepare the requirements document', createdAt: new Date('2025-05-18') },
      { id: '2', author: 'Regular User', content: 'Will do. When do you need it by?', createdAt: new Date('2025-05-18') },
      { id: '3', author: 'Admin User', content: 'By tomorrow morning if possible. We need to review it before the meeting.', createdAt: new Date('2025-05-19') },
      { id: '4', author: 'Project Manager', content: 'Make sure to include the timeline estimates we discussed yesterday', createdAt: new Date('2025-05-19') }
    ]
  },
  // ... adding more timeline tasks with showInTimeline flag
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
    comments: [
      { id: '1', author: 'Designer 1', content: "I've uploaded the latest mockups for review", createdAt: new Date('2025-05-20') },
      { id: '2', author: 'Project Manager', content: "Thanks! They look great. Let's discuss the navigation flow tomorrow.", createdAt: new Date('2025-05-20') }
    ]
  },
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
    comments: [
      { id: '1', author: 'Admin User', content: "Let's use PostgreSQL for this project", createdAt: new Date('2025-05-21') },
      { id: '2', author: 'Developer 1', content: "Good choice. I'll start working on the schema", createdAt: new Date('2025-05-21') }
    ]
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
    comments: []
  }
];

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [board, setBoard] = useState<Board>(initialBoard);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  // Initialize board with tasks that should be in Kanban on first load
  useEffect(() => {
    const kanbanTasks = tasks.filter(task => task.showInKanban !== false);
    
    if (kanbanTasks.length > 0) {
      const boardTasks: Record<string, Task> = {};
      const updatedColumns = { ...initialColumns };

      kanbanTasks.forEach(task => {
        boardTasks[task.id] = task;
        
        // Add task to the appropriate column based on status
        let columnId: string;
        switch (task.status) {
          case 'todo':
            columnId = 'column-1';
            break;
          case 'in-progress':
            columnId = 'column-2';
            break;
          case 'review':
            columnId = 'column-3';
            break;
          case 'done':
          case 'completed':
            columnId = 'column-4';
            break;
          default:
            columnId = 'column-1';
        }
        
        if (!updatedColumns[columnId].taskIds.includes(task.id)) {
          updatedColumns[columnId] = {
            ...updatedColumns[columnId],
            taskIds: [...updatedColumns[columnId].taskIds, task.id]
          };
        }
      });

      setBoard({
        tasks: boardTasks,
        columns: updatedColumns,
        columnOrder: ['column-1', 'column-2', 'column-3', 'column-4']
      });
    }
  }, []);

  // Get all tasks (unified collection)
  const getAllTasks = () => {
    return tasks;
  };
  
  // Get tasks for Kanban view
  const getKanbanTasks = () => {
    return tasks.filter(task => 
      // Consider all tasks for kanban view if they don't explicitly have showInKanban=false
      task.showInKanban !== false
    );
  };
  
  // Get tasks for Timeline view
  const getTimelineTasks = () => {
    return tasks.filter(task => 
      // Include tasks that have showInTimeline=true or have date and time
      task.showInTimeline || (task.date && task.time)
    );
  };

  // Get task by ID
  const getTaskById = (taskId: string) => {
    return tasks.find(task => task.id === taskId);
  };

  // Get tasks by project
  const getTasksByProject = (projectId: string | null) => {
    if (!projectId) return tasks;
    return tasks.filter(task => task.projectId === projectId);
  };

  const addTask = (task: Omit<Task, 'id'> & { id?: string }) => {
    const newTaskId = task.id || `task-${uuidv4()}`;
    
    // Determine which view(s) the task should appear in
    const showInTimeline = task.showInTimeline || (task.date && task.time) ? true : task.showInTimeline;
    const showInKanban = task.showInKanban !== undefined 
      ? task.showInKanban 
      : (!task.date && !task.time) || task.showInKanban;
    
    const newTask: Task = {
      ...task,
      id: newTaskId,
      projectId: task.projectId || null,
      showInTimeline,
      showInKanban
    };

    // Add to unified task collection
    setTasks(prev => {
      // Check if the task already exists
      const existingTaskIndex = prev.findIndex(t => t.id === newTaskId);
      if (existingTaskIndex >= 0) {
        // Replace the existing task
        const updatedTasks = [...prev];
        updatedTasks[existingTaskIndex] = newTask;
        return updatedTasks;
      }
      // Add new task
      return [...prev, newTask];
    });

    // Add to Kanban board if showInKanban is true
    if (showInKanban) {
      // Get the column ID based on the status
      let targetColumnId = '';
      switch (task.status) {
        case 'todo':
          targetColumnId = 'column-1';
          break;
        case 'in-progress':
          targetColumnId = 'column-2';
          break;
        case 'review':
          targetColumnId = 'column-3';
          break;
        case 'done':
        case 'completed':
          targetColumnId = 'column-4';
          break;
        default:
          targetColumnId = 'column-1';
      }

      setBoard((prev) => {
        // Check if the task already exists in the board
        const taskExists = prev.tasks[newTaskId];
        const updatedTasks = {
          ...prev.tasks,
          [newTaskId]: newTask,
        };

        // If the task doesn't exist yet, add it to a column
        if (!taskExists) {
          return {
            ...prev,
            tasks: updatedTasks,
            columns: {
              ...prev.columns,
              [targetColumnId]: {
                ...prev.columns[targetColumnId],
                taskIds: [...prev.columns[targetColumnId].taskIds, newTaskId],
              },
            },
          };
        }

        // If the task exists, just update it
        return {
          ...prev,
          tasks: updatedTasks,
        };
      });
    }

    toast.success('Task saved successfully');
  };

  const updateTask = (task: Task) => {
    // Update in the unified task collection
    setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    
    // Update in Kanban board if task should be in Kanban view
    if (task.showInKanban !== false) {
      setBoard((prev) => {
        // Check if the task status has changed
        const oldTask = prev.tasks[task.id];
        const statusChanged = oldTask && oldTask.status !== task.status;

        // First, update the task in the board
        const updatedTasks = {
          ...prev.tasks,
          [task.id]: task,
        };

        // If status hasn't changed, just update the task
        if (!statusChanged) {
          return {
            ...prev,
            tasks: updatedTasks,
          };
        }

        // If status has changed, move the task between columns
        let sourceColumnId = '';
        let destColumnId = '';

        // Find source column
        Object.keys(prev.columns).forEach((colId) => {
          const currentColumn = prev.columns[colId];
          
          if (currentColumn.taskIds.includes(task.id)) {
            sourceColumnId = colId;
          }
        });
        
        // Find destination column based on the new status
        switch (task.status) {
          case 'todo':
            destColumnId = 'column-1';
            break;
          case 'in-progress':
            destColumnId = 'column-2';
            break;
          case 'review':
            destColumnId = 'column-3';
            break;
          case 'done':
          case 'completed':
            destColumnId = 'column-4';
            break;
          default:
            destColumnId = 'column-1';
        }

        if (!sourceColumnId) {
          // Task wasn't in the board before, add it to the destination column
          return {
            ...prev,
            tasks: updatedTasks,
            columns: {
              ...prev.columns,
              [destColumnId]: {
                ...prev.columns[destColumnId],
                taskIds: [...prev.columns[destColumnId].taskIds, task.id],
              },
            },
          };
        }

        if (sourceColumnId === destColumnId) {
          // Status changed, but it maps to the same column, just update the task
          return {
            ...prev,
            tasks: updatedTasks,
          };
        }

        // Remove from source column and add to destination column
        const sourceColumn = prev.columns[sourceColumnId];
        const sourceTaskIds = sourceColumn.taskIds.filter((id) => id !== task.id);

        const destColumn = prev.columns[destColumnId];
        const destTaskIds = [...destColumn.taskIds, task.id];

        return {
          ...prev,
          tasks: updatedTasks,
          columns: {
            ...prev.columns,
            [sourceColumnId]: {
              ...sourceColumn,
              taskIds: sourceTaskIds,
            },
            [destColumnId]: {
              ...destColumn,
              taskIds: destTaskIds,
            },
          },
        };
      });
    } else {
      // If task should no longer be in Kanban view, remove it from the board
      setBoard((prev) => {
        // Check if the task is in the board
        const isTaskInBoard = Object.prototype.hasOwnProperty.call(prev.tasks, task.id);
        
        if (!isTaskInBoard) {
          return prev; // Task wasn't in the board, no changes needed
        }
        
        // Find which column contains this task
        let columnWithTask: Column | null = null;
        let columnId = '';

        Object.keys(prev.columns).forEach((colId) => {
          if (prev.columns[colId].taskIds.includes(task.id)) {
            columnWithTask = prev.columns[colId];
            columnId = colId;
          }
        });
        
        if (!columnWithTask) {
          // Task is in the board tasks but not in any column
          const { [task.id]: _, ...remainingTasks } = prev.tasks;
          return {
            ...prev,
            tasks: remainingTasks,
          };
        }
        
        // Remove task from column and from board tasks
        const newTaskIds = columnWithTask.taskIds.filter((id) => id !== task.id);
        const { [task.id]: _, ...remainingTasks } = prev.tasks;
        
        return {
          ...prev,
          tasks: remainingTasks,
          columns: {
            ...prev.columns,
            [columnId]: {
              ...columnWithTask,
              taskIds: newTaskIds,
            },
          },
        };
      });
    }

    toast.success('Task updated successfully');
  };

  const deleteTask = (taskId: string) => {
    // Remove from unified task collection
    setTasks(prev => prev.filter(t => t.id !== taskId));
    
    // Remove from Kanban board if present
    setBoard((prev) => {
      // Check if the task is in the board
      const isTaskInBoard = Object.prototype.hasOwnProperty.call(prev.tasks, taskId);
      
      if (!isTaskInBoard) {
        return prev; // Task wasn't in the board, no changes needed
      }
      
      // Find which column contains this task
      let columnWithTask: Column | null = null;
      let columnId = '';

      Object.keys(prev.columns).forEach((colId) => {
        if (prev.columns[colId].taskIds.includes(taskId)) {
          columnWithTask = prev.columns[colId];
          columnId = colId;
        }
      });
      
      if (!columnWithTask) {
        // Task is in the board tasks but not in any column
        const { [taskId]: _, ...remainingTasks } = prev.tasks;
        return {
          ...prev,
          tasks: remainingTasks,
        };
      }
      
      // Remove task from column and from board tasks
      const newTaskIds = columnWithTask.taskIds.filter((id) => id !== taskId);
      const { [taskId]: _, ...remainingTasks } = prev.tasks;
      
      return {
        ...prev,
        tasks: remainingTasks,
        columns: {
          ...prev.columns,
          [columnId]: {
            ...columnWithTask,
            taskIds: newTaskIds,
          },
        },
      };
    });

    toast.success('Task deleted successfully');
  };

  const moveTask = (taskId: string, sourceColId: string, destColId: string, newIndex = 0) => {
    setBoard((prev) => {
      // No need to move if source and destination are the same
      if (sourceColId === destColId && newIndex === prev.columns[sourceColId].taskIds.indexOf(taskId)) {
        return prev;
      }

      // Remove from source column
      const sourceTaskIds = [...prev.columns[sourceColId].taskIds];
      sourceTaskIds.splice(sourceTaskIds.indexOf(taskId), 1);

      // Add to destination column at the specified index
      const destTaskIds = [...prev.columns[destColId].taskIds];
      destTaskIds.splice(newIndex, 0, taskId);

      // Update task status if needed
      const task = prev.tasks[taskId];
      let updatedTask = task;

      // Map column to status
      const destColumn = prev.columns[destColId];
      if (destColumn.title.toLowerCase() === 'to do') {
        updatedTask = { ...task, status: 'todo' };
      } else if (destColumn.title.toLowerCase() === 'in progress') {
        updatedTask = { ...task, status: 'in-progress' };
      } else if (destColumn.title.toLowerCase() === 'review') {
        updatedTask = { ...task, status: 'review' };
      } else if (destColumn.title.toLowerCase() === 'done') {
        updatedTask = { ...task, status: 'done' };
      }

      // Also update the task in the unified collection
      setTasks(prevTasks => 
        prevTasks.map(t => 
          t.id === taskId ? { ...t, status: updatedTask.status } : t
        )
      );

      return {
        ...prev,
        tasks: {
          ...prev.tasks,
          [taskId]: updatedTask,
        },
        columns: {
          ...prev.columns,
          [sourceColId]: {
            ...prev.columns[sourceColId],
            taskIds: sourceTaskIds,
          },
          [destColId]: {
            ...prev.columns[destColId],
            taskIds: destTaskIds,
          },
        },
      };
    });
  };

  return (
    <TaskContext.Provider value={{ 
      board, 
      tasks, 
      addTask, 
      updateTask, 
      deleteTask, 
      moveTask, 
      getTasksByProject,
      getAllTasks,
      getTaskById,
      getKanbanTasks,
      getTimelineTasks
    }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};
