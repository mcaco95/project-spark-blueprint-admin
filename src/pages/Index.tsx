import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, FolderKanban, ListChecks, CalendarClock } from 'lucide-react';
import { useTaskContext } from '@/contexts/tasks/TaskContext';
import { TaskProvider } from '@/contexts/tasks/TaskContext';
import { useEffect, useState } from 'react';
import { useProjectsData } from '@/hooks/useProjectsData';
import { addDays, isAfter, isBefore, startOfDay, parseISO, isValid, isToday, isTomorrow, format, differenceInCalendarDays, endOfWeek, endOfMonth, isWithinInterval, addWeeks, startOfWeek } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Task } from '@/types/task';
import { Progress } from '@/components/ui/progress';
import { Project, ProjectStatus } from '@/types/project';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserSimple } from "@/types/task";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const getInitials = (name?: string | null): string => {
  if (!name) return "?";
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const IndexContent = () => {
  const { t } = useTranslation('common');
  const { board, isLoadingTasks } = useTaskContext();
  const { projects, fetchProjects } = useProjectsData();
  const [projectsLoading, setProjectsLoading] = useState(true);
  const { user, isLoading: isLoadingAuth } = useAuth();

  // Color mapping for statuses
  const projectStatusColors: { [key in ProjectStatus]: string } = {
    active: 'text-green-600 dark:text-green-400',
    planning: 'text-blue-600 dark:text-blue-400',
    'on-hold': 'text-yellow-600 dark:text-yellow-400',
    completed: 'text-gray-500 dark:text-gray-400',
  };

  const taskStatusColors: { [key in 'todo' | 'in-progress' | 'review']: string } = {
    todo: 'text-sky-600 dark:text-sky-400',
    'in-progress': 'text-purple-600 dark:text-purple-400',
    review: 'text-teal-600 dark:text-teal-400',
  };

  useEffect(() => {
    const loadProjects = async () => {
      setProjectsLoading(true);
      try {
        await fetchProjects();
      } catch (error) {
        console.error("Failed to fetch projects for dashboard:", error);
      } finally {
        setProjectsLoading(false);
      }
    };
    loadProjects();
  }, [fetchProjects]);

  // Calculate task statistics from the board state
  const getDashboardStatsAndLists = () => {
    const allTasksArray: Task[] = Object.values(board.tasks);
    const allProjectsArray: Project[] = projects;

    // Project Stats
    const activeProjectsCount = allProjectsArray.filter(p => p.status === 'active').length;
    const planningProjectsCount = allProjectsArray.filter(p => p.status === 'planning').length;
    const onHoldProjectsCount = allProjectsArray.filter(p => p.status === 'on-hold').length;
    const completedProjectsCount = allProjectsArray.filter(p => p.status === 'completed').length;
    const totalProjectsCount = allProjectsArray.length;

    const onHoldProjectNames = allProjectsArray
      .filter(p => p.status === 'on-hold')
      .slice(0, 2)
      .map(p => p.name);
    
    // Task Stats
    const pendingTasks = allTasksArray.filter(task => 
      task.status === 'todo' || task.status === 'in-progress' || task.status === 'review'
    );
    const highPriorityPendingTasksCount = pendingTasks.filter(task => task.priority === 'high').length;
    const todoTasksCount = pendingTasks.filter(task => task.status === 'todo').length;
    const inProgressTasksCount = pendingTasks.filter(task => task.status === 'in-progress').length;
    const reviewTasksCount = pendingTasks.filter(task => task.status === 'review').length;

    // Deadline Stats
    const today = startOfDay(new Date());
    const tomorrow = startOfDay(addDays(today, 1));
    const dayAfterTomorrow = startOfDay(addDays(today, 2));
    
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 }); // Assuming week starts on Monday
    const currentWeekEnd = endOfWeek(today, { weekStartsOn: 1 });
    
    const nextWeekStart = startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 });
    const nextWeekEnd = endOfWeek(addWeeks(today, 1), { weekStartsOn: 1 });
    
    const endOfThisMonth = endOfMonth(today); // Kept for reference, but not directly used in the 4 categories

    let tasksDueTodayCount = 0;
    let tasksDueTomorrowCount = 0;
    let tasksDueThisWeekCount = 0; // Current week, excluding today and tomorrow
    let tasksDueNextWeekCount = 0;
    
    allTasksArray.forEach(task => {
      if (!task.dueDate) return;
      try {
        const dueDateString = typeof task.dueDate === 'string' ? task.dueDate : task.dueDate.toISOString();
        const dueDate = parseISO(dueDateString);
        if (!isValid(dueDate)) return;

        if (isToday(dueDate)) {
          tasksDueTodayCount++;
        } else if (isTomorrow(dueDate)) {
          tasksDueTomorrowCount++;
        } else if (isWithinInterval(dueDate, { start: dayAfterTomorrow, end: currentWeekEnd })) {
          tasksDueThisWeekCount++;
        } else if (isWithinInterval(dueDate, { start: nextWeekStart, end: nextWeekEnd })) {
          tasksDueNextWeekCount++;
        }
      } catch (error) {
        // console.error("Error parsing due date for stats:", error);
      }
    });
    
    const overallUpcomingDeadlinesCount = tasksDueTodayCount + tasksDueTomorrowCount + tasksDueThisWeekCount + tasksDueNextWeekCount;
    
    let nextDeadlineText = "No pressing deadlines found.";
    const firstUpcomingTask = [...allTasksArray]
      .filter(task => {
        if (!task.dueDate) return false;
        const dueDate = parseISO(typeof task.dueDate === 'string' ? task.dueDate : task.dueDate.toISOString());
        return isValid(dueDate) && (isToday(dueDate) || isAfter(dueDate, today));
      })
      .sort((a,b) => {
        const dateA = parseISO(typeof a.dueDate! === 'string' ? a.dueDate! : a.dueDate!.toISOString());
        const dateB = parseISO(typeof b.dueDate! === 'string' ? b.dueDate! : b.dueDate!.toISOString());
        return dateA.getTime() - dateB.getTime();
      })[0];

    if (firstUpcomingTask) {
      const dueDate = parseISO(typeof firstUpcomingTask.dueDate! === 'string' ? firstUpcomingTask.dueDate! : firstUpcomingTask.dueDate!.toISOString());
      if (isToday(dueDate)) nextDeadlineText = "Next up: Today";
      else if (isTomorrow(dueDate)) nextDeadlineText = "Next up: Tomorrow";
      else nextDeadlineText = `Next up: ${format(dueDate, 'MMM d')}`;
    } else if (overallUpcomingDeadlinesCount === 0) {
        nextDeadlineText = "No deadlines for the next two weeks.";
    }

    // Filter and sort tasks for "Your Upcoming Tasks" list
    const relevantTasksForList = allTasksArray.filter(task => 
      task.dueDate && 
      (task.status === 'todo' || task.status === 'in-progress' || task.status === 'review')
    ).map(task => {
      // Ensure dueDate is a Date object for reliable sorting and formatting
      const dueDateString = typeof task.dueDate === 'string' ? task.dueDate : task.dueDate!.toISOString();
      return {
        ...task,
        parsedDueDate: isValid(parseISO(dueDateString)) ? parseISO(dueDateString) : null
      };
    })
    .filter(task => task.parsedDueDate && (isToday(task.parsedDueDate) || isAfter(task.parsedDueDate, today)))
    .sort((a, b) => a.parsedDueDate!.getTime() - b.parsedDueDate!.getTime())
    .slice(0, 3); // Take top 3

    // Filter and sort active projects for the list
    const activeProjectsForList = projects
      .filter(project => project.status === 'active')
      .sort((a, b) => a.name.localeCompare(b.name)) // Sort by name
      .slice(0, 3); // Take top 3

    return {
      pendingTasksCount: pendingTasks.length,
      highPriorityTasksCount: highPriorityPendingTasksCount, // ensure this uses the new variable name
      upcomingDeadlinesCount: overallUpcomingDeadlinesCount, // use new overall count
      nextDeadlineText,
      tasksForUpcomingList: relevantTasksForList,
      activeProjectsForList, // Add this to the returned stats
      
      // Revised Project Stats
      activeProjectsCount, // Specifically active ones for the main count if needed
      totalProjectsCount, // Total projects
      planningProjectsCount,
      onHoldProjectsCount,
      completedProjectsCount,
      onHoldProjectNames, // Kept this, might be useful or removed based on card design

      // Task Status Stats (no change in calculation, only display)
      todoTasksCount,
      inProgressTasksCount,
      reviewTasksCount,

      // New Deadline Stats
      tasksDueTodayCount,
      tasksDueTomorrowCount,
      tasksDueThisWeekCount, 
      tasksDueNextWeekCount, // Added next week
    };
  };
  
  const stats = getDashboardStatsAndLists();

  // Helper to format due date for the list
  const formatTaskDueDate = (dueDate: Date | string): string => {
    const date = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
    if (!isValid(date)) return "Invalid date";
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    const diffDays = differenceInCalendarDays(date, new Date());
    if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days (${format(date, 'EEE')})`;
    return format(date, 'MMM d, yyyy');
  };

  // Loading state check
  if (isLoadingAuth || isLoadingTasks || projectsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        {/* Replace with your preferred Spinner component if different */}
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {user ? `Welcome back, ${user.name}!` : t('welcome')}
          </h1>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-muted-foreground" />
              Projects Overview
            </CardTitle>
            <CardDescription>Summary of all your projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{stats.totalProjectsCount}</div>
            <div className="space-y-1 text-sm">
              <p><span className={`font-semibold ${projectStatusColors.active}`}>{stats.activeProjectsCount} Active</span></p>
              <p><span className={`font-semibold ${projectStatusColors.planning}`}>{stats.planningProjectsCount} Planning</span></p>
              <p><span className={`font-semibold ${projectStatusColors['on-hold']}`}>{stats.onHoldProjectsCount} On-Hold</span></p>
              <p><span className={`font-semibold ${projectStatusColors.completed}`}>{stats.completedProjectsCount} Completed</span></p>
            </div>
            {stats.onHoldProjectNames && stats.onHoldProjectNames.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2.5 pt-2 border-t border-dashed truncate" title={`On Hold Projects: ${stats.onHoldProjectNames.join(', ')}`}>
                Watchlist (On Hold): {stats.onHoldProjectNames.join(', ')}
              </p>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to="/projects">View All Projects</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-muted-foreground" />
              Pending Tasks
            </CardTitle>
            <CardDescription>Your tasks requiring action</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{stats.pendingTasksCount}</div>
            <div className="space-y-1 text-sm mb-2">
                <p><span className={`font-semibold ${taskStatusColors.todo}`}>{stats.todoTasksCount} To Do</span></p>
                <p><span className={`font-semibold ${taskStatusColors['in-progress']}`}>{stats.inProgressTasksCount} In Progress</span></p>
                <p><span className={`font-semibold ${taskStatusColors.review}`}>{stats.reviewTasksCount} In Review</span></p>
            </div>
            {stats.highPriorityTasksCount > 0 && (
                <p className="text-sm text-destructive mt-2 pt-2 border-t border-dashed font-semibold">! {stats.highPriorityTasksCount} high priority</p>
            )}
            {stats.pendingTasksCount === 0 && (
                 <p className="text-sm text-muted-foreground mt-1">No pending tasks. Well done!</p>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to="/tasks/kanban">View All Tasks</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-muted-foreground" />
              Upcoming Deadlines
            </CardTitle>
            <CardDescription>Key tasks by due date</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{stats.upcomingDeadlinesCount}</div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><span className="font-medium text-primary">{stats.tasksDueTodayCount}</span> due today</p>
              <p><span className="font-medium text-primary">{stats.tasksDueTomorrowCount}</span> due tomorrow</p>
              <p><span className="font-medium text-primary">{stats.tasksDueThisWeekCount}</span> due this week</p>
              <p><span className="font-medium text-primary">{stats.tasksDueNextWeekCount}</span> due next week</p>
            </div>
            {(stats.upcomingDeadlinesCount) === 0 && (
                <p className="text-sm text-muted-foreground mt-2 pt-2 border-t border-dashed">{stats.nextDeadlineText}</p>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to="/tasks/timeline">View Timeline</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Bottom Sections Wrapper - Using a grid for two columns on medium screens and up */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8"> 
        {/* Your Upcoming Tasks Section */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Your Upcoming Tasks</h2>
          {stats.tasksForUpcomingList && stats.tasksForUpcomingList.length > 0 ? (
            <div className="space-y-3">
              {stats.tasksForUpcomingList.map((task) => (
                <Link to={`/tasks/${task.id}`} key={task.id} className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-base group-hover:text-primary mb-1">{task.title}</h3>
                    {task.priority && (
                      <Badge 
                        variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'secondary' : 'outline'}
                        className="capitalize text-xs shrink-0"
                      >
                        {task.priority}
                      </Badge>
                    )}
                  </div>
                  {task.parsedDueDate && (
                    <p className="text-sm text-muted-foreground">
                      Due: {formatTaskDueDate(task.parsedDueDate)}
                    </p>
                  )}
                  {task.project_id && projects.find(p => p.id === task.project_id) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Project: {projects.find(p => p.id === task.project_id)?.name}
                    </p>
                  )}
                  {task.assignees && task.assignees.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-dashed">
                      <p className="text-xs text-muted-foreground mb-1">Assigned to:</p>
                      <div className="flex items-center space-x-1">
                        {task.assignees.slice(0, 3).map((assignee: UserSimple) => (
                          <TooltipProvider key={assignee.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Avatar className="h-5 w-5 border-2 border-background group-hover:border-muted/50">
                                  <AvatarFallback className="text-[10px]">
                                    {getInitials(assignee.name)}
                                  </AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{assignee.name || 'Unknown User'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                        {task.assignees.length > 3 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            + {task.assignees.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No pressing deadlines. Great job!</p>
          )}
        </div>

        {/* Your Active Projects Section */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Your Active Projects</h2>
          {stats.activeProjectsForList && stats.activeProjectsForList.length > 0 ? (
            <div className="space-y-3">
              {stats.activeProjectsForList.map((project: Project) => (
                <Link to={`/projects/${project.id}`} key={project.id} className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-base group-hover:text-primary">{project.name}</h3>
                    <Badge variant={project.status === 'active' ? 'default' : 'outline'} className="capitalize text-xs">
                        {project.status}
                    </Badge>
                  </div>
                  {/* Optional: Progress Bar - ensure project.progress is a number 0-100 */}
                  {typeof project.progress === 'number' && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>
                  )}
                  {/* Team Members Display */}
                  {project.members && project.members.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-dashed">
                      <p className="text-xs text-muted-foreground mb-1.5">Team:</p>
                      <div className="flex items-center space-x-1">
                        {project.members.slice(0, 3).map((member: UserSimple) => (
                          <TooltipProvider key={member.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Avatar className="h-5 w-5 border-2 border-background group-hover:border-muted/50">
                                  <AvatarFallback className="text-[10px]">
                                    {getInitials(member.name)}
                                  </AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{member.name || 'Unknown User'}</p>
                                {member.email && <p className="text-xs text-muted-foreground">{member.email}</p>}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                        {project.members.length > 3 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            + {project.members.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No active projects at the moment. Start one!</p>
          )}
        </div>
      </div>

      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {/* This would be populated with actual data in a real app */}
          {Array.from({ length: 0 }).map((_, i) => (
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
  );
};

const Index = () => {
  return (
    <MainLayout>
      <TaskProvider>
        <IndexContent />
      </TaskProvider>
    </MainLayout>
  );
};

export default Index;
