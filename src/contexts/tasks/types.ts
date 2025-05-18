
import { Task, Board, Column } from "@/types/task";

export interface TaskContextType {
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
