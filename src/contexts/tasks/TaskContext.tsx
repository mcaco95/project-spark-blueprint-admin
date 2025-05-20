import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Task, Board, Column } from '@/types/task';
import * as taskSelectors from './taskSelectors';
import * as taskActions from './taskActions';
import { ApiTaskCreatePayload } from './taskActions'; // Import the payload type
import { TaskContextType } from './types';
import { ensureTaskType } from '@/hooks/useTaskTypeSetter';
import { useAuth, fetchApi } from '@/contexts/AuthContext'; // Import useAuth and fetchApi
import { toast } from 'sonner'; // For error notifications

// Define a simple project type for fetching, matching backend ProjectOutput relevant fields
interface FetchedProject {
  id: string;
  name: string;
  // Add other fields if needed, but for task fetching, id is primary
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

// Define a default empty board structure
const defaultEmptyBoard: Board = {
  tasks: {},
  columns: {
    'column-1': { id: 'column-1', title: 'To Do', taskIds: [] },
    'column-2': { id: 'column-2', title: 'In Progress', taskIds: [] },
    'column-3': { id: 'column-3', title: 'Review', taskIds: [] },
    'column-4': { id: 'column-4', title: 'Done', taskIds: [] },
  },
  columnOrder: ['column-1', 'column-2', 'column-3', 'column-4'],
};

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  // Initialize board with the default empty structure
  const [board, setBoard] = useState<Board>(defaultEmptyBoard);
  // Initialize tasks as an empty array
  const [tasks, setTasks] = useState<Task[]>([]); 
  const [isLoadingTasks, setIsLoadingTasks] = useState<boolean>(true); // New loading state
  const { token } = useAuth(); // Get token using useAuth

  useEffect(() => {
    const fetchInitialTasks = async () => {
      if (!token) {
        setIsLoadingTasks(false); // No token, no fetching
        setTasks([]); // Clear tasks if token is lost
        return;
      }

      setIsLoadingTasks(true);
      try {
        const projects = await fetchApi<FetchedProject[], undefined>(
          '/projects/',
          'GET',
          undefined,
          token
        );

        if (projects && projects.length > 0) {
          const allTasksPromises = projects.map(project =>
            fetchApi<Task[], undefined>(
              // Corrected path to match backend route structure
              `/tasks/project/${project.id}/tasks/`, 
              'GET',
              undefined,
              token
            ).catch(error => {
              console.error(`Failed to fetch tasks for project ${project.id}:`, error);
              toast.error(`Error fetching tasks for project ${project.name}.`);
              return []; // Return empty array for this project if fetch fails
            })
          );
          
          const tasksByProject = await Promise.all(allTasksPromises);
          const allFetchedTasks = tasksByProject.flat().filter(Boolean).map(apiTaskRaw => {
            // Assuming apiTaskRaw is the raw task object from the backend (all snake_case)
            // Perform explicit mapping from snake_case (backend) to camelCase (frontend Task type)
            const frontendReadyTask: Partial<Task> = {
              // Spread raw task first to get all matching snake_case fields like id, title, description,
              // project_id, owner_id, created_at, updated_at, status, priority etc.
              ...(apiTaskRaw as any), // Use 'as any' for spreading, then type explicitly

              // Explicitly map fields that are camelCase in frontend Task type
              // but snake_case in backend response.
              dueDate: apiTaskRaw.due_date || null,
              startDate: apiTaskRaw.start_date || null,
              endDate: apiTaskRaw.end_date || null,
              taskType: apiTaskRaw.task_type, // ensureTaskType will handle if this is undefined

              // Ensure arrays are initialized if backend might omit them when empty
              assignees: apiTaskRaw.assignees || [],
              dependencies: apiTaskRaw.dependencies || [],
              comments: apiTaskRaw.comments || [],
            };
            return ensureTaskType(frontendReadyTask as Task); // Pass to ensureTaskType, which expects Task or Partial<Task>
          });
          
          console.log("DEBUG: Tasks being set in context:", JSON.stringify(allFetchedTasks, null, 2));

          setTasks(allFetchedTasks);

          // REMOVED: Board initialization logic - will be handled by the useEffect hook below that listens to 'tasks' changes.
          // const initialTasksMap: Record<string, Task> = {};
          // allFetchedTasks.forEach(task => {
          //   initialTasksMap[task.id] = ensureTaskType(task);
          // });
          // const newBoard: Board = { ...defaultEmptyBoard, tasks: initialTasksMap };
          // Object.values(newBoard.columns).forEach(col => col.taskIds = []);
          // allFetchedTasks.forEach(task => {
          //   const columnId = taskSelectors.getColumnIdForStatus(task.status, newBoard.columns);
          //   if (newBoard.columns[columnId]) {
          //     if (!newBoard.columns[columnId].taskIds.includes(task.id)) {
          //       newBoard.columns[columnId].taskIds.push(task.id);
          //     }
          //   }
          // });
          // setBoard(newBoard);
        } else {
          setTasks([]); // No projects, so no tasks
          // REMOVED: setBoard(defaultEmptyBoard); // Rely on the second useEffect to clear the board
        }
      } catch (error) {
        console.error("Error fetching initial tasks or projects:", error);
        toast.error("Failed to load initial task data.");
        setTasks([]); // Clear tasks on error
        // REMOVED: setBoard(defaultEmptyBoard); // Rely on the second useEffect to clear the board
      } finally {
        setIsLoadingTasks(false);
      }
    };

    fetchInitialTasks();
  }, [token]); // Re-fetch if token changes

