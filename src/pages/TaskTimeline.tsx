import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  format, startOfWeek, endOfWeek, addDays, subDays, subWeeks, addWeeks, 
  parseISO, isToday, getDay, isWithinInterval, startOfMonth, endOfMonth,
  addMonths, subMonths, startOfYear, endOfYear, addYears, subYears,
  startOfQuarter, endOfQuarter, addQuarters, subQuarters, differenceInDays,
  eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, eachQuarterOfInterval
} from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Filter,
  ArrowDown,
  ArrowUp,
  ListFilter,
  Clock,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { TaskEventDialog } from '@/components/timeline/TaskEventDialog';
import { Task, ViewMode } from '@/types/task';
import { useTaskContext } from '@/contexts/tasks/TaskContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar } from "@/components/ui/calendar";
import { toast } from 'sonner';

// Custom color mapping based on project
const projectColors: Record<string, string> = {
  'Website Redesign': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'Mobile App Development': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  'Marketing Campaign': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'All Projects': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

const TaskTimeline = () => {
  const { t, i18n } = useTranslation(['common', 'tasks']);
  const locale = i18n.language === 'es' ? es : enUS;
  const { tasks, updateTask, addTask, deleteTask } = useTaskContext();
  
  // Use a specific date for the demo so it matches our mock data
  const [currentDate, setCurrentDate] = useState<Date>(parseISO('2025-05-20'));
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [filterProject, setFilterProject] = useState<string | null>(null);
  const [filterUser, setFilterUser] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);
  const [date, setDate] = useState<Date>(new Date());
  
  // Get the current range start date based on viewMode
  const getCurrentRangeStart = () => {
    switch(viewMode) {
      case 'day':
        return currentDate;
      case 'week':
        return startOfWeek(currentDate);
      case 'month': 
        return startOfMonth(currentDate);
      case 'quarter':
        return startOfQuarter(currentDate);
      case 'year':
        return startOfYear(currentDate);
      default:
        return startOfWeek(currentDate);
    }
  };
  
  // Use effect to handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Add task with "a" key
      if (e.key === 'a' && !isDialogOpen) {
        e.preventDefault();
        handleAddTask();
      }
      
      // Navigate with arrow keys
      if (e.key === 'ArrowLeft' && e.altKey) {
        e.preventDefault();
        navigatePrevious();
      }
      
      if (e.key === 'ArrowRight' && e.altKey) {
        e.preventDefault();
        navigateNext();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDialogOpen]);
  
  // Generate the days, weeks, months, or years based on view mode
  const getDaysForView = () => {
    const rangeStart = getCurrentRangeStart();
    
    switch(viewMode) {
      case 'day':
        return [rangeStart]; // Just the current day
      
      case 'week':
        return Array.from({ length: 7 }).map((_, i) => addDays(rangeStart, i));
      
      case 'month':
        // Get all days of the current month
        return eachDayOfInterval({
          start: startOfMonth(rangeStart),
          end: endOfMonth(rangeStart)
        });
      
      case 'quarter':
        // Get all weeks in the quarter
        return eachWeekOfInterval({
          start: startOfQuarter(rangeStart),
          end: endOfQuarter(rangeStart)
        });
      
      case 'year':
        // Get all months in the year
        return eachMonthOfInterval({
          start: startOfYear(rangeStart),
          end: endOfYear(rangeStart)
        });
      
      default:
        return Array.from({ length: 7 }).map((_, i) => addDays(rangeStart, i));
    }
  };

  // Navigate to previous period based on view mode
  const navigatePrevious = () => {
    switch(viewMode) {
      case 'day':
        setCurrentDate(subDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case 'month':
        setCurrentDate(subMonths(currentDate, 1));
        break;
      case 'quarter':
        setCurrentDate(subQuarters(currentDate, 1));
        break;
      case 'year':
        setCurrentDate(subYears(currentDate, 1));
        break;
    }
  };
  
  // Navigate to next period based on view mode
  const navigateNext = () => {
    switch(viewMode) {
      case 'day':
        setCurrentDate(addDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case 'month':
        setCurrentDate(addMonths(currentDate, 1));
        break;
      case 'quarter':
        setCurrentDate(addQuarters(currentDate, 1));
        break;
      case 'year':
        setCurrentDate(addYears(currentDate, 1));
        break;
    }
  };
  
  const formatWeekDay = (date: Date) => {
    return format(date, 'EEE', { locale });
  };
  
  const formatDate = (date: Date) => {
    return format(date, viewMode === 'year' ? 'MMM' : 'MMM d', { locale });
  };

  const formatDateRange = () => {
    switch(viewMode) {
      case 'day':
        return format(currentDate, 'MMMM d, yyyy', { locale });
      case 'week': {
        const weekStart = startOfWeek(currentDate);
        return `${format(weekStart, 'MMM d', { locale })} - ${format(addDays(weekStart, 6), 'MMM d, yyyy', { locale })}`;
      }
      case 'month':
        return format(currentDate, 'MMMM yyyy', { locale });
      case 'quarter': {
        const quarterStart = startOfQuarter(currentDate);
        return `${format(quarterStart, 'MMM d', { locale })} - ${format(endOfQuarter(quarterStart), 'MMM d, yyyy', { locale })}`;
      }
      case 'year':
        return format(currentDate, 'yyyy', { locale });
    }
  };

  // Enhanced filtering with multiple options
  const filteredTasks = tasks.filter(task => {
    let matchesProject = true;
    let matchesUser = true;
    let matchesStatus = true;
    
    if (filterProject) {
      matchesProject = task.project === filterProject;
    }
    
    if (filterUser) {
      matchesUser = task.assignees && task.assignees.includes(filterUser);
    }
    
    if (!showCompleted) {
      matchesStatus = task.status !== 'completed' && task.status !== 'done';
    }
    
    return matchesProject && matchesUser && matchesStatus;
  });

  // Get tasks for a specific day with time sorting
  const getTasksForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const tasksForDay = filteredTasks.filter(task => task.date === dateStr);
    
    // Sort tasks by time
    return tasksForDay.sort((a, b) => {
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });
  };
  
  // Get tasks for a specific week, month, quarter or year
  const getTasksForPeriod = (startDate: Date, endDate: Date) => {
    const tasksInPeriod = filteredTasks.filter(task => {
      if (!task.date) return false;
      const taskDate = parseISO(task.date as string);
      return isWithinInterval(taskDate, { start: startDate, end: endDate });
    });
    
    // Sort by date and time
    return tasksInPeriod.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      const dateComparison = a.date.localeCompare(b.date);
      if (dateComparison !== 0) return dateComparison;
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });
  };

  // Handle recurring tasks
  const handleRecurringTaskUpdate = (task: Task) => {
    if (!task.recurrence) return;
    
    // Create next occurrence based on recurrence pattern
    const taskDate = parseISO(task.date as string);
    let nextDate: Date;
    
    switch (task.recurrence) {
      case 'daily':
        nextDate = addDays(taskDate, 1);
        break;
      case 'weekly':
        nextDate = addDays(taskDate, 7);
        break;
      case 'monthly':
        // Approximate a month as 30 days
        nextDate = addDays(taskDate, 30);
        break;
      case 'quarterly':
        // Approximate a quarter as 90 days
        nextDate = addDays(taskDate, 90);
        break;
      case 'yearly':
        // Approximate a year as 365 days
        nextDate = addDays(taskDate, 365);
        break;
      default:
        return;
    }
    
    // Create new task for next occurrence
    const newTask: Task = {
      ...task,
      id: `${task.id}-${format(nextDate, 'yyyyMMdd')}`,
      date: format(nextDate, 'yyyy-MM-dd'),
      status: 'todo'
    };
    
    addTask(newTask);
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setIsDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const handleSaveTask = (task: Task) => {
    if (task.id && tasks.some(t => t.id === task.id)) {
      updateTask(task);
      
      // If task is marked as completed and it's recurring, create next occurrence
      if ((task.status === 'completed' || task.status === 'done') && task.recurrence) {
        handleRecurringTaskUpdate(task);
        toast.success('Task completed! Next occurrence has been scheduled.');
      }
    } else {
      addTask(task);
    }
    setIsDialogOpen(false);
  };
  
  const handleDeleteTask = (task: Task) => {
    deleteTask(task.id);
    toast.success('Task deleted successfully');
  };

  const getTaskColor = (task: Task) => {
    // Use custom color if defined
    if (task.color) return task.color;
    
    // Otherwise use project color
    return projectColors[task.project || ''] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  // Function to determine if the time slot has overlap with other tasks
  const hasTaskOverlap = (date: Date, task: Task) => {
    if (!task.time || !task.duration) return false;
    
    const taskStart = task.time;
    const [taskHour, taskMinute] = taskStart.split(':').map(Number);
    
    // Check all tasks for this day
    const tasksForDay = getTasksForDay(date).filter(t => t.id !== task.id);
    
    return tasksForDay.some(otherTask => {
      if (!otherTask.time || !otherTask.duration) return false;
      
      const otherStart = otherTask.time;
      const [otherHour, otherMinute] = otherStart.split(':').map(Number);
      
      // Convert times to minutes for easier comparison
      const taskStartMinutes = taskHour * 60 + taskMinute;
      const taskEndMinutes = taskStartMinutes + (task.duration || 0);
      
      const otherStartMinutes = otherHour * 60 + otherMinute;
      const otherEndMinutes = otherStartMinutes + (otherTask.duration || 0);
      
      // Check for overlap
      return (
        (taskStartMinutes >= otherStartMinutes && taskStartMinutes < otherEndMinutes) || 
        (taskEndMinutes > otherStartMinutes && taskEndMinutes <= otherEndMinutes) ||
        (taskStartMinutes <= otherStartMinutes && taskEndMinutes >= otherEndMinutes)
      );
    });
  };

  // Jump to today
  const goToToday = () => {
    setCurrentDate(new Date());
    toast.success('Navigated to current date');
  };
  
  // Jump to a specific date from calendar picker
  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setCurrentDate(selectedDate);
      setDate(selectedDate);
    }
  };

  // Render the day view
  const renderDayView = () => {
    const tasksForTheDay = getTasksForDay(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return (
      <div className="border rounded-md overflow-hidden">
        <div className="bg-muted p-4 font-medium text-center border-b">
          {format(currentDate, 'EEEE, MMMM d, yyyy', { locale })}
          {isToday(currentDate) && (
            <Badge className="ml-2 bg-primary">
              {t('today', { ns: 'tasks' })}
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-1 divide-y">
          {hours.map((hour) => {
            // Filter tasks that start at this hour
            const tasksAtHour = tasksForTheDay.filter(
              task => task.time && parseInt(task.time.split(':')[0]) === hour
            );
            
            return (
              <div key={hour} className="group min-h-[60px] relative hover:bg-muted/30">
                <div className="absolute left-0 top-0 w-16 py-1 px-2 text-xs text-muted-foreground border-r">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </div>
                
                <div className="pl-16 p-1">
                  {tasksAtHour.map(task => (
                    <TooltipProvider key={task.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Card 
                            className={`p-2 text-sm hover:shadow-md transition-shadow cursor-pointer mb-1 border-l-4 ${
                              task.status === 'completed' || task.status === 'done' ? 'opacity-70' : ''
                            }`}
                            style={{ 
                              borderLeftColor: task.color || 'var(--primary)',
                              minHeight: `${task.duration ? task.duration / 3 : 20}px`,
                              maxHeight: `${task.duration ? Math.min(task.duration, 180) : 60}px`
                            }}
                            onClick={() => handleEditTask(task)}
                          >
                            <div className="font-medium">{task.title}</div>
                            <div className="text-xs text-muted-foreground flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {task.time} ({task.duration}m)
                            </div>
                            <Badge className={`mt-1 ${projectColors[task.project || ''] || ''}`}>
                              {task.project}
                            </Badge>
                            
                            {task.recurrence && (
                              <Badge variant="outline" className="ml-1 mt-1">
                                {task.recurrence}
                              </Badge>
                            )}
                            
                            {(task.status === 'completed' || task.status === 'done') && (
                              <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 ml-1 mt-1">
                                {t('completed', { ns: 'tasks' })}
                              </Badge>
                            )}
                          </Card>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{task.title}</p>
                          <p className="text-xs">{task.time} - {task.description || t('noDescription', { ns: 'tasks' })}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
                
                {/* Quick add button for this hour */}
                <Button 
                  size="icon"
                  variant="ghost"
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100"
                  onClick={() => {
                    const hourFormatted = hour.toString().padStart(2, '0');
                    setEditingTask({
                      id: '',
                      title: '',
                      status: 'todo',
                      assignees: [],
                      date: format(currentDate, 'yyyy-MM-dd'),
                      time: `${hourFormatted}:00`,
                      duration: 60
                    });
                    setIsDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // Render the week view 
  const renderWeekView = () => {
    const days = getDaysForView();
    
    return (
      <div className="grid grid-cols-7 gap-4">
        {days.map((day, index) => {
          const isCurrentDay = isToday(day);
          const tasksForDay = getTasksForDay(day);
          const isWeekend = getDay(day) === 0 || getDay(day) === 6; // Sunday or Saturday
          
          return (
            <div key={index} className={`flex flex-col space-y-1 ${isWeekend ? 'bg-muted/30' : ''}`}>
              <div className={`text-center p-2 ${isCurrentDay ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-t-md`}>
                <div className="font-medium">{formatWeekDay(day)}</div>
                <div className="text-sm">{formatDate(day)}</div>
              </div>
              
              <div className="bg-card border rounded-b-md flex-1 p-2 space-y-2 min-h-[300px] relative">
                {/* Quick add button on hover */}
                <Button 
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 hover:opacity-100"
                  onClick={() => {
                    setEditingTask({
                      id: '',
                      title: '',
                      status: 'todo',
                      assignees: [],
                      date: format(day, 'yyyy-MM-dd')
                    });
                    setIsDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                
                {tasksForDay.map(task => (
                  <TooltipProvider key={task.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Card 
                          key={task.id} 
                          className={`p-3 text-sm hover:shadow-md transition-shadow cursor-pointer relative border-l-4 ${
                            task.status === 'completed' || task.status === 'done' ? 'opacity-70' : ''
                          }`}
                          style={{ borderLeftColor: task.color || 'var(--primary)' }}
                          onClick={() => handleEditTask(task)}
                        >
                          <div className="font-medium">{task.title}</div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {task.time} ({task.duration}m)
                          </div>
                          <Badge className={`mt-2 ${projectColors[task.project || ''] || ''}`}>
                            {task.project}
                          </Badge>
                          
                          {task.recurrence && (
                            <Badge variant="outline" className="ml-1 mt-2">
                              {task.recurrence}
                            </Badge>
                          )}
                          
                          {task.assignees.length > 0 && (
                            <div className="mt-2 flex -space-x-2">
                              {task.assignees.map((assignee, idx) => (
                                <Avatar key={idx} className="h-6 w-6 border-2 border-background">
                                  <AvatarFallback className="text-xs">
                                    {assignee.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                          )}
                          
                          {hasTaskOverlap(day, task) && (
                            <div className="absolute top-1 right-1">
                              <Badge variant="destructive" className="text-xs px-1.5">!</Badge>
                            </div>
                          )}
                          
                          {(task.status === 'completed' || task.status === 'done') && (
                            <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-sm">
                              <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                {t('completed', { ns: 'tasks' })}
                              </Badge>
                            </div>
                          )}
                        </Card>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-xs">{task.time} - {task.description || t('noDescription', { ns: 'tasks' })}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
                
                {tasksForDay.length === 0 && (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                    <div className="text-center">
                      <Calendar className="h-5 w-5 mx-auto mb-1 opacity-50" />
                      {t('noTasksScheduled', { ns: 'tasks' })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  // Render the month view
  const renderMonthView = () => {
    const days = getDaysForView();
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    // Calculate how many days to show in each row (typically 7)
    const daysPerRow = 7;
    const rows = Math.ceil(days.length / daysPerRow);
    
    return (
      <div className="border rounded-md">
        <div className="grid grid-cols-7 bg-muted p-2 text-center text-xs font-medium border-b">
          <div>{format(startOfWeek(currentDate), 'EEE', { locale })}</div>
          <div>{format(addDays(startOfWeek(currentDate), 1), 'EEE', { locale })}</div>
          <div>{format(addDays(startOfWeek(currentDate), 2), 'EEE', { locale })}</div>
          <div>{format(addDays(startOfWeek(currentDate), 3), 'EEE', { locale })}</div>
          <div>{format(addDays(startOfWeek(currentDate), 4), 'EEE', { locale })}</div>
          <div>{format(addDays(startOfWeek(currentDate), 5), 'EEE', { locale })}</div>
          <div>{format(addDays(startOfWeek(currentDate), 6), 'EEE', { locale })}</div>
        </div>
        
        <div className="divide-y">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-7 divide-x min-h-[120px]">
              {Array.from({ length: daysPerRow }).map((_, colIndex) => {
                const dayIndex = rowIndex * daysPerRow + colIndex;
                if (dayIndex >= days.length) return <div key={colIndex} className="p-1"></div>;
                
                const day = days[dayIndex];
                const tasksForDay = getTasksForDay(day);
                const isOutsideMonth = day < monthStart || day > monthEnd;
                const isCurrentDay = isToday(day);
                const isWeekend = getDay(day) === 0 || getDay(day) === 6; // Sunday or Saturday
                
                return (
                  <div
                    key={colIndex}
                    className={`p-1 group relative ${
                      isOutsideMonth ? 'bg-muted/50 text-muted-foreground' : ''
                    } ${isCurrentDay ? 'bg-primary/10' : ''} ${
                      isWeekend && !isOutsideMonth ? 'bg-muted/30' : ''
                    }`}
                  >
                    <div className={`text-right mb-1 p-1 rounded-full w-6 h-6 flex items-center justify-center ml-auto ${
                      isCurrentDay ? 'bg-primary text-primary-foreground' : ''
                    }`}>
                      {format(day, 'd')}
                    </div>
                    
                    <div className="space-y-1 max-h-[95px] overflow-auto">
                      {tasksForDay.slice(0, 3).map(task => (
                        <div 
                          key={task.id}
                          className={`text-xs p-1 truncate rounded cursor-pointer hover:bg-muted border-l-2 ${
                            task.status === 'completed' || task.status === 'done' ? 'opacity-70' : ''
                          }`}
                          style={{ borderLeftColor: task.color || 'var(--primary)' }}
                          onClick={() => handleEditTask(task)}
                        >
                          {task.time && <span className="mr-1 text-muted-foreground">{task.time.substring(0, 5)}</span>}
                          {task.title}
                        </div>
                      ))}
                      
                      {tasksForDay.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{tasksForDay.length - 3} more
                        </div>
                      )}
                    </div>
                    
                    {/* Quick add button */}
                    <Button 
                      size="icon"
                      variant="ghost"
                      className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 h-5 w-5"
                      onClick={() => {
                        setEditingTask({
                          id: '',
                          title: '',
                          status: 'todo',
                          assignees: [],
                          date: format(day, 'yyyy-MM-dd')
                        });
                        setIsDialogOpen(true);
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Render the quarter view
  const renderQuarterView = () => {
    const weeks = getDaysForView(); // These are actually week start dates
    const quarterStart = startOfQuarter(currentDate);
    const quarterEnd = endOfQuarter(currentDate);
    
    // Get all tasks within this quarter
    const tasksInQuarter = getTasksForPeriod(quarterStart, quarterEnd);
    
    return (
      <div className="space-y-6">
        <div className="text-xl font-medium">
          {t('quarter', { ns: 'tasks' })} {format(quarterStart, 'Q yyyy', { locale })}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Month summary cards */}
          {eachMonthOfInterval({ start: quarterStart, end: quarterEnd }).map((month, idx) => {
            const monthStart = startOfMonth(month);
            const monthEnd = endOfMonth(month);
            const tasksInMonth = getTasksForPeriod(monthStart, monthEnd);
            
            // Group tasks by status
            const completedTasks = tasksInMonth.filter(t => t.status === 'completed' || t.status === 'done');
            const progressTasks = tasksInMonth.filter(t => t.status === 'in-progress' || t.status === 'review');
            const todoTasks = tasksInMonth.filter(t => t.status === 'todo');
            
            return (
              <Card key={idx} className="overflow-hidden">
                <div className="bg-muted p-4 border-b">
                  <h3 className="font-medium">{format(month, 'MMMM yyyy', { locale })}</h3>
                </div>
                <div className="p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t('totalTasks', { ns: 'tasks' })}:</span>
                    <Badge variant="outline">{tasksInMonth.length}</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">{t('completed', { ns: 'tasks' })}:</span>
                      <Badge variant="outline" className="bg-green-100 text-green-800">{completedTasks.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">{t('inProgress', { ns: 'tasks' })}:</span>
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">{progressTasks.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">{t('todo', { ns: 'tasks' })}:</span>
                      <Badge variant="outline" className="bg-gray-100 text-gray-800">{todoTasks.length}</Badge>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setCurrentDate(month);
                      setViewMode('month');
                    }}
                  >
                    {t('viewMonth', { ns: 'tasks' })}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
        
        <div className="border rounded-md">
          <div className="bg-muted p-4 border-b flex justify-between items-center">
            <h3 className="font-medium">{t('upcomingTasks', { ns: 'tasks' })}</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setEditingTask({
                  id: '',
                  title: '',
                  status: 'todo',
                  assignees: [],
                  date: format(new Date(), 'yyyy-MM-dd')
                });
                setIsDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('addTask', { ns: 'tasks' })}
            </Button>
          </div>
          
          <div className="divide-y">
            {tasksInQuarter.slice(0, 10).map(task => (
              <div 
                key={task.id} 
                className="p-3 flex justify-between items-center hover:bg-muted/30 cursor-pointer"
                onClick={() => handleEditTask(task)}
              >
                <div>
                  <div className="font-medium">{task.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {task.date && format(parseISO(task.date as string), 'MMM d, yyyy')}
                    {task.time && ` • ${task.time}`}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge className={projectColors[task.project || ''] || ''}>
                    {task.project}
                  </Badge>
                  
                  {(task.status === 'completed' || task.status === 'done') && (
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      {t('completed', { ns: 'tasks' })}
                    </Badge>
                  )}
                  
                  {task.status === 'in-progress' && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                      {t('inProgress', { ns: 'tasks' })}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            
            {tasksInQuarter.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{t('noTasksInQuarter', { ns: 'tasks' })}</p>
              </div>
            )}
            
            {tasksInQuarter.length > 10 && (
              <div className="p-3 text-center">
                <Button 
                  variant="link"
                  onClick={() => {
                    toast.info(`${tasksInQuarter.length - 10} ${t('moreTasks', { ns: 'tasks' })}`);
                  }}
                >
                  {t('viewMore', { ns: 'tasks' })} ({tasksInQuarter.length - 10})
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Render the year view
  const renderYearView = () => {
    const months = getDaysForView(); // These are actually month start dates
    const yearStart = startOfYear(currentDate);
    const yearEnd = endOfYear(currentDate);
    
    return (
      <div className="space-y-6">
        <div className="text-xl font-medium">
          {format(yearStart, 'yyyy', { locale })}
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {months.map((month, idx) => {
            const monthStart = startOfMonth(month);
            const monthEnd = endOfMonth(month);
            const tasksInMonth = getTasksForPeriod(monthStart, monthEnd);
            
            // Calculate task completion percentage
            const totalTasks = tasksInMonth.length;
            const completedTasks = tasksInMonth.filter(t => 
              t.status === 'completed' || t.status === 'done'
            ).length;
            const completionPercentage = totalTasks > 0 
              ? Math.round((completedTasks / totalTasks) * 100) 
              : 0;
            
            return (
              <Card 
                key={idx} 
                className={`overflow-hidden hover:ring-1 hover:ring-primary cursor-pointer`}
                onClick={() => {
                  setCurrentDate(month);
                  setViewMode('month');
                }}
              >
                <div className={`p-3 font-medium ${
                  format(new Date(), 'MMM yyyy') === format(month, 'MMM yyyy')
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}>
                  {format(month, 'MMMM', { locale })}
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t('tasks', { ns: 'tasks' })}:</span>
                    <span>{totalTasks}</span>
                  </div>
                  
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-full rounded-full" 
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                  
                  <div className="text-xs text-right text-muted-foreground">
                    {completionPercentage}% {t('completed', { ns: 'tasks' })}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        
        {/* Project summary section */}
        <Card>
          <div className="bg-muted p-4 border-b">
            <h3 className="font-medium">{t('projectSummary', { ns: 'tasks' })}</h3>
          </div>
          
          <div className="p-4">
            <Tabs defaultValue="completion">
              <TabsList className="mb-4">
                <TabsTrigger value="completion">{t('completion', { ns: 'tasks' })}</TabsTrigger>
                <TabsTrigger value="distribution">{t('distribution', { ns: 'tasks' })}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="completion">
                <div className="space-y-4">
                  {['Website Redesign', 'Mobile App Development', 'Marketing Campaign'].map((project, idx) => {
                    const projectTasks = tasks.filter(t => t.project === project && t.date);
                    const tasksInYear = projectTasks.filter(t => {
                      if (!t.date) return false;
                      const taskDate = parseISO(t.date as string);
                      return isWithinInterval(taskDate, { start: yearStart, end: yearEnd });
                    });
                    
                    // Calculate task completion percentage
                    const totalTasks = tasksInYear.length;
                    const completedTasks = tasksInYear.filter(t => 
                      t.status === 'completed' || t.status === 'done'
                    ).length;
                    const completionPercentage = totalTasks > 0 
                      ? Math.round((completedTasks / totalTasks) * 100) 
                      : 0;
                    
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{project}</span>
                          <span>{completedTasks}/{totalTasks} {t('tasks', { ns: 'tasks' })}</span>
                        </div>
                        
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className={idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-purple-500' : 'bg-green-500'}
                            style={{ width: `${completionPercentage}%`, height: '100%', borderRadius: '9999px' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
              
              <TabsContent value="distribution">
                <div className="space-y-6 py-4">
                  <div className="flex justify-around">
                    {['Website Redesign', 'Mobile App Development', 'Marketing Campaign'].map((project, idx) => {
                      const projectTasks = tasks.filter(t => t.project === project && t.date);
                      const tasksInYear = projectTasks.filter(t => {
                        if (!t.date) return false;
                        const taskDate = parseISO(t.date as string);
                        return isWithinInterval(taskDate, { start: yearStart, end: yearEnd });
                      });
                      
                      return (
                        <div key={idx} className="text-center">
                          <div className="text-3xl font-bold">{tasksInYear.length}</div>
                          <div className="text-sm text-muted-foreground mt-1">{project}</div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="text-center text-sm mt-4">
                    <p className="text-muted-foreground">
                      {t('totalTasksYear', { count: tasks.filter(t => {
                        if (!t.date) return false;
                        const taskDate = parseISO(t.date as string);
                        return isWithinInterval(taskDate, { start: yearStart, end: yearEnd });
                      }).length, ns: 'tasks' })}
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className={`space-y-6 ${isFullScreen ? 'fixed inset-0 z-50 bg-background p-6 overflow-auto' : ''}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('timeline')}</h1>
            <p className="text-muted-foreground mt-2">
              {t('scheduleOverview', { ns: 'tasks' })}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={navigatePrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="font-medium whitespace-nowrap">
              {formatDateRange()}
            </div>
            <Button variant="outline" size="icon" onClick={navigateNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button onClick={handleAddTask}>
              <Plus className="h-4 w-4 mr-2" />
              {t('addTask', { ns: 'tasks' })}
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t('selectViewMode', { ns: 'tasks' })} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">{t('dayView', { ns: 'tasks' })}</SelectItem>
              <SelectItem value="week">{t('weekView', { ns: 'tasks' })}</SelectItem>
              <SelectItem value="month">{t('monthView', { ns: 'tasks' })}</SelectItem>
              <SelectItem value="quarter">{t('quarterView', { ns: 'tasks' })}</SelectItem>
              <SelectItem value="year">{t('yearView', { ns: 'tasks' })}</SelectItem>
            </SelectContent>
          </Select>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                {t('filters', { ns: 'tasks' })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">{t('filterByProject', { ns: 'tasks' })}</h4>
                <div className="space-y-2">
                  {['Website Redesign', 'Mobile App Development', 'Marketing Campaign', 'All Projects'].map((project) => (
                    <div key={project} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`project-${project}`} 
                        checked={filterProject === project}
                        onCheckedChange={() => setFilterProject(filterProject === project ? null : project)}
                      />
                      <label htmlFor={`project-${project}`} className="text-sm">
                        {project}
                      </label>
                    </div>
                  ))}
                </div>
                
                <h4 className="font-medium">{t('filterByUser', { ns: 'tasks' })}</h4>
                <div className="space-y-2">
                  {['Admin User', 'Regular User', 'Project Manager', 'Developer 1', 'Designer 1'].map((user) => (
                    <div key={user} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`user-${user}`} 
                        checked={filterUser === user}
                        onCheckedChange={() => setFilterUser(filterUser === user ? null : user)}
                      />
                      <label htmlFor={`user-${user}`} className="text-sm flex items-center">
                        <Avatar className="h-5 w-5 mr-1">
                          <AvatarFallback className="text-xs">
                            {user.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {user}
                      </label>
                    </div>
                  ))}
                </div>
                
                <h4 className="font-medium">{t('taskStatus', { ns: 'tasks' })}</h4>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="show-completed" 
                    checked={showCompleted}
                    onCheckedChange={(checked) => setShowCompleted(!!checked)}
                  />
                  <label htmlFor="show-completed" className="text-sm">
                    {t('showCompleted', { ns: 'tasks' })}
                  </label>
                </div>
                
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setFilterProject(null);
                      setFilterUser(null);
                      setShowCompleted(true);
                    }}
                  >
                    {t('clearAll', { ns: 'common' })}
                  </Button>
                  <Button size="sm">
                    {t('applyFilters', { ns: 'tasks' })}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="ml-2">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {t('selectDate', { ns: 'tasks' })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsFullScreen(!isFullScreen)}>
              {isFullScreen ? t('exitFullScreen', { ns: 'common' }) : t('fullScreen', { ns: 'common' })}
            </Button>
            <Button variant="outline" size="sm">
              <ArrowDown className="h-4 w-4 mr-2" />
              {t('export', { ns: 'common' })}
            </Button>
            <Button variant="outline" size="sm">
              <ArrowUp className="h-4 w-4 mr-2" />
              {t('import', { ns: 'common' })}
            </Button>
            <Button variant="secondary" size="sm" onClick={goToToday}>
              {t('today', { ns: 'tasks' })}
            </Button>
          </div>
        </div>
        
        <div className="bg-muted p-2 rounded-md text-sm text-muted-foreground">
          <p><kbd className="px-2 py-1 bg-background rounded border">a</kbd> {t('addNewTask', { ns: 'tasks' })} | 
          <kbd className="px-2 py-1 bg-background rounded border ml-2">Alt+←</kbd> {t('previousPeriod', { ns: 'tasks' })} | 
          <kbd className="px-2 py-1 bg-background rounded border ml-2">Alt+→</kbd> {t('nextPeriod', { ns: 'tasks' })}</p>
        </div>
        
        {/* Render the appropriate view based on viewMode */}
        {viewMode === 'day' && renderDayView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'quarter' && renderQuarterView()}
        {viewMode === 'year' && renderYearView()}
      </div>

      <TaskEventDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
      />
    </MainLayout>
  );
};

export default TaskTimeline;
