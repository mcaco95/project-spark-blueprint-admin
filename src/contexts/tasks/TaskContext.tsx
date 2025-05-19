
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Task, Board } from '@/types/task';
import { initialBoard, initialTasks } from './initialData';
import * as taskSelectors from './taskSelectors';
import * as taskActions from './taskActions';
import { TaskContextType } from './types';

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [board, setBoard] = useState<Board>(initialBoard);
  const [tasks, setTasks] = useState<Task[]>(() => {
    // Add the taskType field to each task if it doesn't exist
    return initialTasks.map(task => ({
      ...task,
      taskType: task.taskType || ((task.date && task.time) ? 'meeting' : 'task')
    }));
  });

  // Initialize board with tasks that should be in Kanban on first load
  useEffect(() => {
    const kanbanTasks = tasks.filter(task => task.showInKanban !== false);
    
    if (kanbanTasks.length > 0) {
      const boardTasks: Record<string, Task> = {};
      const updatedColumns = { ...initialBoard.columns };

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

  // Selector methods
  const getAllTasks = () => taskSelectors.getAllTasks(tasks);
  const getKanbanTasks = () => taskSelectors.getKanbanTasks(tasks);
  const getTimelineTasks = () => taskSelectors.getTimelineTasks(tasks);
  const getTaskById = (taskId: string) => taskSelectors.getTaskById(tasks, taskId);
  const getTasksByProject = (projectId: string | null) => taskSelectors.getTasksByProject(tasks, projectId);

  // Action methods
  const addTask = (task: Omit<Task, 'id'> & { id?: string }) => {
    return taskActions.addTask(task, tasks, setTasks, board, setBoard);
  };

  const updateTask = (task: Task) => {
    return taskActions.updateTask(task, tasks, setTasks, board, setBoard);
  };

  const deleteTask = (taskId: string) => {
    taskActions.deleteTask(taskId, setTasks, setBoard);
  };

  const moveTask = (taskId: string, sourceColId: string, destColId: string, newIndex = 0) => {
    taskActions.moveTask(taskId, sourceColId, destColId, newIndex, board, setBoard, setTasks);
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
