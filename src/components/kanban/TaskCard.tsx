
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Task } from '@/types/task';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useTaskContext } from '@/contexts/TaskContext';
import { Badge } from '@/components/ui/badge';

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

  return (
    <Card 
      className={`mb-3 ${isDragging ? 'opacity-50 border-dashed' : ''} cursor-pointer hover:shadow-md transition-shadow`}
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
              {task.project}
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="px-4 py-2 flex justify-between">
        <div className="flex -space-x-1">
          {task.assignees && task.assignees.map((assignee, idx) => (
            <Avatar key={idx} className="h-6 w-6 border-2 border-background">
              <AvatarFallback className="text-xs">
                {assignee.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
        <div className="flex space-x-1">
          <Button variant="ghost" size="icon" onClick={handleEditClick} className="h-7 w-7">
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
