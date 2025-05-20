import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef } from 'react';
import { format, parseISO, parse } from 'date-fns';
import { MainLayout } from '@/components/layout/MainLayout';
import { useProjectsData } from '@/hooks/useProjectsData';
import { useTaskContext } from '@/contexts/tasks/TaskContext';
import { ApiTaskCreatePayload } from '@/contexts/tasks/taskActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar, 
  Clock, 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  PaperclipIcon, 
  SendIcon, 
  AtSign, 
  Smile,
  Reply
} from 'lucide-react';
import { Task } from '@/types/task';
import { toast } from 'sonner';
import { ProjectDialog } from '@/components/projects/ProjectDialog';
import { TaskDialog } from '@/components/kanban/TaskDialog';
import { TaskEventDialog } from '@/components/timeline/TaskEventDialog';
import { useAuth, fetchApi } from '@/contexts/AuthContext';
import { components } from '@/services/apiClient';
import { UserSimple } from '@/types/task';

// Define User type based on API spec for clarity
type ApiUser = components["schemas"]["UserSimpleOutput"];

// Type for comments fetched from the API (same as in TaskDetail.tsx)
export interface ApiComment {
  id: string;
  text_content: string;
  author: UserSimple; // Using UserSimple imported from task types
  project_id?: string | null;
  task_id?: string | null;
  parent_comment_id?: string | null;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  replies: ApiComment[];
}

