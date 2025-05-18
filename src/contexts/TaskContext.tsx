import React, { createContext, useContext, useState, ReactNode } from 'react';
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
}

const defaultBoard: Board = {
  tasks: {
    'task-1': {
      id: 'task-1',
      title: 'Create project plan',
      description: 'Define project scope, timeline, and resources',
      status: 'todo',
      priority: 'high',
      projectId: '1',
      project: 'Website Redesign',
      assignees: ['Admin User'],
    },
    'task-2': {
      id: 'task-2',
      title: 'Set up development environment',
      description: 'Install necessary tools and dependencies',
      status: 'in-progress',
      priority: 'medium',
      projectId: '1',
      project: 'Website Redesign',
      assignees: ['Regular User'],
    },
    'task-3': {
      id: 'task-3',
      title: 'Review initial mockups',
      description: 'Provide feedback on UI/UX design',
      status: 'review',
      priority: 'medium',
      projectId: '2',
      project: 'Mobile App Development',
      assignees: ['Admin User', 'Regular User'],
    },
    'task-4': {
      id: 'task-4',
      title: 'Deploy MVP',
      description: 'Push initial version to staging',
      status: 'done',
      priority: 'high',
      projectId: '2',
      project: 'Mobile App Development',
      assignees: ['Project Manager'],
    },
  },
  columns: {
    'column-1': {
      id: 'column-1',
      title: 'To Do',
      taskIds: ['task-1'],
    },
    'column-2': {
      id: 'column-2',
      title: 'In Progress',
      taskIds: ['task-2'],
    },
    'column-3': {
      id: 'column-3',
      title: 'Review',
      taskIds: ['task-3'],
    },
    'column-4': {
      id: 'column-4',
      title: 'Done',
      taskIds: ['task-4'],
    },
  },
  columnOrder: ['column-1', 'column-2', 'column-3', 'column-4'],
};

// Additional task data for timeline view
const initialTasks: Task[] = [
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
    comments: [
      { id: '1', author: 'Designer 1', content: 'I've uploaded the latest mockups for review', createdAt: new Date('2025-05-20') },
      { id: '2', author: 'Project Manager', content: 'Thanks! They look great. Let's discuss the navigation flow tomorrow.', createdAt: new Date('2025-05-20') }
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
    comments: [
      { id: '1', author: 'Admin User', content: 'Let's use PostgreSQL for this project', createdAt: new Date('2025-05-21') },
      { id: '2', author: 'Developer 1', content: 'Good choice. I'll start working on the schema', createdAt: new Date('2025-05-21') }
    ]
  },
  // ... keep existing code (other timeline tasks)
];

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [board, setBoard] = useState<Board>(defaultBoard);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const getAllTasks = () => {
    // Combine board tasks and timeline tasks
    const boardTasksList = Object.values(board.tasks);
    return [...boardTasksList, ...tasks];
  };

  const getTasksByProject = (projectId: string | null) => {
    const allTasks = getAllTasks();
    if (!projectId) return allTasks;
    return allTasks.filter(task => task.projectId === projectId);
  };

  const addTask = (task: Omit<Task, 'id'> & { id?: string }) => {
    const newTaskId = task.id || `task-${uuidv4()}`;
    const newTask: Task = {
      ...task,
      id: newTaskId,
      // Make sure tasks always have a projectId
      projectId: task.projectId || null,
    };

    // If the task has a date and time, add it to the timeline tasks
    if (task.date && task.time) {
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
    }
    // Otherwise, add it to the kanban board
    else {
      // Get the column ID based on the status
      let targetColumnId = '';
      Object.keys(board.columns).forEach((columnId) => {
        const column = board.columns[columnId];
        if (
          (column.title.toLowerCase() === 'to do' && task.status === 'todo') ||
          (column.title.toLowerCase() === 'in progress' && task.status === 'in-progress') ||
          (column.title.toLowerCase() === 'review' && task.status === 'review') ||
          (column.title.toLowerCase() === 'done' && (task.status === 'done' || task.status === 'completed'))
        ) {
          targetColumnId = columnId;
        }
      });

      if (!targetColumnId) {
        targetColumnId = 'column-1'; // Default to the first column
      }

      setBoard((prev) => {
        // Check if the task already exists
        const taskExists = prev.tasks[newTaskId];
        const updatedTasks = {
          ...prev.tasks,
          [newTaskId]: newTask,
        };

        // If the task doesn't exist yet, we need to add it to a column
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
    // Check if this is a timeline task (has date and time)
    if (task.date && task.time) {
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
      toast.success('Task updated successfully');
      return;
    }

    // Otherwise, it's a kanban board task
    setBoard((prev) => {
      // Check if the task status has changed
      const oldTask = prev.tasks[task.id];
      const statusChanged = oldTask && oldTask.status !== task.status;

      // First, update the task
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

      // If status has changed, we need to move the task between columns
      let sourceColumnId = '';
      let destColumnId = '';

      // Find source and destination columns
      Object.keys(prev.columns).forEach((columnId) => {
        const column = prev.columns[columnId];
        if (column.taskIds.includes(task.id)) {
          sourceColumnId = columnId;
        }
        if (
          (column.title.toLowerCase() === 'to do' && task.status === 'todo') ||
          (column.title.toLowerCase() === 'in progress' && task.status === 'in-progress') ||
          (column.title.toLowerCase() === 'review' && task.status === 'review') ||
          (column.title.toLowerCase() === 'done' && (task.status === 'done' || task.status === 'completed'))
        ) {
          destColumnId = columnId;
        }
      });

      if (!sourceColumnId || !destColumnId) {
        return {
          ...prev,
          tasks: updatedTasks,
        };
      }

      // Remove from source column
      const sourceColumn = prev.columns[sourceColumnId];
      const sourceTaskIds = sourceColumn.taskIds.filter((id) => id !== task.id);

      // Add to destination column
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

    toast.success('Task updated successfully');
  };

  const deleteTask = (taskId: string) => {
    // Check if the task is in the timeline tasks
    const timelineTask = tasks.find(t => t.id === taskId);
    if (timelineTask) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast.success('Task deleted successfully');
      return;
    }

    // Otherwise, it's in the kanban board
    setBoard((prev) => {
      // First, find which column contains this task
      let columnWithTask: Column | null = null;
      let columnId = '';

      Object.keys(prev.columns).forEach((colId) => {
        if (prev.columns[colId].taskIds.includes(taskId)) {
          columnWithTask = prev.columns[colId];
          columnId = colId;
        }
      });

      if (!columnWithTask || !columnId) {
        return prev;
      }

      // Create new task IDs array without the deleted task
      const newTaskIds = columnWithTask.taskIds.filter((id) => id !== taskId);

      // Create new tasks object without the deleted task
      const { [taskId]: deletedTask, ...remainingTasks } = prev.tasks;

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
      getAllTasks 
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
