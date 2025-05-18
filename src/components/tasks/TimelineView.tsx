
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { useTaskContext } from '@/contexts/tasks/TaskContext';
import { TaskDialog } from '@/components/kanban/TaskDialog';
import { Button } from '@/components/ui/button';
import { Task } from '@/types/task';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function TimelineView() {
  const { getAllTasks } = useTaskContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const navigate = useNavigate();
  const tasks = getAllTasks();

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

  const handlePrevWeek = () => {
    setCurrentWeekStart(prev => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(prev => addWeeks(prev, 1));
  };

  // Generate the 7 days of the week
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  // Filter tasks for the displayed week
  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => {
      const taskDate = task.date && new Date(task.date);
      const dueDate = task.dueDate && new Date(task.dueDate);
      const startDate = task.startDate && new Date(task.startDate);
      
      return (
        (taskDate && isSameDay(taskDate, day)) || 
        (dueDate && isSameDay(dueDate, day)) ||
        (startDate && isSameDay(startDate, day))
      );
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium">
            {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
          </span>
          <Button variant="outline" size="icon" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <Button onClick={handleAddNewTask}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Task
        </Button>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {weekDays.map((day, i) => (
          <div key={i} className="text-center p-2 bg-muted/50 rounded-md">
            <div className="font-medium">{format(day, 'EEE')}</div>
            <div className="text-xs text-muted-foreground">{format(day, 'MMM d')}</div>
          </div>
        ))}
        
        {/* Task cells for each day */}
        {weekDays.map((day, i) => (
          <div key={`cell-${i}`} className="min-h-[200px] border rounded-md p-2 overflow-y-auto">
            {getTasksForDay(day).map(task => (
              <div
                key={task.id}
                className="mb-2 p-2 bg-card border rounded-md text-xs cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/tasks/${task.id}`)}
              >
                <div className="font-medium line-clamp-1">{task.title}</div>
                <div className="flex items-center justify-between mt-1">
                  <Badge variant="outline" className="text-2xs">
                    {task.time || format(day, 'hh:mm a')}
                  </Badge>
                  {task.priority && (
                    <Badge 
                      variant={
                        task.priority === 'high' ? 'destructive' : 
                        task.priority === 'medium' ? 'default' : 'secondary'
                      }
                      className="text-2xs"
                    >
                      {task.priority}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-8 text-xs mt-2"
              onClick={() => {
                setEditingTask({
                  id: '',
                  title: '',
                  assignees: [],
                  status: 'todo',
                  date: format(day, 'yyyy-MM-dd')
                } as Task);
                setIsDialogOpen(true);
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
        ))}
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
