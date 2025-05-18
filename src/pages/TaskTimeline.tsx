
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, startOfWeek, addDays, parseISO } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

// Mock data for the timeline
const mockTimelineTasks = [
  {
    id: '1',
    title: 'Project kickoff meeting',
    project: 'Website Redesign',
    date: '2025-05-20',
    time: '10:00',
    duration: 60,
    assignees: ['Admin User', 'Regular User'],
  },
  {
    id: '2',
    title: 'Design review',
    project: 'Mobile App Development',
    date: '2025-05-21',
    time: '14:00',
    duration: 90,
    assignees: ['Regular User'],
  },
  {
    id: '3',
    title: 'Backend planning',
    project: 'Website Redesign',
    date: '2025-05-22',
    time: '11:00',
    duration: 120,
    assignees: ['Admin User', 'Project Manager'],
  },
  {
    id: '4',
    title: 'Client status update',
    project: 'Marketing Campaign',
    date: '2025-05-23',
    time: '15:30',
    duration: 30,
    assignees: ['Project Manager'],
  },
  {
    id: '5',
    title: 'Team weekly sync',
    project: 'All Projects',
    date: '2025-05-24',
    time: '09:00',
    duration: 45,
    assignees: ['Admin User', 'Regular User', 'Project Manager'],
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
  
  // Generate week days
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));
  
  const previousWeek = () => {
    setCurrentWeekStart(prevDate => addDays(prevDate, -7));
  };
  
  const nextWeek = () => {
    setCurrentWeekStart(prevDate => addDays(prevDate, 7));
  };
  
  const formatWeekDay = (date: Date) => {
    return format(date, 'EEE', { locale });
  };
  
  const formatDate = (date: Date) => {
    return format(date, 'MMM d', { locale });
  };

  // Get tasks for a specific day
  const getTasksForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return mockTimelineTasks.filter(task => task.date === dateStr);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('timeline')}</h1>
            <p className="text-muted-foreground mt-2">
              {t('weeklyOverview', { ns: 'tasks' })}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={previousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="font-medium">
              {formatDate(currentWeekStart)} - {formatDate(addDays(currentWeekStart, 6))}
            </div>
            <Button variant="outline" size="icon" onClick={nextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((day, index) => (
            <div key={index} className="flex flex-col space-y-1">
              <div className={`text-center p-2 ${format(day, 'yyyy-MM-dd') === '2025-05-20' ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-t-md`}>
                <div className="font-medium">{formatWeekDay(day)}</div>
                <div className="text-sm">{formatDate(day)}</div>
              </div>
              
              <div className="bg-card border rounded-b-md flex-1 p-2 space-y-2 min-h-[200px]">
                {getTasksForDay(day).map(task => (
                  <Card key={task.id} className="p-3 text-sm hover:shadow-md transition-shadow">
                    <div className="font-medium">{task.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{task.time} ({task.duration}m)</div>
                    <Badge className={`mt-2 ${priorityColors[task.project] || ''}`}>
                      {task.project}
                    </Badge>
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
      </div>
    </MainLayout>
  );
};

export default TaskTimeline;
