import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Task } from '@/types/task';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Timer, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useTaskContext } from '@/contexts/tasks/TaskContext';
import { usePomodoroContext } from '@/contexts/PomodoroContext';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, parse, parseISO, isValid } from 'date-fns';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  onEdit?: () => void;
}

const priorityColors = {
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

export function TaskCard({ task, isDragging, onEdit }: TaskCardProps) {
  const { deleteTask } = useTaskContext();
  const { 
    setCurrentTask, 
    startFocus, 
    currentTask, 
    getTaskPomodoros,
    addTaskToPomodoros
  } = usePomodoroContext();
  const navigate = useNavigate();
  
  const handleCardClick = (e: React.MouseEvent) => {
    // Only navigate if the click wasn't on a button
    if (!(e.target instanceof HTMLButtonElement) && 
        !(e.target instanceof SVGElement) && 
        !((e.target as HTMLElement).parentElement instanceof HTMLButtonElement)) {
      navigate(`/tasks/${task.id}`);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (onEdit) {
      onEdit();
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    deleteTask(task.id);
  };
  
  const handleStartPomodoroClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setCurrentTask(task);
    
    // Add to pomodoros if not already there
    if (!getTaskPomodoros(task.id)) {
      addTaskToPomodoros(task.id);
    }
    
    startFocus();
  };

  const isCurrentPomodoroTask = currentTask?.id === task.id;
  const taskPomodoro = getTaskPomodoros(task.id);
  const pomodoroProgress = taskPomodoro 
    ? (taskPomodoro.completedPomodoros / taskPomodoro.estimatedPomodoros) * 100
    : 0;

  const formatDate = (dateInput: string | Date | null | undefined, formatString: string = 'MMM dd') => {
    if (!dateInput) return '';
    try {
      // If it's already a Date object, use it. If it's a string, parse it.
      // Backend sends date as "YYYY-MM-DD" for dueDate.
      // Backend might send full ISO for meeting dates (task.date / task.startDate)
      const dateObj = typeof dateInput === 'string' 
        ? (dateInput.includes('T') 
          ? parseISO(dateInput) 
          : parse(dateInput, 'yyyy-MM-dd', new Date()))
        : dateInput;
      
      // Ensure we're working with a valid date
      if (!isValid(dateObj)) {
        console.error("Invalid date in TaskCard:", dateInput);
        return '';
      }
      
      return format(dateObj, formatString);
    } catch (e) {
      console.error("Error formatting date in TaskCard:", dateInput, e);
      return ''; // Return empty string instead of potentially invalid date string
    }
  };

  return (
    <Card 
      className={`mb-3 ${isDragging ? 'opacity-50 border-dashed' : ''} cursor-pointer hover:shadow-md transition-shadow ${isCurrentPomodoroTask ? 'border-primary border-2' : ''}`}
      data-task-id={task.id}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-medium">{task.title}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-2 text-sm text-muted-foreground">
        <p className="line-clamp-2">{task.description || 'No description'}</p>
        
        <div className="flex flex-wrap gap-1 mt-2">
          {task.priority && (
            <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${priorityColors[task.priority]}`}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>
          )}
          
          {task.project && (
            <Badge variant="secondary" className="text-xs">
              {task.project.name}
            </Badge>
          )}
          
          {/* Show date if available */}
          {task.taskType === 'task' && task.dueDate && (
            <Badge variant="outline" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              {formatDate(task.dueDate)}
            </Badge>
          )}
          {task.taskType === 'meeting' && task.date && ( 
            <Badge variant="outline" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              {/* Meetings might have a more specific time, adjust format if needed */}
              {formatDate(task.date, 'MMM dd, HH:mm')} 
            </Badge>
          )}
          
          {isCurrentPomodoroTask && (
            <Badge variant="secondary" className="text-xs bg-primary text-primary-foreground">
              <Timer className="h-3 w-3 mr-1" /> Active
            </Badge>
          )}

          {taskPomodoro && (
            <Badge variant="outline" className="text-xs">
              <Timer className="h-3 w-3 mr-1" />
              {taskPomodoro.completedPomodoros}/{taskPomodoro.estimatedPomodoros}
            </Badge>
          )}
        </div>

        {taskPomodoro && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="mt-2">
                  <Progress 
                    value={pomodoroProgress} 
                    className="h-1" 
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {taskPomodoro.completedPomodoros} of {taskPomodoro.estimatedPomodoros} pomodoros completed
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </CardContent>
      <CardFooter className="px-4 py-2 flex justify-between">
        <div className="flex -space-x-1">
          {task.assignees && task.assignees.map((assignee, idx) => (
            <Avatar key={idx} className="h-6 w-6 border-2 border-background">
              <AvatarFallback className="text-xs">
                {assignee.name ? assignee.name.substring(0, 2).toUpperCase() : (assignee.email ? assignee.email.substring(0,1).toUpperCase() : '??')}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
        <div className="flex space-x-1">
          <Button
            variant="ghost" 
            size="icon" 
            onClick={handleStartPomodoroClick}
            className={`h-7 w-7 ${isCurrentPomodoroTask ? 'text-primary' : ''}`}
            title="Start Pomodoro"
          >
            <Timer className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleEditClick} 
            className="h-7 w-7"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleDeleteClick}
            className="h-7 w-7"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
