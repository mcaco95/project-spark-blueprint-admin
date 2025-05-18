
import React from 'react';
import { Task } from '@/types/task';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { useTaskContext } from '@/contexts/TaskContext';

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

  return (
    <Card 
      className={`mb-3 ${isDragging ? 'opacity-50 border-dashed' : ''}`}
      data-task-id={task.id}
    >
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-medium">{task.title}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-2 text-sm text-muted-foreground">
        <p className="line-clamp-2">{task.description || 'No description'}</p>
        
        {task.priority && (
          <div className="mt-2">
            <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${priorityColors[task.priority]}`}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter className="px-4 py-2 flex justify-between">
        <div className="text-xs text-muted-foreground">
          {task.assignee && (
            <span>{task.assignee}</span>
          )}
        </div>
        <div className="flex space-x-1">
          <Button variant="ghost" size="icon" onClick={onEdit} className="h-7 w-7">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => deleteTask(task.id)}
            className="h-7 w-7"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
