
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Task, Board, Column } from '@/types/task';
import { toast } from '@/components/ui/sonner';

interface TaskContextType {
  board: Board;
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (taskId: string, sourceColId: string, destColId: string, newIndex?: number) => void;
}

const defaultBoard: Board = {
  tasks: {
    'task-1': {
      id: 'task-1',
      title: 'Create project plan',
      description: 'Define project scope, timeline, and resources',
      status: 'todo',
      priority: 'high',
    },
    'task-2': {
      id: 'task-2',
      title: 'Set up development environment',
      description: 'Install necessary tools and dependencies',
      status: 'in-progress',
      priority: 'medium',
    },
    'task-3': {
      id: 'task-3',
      title: 'Review initial mockups',
      description: 'Provide feedback on UI/UX design',
      status: 'review',
      priority: 'medium',
    },
    'task-4': {
      id: 'task-4',
      title: 'Deploy MVP',
      description: 'Push initial version to staging',
      status: 'done',
      priority: 'high',
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

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [board, setBoard] = useState<Board>(defaultBoard);

  const addTask = (task: Omit<Task, 'id'>) => {
    const newTaskId = `task-${uuidv4()}`;
    const newTask: Task = {
      ...task,
      id: newTaskId,
    };

    // Get the column ID based on the status
    let targetColumnId = '';
    Object.keys(board.columns).forEach((columnId) => {
      const column = board.columns[columnId];
      if (
        (column.title.toLowerCase() === 'to do' && task.status === 'todo') ||
        (column.title.toLowerCase() === 'in progress' && task.status === 'in-progress') ||
        (column.title.toLowerCase() === 'review' && task.status === 'review') ||
        (column.title.toLowerCase() === 'done' && task.status === 'done')
      ) {
        targetColumnId = columnId;
      }
    });

    if (!targetColumnId) {
      targetColumnId = 'column-1'; // Default to the first column
    }

    setBoard((prev) => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [newTaskId]: newTask,
      },
      columns: {
        ...prev.columns,
        [targetColumnId]: {
          ...prev.columns[targetColumnId],
          taskIds: [...prev.columns[targetColumnId].taskIds, newTaskId],
        },
      },
    }));

    toast.success('Task created successfully');
  };

  const updateTask = (task: Task) => {
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
          (column.title.toLowerCase() === 'done' && task.status === 'done')
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
    <TaskContext.Provider value={{ board, addTask, updateTask, deleteTask, moveTask }}>
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
