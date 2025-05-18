
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, startOfWeek, endOfWeek, addDays, subDays, subWeeks, addWeeks, parseISO } from 'date-fns';
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
  ArrowUp
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
import { TimelineTask, ViewMode } from '@/types/task';

// Enhanced mock data for the timeline
const mockTimelineTasks: TimelineTask[] = [
  {
    id: '1',
    title: 'Project kickoff meeting',
    project: 'Website Redesign',
    projectId: '1',
    date: '2025-05-20',
    time: '10:00',
    duration: 60,
    assignees: ['Admin User', 'Regular User'],
    description: 'Initial meeting to discuss project goals and timeline',
    comments: [
      { id: '1', author: 'Admin User', content: '@Regular User please prepare the requirements document', createdAt: new Date('2025-05-18') }
    ]
  },
  {
    id: '2',
    title: 'Design review',
    project: 'Mobile App Development',
    projectId: '2',
    date: '2025-05-21',
    time: '14:00',
    duration: 90,
    assignees: ['Regular User'],
    description: 'Review initial app designs and wireframes'
  },
  {
    id: '3',
    title: 'Backend planning',
    project: 'Website Redesign',
    projectId: '1',
    date: '2025-05-22',
    time: '11:00',
    duration: 120,
    assignees: ['Admin User', 'Project Manager'],
    description: 'Plan API endpoints and database schema'
  },
  {
    id: '4',
    title: 'Client status update',
    project: 'Marketing Campaign',
    projectId: '3',
    date: '2025-05-23',
    time: '15:30',
    duration: 30,
    assignees: ['Project Manager'],
    description: 'Weekly status report to the client'
  },
  {
    id: '5',
    title: 'Team weekly sync',
    project: 'All Projects',
    projectId: null,
    date: '2025-05-24',
    time: '09:00',
    duration: 45,
    assignees: ['Admin User', 'Regular User', 'Project Manager'],
    description: 'Weekly team synchronization meeting',
    recurrence: 'weekly'
  },
  {
    id: '6',
    title: 'Code review',
    project: 'Mobile App Development',
    projectId: '2',
    date: '2025-05-25',
    time: '13:00',
    duration: 60,
    assignees: ['Regular User', 'Developer 1'],
    description: 'Review pull requests and discuss improvements'
  },
  {
    id: '7',
    title: 'UI/UX Workshop',
    project: 'Website Redesign',
    projectId: '1',
    date: '2025-05-26',
    time: '10:00',
    duration: 180,
    assignees: ['Designer 1', 'Designer 2', 'Regular User'],
    description: 'Workshop to define UI components and user flows'
  },
  {
    id: '8',
    title: 'Monthly Planning',
    project: 'All Projects',
    projectId: null,
    date: '2025-06-01',
    time: '09:00',
    duration: 120,
    assignees: ['Admin User', 'Project Manager', 'Regular User'],
    description: 'Monthly planning session for all projects',
    recurrence: 'monthly'
  },
  {
    id: '9',
    title: 'Quarterly Review',
    project: 'All Projects',
    projectId: null,
    date: '2025-07-01',
    time: '14:00',
    duration: 180,
    assignees: ['Admin User', 'Project Manager', 'Regular User', 'Developer 1', 'Designer 1'],
    description: 'Quarterly review and planning for Q3',
    recurrence: 'quarterly'
  },
];

const priorityColors: Record<string, string> = {
  'Website Redesign': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'Mobile App Development': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  'Marketing Campaign': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'All Projects': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

const TaskTimeline = () => {
  const { t, i18n } = useTranslation(['common', 'tasks']);
  const locale = i18n.language === 'es' ? es : enUS;
  
  // Use a specific date for the demo so it matches our mock data
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(parseISO('2025-05-20')));
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [filterProject, setFilterProject] = useState<string | null>(null);
  const [filterUser, setFilterUser] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TimelineTask | null>(null);
  
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

  // Filter tasks based on selected filters
  const filteredTasks = mockTimelineTasks.filter(task => {
    let matchesProject = true;
    let matchesUser = true;
    
    if (filterProject) {
      matchesProject = task.project === filterProject;
    }
    
    if (filterUser) {
      matchesUser = task.assignees.includes(filterUser);
    }
    
    return matchesProject && matchesUser;
  });

  // Get tasks for a specific day
  const getTasksForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return filteredTasks.filter(task => task.date === dateStr);
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setIsDialogOpen(true);
  };

  const handleEditTask = (task: TimelineTask) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const handleSaveTask = (task: TimelineTask) => {
    // In a real application, this would update the task in the database
    console.log('Save task:', task);
    setIsDialogOpen(false);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
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
                
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setFilterProject(null);
                      setFilterUser(null);
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
            <Button variant="outline" size="sm">
              <ArrowDown className="h-4 w-4 mr-2" />
              {t('export', { ns: 'common' })}
            </Button>
            <Button variant="outline" size="sm">
              <ArrowUp className="h-4 w-4 mr-2" />
              {t('import', { ns: 'common' })}
            </Button>
            <Button variant="secondary" size="sm">
              {t('today', { ns: 'tasks' })}
            </Button>
          </div>
        </div>
        
        {viewMode === 'week' && (
          <div className="grid grid-cols-7 gap-4">
            {days.map((day, index) => (
              <div key={index} className="flex flex-col space-y-1">
                <div className={`text-center p-2 ${format(day, 'yyyy-MM-dd') === '2025-05-20' ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-t-md`}>
                  <div className="font-medium">{formatWeekDay(day)}</div>
                  <div className="text-sm">{formatDate(day)}</div>
                </div>
                
                <div className="bg-card border rounded-b-md flex-1 p-2 space-y-2 min-h-[200px]">
                  {getTasksForDay(day).map(task => (
                    <Card 
                      key={task.id} 
                      className="p-3 text-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleEditTask(task)}
                    >
                      <div className="font-medium">{task.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">{task.time} ({task.duration}m)</div>
                      <Badge className={`mt-2 ${priorityColors[task.project] || ''}`}>
                        {task.project}
                      </Badge>
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
                    </Card>
                  ))}
                  
                  {getTasksForDay(day).length === 0 && (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                      <div className="text-center">
                        <Calendar className="h-5 w-5 mx-auto mb-1 opacity-50" />
                        {t('noTasksScheduled', { ns: 'tasks' })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
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
