import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useTaskContext } from '@/contexts/tasks/TaskContext';
import { Task } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle, Clock, ListChecks, User, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const TaskDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTaskById, updateTask, deleteTask } = useTaskContext();
  const [task, setTask] = useState<Task | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const foundTask = getTaskById(id);
      if (foundTask) {
        setTask(foundTask);
      } else {
        // Optionally redirect to a "Task Not Found" page
        console.warn(`Task with id ${id} not found.`);
        navigate('/tasks');
      }
      setIsLoading(false);
    }
  }, [id, getTaskById, navigate]);

  const handleStatusChange = (newStatus: Task['status']) => {
    if (task) {
      const updatedTask = { ...task, status: newStatus };
      updateTask(updatedTask);
      setTask(updatedTask);
    }
  };

  const handleDeleteTask = () => {
    if (task?.id) {
      deleteTask(task.id);
      navigate('/tasks');
    }
  };

  if (isLoading) {
    return <MainLayout>Loading...</MainLayout>;
  }

  if (!task) {
    return <MainLayout>Task not found</MainLayout>;
  }

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '';
    try {
      return format(new Date(date), 'MMM dd, yyyy');
    } catch (e) {
      return String(date);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{task.title}</h1>
            <p className="text-muted-foreground mt-2">
              {task.description || 'No description provided.'}
            </p>
          </div>
          <div className="space-x-2">
            <Button onClick={() => navigate('/tasks')} variant="outline">
              Back to Tasks
            </Button>
            <Button onClick={() => navigate(`/tasks/edit/${task.id}`)}>Edit Task</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card rounded-md p-4">
            <h2 className="text-xl font-medium mb-4">Task Details</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-muted-foreground" />
                <span>Status:</span>
                <Badge variant="secondary">{task.status}</Badge>
              </div>
              {task.priority && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    Priority: {task.priority}
                  </Badge>
                </div>
              )}
              {task.assignees && task.assignees.length > 0 && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Assignees:</span>
                  <div className="flex -space-x-1">
                    {task.assignees.map((assignee, idx) => (
                      <Avatar key={idx} className="h-6 w-6 border-2 border-background">
                        <AvatarFallback className="text-xs">
                          {assignee.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>
              )}
              {task.dueDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Due Date:</span>
                  <span>{formatDate(task.dueDate)}</span>
                </div>
              )}
              {task.date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Date:</span>
                  <span>{formatDate(task.date)}</span>
                </div>
              )}
              {task.time && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Time:</span>
                  <span>{task.time}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card rounded-md p-4">
            <h2 className="text-xl font-medium mb-4">Actions</h2>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleStatusChange('todo')}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Mark as To Do
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleStatusChange('in-progress')}
              >
                <Clock className="h-4 w-4 mr-2" />
                Mark as In Progress
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleStatusChange('review')}
              >
                <ListChecks className="h-4 w-4 mr-2" />
                Mark as In Review
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleStatusChange('done')}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Done
              </Button>
              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={handleDeleteTask}
              >
                Delete Task
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default TaskDetail;
