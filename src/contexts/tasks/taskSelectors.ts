
import { Task } from "@/types/task";

export const getAllTasks = (tasks: Task[]) => {
  return tasks;
};

export const getKanbanTasks = (tasks: Task[]) => {
  return tasks.filter(task => 
    // Consider all tasks for kanban view if they don't explicitly have showInKanban=false
    task.showInKanban !== false
  );
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
  return tasks.filter(task => task.projectId === projectId);
};
