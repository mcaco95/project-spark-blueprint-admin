import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parse } from 'date-fns';
import { MainLayout } from '@/components/layout/MainLayout';
import { useTaskContext } from '@/contexts/tasks/TaskContext';
import { Task, UserSimple } from '@/types/task';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  CheckCircle,
  Clock,
  ListChecks,
  User,
  XCircle,
  ArrowLeft,
  Edit,
  Trash2,
  MessageSquare,
  PaperclipIcon,
  SendIcon,
  AtSign,
  Smile,
  Reply
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuth, fetchApi } from '@/contexts/AuthContext';

// Type for comments fetched from the API
export interface ApiComment {
  id: string;
  text_content: string;
  author: UserSimple;
  project_id?: string | null;
  task_id?: string | null;
  parent_comment_id?: string | null;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  replies: ApiComment[];
}

const taskStatusColors: Record<string, string> = {
  'todo': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'review': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  'done': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
};

const priorityColors: Record<string, string> = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const TaskDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTaskById, updateTask, deleteTask } = useTaskContext();
  const [task, setTask] = useState<Task | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  
  // Comment specific state
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const commentSectionRef = useRef<HTMLDivElement>(null);
  const { user, token } = useAuth();

  useEffect(() => {
    if (id) {
      const foundTask = getTaskById(id);
      if (foundTask) {
        const taskWithEnsuredType = { ...foundTask };
        if (!taskWithEnsuredType.taskType) {
            if (taskWithEnsuredType.dueDate) {
                taskWithEnsuredType.taskType = 'task';
            } else if (taskWithEnsuredType.date && taskWithEnsuredType.time) {
                taskWithEnsuredType.taskType = 'meeting';
            } else {
                taskWithEnsuredType.taskType = 'task';
            }
        }
        setTask(taskWithEnsuredType);
      } else {
        console.warn(`Task with id ${id} not found.`);
        navigate('/tasks');
      }
      setIsLoading(false);
    }
  }, [id, getTaskById, navigate]);

  useEffect(() => {
    const fetchTaskComments = async () => {
      if (!id || !token) {
        setComments([]);
        return;
      }
      setIsLoadingComments(true);
      setCommentError(null);
      try {
        const fetchedComments = await fetchApi<ApiComment[]>(`/comments/task/${id}/comments`, 'GET', undefined, token);
        setComments(fetchedComments || []);
      } catch (error) {
        console.error('Failed to fetch task comments:', error);
        setCommentError('Failed to load comments. Please try again.');
        setComments([]);
      } finally {
        setIsLoadingComments(false);
      }
    };

    if (id) {
      fetchTaskComments();
    }
  }, [id, token]);

  const handleStatusChange = (newStatus: Task['status']) => {
    if (task) {
      const updatedTask = { ...task, status: newStatus };
      updateTask(updatedTask);
      setTask(updatedTask);
      toast.success(`Task status updated to ${newStatus.replace('-', ' ')}`);
    }
  };

  const handleDeleteTask = () => {
    if (task?.id) {
      deleteTask(task.id);
      toast.success('Task deleted successfully');
      navigate('/tasks');
    }
  };

  const handleAddComment = async () => {
    if (!newCommentText.trim() || !task || !user || !token || !id) {
      toast.error("Cannot send empty comment or missing critical data.");
      return;
    }

    const payload: {
      text_content: string;
      parent_comment_id?: string;
    } = {
      text_content: newCommentText,
    };

    if (replyingToCommentId) {
      payload.parent_comment_id = replyingToCommentId;
    }

    setIsLoadingComments(true); 
    setCommentError(null);
    try {
      const newCommentFromApi = await fetchApi<ApiComment>(
        `/comments/task/${id}/comments`,
        'POST',
        payload,
        token
      );

      if (newCommentFromApi) {
        const fetchedComments = await fetchApi<ApiComment[]>(`/comments/task/${id}/comments`, 'GET', undefined, token);
        setComments(fetchedComments || []);
        toast.success(replyingToCommentId ? 'Reply sent successfully!' : 'Comment added successfully!');
        
        setTimeout(() => {
          if (commentSectionRef.current) {
            commentSectionRef.current.scrollTop = commentSectionRef.current.scrollHeight;
          }
        }, 100);
      } else {
        toast.error('Failed to add comment. The server did not return the new comment.');
        setCommentError('Failed to send comment. Please try again.');
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast.error(`Failed to add comment: ${errorMsg}`);
      setCommentError(`Failed to send comment: ${errorMsg}`);
    } finally {
      setNewCommentText('');
      setReplyingToCommentId(null);
      setIsLoadingComments(false);
    }
  };
  
  const handleEditTask = () => {
    navigate(`/tasks/edit/${id}`);
  };
  
  const formatMentions = (text: string) => {
    return text.replace(/@(\w+)/g, '<span class="text-blue-500 font-medium">@$1</span>');
  };

  const formatDate = (dateInput: Date | string | undefined | null) => {
    if (!dateInput) return '';
    try {
      const dateObj = typeof dateInput === 'string' ? 
        (dateInput.includes('T') ? new Date(dateInput) : parse(dateInput, 'yyyy-MM-dd', new Date())) : 
        dateInput;
      return format(dateObj, 'MMM dd, yyyy');
    } catch (e) {
      console.error("Error formatting date in TaskDetail:", dateInput, e);
      return String(dateInput);
    }
  };

  const formatTime = (time: string | undefined) => {
    if (!time) return '';
    return time;
  };

  const isScheduledTask = (currentTask?: Task): boolean => {
    return currentTask?.taskType === 'meeting' || (!currentTask?.taskType && !!(currentTask?.date && currentTask?.time));
  };

  if (isLoading) {
    return <MainLayout>Loading...</MainLayout>;
  }

  if (!task) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <h1 className="text-2xl font-bold mb-4">Task not found</h1>
          <p className="text-muted-foreground mb-6">The task you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/tasks')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tasks
          </Button>
        </div>
      </MainLayout>
    );
  }

  // Recursive function to render comments and their replies
  const renderCommentsRecursive = (commentList: ApiComment[], isReply = false) => {
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
                {format(new Date(comment.created_at), 'MMM d, h:mm a')}
              </span>
            </div>
            
            <div className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: formatMentions(comment.text_content || '') }}
            />
            
            <div className="flex items-center gap-2 mt-2">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                <button 
                  onClick={() => {
                    setReplyingToCommentId(comment.id);
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <Reply className="h-3.5 w-3.5" />
                  <span>Reply</span>
                </button>
              </div>
            </div>
            
            {replyingToCommentId === comment.id && (
              <div className="mt-2">
                <div className="flex items-start gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">{user?.name?.substring(0,2).toUpperCase() || 'ME'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea 
                      placeholder={`Reply to ${comment.author.name || comment.author.email}...`}
                      className="min-h-[60px] text-sm"
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      autoFocus
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setReplyingToCommentId(null)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm"
                        onClick={handleAddComment}
                      >
                        Reply
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-2">
                {renderCommentsRecursive(comment.replies, true)}
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
            <Button variant="outline" size="icon" className="mr-4" onClick={() => navigate('/tasks')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{task.title}</h1>
                <Badge className={taskStatusColors[task.status]}>
                  {task.status === 'in-progress' ? 'In Progress' : task.status}
                </Badge>
                {task.priority && (
                  <Badge variant="outline" className={priorityColors[task.priority]}>
                    {task.priority}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1">{task.description || 'No description provided'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleEditTask}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Task
            </Button>
            <Button variant="destructive" onClick={handleDeleteTask}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full max-w-md mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{isScheduledTask(task) ? 'Meeting Details' : 'Task Details'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {task.status && (
                    <div className="flex items-center text-sm">
                      <ListChecks className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="font-medium mr-2">Status:</span> 
                      <Badge className={taskStatusColors[task.status]}>
                        {task.status === 'in-progress' ? 'In Progress' : task.status}
                      </Badge>
                    </div>
                  )}
                  
                  {task.priority && (
                    <div className="flex items-center text-sm">
                      <span className="font-medium mr-2">Priority:</span> 
                      <Badge variant="outline" className={priorityColors[task.priority]}>
                        {task.priority}
                      </Badge>
                    </div>
                  )}
                  
                  {task.project_id && (
                    <div className="flex items-center text-sm">
                      <span className="font-medium mr-2">Project:</span> 
                      <span className="text-muted-foreground">
                        {task.project ? task.project.name : (task.project_id || 'Unknown project')}
                      </span>
                    </div>
                  )}
                  
                  {isScheduledTask(task) ? (
                    <>
                      <div className="flex items-center text-sm">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="font-medium mr-2">Date:</span> 
                        {task.date}
                      </div>
                      
                      <div className="flex items-center text-sm">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="font-medium mr-2">Time:</span> 
                        {task.time}
                        {task.duration && <span> ({task.duration} minutes)</span>}
                      </div>
                    </>
                  ) : (
                    <>
                      {task.dueDate && (
                        <div className="flex items-center text-sm">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span className="font-medium mr-2">Due Date:</span> 
                          {formatDate(task.dueDate)}
                        </div>
                      )}
                    </>
                  )}
                  
                  {task.assignees && task.assignees.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Assignees:</span>
                      </div>
                      <div className="flex flex-wrap gap-2 pl-6">
                        {task.assignees.map((assignee, idx) => (
                          <div key={idx} className="flex items-center bg-muted rounded-full px-3 py-1">
                            <Avatar className="h-5 w-5 mr-2">
                              <AvatarFallback className="text-xs">
                                {assignee.name ? assignee.name.substring(0, 2).toUpperCase() : (assignee.email ? assignee.email.substring(0,1).toUpperCase() : '??')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{assignee.name || assignee.email}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {task.dependencies && task.dependencies.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <span className="font-medium">Dependencies:</span>
                      </div>
                      <div className="pl-6">
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                          {task.dependencies.map((dep, idx) => (
                            <li key={idx}>{dep.title}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleStatusChange('todo')}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Mark as To Do
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleStatusChange('in-progress')}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Mark as In Progress
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleStatusChange('review')}
                  >
                    <ListChecks className="h-4 w-4 mr-2" />
                    Mark as In Review
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleStatusChange('done')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Done
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                    onClick={handleDeleteTask}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Task
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="comments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Comments ({comments.length})</h2>
            </div>
            
            <Card className="mb-0">
              <CardContent className="p-0">
                <div 
                  ref={commentSectionRef}
                  className="max-h-[500px] overflow-y-auto p-4 space-y-4"
                >
                  {isLoadingComments && <p>Loading comments...</p>}
                  {commentError && <p className="text-red-500">{commentError}</p>}
                  {!isLoadingComments && !commentError && comments.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No comments yet. Start the conversation!</p>
                    </div>
                  )}
                  {!isLoadingComments && !commentError && comments.length > 0 && (
                     renderCommentsRecursive(comments)
                  )}
                </div>
                
                <div className="border-t p-4">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback>{user?.name?.substring(0,2).toUpperCase() || 'ME'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <Textarea 
                        placeholder={replyingToCommentId ? "Write a reply..." : "Add a comment..."}
                        className="min-h-[80px] resize-none"
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                      />
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-muted-foreground">
                        </div>
                        <Button 
                          onClick={handleAddComment}
                          className="gap-2"
                          disabled={!newCommentText.trim() || isLoadingComments}
                        >
                          <SendIcon className="h-4 w-4" />
                          {replyingToCommentId ? 'Send Reply' : 'Send Comment'}
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
    </MainLayout>
  );
};

export default TaskDetail;