// Payload type for creating/updating comments
interface CommentPayload {
  text_content: string;
  parent_comment_id?: string;
}

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
  const { projects, getProjectById, updateProject, deleteProject } = useProjectsData();
  const { getTasksByProject, addTask, isLoadingTasks, tasks: allTasksFromContext } = useTaskContext();
  const [activeTab, setActiveTab] = useState('tasks');
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isTimelineTaskDialogOpen, setIsTimelineTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Comment specific state - new names to avoid collision if old logic is there
  const [projectComments, setProjectComments] = useState<ApiComment[]>([]);
  const [isLoadingProjectComments, setIsLoadingProjectComments] = useState(false);
  const [projectCommentError, setProjectCommentError] = useState<string | null>(null);
  const [newProjectCommentText, setNewProjectCommentText] = useState(''); 
  const [replyingToProjectCommentId, setReplyingToProjectCommentId] = useState<string | null>(null); 
  
  const commentSectionRef = useRef<HTMLDivElement>(null);
  const { user, token } = useAuth();
  const [allUsers, setAllUsers] = useState<ApiUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  
  const project = getProjectById(id || '');
  
  // Calculate projectTasks using useMemo. This must be called unconditionally before any early returns.
  // The logic inside useMemo can handle cases where project is not yet available.
  const projectTasks = useMemo(() => {
    // If tasks are still loading from context, or if the project object itself isn't available yet,
    // return an empty array. This prevents errors if getTasksByProject is called with an undefined project ID.
    if (isLoadingTasks || !project) {
      return [];
    }
    return getTasksByProject(project.id);
  }, [isLoadingTasks, project, allTasksFromContext, getTasksByProject]);
  
  useEffect(() => {
    const fetchUsers = async () => {
      if (!token) {
        setIsLoadingUsers(false);
        return;
      }
      try {
        setIsLoadingUsers(true);
        // Assuming the UserSimpleOutput is the correct type for the list of users
        const usersData = await fetchApi<ApiUser[]>('/auth/users', 'GET', undefined, token);
        setAllUsers(usersData || []);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast.error("Failed to load user data for team members.");
        setAllUsers([]); // Ensure it's an empty array on error
      } finally {
        setIsLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [token]);

  useEffect(() => {
    const fetchProjectComments = async () => {
      if (!id || !token) { // id is project_id from useParams
        setProjectComments([]);
        return;
      }
      setIsLoadingProjectComments(true);
      setProjectCommentError(null);
      try {
        const fetchedComments = await fetchApi<ApiComment[]>(`/comments/project/${id}/comments`, 'GET', undefined, token);
        setProjectComments(fetchedComments || []);
      } catch (error) {
        console.error('Failed to fetch project comments:', error);
        setProjectCommentError('Failed to load comments. Please try again.');
        setProjectComments([]);
      } finally {
        setIsLoadingProjectComments(false);
      }
    };

    if (id) { // Only fetch if project ID is available
      fetchProjectComments();
    }
  }, [id, token]); // Re-fetch if project id or token changes
  
  // Moved projectTasks useMemo above this block
  // console.log('[ProjectDetail] project object:', project); // Log the whole project object. Can be re-enabled for debugging.
  
  if (!project) {
    return <MainLayout>
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h1 className="text-2xl font-bold mb-4">Project not found or failed to load.</h1>
        <p className="text-muted-foreground mb-6">The project you're looking for doesn't exist, failed to load, or you do not have access.</p>
        <Button onClick={() => navigate('/projects')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
      </div>
    </MainLayout>;
  }
  
  // console.log('[ProjectDetail] Current project ID:', project.id); // Can be re-enabled for debugging.
  // console.log('[ProjectDetail] Tasks received for this project:', JSON.stringify(projectTasks, null, 2)); // Can be re-enabled for debugging.
  
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
    
    // Navigate to task detail page
    navigate(`/tasks/${task.id}`);
  };

  const handleAddComment = async () => {
    if (!newProjectCommentText.trim() || !project || !user || !token || !id) { // id is project_id
      toast.error("Cannot send empty comment or missing critical data.");
      return;
    }

    const payload: CommentPayload = {
      text_content: newProjectCommentText,
    };

    if (replyingToProjectCommentId) {
      payload.parent_comment_id = replyingToProjectCommentId;
    }

    setIsLoadingProjectComments(true);
    setProjectCommentError(null);
    try {
      const newCommentFromApi = await fetchApi<ApiComment, CommentPayload>(
        `/comments/project/${id}/comments`,
        'POST',
        payload,
        token
      );

      if (newCommentFromApi) {
        const fetchedComments = await fetchApi<ApiComment[]>(`/comments/project/${id}/comments`, 'GET', undefined, token);
        setProjectComments(fetchedComments || []);
        toast.success(replyingToProjectCommentId ? 'Reply sent successfully!' : 'Comment added successfully!');
        
        setTimeout(() => {
          if (commentSectionRef.current) {
            commentSectionRef.current.scrollTop = commentSectionRef.current.scrollHeight;
          }
        }, 100);
      } else {
        toast.error('Failed to add comment. Server did not return the new comment.');
        setProjectCommentError('Failed to send comment. Please try again.');
      }
    } catch (error) {
      console.error('Failed to add project comment:', error);
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast.error(`Failed to add comment: ${errorMsg}`);
      setProjectCommentError(`Failed to send comment: ${errorMsg}`);
    } finally {
      setNewProjectCommentText('');
      setReplyingToProjectCommentId(null);
      setIsLoadingProjectComments(false);
    }
  };
  
  const formatMentions = (text: string) => {
    return text.replace(/@(\w+)/g, '<span class="text-blue-500 font-medium">@$1</span>');
  };

  const formatDate = (dateInput: string | Date | undefined | null) => {
    if (!dateInput) return '';
    console.log('[ProjectDetail] formatDate input:', dateInput, 'type:', typeof dateInput); // Log input to formatDate
    try {
      const dateObj = typeof dateInput === 'string' ? 
        (dateInput.includes('T') ? parseISO(dateInput) : parse(dateInput, 'yyyy-MM-dd', new Date())) : 
        dateInput;
      return format(dateObj, 'PPP'); // 'PPP' gives "MMM d, yyyy"
    } catch (e) {
      console.error("Error formatting date in ProjectDetail:", dateInput, e);
      return String(dateInput); // Fallback
    }
  };

  const formatDateTime = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'MMM d, h:mm a');
  };

  // Recursive function to render comments and their replies for Projects
  const renderProjectCommentsRecursive = (commentList: ApiComment[], isReply = false) => {
    return commentList.map((comment) => (
      <div key={comment.id} className={`relative group ${isReply ? 'ml-8 mt-2 pt-2 border-l-2 border-gray-200 pl-4' : ''}`}>
        <div className="flex items-start gap-3">
          <Avatar className="mt-0.5">
            <AvatarFallback>
              {comment.author.name ? comment.author.name.substring(0, 2).toUpperCase() : (comment.author.email ? comment.author.email.substring(0,1).toUpperCase() : '??')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-medium">{comment.author.name || comment.author.email}</span>
              <span className="text-xs text-muted-foreground">
                {/* Assuming comment.created_at is a string that needs parsing */}
                {format(new Date(comment.created_at), 'MMM d, h:mm a')}
              </span>
            </div>
            <div className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: formatMentions(comment.text_content || '') }}
            />
            <div className="flex items-center gap-2 mt-2">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                <button 
                  onClick={() => setReplyingToProjectCommentId(comment.id)}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <Reply className="h-3.5 w-3.5" />
                  <span>Reply</span>
                </button>
              </div>
            </div>
            {replyingToProjectCommentId === comment.id && (
              <div className="mt-2"> 
                <div className="flex items-start gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">{user?.name?.substring(0,2).toUpperCase() || 'ME'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea 
                      placeholder={`Reply to ${comment.author.name || comment.author.email}...`}
                      className="min-h-[60px] text-sm"
                      value={newProjectCommentText} // Ensure this state is used
                      onChange={(e) => setNewProjectCommentText(e.target.value)} // Ensure this state is updated
                      autoFocus
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <Button variant="ghost" size="sm" onClick={() => setReplyingToProjectCommentId(null)}>Cancel</Button>
                      <Button size="sm" onClick={handleAddComment}>Reply</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Render replies recursively */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-2">
                {renderProjectCommentsRecursive(comment.replies, true)}
              </div>
            )}
          </div>
        </div>
      </div>
    ));
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
                    {formatDate(project.startDate)}
                  </div>
                  {project.endDate && (
                    <div className="flex items-center text-sm">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="font-medium mr-2">End Date:</span>
                      {(() => { console.log('[ProjectDetail] project.endDate for display:', project.endDate, 'type:', typeof project.endDate); return null; })()}
                      {formatDate(project.endDate)}
                    </div>
                  )}
                  <div className="flex items-center text-sm">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="font-medium mr-2">Created:</span> 
                    {formatDateTime(project.createdAt)}
                  </div>
                  {project.updatedAt && (
                    <div className="flex items-center text-sm">
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="font-medium mr-2">Last Updated:</span> 
                      {formatDateTime(project.updatedAt)}
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
                    {(() => { console.log('[ProjectDetail] project.teamMembers:', project.teamMembers); return null; })()}
                    {(() => { console.log('[ProjectDetail] allUsers:', allUsers); return null; })()}
                    {project.teamMembers && project.teamMembers.length > 0 ? (
                      project.teamMembers.map((memberId) => {
                        const memberUser = allUsers.find(u => u.id === memberId);
                        console.log('[ProjectDetail] Mapping memberId:', memberId, 'Found user:', memberUser);
                        const memberName = memberUser?.name || memberUser?.email || memberId; // Fallback: name, then email, then ID
                        const avatarFallback = memberUser?.name ? memberUser.name.substring(0, 2).toUpperCase() : (memberUser?.email ? memberUser.email.substring(0,2).toUpperCase() : memberId.substring(0,2).toUpperCase());
                        
                        return (
                          <div key={memberId} className="flex items-center bg-muted rounded-full px-3 py-1">
                            <Avatar className="h-5 w-5 mr-2">
                              <AvatarFallback className="text-xs">
                                {avatarFallback}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{memberName}</span>
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-sm text-muted-foreground">No team members assigned.</span>
                    )}
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
                      <div className="text-3xl font-bold">{isLoadingTasks ? '...' : todoTasks}</div>
                      <div className="text-sm text-muted-foreground">To Do</div>
                    </div>
                    <div className="bg-muted rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold">{isLoadingTasks ? '...' : inProgressTasks}</div>
                      <div className="text-sm text-muted-foreground">In Progress</div>
                    </div>
                    <div className="bg-muted rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold">{isLoadingTasks ? '...' : reviewTasks}</div>
                      <div className="text-sm text-muted-foreground">Review</div>
                    </div>
                    <div className="bg-muted rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold">{isLoadingTasks ? '...' : completedTasks}</div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="tasks" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Project Tasks ({isLoadingTasks ? '...' : totalTasks})</h2>
              <div className="flex gap-2">
                <Button onClick={() => handleAddTask(false)} disabled={isLoadingTasks}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
                <Button variant="outline" onClick={() => handleAddTask(true)} disabled={isLoadingTasks}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Task
                </Button>
              </div>
            </div>
            
            {isLoadingTasks ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading tasks...</p>
                {/* Optional: Add a spinner here */}
              </div>
            ) : projectTasks.length > 0 ? (
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
                        <div className="flex -space-x-2 overflow-hidden">
                          {task.assignees.slice(0, 3).map(assignee => (
                            <Avatar key={assignee.id} className="h-6 w-6 border-2 border-background">
                              <AvatarFallback className="text-xs">
                                {(assignee.name && typeof assignee.name === 'string' 
                                  ? assignee.name.substring(0, 2).toUpperCase() 
                                  : (typeof assignee.email === 'string' ? assignee.email.substring(0,1).toUpperCase() : '??'))}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {task.assignees.length > 3 && (
                            <Avatar className="h-6 w-6 border-2 border-background">
                               <AvatarFallback className="text-xs bg-muted-foreground text-background">
                                 +{task.assignees.length - 3}
                               </AvatarFallback>
                             </Avatar>
                          )}
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
              <h2 className="text-xl font-semibold">Comments ({projectComments.length})</h2>
            </div>
            
            <Card className="mb-0">
              <CardContent className="p-0">
                {/* Comments Display updated to use projectComments state and recursive renderer */}
                <div 
                  ref={commentSectionRef}
                  className="max-h-[500px] overflow-y-auto p-4 space-y-4"
                >
                  {isLoadingProjectComments && <p>Loading comments...</p>}
                  {projectCommentError && <p className="text-red-500">{projectCommentError}</p>}
                  {!isLoadingProjectComments && !projectCommentError && projectComments.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No comments yet. Start the conversation!</p>
                    </div>
                  )}
                  {!isLoadingProjectComments && !projectCommentError && projectComments.length > 0 && (
                     renderProjectCommentsRecursive(projectComments)
                  )}
                </div>
                
                {/* Comment input area updated to use new state variables */}
                <div className="border-t p-4">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback>{user?.name?.substring(0,2).toUpperCase() || 'ME'}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-2">
                      <Textarea 
                        placeholder={replyingToProjectCommentId ? "Write a reply..." : "Add a comment..."}
                        className="min-h-[80px] resize-none"
                        value={newProjectCommentText} // Use new state variable
                        onChange={(e) => setNewProjectCommentText(e.target.value)} // Update new state variable
                      />
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          {/* Placeholder for future icons like @mention, attachment */}
                        </div>
                        
                        <Button 
                          onClick={handleAddComment} // This now calls the API version
                          className="gap-2"
                          disabled={!newProjectCommentText.trim() || isLoadingProjectComments} // Disable while loading
                        >
                          <SendIcon className="h-4 w-4" />
                          {replyingToProjectCommentId ? 'Send Reply' : 'Send Comment'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <ProjectDialog 
        isOpen={isProjectDialogOpen}
        onClose={() => setIsProjectDialogOpen(false)}
        editingProject={project}
        projects={projects}
        onSave={(updatedProject) => {
          updateProject(updatedProject, updatedProject.id);
          setIsProjectDialogOpen(false);
          toast.success('Project updated successfully');
        }}
      />
      
      <TaskDialog 
        isOpen={isTaskDialogOpen}
        onClose={() => setIsTaskDialogOpen(false)}
        editingTask={null}
        defaultProject={project.id}
        onSave={(savedTask) => {
          setIsTaskDialogOpen(false);
          toast.success(`Task "${savedTask.title}" created successfully!`);
        }}
      />
      
      <TaskEventDialog 
        isOpen={isTimelineTaskDialogOpen}
        onClose={() => setIsTimelineTaskDialogOpen(false)}
        task={editingTask ? { ...editingTask } : { 
          id: '', 
          title: '',
          description: '', 
          status: 'todo',
          priority: 'medium', 
          assignees: [],
          project_id: project.id,
          project: { id: project.id, name: project.name }, 
          taskType: 'meeting',
          owner_id: project.ownerId,
          owner: project.owner,
          created_at: new Date().toISOString(), 
          updated_at: new Date().toISOString(),
          dueDate: null,
          startDate: null,
          endDate: null,
          duration: null,
          dependencies: [],
          showInTimeline: true, 
          showInKanban: true, 
        } as Task }
        onSave={(taskDataFromDialog) => {
          const payload: ApiTaskCreatePayload = {
            title: taskDataFromDialog.title || 'New Scheduled Event',
            description: taskDataFromDialog.description,
            status: taskDataFromDialog.status || 'todo',
            priority: taskDataFromDialog.priority || 'medium',
            task_type: taskDataFromDialog.taskType || 'meeting',
            project_id: project.id, 
            assignee_ids: taskDataFromDialog.assignees?.map(a => a.id) || [],
            due_date: taskDataFromDialog.dueDate ? format(new Date(taskDataFromDialog.dueDate), 'yyyy-MM-dd') : undefined,
            start_date: taskDataFromDialog.startDate ? new Date(taskDataFromDialog.startDate).toISOString() : undefined,
            end_date: taskDataFromDialog.endDate ? new Date(taskDataFromDialog.endDate).toISOString() : undefined,
            duration_minutes: taskDataFromDialog.duration,
          };
          addTask(payload);
          setIsTimelineTaskDialogOpen(false);
        }}
      />
    </MainLayout>
  );
};

export default ProjectDetail;
