import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Grid, Users, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { MetricData, ChartData } from '@/types/admin';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';
import { adminService } from '@/services/adminService';
import { Spinner } from '@/components/ui/spinner';
import { TeamOverview } from './TeamOverview';

export const MetricsOverview = () => {
  const { t } = useTranslation(['admin', 'common']);
  const [activeTab, setActiveTab] = useState('system');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [userRolesData, setUserRolesData] = useState<ChartData[]>([]);
  const [projectStatusData, setProjectStatusData] = useState<ChartData[]>([]);
  const [taskCompletionData, setTaskCompletionData] = useState<ChartData[]>([]);
  const [userActivityData, setUserActivityData] = useState<ChartData[]>([]);

  useEffect(() => {
    if (activeTab === 'system') {
      loadMetrics();
    }
  }, [activeTab]);

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching metrics data...');

      // Load all metrics data with individual try-catch blocks
      let usersResponse, projectsResponse, tasksResponse, activityResponse;

      try {
        console.log('Fetching users data...');
        usersResponse = await adminService.getUsers();
        console.log('Users data received:', usersResponse);
      } catch (err) {
        console.error('Error fetching users:', err);
        throw new Error('Failed to fetch users data');
      }

      try {
        console.log('Fetching projects data...');
        projectsResponse = await adminService.getProjects();
        console.log('Projects data received:', projectsResponse);
      } catch (err) {
        console.error('Error fetching projects:', err);
        throw new Error('Failed to fetch projects data');
      }

      try {
        console.log('Fetching tasks data...');
        tasksResponse = await adminService.getTasks();
        console.log('Tasks data received:', tasksResponse);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        throw new Error('Failed to fetch tasks data');
      }

      try {
        console.log('Fetching user activity data...');
        activityResponse = await adminService.getUserActivity();
        console.log('User activity data received:', activityResponse);
      } catch (err) {
        console.error('Error fetching user activity:', err);
        throw new Error('Failed to fetch user activity data');
      }

      // Process users data
      if (!usersResponse?.items?.length) {
        console.warn('No users data available');
      }
      const activeUsers = usersResponse.items.filter(u => u.status === 'active').length;
      const inactiveUsers = usersResponse.items.filter(u => u.status === 'inactive').length;
      const totalUsers = usersResponse.items.length;

      // Process roles data
      const roleCount: Record<string, number> = {};
      usersResponse.items.forEach(user => {
        if (!user.role) {
          console.warn('User without role found:', user);
          return;
        }
        roleCount[user.role] = (roleCount[user.role] || 0) + 1;
      });
      setUserRolesData(Object.entries(roleCount).map(([name, value]) => ({ name, value })));

      // Process project status data
      if (!projectsResponse?.items?.length) {
        console.warn('No projects data available');
      }
      const statusCount: Record<string, number> = {};
      projectsResponse.items.forEach(project => {
        if (!project.status) {
          console.warn('Project without status found:', project);
          return;
        }
        statusCount[project.status] = (statusCount[project.status] || 0) + 1;
      });
      setProjectStatusData(Object.entries(statusCount).map(([name, value]) => ({ name, value })));

      // Process task completion data
      if (!tasksResponse?.items?.length) {
        console.warn('No tasks data available');
      }
      const tasksByMonth: Record<string, { completed: number, total: number }> = {};
      tasksResponse.items.forEach(task => {
        if (!task.created_at) {
          console.warn('Task without creation date found:', task);
          return;
        }
        const date = new Date(task.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!tasksByMonth[monthKey]) {
          tasksByMonth[monthKey] = { completed: 0, total: 0 };
        }
        
        tasksByMonth[monthKey].total++;
        if (task.status === 'completed') {
          tasksByMonth[monthKey].completed++;
        }
      });

      setTaskCompletionData(
        Object.entries(tasksByMonth).map(([name, data]) => ({
          name,
          value: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
        }))
      );

      // Process user activity data
      if (!activityResponse?.items?.length) {
        console.warn('No user activity data available');
      }
      setUserActivityData(
        activityResponse.items.map(activity => ({
          name: new Date(activity.date).toLocaleDateString(),
          value: activity.count
        }))
      );

      // Set overview metrics
      const completedTasks = tasksResponse.items.filter(t => t.status === 'completed').length;
      const totalTasks = tasksResponse.items.length;
      const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Calculate overdue tasks and tasks without due dates
      const tasksWithoutDueDate = tasksResponse.items.filter(t => !t.dueDate).length;
      const overdueTasks = tasksResponse.items.filter(t => {
        if (!t.dueDate) {
          return false;
        }
        const dueDate = new Date(t.dueDate);
        return t.status !== 'completed' && dueDate < new Date();
      }).length;

      if (tasksWithoutDueDate > 0) {
        console.warn(`${tasksWithoutDueDate} tasks found without due dates`);
      }

      setMetrics([
        {
          label: 'totalUsers',
          value: totalUsers
        },
        {
          label: 'activeUsers',
          value: activeUsers
        },
        {
          label: 'taskCompletionRate',
          value: taskCompletionRate
        },
        {
          label: 'overdueTasksCount',
          value: overdueTasks,
          description: tasksWithoutDueDate > 0 ? t('overdueTasksWithMissing', { count: tasksWithoutDueDate }) : undefined
        }
      ]);

      console.log('All metrics processed successfully');

    } catch (err) {
      console.error('Error loading metrics:', err);
      setError(t('errorLoadingMetrics', { ns: 'admin' }));
    } finally {
      setIsLoading(false);
    }
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="system">{t('systemMetrics', { ns: 'admin' })}</TabsTrigger>
          <TabsTrigger value="team">{t('teamPerformance', { ns: 'admin' })}</TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Spinner className="w-8 h-8" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center min-h-[400px] text-destructive">
              <AlertCircle className="w-6 h-6 mr-2" />
              <p>{error}</p>
            </div>
          ) : (
            <>
              {/* Overview metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {metrics.map((metric) => (
                  <Card key={metric.label}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {t(metric.label, { ns: 'admin' })}
                      </CardTitle>
                      {metric.label === 'totalUsers' && <Users className="h-4 w-4 text-muted-foreground" />}
                      {metric.label === 'activeUsers' && <Users className="h-4 w-4 text-muted-foreground" />}
                      {metric.label === 'taskCompletionRate' && <CheckCircle2 className="h-4 w-4 text-muted-foreground" />}
                      {metric.label === 'overdueTasksCount' && <Clock className="h-4 w-4 text-muted-foreground" />}
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {metric.label.includes('Rate') ? `${metric.value}%` : metric.value}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Roles Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('userRolesDistribution', { ns: 'admin' })}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={userRolesData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${t(name + 'Role', { ns: 'admin' })} ${(percent * 100).toFixed(0)}%`}
                          >
                            {userRolesData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name) => [value, t(name + 'Role', { ns: 'admin' })]} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Project Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('projectStatusDistribution', { ns: 'admin' })}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={projectStatusData}>
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar 
                            dataKey="value" 
                            name={t('projects', { ns: 'admin' })} 
                            fill="#8884d8" 
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Task Completion Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('taskCompletionTrend', { ns: 'admin' })}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={taskCompletionData}>
                          <XAxis 
                            dataKey="name" 
                            tickFormatter={(value) => {
                              const [year, month] = value.split('-');
                              return `${month}/${year.slice(2)}`;
                            }}
                          />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            name={t('completionRate', { ns: 'admin' })} 
                            stroke="#8884d8"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* User Activity Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('userActivityTrend', { ns: 'admin' })}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={userActivityData}>
                          <XAxis 
                            dataKey="name" 
                            tickFormatter={(value) => {
                              const [year, month] = value.split('-');
                              return `${month}/${year.slice(2)}`;
                            }}
                          />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            name={t('activeUsers', { ns: 'admin' })} 
                            stroke="#82ca9d"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="team">
          <TeamOverview />
        </TabsContent>
      </Tabs>
    </div>
  );
};
