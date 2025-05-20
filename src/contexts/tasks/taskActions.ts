import { Board, Task, Column } from "@/types/task";
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { fetchApi } from "@/contexts/AuthContext";

// Define a type for the task creation payload expected by the API
// This should align with backend.services.tasks.schemas.TaskCreate
export interface ApiTaskCreatePayload {
  title: string;
  description?: string | null;
  status?: string; // e.g., 'todo', 'in_progress' etc.
  priority?: string | null;
  task_type?: string; // e.g., 'task', 'meeting'
  due_date?: string | null; // ISO date string
  start_date?: string | null; // ISO datetime string
  end_date?: string | null; // ISO datetime string
  duration_minutes?: number | null;
  project_id: string; // UUID for the project
  assignee_ids?: string[]; // List of assignee UUIDs
  depends_on_task_ids?: string[]; // List of Task UUIDs this task depends on
  dependency_type_for_new?: string | null; // e.g., 'finish-to-start'
}

export const addTask = async (
  token: string | null,
  taskDataForApi: ApiTaskCreatePayload,
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  setBoard: React.Dispatch<React.SetStateAction<Board>>
): Promise<Task | null> => {
  
  if (!taskDataForApi.project_id) {
    toast.error("Project ID is required to create a task.");
    return null;
  }

  try {
    // The backend endpoint is /api/v1/tasks/project/{project_id}/tasks/
    const path = `/tasks/project/${taskDataForApi.project_id}/tasks/`;
    
    // The actual payload sent to fetchApi should not include project_id in the body
    // if it's already in the path, and our Pydantic TaskCreate schema doesn't re-list it if path provides it.
    // However, our Flask-RESTx route POST for /project/{project_id}/tasks/ expects project_id in the Pydantic model.
    // The Flask route gets project_id from path and Pydantic validates the body, which also expects project_id.
    // So, taskDataForApi should contain project_id.

    const createdTaskFromApi: Task = await fetchApi<Task, ApiTaskCreatePayload>(
      path, 
      'POST', 
      taskDataForApi,
      token
    );

    if (createdTaskFromApi) {
      // Add to unified task collection
      setTasks(prev => {
        // Optional: Check if task somehow already exists to prevent duplicates if UI allows quick resubmits
        const existingTaskIndex = prev.findIndex(t => t.id === createdTaskFromApi.id);
        if (existingTaskIndex >= 0) {
          const updatedTasks = [...prev];
          updatedTasks[existingTaskIndex] = createdTaskFromApi;
          return updatedTasks;
        }
        return [...prev, createdTaskFromApi];
      });

      // Add to Kanban board if showInKanban is true (or based on task_type)
      // The createdTaskFromApi should ideally have showInKanban determined by backend or here
      const showInKanban = createdTaskFromApi.showInKanban !== undefined 
        ? createdTaskFromApi.showInKanban 
        : (createdTaskFromApi.taskType === 'task');

      if (showInKanban) {
        let targetColumnId = 'column-1'; // Default based on status
        switch (createdTaskFromApi.status) {
          case 'todo': targetColumnId = 'column-1'; break;
          case 'in-progress': targetColumnId = 'column-2'; break;
          case 'review': targetColumnId = 'column-3'; break;
          case 'done':
          case 'completed': targetColumnId = 'column-4'; break;
          default: targetColumnId = 'column-1';
        }

        setBoard((prevBoard) => {
          const newBoardTasks = {
            ...prevBoard.tasks,
            [createdTaskFromApi.id]: createdTaskFromApi,
          };
          const column = prevBoard.columns[targetColumnId];
          if (column && !column.taskIds.includes(createdTaskFromApi.id)) {
            const newTaskIds = [...column.taskIds, createdTaskFromApi.id];
            return {
              ...prevBoard,
              tasks: newBoardTasks,
              columns: {
                ...prevBoard.columns,
                [targetColumnId]: {
                  ...column,
                  taskIds: newTaskIds,
                },
              },
            };
          } else if (!column) {
            // Handle case where targetColumnId might be invalid (should not happen with default)
            console.warn(`Target column ${targetColumnId} not found in board.`);
            return { ...prevBoard, tasks: newBoardTasks }; // Add to tasks at least
          }
          return { ...prevBoard, tasks: newBoardTasks }; // Task already in column or column update not needed
        });
      }
      toast.success('Task created successfully via API!');
      return createdTaskFromApi;
    } else {
      toast.error('Failed to create task: No data returned from API.');
      return null;
    }
  } catch (error: any) {
    console.error("Error creating task:", error);
    toast.error(`Failed to create task: ${error.message || 'Network error'}`);
    return null;
  }
};

export const updateTask = (
  task: Task,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  board: Board,
  setBoard: React.Dispatch<React.SetStateAction<Board>>
) => {
  // Placeholder: current logic is local state update
  console.warn("updateTask is using local state and needs API integration.");
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

  toast.success('Task updated successfully (local)');
  return task;
};

export const deleteTask = (
  taskId: string,
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  setBoard: React.Dispatch<React.SetStateAction<Board>>
) => {
  console.warn("deleteTask is using local state and needs API integration.");
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

  toast.success('Task deleted successfully (local)');
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
  console.warn("moveTask is using local state and needs API integration.");
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
