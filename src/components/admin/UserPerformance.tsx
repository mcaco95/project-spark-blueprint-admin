import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';

const UserPerformance: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    // Fetch user performance metrics
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/user-performance');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching user performance metrics:', error);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Active Tasks</CardTitle>
          <CardDescription>Tasks currently in progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics?.activeTasks?.map((task) => (
              <div key={task.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{task.title}</h4>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  </div>
                  <Badge variant={task.status === 'active' ? 'default' : 'secondary'}>
                    {task.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{task.completionRate}%</span>
                  </div>
                  <Progress value={task.completionRate} className="h-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{task.completedTasks} of {task.totalTasks} tasks completed</span>
                    {task.dueDate && (
                      <span>Due {format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {(!metrics?.activeTasks || metrics.activeTasks.length === 0) && (
              <div className="text-center py-4 text-muted-foreground">
                No active tasks found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Active Projects</CardTitle>
          <CardDescription>Projects with ongoing tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics?.activeProjects?.map((project) => (
              <div key={project.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{project.name}</h4>
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                  </div>
                  <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                    {project.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                  {project.endDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Due Date</span>
                      <span>{new Date(project.endDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {(!metrics?.activeProjects || metrics.activeProjects.length === 0) && (
              <div className="text-center py-4 text-muted-foreground">
                No active projects found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserPerformance; 