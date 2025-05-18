import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaskContext } from '@/contexts/tasks/TaskContext';
import { TaskDialog } from '@/components/kanban/TaskDialog';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Edit, Trash2, Timer } from 'lucide-react';
import { Task } from '@/types/task';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { usePomodoroContext } from '@/contexts/PomodoroContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function ListView() {
  const { getAllTasks, deleteTask } = useTaskContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const navigate = useNavigate();
  const tasks = getAllTasks();
  const { 
    setCurrentTask, 
    startFocus, 
    currentTask, 
    getTaskPomodoros,
    addTaskToPomodoros
  } = usePomodoroContext();

  const handleAddNewTask = () => {
    setEditingTask(null);
    setIsDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const handleTaskSaved = (task: Task) => {
    setIsDialogOpen(false);
    navigate(`/tasks/${task.id}`);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTask(null);
  };

  const handleRowClick = (taskId: string) => {
    navigate(`/tasks/${taskId}`);
  };

  const handleStartPomodoroClick = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setCurrentTask(task);
    
    // Add to pomodoros if not already there
    if (!getTaskPomodoros(task.id)) {
      addTaskToPomodoros(task.id);
    }
    
    startFocus();
  };

  const handleDeleteClick = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    deleteTask(taskId);
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '';
    try {
      return format(new Date(date), 'MMM dd, yyyy');
    } catch (e) {
      return String(date);
    }
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null;
    
    const colorMap: Record<string, string> = {
      low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
      high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
    
    return (
      <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${colorMap[priority]}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const colorMap: Record<string, string> = {
      'todo': 'bg-gray-200 text-gray-800',
      'in-progress': 'bg-blue-200 text-blue-800',
      'review': 'bg-yellow-200 text-yellow-800',
      'done': 'bg-green-200 text-green-800',
      'completed': 'bg-green-200 text-green-800',
    };
    
    return (
      <Badge className={colorMap[status]}>
        {status === 'in-progress' ? 'In Progress' : 
          status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleAddNewTask}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Task
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assignees</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Project</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow 
                key={task.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(task.id)}
              >
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell>{getStatusBadge(task.status)}</TableCell>
                <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                <TableCell>
                  <div className="flex -space-x-1">
                    {task.assignees && task.assignees.map((assignee, idx) => (
                      <Avatar key={idx} className="h-6 w-6 border-2 border-background">
                        <AvatarFallback className="text-xs">
                          {assignee.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {task.dueDate ? (
                    <div className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      {formatDate(task.dueDate)}
                    </div>
                  ) : task.date ? (
                    <div className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      {formatDate(task.date)}
                    </div>
                  ) : null}
                </TableCell>
                <TableCell>{task.project}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1" onClick={e => e.stopPropagation()}>
                    <Button
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => handleStartPomodoroClick(e, task)}
                      className="h-7 w-7"
                      title="Start Pomodoro"
                    >
                      <Timer className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditTask(task);
                      }} 
                      className="h-7 w-7"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => handleDeleteClick(e, task.id)}
                      className="h-7 w-7"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <TaskDialog 
        isOpen={isDialogOpen} 
        onClose={handleCloseDialog} 
        editingTask={editingTask}
        onSave={handleTaskSaved} 
      />
    </div>
  );
}
