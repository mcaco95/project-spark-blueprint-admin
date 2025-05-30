
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { TaskProvider, useTaskContext } from '@/contexts/tasks/TaskContext';
import { TaskColumn } from '@/components/kanban/TaskColumn';
import { TaskDialog } from '@/components/kanban/TaskDialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Task } from '@/types/task';

const KanbanBoard = () => {
  const { board } = useTaskContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const navigate = useNavigate();

  const handleAddNewTask = () => {
    setEditingTask(null);
    setIsDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const handleTaskSaved = (task: Task) => {
    // Close dialog and navigate to the task detail page
    setIsDialogOpen(false);
    navigate(`/tasks/${task.id}`);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTask(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kanban Board</h1>
          <p className="text-muted-foreground mt-2">
            Drag and drop tasks between columns
          </p>
        </div>
        <Button onClick={handleAddNewTask} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add New Task
        </Button>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-4 overflow-x-auto pb-6">
        {board.columnOrder.map(columnId => {
          const column = board.columns[columnId];
          const tasks = column.taskIds.map(taskId => board.tasks[taskId]);
          
          return (
            <TaskColumn 
              key={column.id} 
              column={column} 
              tasks={tasks} 
              onEditTask={handleEditTask}
            />
          );
        })}
      </div>

      <TaskDialog 
        isOpen={isDialogOpen} 
        onClose={handleCloseDialog} 
        editingTask={editingTask}
        onSave={handleTaskSaved} 
      />
    </div>
  );
};

const TaskKanban = () => {
  return (
    <MainLayout>
      <TaskProvider>
        <KanbanBoard />
      </TaskProvider>
    </MainLayout>
  );
};

export default TaskKanban;
