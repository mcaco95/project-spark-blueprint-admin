import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPerformanceMetrics, TeamMetrics } from '@/types/admin';
import { adminService } from '@/services/adminService';
import { Spinner } from '@/components/ui/spinner';
import { AlertCircle, Clock, CheckCircle2, Users, ArrowUpRight, ListTodo, Activity, AlertTriangle, Target, Timer, Zap } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

export const TeamOverview = () => {
  const { t } = useTranslation(['admin']);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamMetrics, setTeamMetrics] = useState<TeamMetrics | null>(null);
  const [userMetrics, setUserMetrics] = useState<UserPerformanceMetrics[]>([]);
  const [timeRange, setTimeRange] = useState('30'); // days

  useEffect(() => {
    loadMetrics();
  }, [timeRange]);

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [team, users] = await Promise.all([
        adminService.getTeamMetrics(parseInt(timeRange)),
        adminService.getAllUserPerformanceMetrics(parseInt(timeRange))
      ]);
      setTeamMetrics(team);
      setUserMetrics(users);
    } catch (err) {
      console.error('Error loading metrics:', err);
      setError(t('errorLoadingMetrics'));
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToUserDetails = (userId: string) => {
    navigate(`/admin/users/${userId}/performance`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-destructive">
        <AlertCircle className="w-6 h-6 mr-2" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Time Range Selector */}
      <Tabs defaultValue={timeRange} className="w-full" onValueChange={setTimeRange}>
        <TabsList>
          <TabsTrigger value="7">{t('last7Days')}</TabsTrigger>
          <TabsTrigger value="30">{t('last30Days')}</TabsTrigger>
          <TabsTrigger value="90">{t('last90Days')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Team Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('averageTasksPerUser')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(teamMetrics?.averageTasksPerUser ?? 0).toFixed(1)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('averageCompletionTime')}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(teamMetrics?.averageCompletionTime ?? 0).toFixed(1)} {t('days')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('completionRate')}
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamMetrics?.taskCompletionTrend?.length
                ? Math.round(
                    (teamMetrics.taskCompletionTrend.reduce((acc, curr) => acc + (curr.completed ?? 0), 0) /
                      teamMetrics.taskCompletionTrend.reduce((acc, curr) => acc + (curr.total ?? 0), 0)) *
                      100
                  )
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Completion Trend */}
      <Card>
        <CardHeader>
          <CardTitle>{t('teamCompletionTrend')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={teamMetrics?.taskCompletionTrend ?? []}>
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => value ? new Date(value).toLocaleDateString() : ''}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  name={t('completedTasks')} 
                  stroke="#8884d8" 
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  name={t('totalTasks')} 
                  stroke="#82ca9d" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* User Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamMetrics?.taskDistribution.map((user) => {
          console.log('User metrics raw:', user);
          
          // Calculate completion rates
          const totalTasks = user.taskCount;
          const completedTasks = (user.taskStatusDistribution || [])
            .find(item => item.name === 'completed')?.value ?? 0;
          
          const taskCompletionRate = totalTasks > 0
            ? (completedTasks / totalTasks) * 100
            : 0;

          // Get task counts from taskStatusDistribution
          const todoTasks = (user.taskStatusDistribution || [])
            .find(item => item.name === 'todo')?.value ?? 0;
          const inProgressTasks = (user.taskStatusDistribution || [])
            .find(item => item.name === 'in_progress')?.value ?? 0;

          console.log('Raw taskStatusDistribution:', user.taskStatusDistribution);
          console.log('Task counts from distribution:', { todoTasks, inProgressTasks, completedTasks });

          return (
            <Card 
              key={user.userId}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/50"
              onClick={() => navigateToUserDetails(user.userId)}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg font-medium">
                    {user.userName}
                  </CardTitle>
                  <CardDescription>
                    {t('taskOverview')}
                  </CardDescription>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Task Status */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-muted-foreground">{t('completed')}</span>
                      </div>
                      <span className="font-medium">{completedTasks}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-muted-foreground">{t('inProgress')}</span>
                      </div>
                      <span className="font-medium">{inProgressTasks}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <ListTodo className="h-4 w-4 text-purple-500" />
                        <span className="text-sm text-muted-foreground">{t('todo')}</span>
                      </div>
                      <span className="font-medium">{todoTasks}</span>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-muted-foreground">{t('taskCompletionRate')}</span>
                      </div>
                      <span className="font-medium">{taskCompletionRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-purple-500" />
                        <span className="text-sm text-muted-foreground">{t('productivity')}</span>
                      </div>
                      <span className="font-medium">
                        {(completedTasks / 30).toFixed(1)} {t('tasksPerDay')}
                      </span>
                    </div>
                  </div>
                  
                  {/* Progress bar showing task distribution */}
                  <div className="mt-4 space-y-2">
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="flex h-full">
                        {todoTasks > 0 && (
                          <div 
                            className="bg-purple-500" 
                            style={{ 
                              width: `${(todoTasks / totalTasks) * 100}%` 
                            }} 
                          />
                        )}
                        {inProgressTasks > 0 && (
                          <div 
                            className="bg-blue-500" 
                            style={{ 
                              width: `${(inProgressTasks / totalTasks) * 100}%` 
                            }} 
                          />
                        )}
                        {completedTasks > 0 && (
                          <div 
                            className="bg-green-500" 
                            style={{ 
                              width: `${(completedTasks / totalTasks) * 100}%` 
                            }} 
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{totalTasks} total tasks</span>
                      <span>{taskCompletionRate.toFixed(1)}% completed</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}; 