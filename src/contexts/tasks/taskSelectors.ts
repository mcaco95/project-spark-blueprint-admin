import { Task } from "@/types/task";

export const getAllTasks = (tasks: Task[]) => {
  return tasks;
};

export const getKanbanTasks = (tasks: Task[]) => {
  return tasks.filter(task => {
    // Consider all tasks for kanban view if they don't explicitly have showInKanban=false
    // Also ensure task has required fields
    return task.showInKanban !== false && 
           task.id && 
           task.title && 
           task.status && 
           (
             // Ensure dates are in proper format if present
             !task.dueDate || (typeof task.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(task.dueDate)) ||
             !task.date || (typeof task.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(task.date))
           );
  });
};

export const getTimelineTasks = (tasks: Task[]) => {
  return tasks.filter(task => 
    // Include tasks that have showInTimeline=true or have date and time
    task.showInTimeline || (task.date && task.time)
  );
};

export const getTaskById = (tasks: Task[], taskId: string) => {
  return tasks.find(task => task.id === taskId);
};

export const getTasksByProject = (tasks: Task[], projectId: string | null) => {
  if (!projectId) return tasks;
  return tasks.filter(task => task.project_id === projectId);
};
