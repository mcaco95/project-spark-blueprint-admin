import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { TaskProvider } from '@/contexts/tasks/TaskContext';
import { ViewMode } from '@/types/task';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { KanbanView } from '@/components/tasks/KanbanView';
import { ListView } from '@/components/tasks/ListView';
import { CalendarView } from '@/components/tasks/CalendarView';
import { TimelineView } from '@/components/tasks/TimelineView';
import { Kanban, List, Calendar, GanttChart } from 'lucide-react';

const TasksPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeView, setActiveView] = useState<ViewMode>('kanban');

  // On component mount, check URL params for view preference
  useEffect(() => {
    const viewParam = searchParams.get('view') as ViewMode | null;
    if (viewParam && ['kanban', 'list', 'calendar', 'timeline'].includes(viewParam)) {
      setActiveView(viewParam);
    } else {
      // Check localStorage for saved preference
      const savedView = localStorage.getItem('taskView') as ViewMode | null;
      if (savedView && ['kanban', 'list', 'calendar', 'timeline'].includes(savedView)) {
        setActiveView(savedView);
        // Update URL to match saved preference
        setSearchParams({ view: savedView });
      }
    }
  }, [searchParams, setSearchParams]);

  const handleViewChange = (value: string) => {
    if (value) {
      const newView = value as ViewMode;
      setActiveView(newView);
      setSearchParams({ view: newView });
      localStorage.setItem('taskView', newView);
    }
  };

  return (
    <MainLayout>
      <TaskProvider>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
              <p className="text-muted-foreground mt-2">
                Manage your tasks in different views
              </p>
            </div>
            
            <ToggleGroup type="single" value={activeView} onValueChange={handleViewChange}>
              <ToggleGroupItem value="kanban" aria-label="Kanban view">
                <Kanban className="h-4 w-4 mr-2" />
                Kanban
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <List className="h-4 w-4 mr-2" />
                List
              </ToggleGroupItem>
              <ToggleGroupItem value="calendar" aria-label="Calendar view">
                <Calendar className="h-4 w-4 mr-2" />
                Calendar
              </ToggleGroupItem>
              <ToggleGroupItem value="timeline" aria-label="Timeline view">
                <GanttChart className="h-4 w-4 mr-2" />
                Timeline
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          
          {activeView === 'kanban' && <KanbanView />}
          {activeView === 'list' && <ListView />}
          {activeView === 'calendar' && <CalendarView />}
          {activeView === 'timeline' && <TimelineView />}
        </div>
      </TaskProvider>
    </MainLayout>
  );
};

export default TasksPage;
