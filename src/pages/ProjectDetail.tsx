import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { format } from 'date-fns';
import { MainLayout } from '@/components/layout/MainLayout';
import { useProjectsData } from '@/hooks/useProjectsData';
import { useTaskContext } from '@/contexts/TaskContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, ArrowLeft, Plus, MessageSquare, Edit, Trash2 } from 'lucide-react';
import { ProjectComment } from '@/types/project';
import { Task } from '@/types/task'; // Import Task from task.ts instead of project.ts
import { toast } from 'sonner';
import { ProjectDialog } from '@/components/projects/ProjectDialog';
import { TaskDialog } from '@/components/kanban/TaskDialog';
import { TaskEventDialog } from '@/components/timeline/TaskEventDialog';

const statusColors: Record<string, string> = {
  planning: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  'on-hold': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
};

const priorityColors: Record<string, string> = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const taskStatusColors: Record<string, string> = {
  'todo': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'review': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  'done': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
};

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProjectById, updateProject, deleteProject } = useProjectsData();
  const { getTasksByProject, addTask } = useTaskContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isTimelineTaskDialogOpen, setIsTimelineTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const project = getProjectById(id || '');
  
  if (!project) {
    return <MainLayout>
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h1 className="text-2xl font-bold mb-4">Project not found</h1>
        <p className="text-muted-foreground mb-6">The project you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate('/projects')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
      </div>
    </MainLayout>;
  }
  
  const projectTasks = getTasksByProject(project.id);
  
  // Calculate task statistics
  const todoTasks = projectTasks.filter(task => task.status === 'todo').length;
  const inProgressTasks = projectTasks.filter(task => task.status === 'in-progress').length;
  const reviewTasks = projectTasks.filter(task => task.status === 'review').length;
  const completedTasks = projectTasks.filter(task => task.status === 'done' || task.status === 'completed').length;
  const totalTasks = projectTasks.length;
  
  const handleProjectEdit = () => {
    setIsProjectDialogOpen(true);
  };
  
  const handleProjectDelete = () => {
    deleteProject(project.id);
    toast.success('Project deleted successfully');
    navigate('/projects');
  };
  
  const handleAddTask = (isTimelineTask = false) => {
    setEditingTask(null);
    if (isTimelineTask) {
      setIsTimelineTaskDialogOpen(true);
    } else {
      setIsTaskDialogOpen(true);
    }
  };
  
  const handleTaskClick = (task: Task) => {
    setEditingTask(task);
    
    // Determine which dialog to open based on whether the task has date/time fields
    if (task.date && task.time) {
      setIsTimelineTaskDialogOpen(true);
    } else {
      setIsTaskDialogOpen(true);
    }
  };
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center">
            <Button variant="outline" size="icon" className="mr-4" onClick={() => navigate('/projects')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                <Badge className={statusColors[project.status]}>{project.status}</Badge>
                <Badge variant="outline" className={priorityColors[project.priority]}>{project.priority}</Badge>
              </div>
              <p className="text-muted-foreground mt-1">{project.description || 'No description provided'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleProjectEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Project
            </Button>
            <Button variant="destructive" onClick={handleProjectDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-md mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center text-sm">
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="font-medium mr-2">Start Date:</span> 
                    {format(new Date(project.startDate), 'PPP')}
                  </div>
                  {project.endDate && (
                    <div className="flex items-center text-sm">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="font-medium mr-2">End Date:</span> 
                      {format(new Date(project.endDate), 'PPP')}
                    </div>
                  )}
                  <div className="flex items-center text-sm">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="font-medium mr-2">Created:</span> 
                    {format(new Date(project.createdAt), 'PPP')}
                  </div>
                  {project.updatedAt && (
                    <div className="flex items-center text-sm">
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="font-medium mr-2">Last Updated:</span> 
                      {format(new Date(project.updatedAt), 'PPP')}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Team</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center mb-4">
                    <div className="text-sm font-medium mr-2">Created by:</div>
                    <div className="flex items-center">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarFallback className="text-xs">
                          {project.createdBy.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{project.createdBy}</span>
                    </div>
                  </div>
                  
                  <div className="text-sm font-medium mb-2">Team Members:</div>
                  <div className="flex flex-wrap gap-2">
                    {project.teamMembers.map((member, index) => (
                      <div key={index} className="flex items-center bg-muted rounded-full px-3 py-1">
                        <Avatar className="h-5 w-5 mr-2">
                          <AvatarFallback className="text-xs">
                            {member.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{member}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                    <div className="bg-muted rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold">{todoTasks}</div>
                      <div className="text-sm text-muted-foreground">To Do</div>
                    </div>
                    <div className="bg-muted rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold">{inProgressTasks}</div>
                      <div className="text-sm text-muted-foreground">In Progress</div>
                    </div>
                    <div className="bg-muted rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold">{reviewTasks}</div>
                      <div className="text-sm text-muted-foreground">Review</div>
                    </div>
                    <div className="bg-muted rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold">{completedTasks}</div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="tasks" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Project Tasks ({totalTasks})</h2>
              <div className="flex gap-2">
                <Button onClick={() => handleAddTask(false)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
                <Button variant="outline" onClick={() => handleAddTask(true)}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Task
                </Button>
              </div>
            </div>
            
            {projectTasks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projectTasks.map((task) => (
                  <Card 
                    key={task.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleTaskClick(task)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{task.title}</h3>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </div>
                        <Badge className={taskStatusColors[task.status]}>
                          {task.status === 'in-progress' ? 'In Progress' : task.status}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-4">
                        {task.date && task.time && (
                          <div className="bg-muted text-xs px-2 py-1 rounded flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {task.date} {task.time}
                            {task.duration && <span> ({task.duration}m)</span>}
                          </div>
                        )}
                        
                        {task.dueDate && (
                          <div className="bg-muted text-xs px-2 py-1 rounded flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Due: {format(new Date(task.dueDate), 'MMM d')}
                          </div>
                        )}
                      </div>
                      
                      {task.assignees && task.assignees.length > 0 && (
                        <div className="mt-3 flex -space-x-2">
                          {task.assignees.map((assignee, idx) => (
                            <Avatar key={idx} className="h-6 w-6 border-2 border-background">
                              <AvatarFallback className="text-xs">
                                {assignee.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-muted rounded-lg">
                <p className="text-muted-foreground mb-2">No tasks have been added to this project yet.</p>
                <Button onClick={() => handleAddTask(false)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add your first task
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="comments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Comments ({project.comments?.length || 0})</h2>
              <Button>
                <MessageSquare className="h-4 w-4 mr-2" />
                Add Comment
              </Button>
            </div>
            
            {project.comments && project.comments.length > 0 ? (
              <div className="space-y-4">
                {project.comments.map((comment: ProjectComment) => (
                  <Card key={comment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {comment.author.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{comment.author}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                            </span>
                          </div>
                          <p className="mt-1">{comment.text}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-muted rounded-lg">
                <p className="text-muted-foreground">No comments yet.</p>
                <Button className="mt-2">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add the first comment
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <ProjectDialog 
        isOpen={isProjectDialogOpen}
        onClose={() => setIsProjectDialogOpen(false)}
        editingProject={project}
        onSave={(updatedProject) => {
          updateProject(updatedProject);
          setIsProjectDialogOpen(false);
          toast.success('Project updated successfully');
        }}
      />
      
      <TaskDialog 
        isOpen={isTaskDialogOpen}
        onClose={() => setIsTaskDialogOpen(false)}
        editingTask={editingTask}
        defaultProject={project.id}
      />
      
      <TaskEventDialog 
        isOpen={isTimelineTaskDialogOpen}
        onClose={() => setIsTimelineTaskDialogOpen(false)}
        task={editingTask ? { ...editingTask } : { 
          id: '', 
          title: '',
          status: 'todo',
          assignees: [],
          projectId: project.id,
          project: project.name
        }}
        onSave={(task) => {
          addTask({...task, projectId: project.id});
          setIsTimelineTaskDialogOpen(false);
        }}
      />
    </MainLayout>
  );
};

export default ProjectDetail;
