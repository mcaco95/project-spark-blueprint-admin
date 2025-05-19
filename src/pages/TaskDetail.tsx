import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { MainLayout } from '@/components/layout/MainLayout';
import { useTaskContext } from '@/contexts/tasks/TaskContext';
import { Task, TaskComment } from '@/types/task';
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
import { v4 as uuidv4 } from 'uuid';

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

const reactionEmojis = ['👍', '👎', '❤️', '🎉', '👀', '🚀', '👏'];

const TaskDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTaskById, updateTask, deleteTask } = useTaskContext();
  const [task, setTask] = useState<Task | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const commentSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      const foundTask = getTaskById(id);
      if (foundTask) {
        // Initialize comments array if it doesn't exist
        if (!foundTask.comments) {
          foundTask.comments = [];
        }
        // Initialize taskType if it doesn't exist
        if (!foundTask.taskType) {
          // Determine task type based on whether it has date/time or dueDate
          foundTask.taskType = (foundTask.date && foundTask.time) ? 'meeting' : 'task';
        }
        setTask(foundTask);
      } else {
        console.warn(`Task with id ${id} not found.`);
        navigate('/tasks');
      }
      setIsLoading(false);
    }
  }, [id, getTaskById, navigate]);

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

  const handleAddComment = () => {
    if (!newComment.trim() || !task) return;
    
    const newCommentObj: TaskComment = {
      id: uuidv4(),
      text: newComment,
      author: 'Current User', // In a real app, this would be the logged-in user
      createdAt: new Date(),
      mentions: extractMentions(newComment),
    };
    
    const updatedTask = {
      ...task,
      comments: [...(task.comments || []), newCommentObj]
    };
    
    updateTask(updatedTask);
    setTask(updatedTask);
    setNewComment('');
    toast.success('Comment added successfully');
    
    // Scroll to bottom of comments section
    setTimeout(() => {
      if (commentSectionRef.current) {
        commentSectionRef.current.scrollTop = commentSectionRef.current.scrollHeight;
      }
    }, 100);
  };
  
  const extractMentions = (text: string) => {
    const mentionRegex = /@(\w+)/g;
    const matches = text.match(mentionRegex);
    return matches ? matches.map(match => match.substring(1)) : [];
  };
  
  const handleReaction = (commentId: string, emoji: string) => {
    if (!task || !task.comments) return;
    
    const updatedTask = { ...task };
    const commentIndex = updatedTask.comments.findIndex(c => c.id === commentId);
    
    if (commentIndex >= 0) {
      const comment = updatedTask.comments[commentIndex];
      
      if (!comment.reactions) {
        comment.reactions = [];
      }
      
      const existingReactionIndex = comment.reactions.findIndex(r => r.emoji === emoji);
      
      if (existingReactionIndex >= 0) {
        // User has already reacted with this emoji
        const existingReaction = comment.reactions[existingReactionIndex];
        
        if (existingReaction.users.includes('Current User')) {
          // Remove user from the reaction
          existingReaction.users = existingReaction.users.filter(u => u !== 'Current User');
          existingReaction.count = existingReaction.count - 1;
          
          // Remove reaction entirely if no users left
          if (existingReaction.count === 0) {
            comment.reactions = comment.reactions.filter(r => r.emoji !== emoji);
          }
        } else {
          // Add user to the reaction
          existingReaction.users.push('Current User');
          existingReaction.count = existingReaction.count + 1;
        }
      } else {
        // First reaction with this emoji
        comment.reactions.push({
          emoji,
          count: 1,
          users: ['Current User']
        });
      }
      
      updateTask(updatedTask);
      setTask(updatedTask);
    }
    
    setShowReactionPicker(null);
  };
  
  const handleEditTask = () => {
    navigate(`/tasks/edit/${id}`);
  };
  
  const formatMentions = (text: string) => {
    return text.replace(/@(\w+)/g, '<span class="text-blue-500 font-medium">@$1</span>');
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '';
    try {
      return format(new Date(date), 'MMM dd, yyyy');
    } catch (e) {
      return String(date);
    }
  };

  const formatTime = (time: string | undefined) => {
    if (!time) return '';
    return time;
  };

  const isScheduledTask = (task?: Task): boolean => {
    return task?.taskType === 'meeting' || !!(task?.date && task?.time);
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
                  
                  {task.projectId && (
                    <div className="flex items-center text-sm">
                      <span className="font-medium mr-2">Project:</span> 
                      <span className="text-muted-foreground">{task.project || 'Unknown project'}</span>
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
                                {assignee.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{assignee}</span>
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
                            <li key={idx}>{dep}</li>
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
              <h2 className="text-xl font-semibold">Comments ({task.comments?.length || 0})</h2>
            </div>
            
            <Card className="mb-0">
              <CardContent className="p-0">
                {/* Comments Display */}
                <div 
                  ref={commentSectionRef}
                  className="max-h-[500px] overflow-y-auto p-4 space-y-4"
                >
                  {task.comments && task.comments.length > 0 ? (
                    task.comments.map((comment: TaskComment) => (
                      <div key={comment.id} className="relative group">
                        <div className="flex items-start gap-3">
                          <Avatar className="mt-0.5">
                            <AvatarFallback>
                              {comment.author.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{comment.author}</span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                              </span>
                            </div>
                            
                            {/* Comment content with formatted mentions */}
                            <div className="prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: formatMentions(comment.text || '') }}
                            />
                            
                            {/* Comment actions */}
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex flex-wrap gap-1">
                                {comment.reactions && comment.reactions.map((reaction) => (
                                  <button 
                                    key={reaction.emoji}
                                    onClick={() => handleReaction(comment.id, reaction.emoji)}
                                    className={`text-xs px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                                      reaction.users.includes('Current User') 
                                        ? 'bg-blue-100 text-blue-800' 
                                        : 'bg-gray-100 hover:bg-gray-200'
                                    }`}
                                  >
                                    <span>{reaction.emoji}</span>
                                    <span>{reaction.count}</span>
                                  </button>
                                ))}
                              </div>
                              
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                <button 
                                  onClick={() => setShowReactionPicker(comment.id)}
                                  className="text-xs text-gray-500 hover:text-gray-700"
                                >
                                  <Smile className="h-3.5 w-3.5" />
                                </button>
                                <button 
                                  onClick={() => setReplyingTo(comment.id)}
                                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                                >
                                  <Reply className="h-3.5 w-3.5" />
                                  <span>Reply</span>
                                </button>
                              </div>
                            </div>
                            
                            {/* Reaction picker */}
                            {showReactionPicker === comment.id && (
                              <div className="absolute z-10 mt-1 p-1 bg-white border rounded-lg shadow-lg flex">
                                {reactionEmojis.map(emoji => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleReaction(comment.id, emoji)}
                                    className="p-1.5 hover:bg-gray-100 rounded"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                            
                            {/* Reply box */}
                            {replyingTo === comment.id && (
                              <div className="mt-2 pl-2 border-l-2 border-gray-200">
                                <div className="flex items-start gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-xs">CU</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <Textarea 
                                      placeholder={`Reply to ${comment.author}...`}
                                      className="min-h-[60px] text-sm"
                                      value={newComment}
                                      onChange={(e) => setNewComment(e.target.value)}
                                    />
                                    <div className="flex justify-end gap-2 mt-2">
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => setReplyingTo(null)}
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
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No comments yet. Start the conversation!</p>
                    </div>
                  )}
                </div>
                
                {/* Comment input area */}
                <div className="border-t p-4">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback>CU</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-2">
                      <Textarea 
                        placeholder="Add a comment..."
                        className="min-h-[80px] resize-none"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                      />
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <button className="hover:text-foreground">
                            <AtSign className="h-4 w-4" />
                          </button>
                          <button className="hover:text-foreground">
                            <PaperclipIcon className="h-4 w-4" />
                          </button>
                          <button className="hover:text-foreground">
                            <Smile className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <Button 
                          onClick={handleAddComment}
                          className="gap-2"
                          disabled={!newComment.trim()}
                        >
                          <SendIcon className="h-4 w-4" />
                          Send
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
