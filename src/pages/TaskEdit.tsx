
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useTaskContext } from '@/contexts/tasks/TaskContext';
import { Task } from '@/types/task';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { TaskDialog } from '@/components/tasks/TaskEditDialog';

const TaskEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTaskById } = useTaskContext();
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const foundTask = getTaskById(id);
      if (foundTask) {
        setTask(foundTask);
      } else {
        console.warn(`Task with id ${id} not found.`);
        navigate('/tasks');
      }
      setIsLoading(false);
    }
  }, [id, getTaskById, navigate]);

  const handleTaskSaved = () => {
    navigate(`/tasks/${id}`);
  };

  if (isLoading) {
    return <MainLayout>Loading...</MainLayout>;
  }

  if (!task) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <h1 className="text-2xl font-bold mb-4">Task not found</h1>
          <p className="text-muted-foreground mb-6">The task you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/tasks')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tasks
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button variant="outline" size="icon" className="mr-4" onClick={() => navigate(`/tasks/${id}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Edit Task</h1>
        </div>

        <TaskDialog 
          isOpen={true}
          onClose={() => navigate(`/tasks/${id}`)}
          editingTask={task}
          onSave={handleTaskSaved}
          standalone={true}
        />
      </div>
    </MainLayout>
  );
};

export default TaskEdit;
