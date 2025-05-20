import { Task, Board, Column } from "@/types/task";
import { ApiTaskCreatePayload } from "./taskActions";

export interface TaskContextType {
  board: Board;
  tasks: Task[];
  isLoadingTasks: boolean;
  addTask: (taskDataForApi: ApiTaskCreatePayload) => Promise<Task | null>;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (taskId: string, sourceColId: string, destColId: string, newIndex?: number) => void;
  getTasksByProject: (projectId: string | null) => Task[];
  getAllTasks: () => Task[];
  getTaskById: (taskId: string) => Task | undefined;
  getKanbanTasks: () => Task[];
  getTimelineTasks: () => Task[];
}
