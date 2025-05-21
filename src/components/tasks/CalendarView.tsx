import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaskContext } from '@/contexts/tasks/TaskContext';
import { TaskDialog } from '@/components/tasks/TaskEditDialog';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { Task } from '@/types/task';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isValid, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';

export function CalendarView() {
  const { getAllTasks } = useTaskContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const navigate = useNavigate();
  const tasks = getAllTasks();

  const handleAddNewTask = () => {
    console.log('Adding new task in Calendar view');
    setEditingTask(null);
    setIsDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const handleTaskSaved = (savedTask?: Task) => {
    setIsDialogOpen(false);
    setEditingTask(null);
    if (savedTask) {
      navigate(`/tasks/${savedTask.id}`);
    }
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
      try {
        // Parse dates ensuring they're treated as UTC midnight
        const dueDate = task.dueDate ? parseISO(`${task.dueDate}T00:00:00.000Z`) : null;
        const taskDate = task.date ? parseISO(`${task.date}T00:00:00.000Z`) : null;
        const startDate = task.startDate ? parseISO(`${task.startDate}T00:00:00.000Z`) : null;
        
        // Compare dates ignoring timezone
        const compareDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        
        return (
          (dueDate && isSameDay(dueDate, compareDate)) ||
          (taskDate && isValid(taskDate) && isSameDay(taskDate, compareDate)) ||
          (startDate && isSameDay(startDate, compareDate))
        );
      } catch (e) {
        console.error("Error comparing dates for task:", task.id, e);
        return false;
      }
    }).sort((a, b) => {
      // Sort by time if available, then by type (meetings first)
      const aTime = a.time || '';
      const bTime = b.time || '';
      if (aTime !== bTime) return aTime.localeCompare(bTime);
      if (a.taskType !== b.taskType) return a.taskType === 'meeting' ? -1 : 1;
      return 0;
    });
  };

  // Custom day render function to show task indicators
  const getDayIndicators = (day: Date) => {
    const tasksOnDay = getTasksForDate(day);
    return {
      hasMeeting: tasksOnDay.some(t => t.taskType === 'meeting'),
      hasTask: tasksOnDay.some(t => t.taskType === 'task'),
      taskCount: tasksOnDay.length
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <div className="w-2 h-2 rounded-full bg-blue-500 mr-1" />
            Meetings
          </Badge>
          <Badge variant="outline" className="text-xs">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-1" />
            Tasks
          </Badge>
        </div>
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
              hasMeeting: (date) => getDayIndicators(date).hasMeeting,
              hasTask: (date) => getDayIndicators(date).hasTask
            }}
            modifiersStyles={{
              hasMeeting: { 
                backgroundColor: "var(--primary-50)",
                borderBottom: "2px solid var(--primary)" 
              },
              hasTask: { 
                backgroundColor: "var(--success-50)",
                borderTop: "2px solid var(--success)" 
              }
            }}
            components={{
              DayContent: (props) => {
                const indicators = getDayIndicators(props.date);
                const maxDots = 5;
                const extraTasks = indicators.taskCount > maxDots ? indicators.taskCount - maxDots : 0;
                
                return (
                  <div className="relative w-full h-full flex flex-col items-center">
                    <span className="mb-1">{props.date.getDate()}</span>
                    {(indicators.hasMeeting || indicators.hasTask) && (
                      <div className="flex flex-col gap-0.5 items-center mt-auto">
                        <div className="flex gap-0.5 justify-center">
                          {Array.from({ length: Math.min(indicators.taskCount, maxDots) }).map((_, i) => (
                            <div 
                              key={i}
                              className={cn(
                                "w-1 h-1 rounded-full",
                                indicators.hasMeeting && i === 0 ? "bg-blue-500" : "bg-green-500"
                              )}
                            />
                          ))}
                        </div>
                        {extraTasks > 0 && (
                          <span className="text-[9px] text-muted-foreground leading-none">
                            +{extraTasks}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              }
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
                  <div className="space-y-3">
                    {getTasksForDate(selectedDate).length > 0 ? (
                      getTasksForDate(selectedDate).map((task) => (
                        <div
                          key={task.id}
                          className={cn(
                            "p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
                            task.taskType === 'meeting' ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-green-500'
                          )}
                          onClick={() => handleTaskClick(task.id)}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{task.title}</h3>
                                <Badge variant="outline">
                                  {task.taskType === 'meeting' ? 'Meeting' : 'Task'}
                                </Badge>
                              </div>
                              {task.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                {task.time && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    <span>{task.time}</span>
                                  </div>
                                )}
                                {task.project && (
                                  <div className="flex items-center gap-1">
                                    <CalendarIcon className="h-4 w-4" />
                                    <span>{task.project.name}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 items-end">
                              {task.priority && (
                                <Badge variant={
                                  task.priority === 'high' ? 'destructive' : 
                                  task.priority === 'medium' ? 'default' : 'secondary'
                                }>
                                  {task.priority}
                                </Badge>
                              )}
                              <Badge>{task.status}</Badge>
                            </div>
                          </div>
                          {task.assignees.length > 0 && (
                            <div className="mt-3 flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Assignees:</span>
                              <div className="flex gap-1">
                                {task.assignees.map(assignee => (
                                  <Badge key={assignee.id} variant="outline">
                                    {assignee.name || assignee.email}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
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
                        setEditingTask(null);
                        setIsDialogOpen(true);
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

      {isDialogOpen && (
        <TaskDialog 
          isOpen={isDialogOpen} 
          onClose={handleCloseDialog} 
          editingTask={editingTask}
          onSave={handleTaskSaved}
          initialDate={selectedDate}
        />
      )}
    </div>
  );
}
