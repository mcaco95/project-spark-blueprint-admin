
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useTaskContext } from '@/contexts/TaskContext';

const Index = () => {
  const { t } = useTranslation('common');
  const { board } = useTaskContext();

  // Calculate task statistics from the board state
  const getTaskStats = () => {
    const allTasks = Object.values(board.tasks);
    
    // Count tasks by status
    const pendingTasks = allTasks.filter(task => 
      task.status === 'todo' || task.status === 'in-progress' || task.status === 'review'
    );
    
    const highPriorityTasks = allTasks.filter(task => task.priority === 'high');
    
    // Calculate tasks due this week (simulated since we don't have real dates yet)
    const upcomingDeadlines = 7; // In a real app, we'd filter by date
    
    return {
      activeProjects: 5, // This would come from a project context in a real app
      pendingTasks: pendingTasks.length,
      highPriorityTasks: highPriorityTasks.length,
      upcomingDeadlines
    };
  };
  
  const stats = getTaskStats();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('welcome')}</h1>
            <p className="text-muted-foreground mt-2">
              Manage your projects and tasks efficiently
            </p>
          </div>
          <Link to="/projects">
            <Button className="w-full md:w-auto flex gap-2">
              <PlusCircle className="h-4 w-4" />
              <span>New Project</span>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Projects</CardTitle>
              <CardDescription>Your current active projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.activeProjects}</div>
              <p className="text-sm text-muted-foreground">3 need attention</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link to="/projects">View All Projects</Link>
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Pending Tasks</CardTitle>
              <CardDescription>Tasks waiting for your action</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.pendingTasks}</div>
              <p className="text-sm text-muted-foreground">{stats.highPriorityTasks} high priority</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link to="/tasks/kanban">View All Tasks</Link>
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
              <CardDescription>Tasks due this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.upcomingDeadlines}</div>
              <p className="text-sm text-muted-foreground">Next: Tomorrow</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link to="/tasks/timeline">View Timeline</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {/* This would be populated with actual data in a real app */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 p-3 rounded-md hover:bg-muted/50">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold">
                    {String.fromCharCode(65 + i)}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {["Task updated", "Comment added", "File uploaded"][i]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {["Project Alpha", "Website Redesign", "Mobile App"][i]} • {["2 hours ago", "Yesterday", "3 days ago"][i]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
