import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns';
import { useTaskContext } from '@/contexts/tasks/TaskContext';
import { TaskDialog } from '@/components/tasks/TaskEditDialog';
import { Button } from '@/components/ui/button';
import { Task } from '@/types/task';
import { Plus, ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function TimelineView() {
  const { getAllTasks, updateTask } = useTaskContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const navigate = useNavigate();
  const tasks = getAllTasks();

  const handleAddNewTask = () => {
    console.log('Adding new task');
    setEditingTask(null);
    setIsDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const handleTaskSaved = (savedTask?: Task) => {
    console.log('Task saved:', savedTask);
    setIsDialogOpen(false);
    setEditingTask(null);
    if (savedTask) {
      toast.success('Task created successfully');
      navigate(`/tasks/${savedTask.id}`);
    }
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

  // Filter and sort tasks for the displayed week
  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => {
      const taskDate = task.date && parseISO(task.date);
      const dueDate = task.dueDate && (typeof task.dueDate === 'string' ? parseISO(task.dueDate) : task.dueDate);
      const startDate = task.startDate && (typeof task.startDate === 'string' ? parseISO(task.startDate) : task.startDate);
      
      return (
        (taskDate && isSameDay(taskDate, day)) || 
        (dueDate && isSameDay(dueDate, day)) ||
        (startDate && isSameDay(startDate, day))
      );
    }).sort((a, b) => {
      // Sort by time if available, then by type (meetings first)
      const aTime = a.time || '';
      const bTime = b.time || '';
      if (aTime !== bTime) return aTime.localeCompare(bTime);
      if (a.taskType !== b.taskType) return a.taskType === 'meeting' ? -1 : 1;
      return 0;
    });
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const [sourceDate] = result.source.droppableId.split('-');
    const [destDate] = result.destination.droppableId.split('-');
    const taskId = result.draggableId;
    const task = tasks.find(t => t.id === taskId);

    console.log('Drag end - Task to update:', task);
    console.log('Moving from date:', sourceDate, 'to date:', destDate);

    if (task && sourceDate !== destDate) {
      try {
        // Ensure we have the full date string
        const newDate = destDate;
        console.log('Updating task with new date:', newDate);
        
        // Keep all existing task properties and only update the date fields
        const updatedTask = {
          ...task,
          dueDate: task.taskType === 'task' ? newDate : task.dueDate,
          startDate: task.taskType === 'meeting' ? newDate : task.startDate,
          date: task.taskType === 'meeting' ? newDate : task.date,
          // Ensure these required fields are present
          id: task.id,
          project_id: task.project_id,
          title: task.title,
          status: task.status,
          taskType: task.taskType,
          owner_id: task.owner_id,
          created_at: task.created_at,
          assignees: task.assignees || [],
          dependencies: task.dependencies || [],
          comments: task.comments || []
        };
        
        console.log('Sending update with task:', updatedTask);
        const result = await updateTask(updatedTask);
        console.log('Update result:', result);
        
        if (!result) {
          throw new Error('Failed to update task - no result returned');
        }
        
        // Force a re-render
        setCurrentWeekStart(prev => new Date(prev));
        toast.success('Task updated successfully');
      } catch (error) {
        console.error('Failed to update task date:', error);
        toast.error('Failed to update task date. Please try again.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium text-lg">
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

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-7 gap-0.5">
          {/* Day headers */}
          {weekDays.map((day, i) => (
            <div 
              key={i} 
              className={cn(
                "text-center py-2 px-1 border-b bg-card",
                isSameDay(day, new Date()) && "border-primary/50 bg-primary/5"
              )}
            >
              <div className="font-medium text-sm">{format(day, 'EEE')}</div>
              <div className="text-xs text-muted-foreground">{format(day, 'MMM d')}</div>
            </div>
          ))}
          
          {/* Task cells for each day */}
          {weekDays.map((day, i) => (
            <Droppable key={`${format(day, 'yyyy-MM-dd')}-${i}`} droppableId={`${format(day, 'yyyy-MM-dd')}-${i}`}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "min-h-[400px] border-r last:border-r-0 p-1 transition-colors",
                    snapshot.isDraggingOver && "bg-muted/30",
                    isSameDay(day, new Date()) && "bg-primary/5"
                  )}
                  style={{
                    maxHeight: 'calc(100vh - 200px)',
                    overflowY: 'auto'
                  }}
                >
                  {getTasksForDay(day).map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={cn(
                            "mb-1 p-2 bg-card border rounded cursor-pointer group relative",
                            "hover:shadow-sm transition-all duration-200",
                            task.taskType === 'meeting' ? 'border-l-[3px] border-l-blue-500' : 'border-l-[3px] border-l-green-500',
                            snapshot.isDragging && "shadow rotate-1 scale-102"
                          )}
                          onClick={() => navigate(`/tasks/${task.id}`)}
                        >
                          {/* Title and Type Badge Row */}
                          <div className="flex items-start justify-between mb-1.5">
                            <span className="font-medium text-sm leading-tight line-clamp-2 pr-16">{task.title}</span>
                            <Badge 
                              variant={
                                task.priority === 'high' ? 'destructive' : 
                                task.priority === 'medium' ? 'default' : 'secondary'
                              }
                              className="absolute top-2 right-2 text-[10px] px-1 py-0"
                            >
                              {task.priority}
                            </Badge>
                          </div>

                          {/* Task Type Badge */}
                          <div className="flex items-center gap-1 mb-1.5">
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-[10px] px-1 py-0",
                                task.taskType === 'meeting' ? 'text-blue-600 border-blue-200 bg-blue-50' : 'text-green-600 border-green-200 bg-green-50'
                              )}
                            >
                              {task.taskType === 'meeting' ? 'Meeting' : 'Task'}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {task.status}
                            </span>
                          </div>

                          {/* Time and Project Row */}
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1">
                            {task.time && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{task.time}</span>
                              </div>
                            )}
                            {task.project && (
                              <div className="flex items-center gap-1 max-w-[120px]">
                                <CalendarIcon className="h-3 w-3 shrink-0" />
                                <span className="truncate">{task.project.name}</span>
                              </div>
                            )}
                          </div>

                          {/* Description - Show on hover */}
                          {task.description && (
                            <p className="hidden group-hover:block text-[10px] text-muted-foreground mb-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          {/* Assignees */}
                          {task.assignees && task.assignees.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {task.assignees.map(assignee => (
                                <span 
                                  key={assignee.id} 
                                  className="inline-block bg-muted/50 text-[10px] px-1.5 py-0.5 rounded"
                                  title={assignee.name || assignee.email}
                                >
                                  {(assignee.name || assignee.email).split(' ')[0]}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-6 text-xs mt-1"
                    onClick={() => {
                      const newSelectedDate = format(day, 'yyyy-MM-dd');
                      console.log('Adding new task for date:', newSelectedDate);
                      setSelectedDate(newSelectedDate);
                      setEditingTask(null);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
      
      {isDialogOpen && (
        <TaskDialog 
          isOpen={isDialogOpen} 
          onClose={handleCloseDialog} 
          editingTask={editingTask}
          onSave={handleTaskSaved}
          initialDate={selectedDate ? parseISO(selectedDate) : undefined}
        />
      )}
    </div>
  );
}
