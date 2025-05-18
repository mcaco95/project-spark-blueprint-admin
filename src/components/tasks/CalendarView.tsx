
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaskContext } from '@/contexts/TaskContext';
import { TaskDialog } from '@/components/kanban/TaskDialog';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Task } from '@/types/task';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isValid } from 'date-fns';

export function CalendarView() {
  const { getAllTasks } = useTaskContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
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

  const handleTaskClick = (taskId: string) => {
    navigate(`/tasks/${taskId}`);
  };

  // Helper function to get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      // Check various date fields
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      const taskDate = task.date ? parseISO(task.date as string) : null;
      const startDate = task.startDate ? new Date(task.startDate) : null;
      
      // Format the comparison date to YYYY-MM-DD
      const dateStr = format(date, 'yyyy-MM-dd');
      
      return (
        (dueDate && format(dueDate, 'yyyy-MM-dd') === dateStr) ||
        (taskDate && isValid(taskDate) && format(taskDate, 'yyyy-MM-dd') === dateStr) ||
        (startDate && format(startDate, 'yyyy-MM-dd') === dateStr)
      );
    });
  };

  // Custom day render function to show task indicators
  const dayHasTask = (day: Date) => {
    const tasksOnDay = getTasksForDate(day);
    return tasksOnDay.length > 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleAddNewTask}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Task
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1">
          <CalendarComponent
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border shadow"
            modifiers={{
              hasTask: (date) => dayHasTask(date)
            }}
            modifiersStyles={{
              hasTask: { backgroundColor: "var(--primary-50)", fontWeight: "bold" }
            }}
          />
        </div>
        
        <div className="col-span-1 lg:col-span-2">
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
                </h2>
              </div>
              
              {selectedDate ? (
                <>
                  <div className="space-y-2">
                    {getTasksForDate(selectedDate).length > 0 ? (
                      getTasksForDate(selectedDate).map((task) => (
                        <div
                          key={task.id}
                          className="p-3 border rounded-md cursor-pointer hover:bg-muted/50"
                          onClick={() => handleTaskClick(task.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{task.title}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {task.description || 'No description'}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {task.priority && (
                                <Badge variant={task.priority === 'high' ? 'destructive' : 
                                        task.priority === 'medium' ? 'default' : 'secondary'}>
                                  {task.priority}
                                </Badge>
                              )}
                              <Badge>{task.status}</Badge>
                            </div>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {task.time && <span>Time: {task.time}</span>}
                            {task.project && <span className="ml-2">Project: {task.project}</span>}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No tasks for this date
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-4 text-center">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        handleAddNewTask();
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add task on {format(selectedDate, 'MMM d')}
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Select a date to view tasks
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <TaskDialog 
        isOpen={isDialogOpen} 
        onClose={handleCloseDialog} 
        editingTask={editingTask}
        onSave={handleTaskSaved} 
        initialDate={selectedDate}
      />
    </div>
  );
}
