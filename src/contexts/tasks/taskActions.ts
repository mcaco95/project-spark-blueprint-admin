
import { Board, Task, Column } from "@/types/task";
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

export const addTask = (
  task: Omit<Task, 'id'> & { id?: string },
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  board: Board,
  setBoard: React.Dispatch<React.SetStateAction<Board>>
) => {
  const newTaskId = task.id || `task-${uuidv4()}`;
  
  // Use taskType if provided, otherwise determine based on existing fields
  const taskType = task.taskType || ((task.date && task.time) ? 'meeting' : 'task');
  
  // Determine which view(s) the task should appear in based on taskType
  const showInTimeline = task.showInTimeline !== undefined ? task.showInTimeline : (taskType === 'meeting');
  const showInKanban = task.showInKanban !== undefined ? task.showInKanban : (taskType === 'task');
  
  const newTask: Task = {
    ...task,
    id: newTaskId,
    projectId: task.projectId || null,
    taskType,
    showInTimeline,
    showInKanban,
    assignees: task.assignees || []
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
  return newTask;
};

export const updateTask = (
  task: Task,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  board: Board,
  setBoard: React.Dispatch<React.SetStateAction<Board>>
) => {
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
  return task;
};

export const deleteTask = (
  taskId: string,
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  setBoard: React.Dispatch<React.SetStateAction<Board>>
) => {
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

export const moveTask = (
  taskId: string, 
  sourceColId: string, 
  destColId: string, 
  newIndex = 0,
  board: Board,
  setBoard: React.Dispatch<React.SetStateAction<Board>>,
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
) => {
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