  // useEffect to populate board from tasks (will run, but tasks is initially empty)
  // This can be kept if tasks are fetched and set later, it would rebuild the board.
  // Or, if tasks are always managed via board operations, this might be simplified.
  useEffect(() => {
    const kanbanTasks = tasks.filter(task => task.showInKanban !== false);
    
    if (kanbanTasks.length > 0) {
      const boardTasks: Record<string, Task> = {};
      // Reset columns to default empty structure before populating, to avoid merging with stale data if tasks change.
      const updatedColumns: Record<string, Column> = JSON.parse(JSON.stringify(defaultEmptyBoard.columns));

      kanbanTasks.forEach(task => {
        boardTasks[task.id] = task;
        
        let columnId: string = 'column-1'; // Default to first column
        // Determine column based on task status
        const statusToColumnMap: Record<string, string> = {
          'todo': 'column-1',
          'in-progress': 'column-2',
          'review': 'column-3',
          'done': 'column-4',
          'completed': 'column-4',
        };
        if (task.status && statusToColumnMap[task.status]) {
          columnId = statusToColumnMap[task.status];
        }
        
        // Ensure column exists before trying to add task to it
        if (updatedColumns[columnId] && !updatedColumns[columnId].taskIds.includes(task.id)) {
          updatedColumns[columnId].taskIds.push(task.id);
        }
      });

      setBoard({
        tasks: boardTasks,
        columns: updatedColumns,
        columnOrder: defaultEmptyBoard.columnOrder
      });
    } else {
      // If there are no kanban tasks (e.g., after deleting all tasks, or on initial load with no tasks)
      // Reset the board to its default empty state.
      setBoard(defaultEmptyBoard);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]); // Rerun when the main tasks array changes

  // Selector methods
  const getAllTasks = () => taskSelectors.getAllTasks(tasks);
  const getKanbanTasks = () => taskSelectors.getKanbanTasks(tasks);
  const getTimelineTasks = () => taskSelectors.getTimelineTasks(tasks);
  const getTaskById = (taskId: string) => {
    const task = taskSelectors.getTaskById(tasks, taskId);
    return task ? ensureTaskType(task) : undefined;
  };
  const getTasksByProject = (projectId: string | null) => {
    console.log('[TaskContext] getTasksByProject: Called with projectId:', projectId);
    console.log('[TaskContext] getTasksByProject: Current full tasks in context:', JSON.stringify(tasks, null, 2));
    
    const projectTasks = taskSelectors.getTasksByProject(tasks, projectId);
    
    console.log('[TaskContext] getTasksByProject: Filtered tasks for this project:', JSON.stringify(projectTasks, null, 2));
    return projectTasks.map(task => ensureTaskType(task));
  };

  // Action methods
  const addTask = async (taskDataForApi: ApiTaskCreatePayload): Promise<Task | null> => {
    if (!token) {
      toast.error("Authentication token not found. Cannot create task.");
      return null;
    }
    try {
      const newTaskFromApi = await taskActions.addTask(token, taskDataForApi, setTasks, setBoard);
      if (newTaskFromApi) {
        console.log("DEBUG: New task from API added to context:", JSON.stringify(newTaskFromApi, null, 2));
      }
      return newTaskFromApi;
    } catch (error) {
      console.error("Error in TaskProvider addTask:", error);
      return null;
    }
  };

  const updateTask = async (taskToUpdate: Partial<Task> & { id: string }): Promise<Task | null> => {
    if (!token) {
      toast.error("Authentication token not available. Please log in.");
      return null;
    }
    if (!taskToUpdate || !taskToUpdate.id) {
      toast.error("Task data or Task ID is missing for update.");
      return null;
    }

    // Construct the API payload (similar to taskActions.ts but using taskToUpdate directly)
    const payload: taskActions.ApiTaskUpdatePayload = {}; // Use the interface from taskActions
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

    // Refined logic for start_date and end_date
    if (taskToUpdate.startDate !== undefined && taskToUpdate.startDate !== null) {
      try {
        const startDateIso = typeof taskToUpdate.startDate === 'string' 
          ? taskToUpdate.startDate 
          : new Date(taskToUpdate.startDate).toISOString();
        if (startDateIso) payload.start_date = startDateIso;
      } catch (e) { console.warn("Invalid startDate for API payload", taskToUpdate.startDate); }
    }

    if (taskToUpdate.endDate !== undefined && taskToUpdate.endDate !== null) {
      try {
        const endDateIso = typeof taskToUpdate.endDate === 'string'
          ? taskToUpdate.endDate
          : new Date(taskToUpdate.endDate).toISOString();
        if (endDateIso) payload.end_date = endDateIso;
      } catch (e) { console.warn("Invalid endDate for API payload", taskToUpdate.endDate); }
    }

    if (taskToUpdate.duration !== undefined) payload.duration_minutes = taskToUpdate.duration;
    if (taskToUpdate.project_id !== undefined) payload.project_id = taskToUpdate.project_id;
    
    if (taskToUpdate.assignees !== undefined) {
      payload.assignee_ids = taskToUpdate.assignees ? taskToUpdate.assignees.map(a => a.id) : [];
    }
    // Add depends_on_task_ids if needed for update payload, similar to assignees
    if (taskToUpdate.dependencies !== undefined) {
        payload.depends_on_task_ids = taskToUpdate.dependencies ? taskToUpdate.dependencies.map(d => d.id) : [];
    }

    try {
      const path = `/tasks/${taskToUpdate.id}`;
      const updatedTaskFromApi = await fetchApi<Task, taskActions.ApiTaskUpdatePayload>(
        path,
        'PUT',
        payload,
        token
      );

      if (updatedTaskFromApi) {
        // Ensure taskType is set correctly after API update, as ensureTaskType was used for initial fetch
        const finalUpdatedTask = ensureTaskType(updatedTaskFromApi);

        setTasks(prevTasks => prevTasks.map(t => t.id === finalUpdatedTask.id ? finalUpdatedTask : t));
        // The board will auto-update due to the useEffect dependency on 'tasks'
        toast.success('Task updated successfully via API!');
        return finalUpdatedTask;
      } else {
        toast.error('Failed to update task: No data returned from API.');
        return null;
      }
    } catch (error: any) {
      console.error("Error updating task in TaskContext:", error);
      toast.error(`Failed to update task: ${error.message || 'Network error'}`);
      return null;
    }
  };

  const deleteTask = (taskId: string) => {
    // This still needs to be refactored for API calls
    // TODO: Implement API call for deleteTask in taskActions.ts and use token
    console.warn("deleteTask in TaskContext still uses local updates. API integration needed.");
    taskActions.deleteTask(taskId, setTasks, setBoard);
  };

  const moveTask = (taskId: string, sourceColId: string, destColId: string, newIndex = 0) => {
    // This still needs to be refactored for API calls
    // TODO: Implement API call for moveTask in taskActions.ts and use token
    console.warn("moveTask in TaskContext still uses local updates. API integration needed.");
    taskActions.moveTask(taskId, sourceColId, destColId, newIndex, board, setBoard, setTasks);
  };

  return (
    <TaskContext.Provider value={{
      board, 
      tasks, 
      isLoadingTasks, // Expose isLoadingTasks
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
