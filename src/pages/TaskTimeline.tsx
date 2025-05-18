import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format, startOfWeek, endOfWeek, addDays, subDays, subWeeks, addWeeks, parseISO, isToday, getDay, isWithinInterval } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  Filter,
  ArrowDown,
  ArrowUp,
  ListFilter,
  Clock
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
import { Checkbox } from "@/components/ui/checkbox";
import { TaskEventDialog } from '@/components/timeline/TaskEventDialog';
import { Task, ViewMode } from '@/types/task';
import { useTaskContext } from '@/contexts/TaskContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(parseISO('2025-05-20')));
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [filterProject, setFilterProject] = useState<string | null>(null);
  const [filterUser, setFilterUser] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);
  
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
  
  // Generate days based on view mode
  const getDaysForView = () => {
    switch(viewMode) {
      case 'day':
        return [currentWeekStart];
      case 'week':
        return Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));
      case 'month':
        // Show 4 weeks for month view
        return Array.from({ length: 28 }).map((_, i) => addDays(currentWeekStart, i));
      case 'quarter':
        // Show 12 weeks for quarter view (simplified)
        return Array.from({ length: 12 }).map((_, i) => addDays(currentWeekStart, i * 7));
      case 'year':
        // Show 12 months for year view (simplified)
        return Array.from({ length: 12 }).map((_, i) => addDays(currentWeekStart, i * 30));
      default:
        return Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));
    }
  };
  
  const days = getDaysForView();

  const navigatePrevious = () => {
    switch(viewMode) {
      case 'day':
        setCurrentWeekStart(subDays(currentWeekStart, 1));
        break;
      case 'week':
        setCurrentWeekStart(subWeeks(currentWeekStart, 1));
        break;
      case 'month':
        setCurrentWeekStart(subWeeks(currentWeekStart, 4));
        break;
      case 'quarter':
        setCurrentWeekStart(subWeeks(currentWeekStart, 12));
        break;
      case 'year':
        setCurrentWeekStart(subWeeks(currentWeekStart, 52));
        break;
    }
  };
  
  const navigateNext = () => {
    switch(viewMode) {
      case 'day':
        setCurrentWeekStart(addDays(currentWeekStart, 1));
        break;
      case 'week':
        setCurrentWeekStart(addWeeks(currentWeekStart, 1));
        break;
      case 'month':
        setCurrentWeekStart(addWeeks(currentWeekStart, 4));
        break;
      case 'quarter':
        setCurrentWeekStart(addWeeks(currentWeekStart, 12));
        break;
      case 'year':
        setCurrentWeekStart(addWeeks(currentWeekStart, 52));
        break;
    }
  };
  
  const formatWeekDay = (date: Date) => {
    return format(date, 'EEE', { locale });
  };
  
  const formatDate = (date: Date) => {
    return format(date, 'MMM d', { locale });
  };

  const formatDateRange = () => {
    switch(viewMode) {
      case 'day':
        return format(currentWeekStart, 'MMMM d, yyyy', { locale });
      case 'week':
        return `${format(currentWeekStart, 'MMM d', { locale })} - ${format(addDays(currentWeekStart, 6), 'MMM d', { locale })}`;
      case 'month':
        return `${format(currentWeekStart, 'MMM d', { locale })} - ${format(addDays(currentWeekStart, 27), 'MMM d', { locale })}`;
      case 'quarter':
        return `${format(currentWeekStart, 'MMM d', { locale })} - ${format(addDays(currentWeekStart, 83), 'MMM d', { locale })}`;
      case 'year':
        return format(currentWeekStart, 'yyyy', { locale });
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
    setCurrentWeekStart(startOfWeek(new Date()));
    toast.success('Navigated to current week');
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
        
        {viewMode === 'week' && (
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
        )}

        {viewMode !== 'week' && (
          <div className="border rounded-md p-4 text-center">
            <p className="text-muted-foreground">{t('viewModeInDevelopment', { ns: 'tasks' })}</p>
            <p className="text-sm text-muted-foreground mt-2">{t('switchToWeek', { ns: 'tasks' })}</p>
          </div>
        )}
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
