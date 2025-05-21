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

// Define a type for the task update payload expected by the API
// This should align with backend.services.tasks.schemas.TaskUpdate
export interface ApiTaskUpdatePayload {
  title?: string | null;
  description?: string | null;
  status?: string; // e.g., 'todo', 'in_progress' etc.
  priority?: string | null;
  task_type?: string; // e.g., 'task', 'meeting'
  due_date?: string | null; // ISO date string
  start_date?: string | null; // ISO datetime string
  end_date?: string | null; // ISO datetime string
  duration_minutes?: number | null;
  project_id?: string | null; // UUID for the project, if moving
  assignee_ids?: string[] | null; // List of assignee UUIDs
  depends_on_task_ids?: string[] | null; // List of Task UUIDs this task depends on
  // dependency_type_for_new is not typically part of update for existing dependencies,
  // but could be if adding new ones during an update.
  // For simplicity, let's assume depends_on_task_ids replaces the list,
  // and new dependencies would need separate handling or a more complex payload.
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
          case 'in_progress': targetColumnId = 'column-2'; break;
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

export const updateTask = async (
  token: string | null,
  taskToUpdate: Partial<Task> & { id: string },
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  setBoard: React.Dispatch<React.SetStateAction<Board>>
): Promise<Task | null> => {
  if (!token) {
    toast.error("Authentication token not available. Please log in.");
    return null;
  }
  if (!taskToUpdate || !taskToUpdate.id) {
    toast.error("Task data or Task ID is missing for update.");
    return null;
  }

  // Construct the API payload
  const payload: ApiTaskUpdatePayload = {};
  if (taskToUpdate.title !== undefined) payload.title = taskToUpdate.title;
  if (taskToUpdate.description !== undefined) payload.description = taskToUpdate.description;
  if (taskToUpdate.status !== undefined) payload.status = taskToUpdate.status;
  if (taskToUpdate.priority !== undefined) payload.priority = taskToUpdate.priority;
  if (taskToUpdate.taskType !== undefined) payload.task_type = taskToUpdate.taskType;
  
  if (taskToUpdate.dueDate !== undefined) {
    payload.due_date = taskToUpdate.dueDate ? 
      (typeof taskToUpdate.dueDate === 'string' ? taskToUpdate.dueDate.split('T')[0] : new Date(taskToUpdate.dueDate).toISOString().split('T')[0]) 
      : null;
  }
  if (taskToUpdate.startDate !== undefined) {
    payload.start_date = taskToUpdate.startDate ? 
      (typeof taskToUpdate.startDate === 'string' ? taskToUpdate.startDate : new Date(taskToUpdate.startDate).toISOString()) 
      : null;
  }
  if (taskToUpdate.endDate !== undefined) {
    payload.end_date = taskToUpdate.endDate ? 
      (typeof taskToUpdate.endDate === 'string' ? taskToUpdate.endDate : new Date(taskToUpdate.endDate).toISOString()) 
      : null;
  }
  if (taskToUpdate.duration !== undefined) payload.duration_minutes = taskToUpdate.duration;
  if (taskToUpdate.project_id !== undefined) payload.project_id = taskToUpdate.project_id; // For moving task
  
  if (taskToUpdate.assignees !== undefined) {
    payload.assignee_ids = taskToUpdate.assignees ? taskToUpdate.assignees.map(a => a.id) : [];
  }
  // depends_on_task_ids would be mapped similarly if part of taskToUpdate
  // For now, not including it in the simplified payload construction

  try {
    const path = `/tasks/${taskToUpdate.id}`;
    const updatedTaskFromApi: Task = await fetchApi<Task, ApiTaskUpdatePayload>(
      path,
      'PUT',
      payload,
      token
    );

    if (updatedTaskFromApi) {
      // Update in the unified task collection
      setTasks(prevTasks => prevTasks.map(t => t.id === updatedTaskFromApi.id ? updatedTaskFromApi : t));

      // Update in Kanban board
      // The showInKanban logic should ideally come from the API response or be consistent
      const showInKanban = updatedTaskFromApi.showInKanban !== undefined 
        ? updatedTaskFromApi.showInKanban 
        : (updatedTaskFromApi.taskType === 'task');

      if (showInKanban) {
        setBoard((prevBoard) => {
          const oldTask = prevBoard.tasks[updatedTaskFromApi.id];
          const statusChanged = oldTask && oldTask.status !== updatedTaskFromApi.status;

          const newBoardTasks = {
            ...prevBoard.tasks,
            [updatedTaskFromApi.id]: updatedTaskFromApi,
          };

          if (!statusChanged && oldTask) { // Task was already in board and status didn't change
        return {
              ...prevBoard,
              tasks: newBoardTasks,
        };
      }

          // Determine source and destination columns for status change or new task
      let sourceColumnId = '';
          if (oldTask) { // If task was already on board, find its column
            Object.keys(prevBoard.columns).forEach((colId) => {
              if (prevBoard.columns[colId].taskIds.includes(updatedTaskFromApi.id)) {
          sourceColumnId = colId;
        }
      });
          }

          let destColumnId = 'column-1'; // Default based on new status
          switch (updatedTaskFromApi.status) {
            case 'todo': destColumnId = 'column-1'; break;
            case 'in_progress': destColumnId = 'column-2'; break;
            case 'review': destColumnId = 'column-3'; break;
            case 'done': case 'completed': destColumnId = 'column-4'; break;
            default: destColumnId = 'column-1';
          }
          
          const columnsUpdate = { ...prevBoard.columns };
          let taskMoved = false;

          if (sourceColumnId && sourceColumnId !== destColumnId) {
            // Remove from source column
            const sourceCol = columnsUpdate[sourceColumnId];
            columnsUpdate[sourceColumnId] = {
              ...sourceCol,
              taskIds: sourceCol.taskIds.filter(id => id !== updatedTaskFromApi.id),
            };
            taskMoved = true;
          }

          // Add to destination column if not already there or if moved
          const destCol = columnsUpdate[destColumnId];
          if (destCol && (!destCol.taskIds.includes(updatedTaskFromApi.id) || taskMoved)) {
             // Ensure it's not added multiple times if it was already in destCol and status changed
             const newDestTaskIds = destCol.taskIds.filter(id => id !== updatedTaskFromApi.id);
             newDestTaskIds.push(updatedTaskFromApi.id); // Add it (again, or for the first time)
             columnsUpdate[destColumnId] = {
               ...destCol,
               taskIds: newDestTaskIds,
             };
          } else if (!destCol) {
            console.warn(`Destination column ${destColumnId} not found in board.`);
          }

      return {
            ...prevBoard,
            tasks: newBoardTasks,
            columns: columnsUpdate,
      };
    });
      } else { // Task should not be in Kanban (e.g., type 'meeting' or showInKanban is false)
        setBoard((prevBoard) => {
          if (!prevBoard.tasks[updatedTaskFromApi.id]) return prevBoard; // Not in board, nothing to do

          const { [updatedTaskFromApi.id]: _, ...remainingTasks } = prevBoard.tasks;
          const newColumns = { ...prevBoard.columns };
          Object.keys(newColumns).forEach(colId => {
            newColumns[colId] = {
              ...newColumns[colId],
              taskIds: newColumns[colId].taskIds.filter(id => id !== updatedTaskFromApi.id),
            };
          });
        return {
            ...prevBoard,
          tasks: remainingTasks,
            columns: newColumns,
      };
    });
  }

      toast.success('Task updated successfully!');
      return updatedTaskFromApi;
    } else {
      toast.error('Failed to update task: No data returned from API.');
      return null;
    }
  } catch (error: any) {
    console.error("Error updating task:", error);
    toast.error(`Failed to update task: ${error.message || 'Network error'}`);
    return null;
  }
};

export const deleteTask = async (
  token: string | null,
  taskId: string,
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  setBoard: React.Dispatch<React.SetStateAction<Board>>
): Promise<boolean> => {
  if (!token) {
    toast.error("Authentication token not available. Please log in.");
    return false;
  }

  try {
    const path = `/tasks/${taskId}`;
    await fetchApi(path, 'DELETE', null, token);

    // If API call succeeds, update local state
    setTasks(prev => prev.filter(t => t.id !== taskId));
    
    setBoard((prev) => {
      const isTaskInBoard = Object.prototype.hasOwnProperty.call(prev.tasks, taskId);
      if (!isTaskInBoard) {
        return prev;
      }
      let columnWithTask: Column | null = null;
      let columnId = '';
      Object.keys(prev.columns).forEach((colId) => {
        if (prev.columns[colId].taskIds.includes(taskId)) {
          columnWithTask = prev.columns[colId];
          columnId = colId;
        }
      });
      if (!columnWithTask) {
        const { [taskId]: _, ...remainingTasks } = prev.tasks;
        return {
          ...prev,
          tasks: remainingTasks,
        };
      }
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
    return true;
  } catch (error: any) {
    console.error("Error deleting task:", error);
    toast.error(`Failed to delete task: ${error.message || 'Network error'}`);
    return false;
  }
};

export const moveTaskOnKanban = async (
  taskId: string,
  sourceColId: string, // Keep for potential logging or more complex logic later
  destColId: string,
  boardColumns: Record<string, Column>, // Pass current board columns to map destColId to status
  currentTask: Task | undefined,
  token: string | null,
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  setBoard: React.Dispatch<React.SetStateAction<Board>>
) => {
  if (!currentTask) {
    toast.error("Task details not found for moving.");
    return;
  }
  if (!token) {
    toast.error("Authentication required to move task.");
    return;
  }

  const destColumn = boardColumns[destColId];
  if (!destColumn) {
    toast.error("Destination column not found.");
    return;
  }

  let newStatus: Task['status'] = currentTask.status; // Default to current status

  const title = destColumn.title.toLowerCase();
  if (title === 'to do') {
    newStatus = 'todo';
  } else if (title === 'in progress' || title === 'in-progress' || title === 'in_progress') {
    newStatus = 'in_progress'; // Always use underscore version for the API
  } else if (title === 'review') {
    newStatus = 'review';
  } else if (title === 'done' || title === 'completed') {
    newStatus = 'completed';
  }

  if (newStatus === currentTask.status) {
    console.log("Task moved to a column with the same status or status not changed.");
    // If only reordering within the same column, that logic would be separate
    // and might not need an API call if the backend doesn't track order within status.
    // For now, this function primarily handles status changes due to column moves.
    return; 
  }

  await updateTask(
    token,
    { id: taskId, status: newStatus },
    setTasks,
    setBoard
  );
};
