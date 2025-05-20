import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, Legend, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { Spinner } from '@/components/ui/spinner';
import { 
  AlertCircle, Clock, CheckCircle2, AlertTriangle, Calendar, 
  ArrowUpRight, Target, Zap, Activity, Timer, TrendingUp 
} from 'lucide-react';
import { adminService } from '@/services/adminService';
import { UserPerformanceMetrics } from '@/types/admin';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const UserPerformanceContent = ({ metrics }: { metrics: UserPerformanceMetrics }) => {
  const { t } = useTranslation(['admin']);
  const navigate = useNavigate();
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];

  // Calculate additional metrics
  const taskCompletionRate = metrics.metrics.totalTasks > 0
    ? (metrics.metrics.completedTasks / metrics.metrics.totalTasks) * 100
    : 0;

  const onTimeCompletionRate = metrics.metrics.completedTasks > 0
    ? ((metrics.metrics.completedTasks - metrics.metrics.overdueTasks) / metrics.metrics.completedTasks) * 100
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{metrics.userName}</h1>
          <p className="text-muted-foreground mt-2">
            {t('userPerformanceDescription')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={metrics.metrics.lastActiveDate ? 'default' : 'secondary'}>
            {metrics.metrics.lastActiveDate 
              ? `Last active: ${new Date(metrics.metrics.lastActiveDate).toLocaleDateString()}`
              : 'No recent activity'
            }
          </Badge>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('taskCompletionRate')}
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskCompletionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.metrics.completedTasks} of {metrics.metrics.totalTasks} tasks completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('onTimeCompletion')}
            </CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onTimeCompletionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.metrics.overdueTasks} overdue tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('productivity')}
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(metrics.metrics.completedTasks / 30).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('tasksPerDay')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('avgCompletionTime')}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(metrics.metrics?.averageCompletionTime ?? 0).toFixed(1)} {t('days')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('taskStatusDistribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {(() => {
                console.log("Frontend - Task Status Distribution Data:", metrics.metrics.taskStatusDistribution);
                
                // Transform data to include all possible statuses with 0 count if not present
                const allStatuses = ['todo', 'in_progress', 'review', 'completed'];
                const statusData = allStatuses.map(status => {
                  const existingData = (metrics.metrics.taskStatusDistribution || [])
                    .find(item => item.name === status);
                  return {
                    name: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
                    value: existingData ? existingData.value : 0
                  };
                });

                console.log("Transformed Status Data:", statusData);

                return (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, value }) => value > 0 ? `${name} (${value})` : ''}
                        labelLine={true}
                      >
                        {statusData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={
                              entry.name.toLowerCase().includes('todo') ? '#8884d8' :
                              entry.name.toLowerCase().includes('progress') ? '#82ca9d' :
                              entry.name.toLowerCase().includes('review') ? '#ffc658' :
                              entry.name.toLowerCase().includes('completed') ? '#ff8042' :
                              '#d0d0d0'
                            }
                            strokeWidth={entry.value > 0 ? 1 : 0}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [`${value} tasks`, name]}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value) => value}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                );
              })()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('tasksByPriority')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {(() => {
                console.log("Frontend - Tasks by Priority Data:", metrics.metrics.tasksByPriority);
                return (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.metrics.tasksByPriority}>
                      <XAxis 
                        dataKey="name"
                        tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                      />
                      <YAxis allowDecimals={false} />
                      <Tooltip 
                        formatter={(value) => [`${value} tasks`, 'Count']}
                        labelFormatter={(label) => label.charAt(0).toUpperCase() + label.slice(1)}
                      />
                      <Legend />
                      <Bar 
                        dataKey="value" 
                        fill="#8884d8"
                        name="Tasks"
                        label={{ position: 'top' }}
                      >
                        {(metrics.metrics.tasksByPriority || []).map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.name === 'high' ? '#ff8042' :
                              entry.name === 'medium' ? '#ffc658' :
                              entry.name === 'low' ? '#82ca9d' :
                              '#d0d0d0'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Lists */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t('activeTasks')}</span>
              <Button variant="outline" size="sm" onClick={() => navigate('/tasks')}>
                {t('viewAll')}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('taskName')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('priority')}</TableHead>
                  <TableHead>{t('dueDate')}</TableHead>
                  <TableHead>{t('project')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(metrics.metrics.activeTasks || []).map((task) => (
                  <TableRow 
                    key={task.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  >
                    <TableCell>{task.title}</TableCell>
                    <TableCell>
                      <Badge variant={
                        task.status === 'todo' ? 'secondary' :
                        task.status === 'in_progress' ? 'default' :
                        task.status === 'review' ? 'destructive' :
                        task.status === 'done' || task.status === 'completed' ? 'default' :
                        'outline'
                      }>
                        {t(task.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        task.priority === 'high' ? 'destructive' :
                        task.priority === 'medium' ? 'default' :
                        'secondary'
                      }>
                        {t(task.priority)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="link" 
                        className="p-0 h-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/projects/${task.projectId}`);
                        }}
                      >
                        {task.projectName}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!metrics.metrics.activeTasks || metrics.metrics.activeTasks.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      {t('noActiveTasks')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Active Projects Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t('activeProjects')}</span>
              <Button variant="outline" size="sm" onClick={() => navigate('/projects')}>
                {t('viewAll')}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('projectName')}</TableHead>
                  <TableHead>{t('description')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('endDate')}</TableHead>
                  <TableHead>{t('progress')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  console.log('[UserPerformanceContent] Rendering activeProjects. Data:', metrics.metrics.activeProjects);
                  if (metrics.metrics.activeProjects && metrics.metrics.activeProjects.length > 0) {
                    console.log('[UserPerformanceContent] Found active projects. Count:', metrics.metrics.activeProjects.length);
                    return metrics.metrics.activeProjects.map((project) => (
                      <TableRow
                        key={project.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        <TableCell>{project.name}</TableCell>
                        <TableCell>{project.description}</TableCell>
                        <TableCell>
                          <Badge variant={
                            project.status === 'active' ? 'default' :
                            project.status === 'planning' ? 'secondary' :
                            project.status === 'on-hold' ? 'outline' : // Assuming 'on-hold' is a possible status
                            project.status === 'completed' ? 'default' : // Or a success variant if you have one
                            'outline'
                          }>
                            {t(project.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {project.endDate ? new Date(project.endDate).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span className="mr-2">{project.progress}%</span>
                            {/* You might want a visual progress bar here too if desired */}
                            {/* e.g., <Progress value={project.progress} className="w-20 h-2" /> */}
                          </div>
                        </TableCell>
                      </TableRow>
                    ));
                  } else {
                    console.log('[UserPerformanceContent] No active projects found or array is empty.');
                    return (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          {t('noActiveProjects')}
                        </TableCell>
                      </TableRow>
                    );
                  }
                })()}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t('recentlyCompletedTasks')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('taskName')}</TableHead>
                  <TableHead>{t('completedDate')}</TableHead>
                  <TableHead>{t('timeToComplete')}</TableHead>
                  <TableHead>{t('project')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(metrics.metrics.recentlyCompletedTasks || []).map((task) => (
                  <TableRow 
                    key={task.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  >
                    <TableCell>{task.title}</TableCell>
                    <TableCell>
                      {new Date(task.completedDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {task.timeToComplete.toFixed(1)} {t('days')}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="link" 
                        className="p-0 h-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/projects/${task.projectId}`);
                        }}
                      >
                        {task.projectName}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!metrics.metrics.recentlyCompletedTasks || metrics.metrics.recentlyCompletedTasks.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      {t('noCompletedTasks')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Completion Trend */}
        <Card>
          <CardHeader>
            <CardTitle>{t('completionTrend')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.metrics.completionTrend || []}>
                  <defs>
                    <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value) => [value, t('completedTasks')]}
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="#8884d8"
                    fillOpacity={1}
                    fill="url(#completedGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const UserPerformance = () => {
  const { t } = useTranslation(['admin']);
  const { userId } = useParams();
  const [timeRange, setTimeRange] = useState('30'); // days
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userMetrics, setUserMetrics] = useState<UserPerformanceMetrics | null>(null);

  useEffect(() => {
    loadUserMetrics();
  }, [userId, timeRange]);

  const loadUserMetrics = async () => {
    if (!userId) {
      setError(t('userNotFound'));
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      const metrics = await adminService.getUserPerformanceMetrics(userId, parseInt(timeRange));
      setUserMetrics(metrics);
    } catch (err) {
      console.error('Error loading user metrics:', err);
      setError(err instanceof Error ? err.message : t('errorLoadingMetrics'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <Tabs defaultValue={timeRange} className="w-full" onValueChange={setTimeRange}>
          <TabsList>
            <TabsTrigger value="7">{t('last7Days')}</TabsTrigger>
            <TabsTrigger value="30">{t('last30Days')}</TabsTrigger>
            <TabsTrigger value="90">{t('last90Days')}</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Spinner className="w-8 h-8" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center min-h-[400px] text-destructive">
            <AlertCircle className="w-6 h-6 mr-2" />
            <p>{error}</p>
          </div>
        ) : userMetrics ? (
          <UserPerformanceContent metrics={userMetrics} />
        ) : (
          <div className="flex items-center justify-center min-h-[400px] text-destructive">
            <AlertCircle className="w-6 h-6 mr-2" />
            <p>{t('userNotFound')}</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default UserPerformance; 