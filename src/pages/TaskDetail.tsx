import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { MainLayout } from '@/components/layout/MainLayout';
import { useTaskContext } from '@/contexts/TaskContext';
import { Task, TaskComment } from '@/types/task';
import { toast } from 'sonner';
import { 
  Clock, 
  Calendar, 
  ArrowLeft,
  CheckCircle, 
  Circle, 
  Edit, 
  Trash, 
  MessageSquare,
  Paperclip,
  Send,
  Smile
} from 'lucide-react';

import {
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Badge 
} from '@/components/ui/badge';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Avatar, 
  AvatarFallback 
} from '@/components/ui/avatar';
import { 
  Button 
} from '@/components/ui/button';
import { 
  Textarea 
} from '@/components/ui/textarea';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { TaskDialog } from '@/components/kanban/TaskDialog';
import { v4 as uuidv4 } from 'uuid';
import PomodoroButton from '@/components/pomodoro/PomodoroButton';

// Generate random users for demo
const users = [
  { name: 'Admin User', avatar: 'AU' },
  { name: 'Regular User', avatar: 'RU' },
  { name: 'Project Manager', avatar: 'PM' },
  { name: 'Designer 1', avatar: 'D1' },
  { name: 'Developer 1', avatar: 'DE' },
];

// Custom color mapping based on project
const projectColors: Record<string, string> = {
  'Website Redesign': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'Mobile App Development': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  'Marketing Campaign': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'All Projects': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

// Status colors
const statusColors: Record<string, string> = {
  'todo': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'review': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  'done': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
};

// Priority colors
const priorityColors: Record<string, string> = {
  'low': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'medium': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  'high': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const TaskDetail = () => {
  const { t } = useTranslation(['common', 'tasks']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAllTasks, updateTask, deleteTask } = useTaskContext();
  
  const [task, setTask] = useState<Task | null>(null);
  const [comment, setComment] = useState('');
  const [currentUser] = useState(users[0]); // Default to Admin User for demo
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Load task data
  useEffect(() => {
    if (id) {
      const tasks = getAllTasks();
      const foundTask = tasks.find(t => t.id === id);
      if (foundTask) {
        setTask(foundTask);
      } else {
        toast.error(t('taskNotFound', { ns: 'tasks' }));
        navigate('/tasks/kanban');
      }
    }
  }, [id, getAllTasks, navigate, t]);

  // Format date depending on the type
  const formatTaskDate = (dateString?: string | Date) => {
    if (!dateString) return t('noDate', { ns: 'tasks' });
    
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      return format(date, 'PPP');
    } catch (e) {
      return t('invalidDate', { ns: 'tasks' });
    }
  };

  // Handle status change
  const handleStatusChange = (newStatus: Task['status']) => {
    if (task) {
      const updatedTask = { ...task, status: newStatus };
      updateTask(updatedTask);
      setTask(updatedTask);
      toast.success(t('statusUpdated', { ns: 'tasks' }));
    }
  };

  // Handle comment submission
  const handleAddComment = () => {
    if (!comment.trim() || !task) return;
    
    const newComment: TaskComment = {
      id: uuidv4(),
      content: comment.trim(),
      author: currentUser.name,
      createdAt: new Date(),
      mentions: extractMentions(comment),
    };
    
    const updatedTask = { 
      ...task, 
      comments: [...(task.comments || []), newComment] 
    };
    
    updateTask(updatedTask);
    setTask(updatedTask);
    setComment('');
    toast.success(t('commentAdded', { ns: 'tasks' }));
  };

  // Extract @mentions from comment
  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      // Find if this mention matches a user
      const mentionedUser = users.find(
        user => user.name.toLowerCase().replace(' ', '') === match[1].toLowerCase()
      );
      
      if (mentionedUser) {
        mentions.push(mentionedUser.name);
      }
    }
    
    return mentions;
  };

  // Handle edit task
  const handleEditTask = () => {
    setIsEditDialogOpen(true);
  };

  // Save edited task
  const handleSaveTask = (updatedTask: Task) => {
    updateTask(updatedTask);
    setTask(updatedTask);
    setIsEditDialogOpen(false);
    toast.success(t('taskUpdated', { ns: 'tasks' }));
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (task) {
      deleteTask(task.id);
      setIsDeleteDialogOpen(false);
      toast.success(t('taskDeleted', { ns: 'tasks' }));
      navigate('/tasks/kanban');
    }
  };

  // Check if there's no task found
  if (!task) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{t('taskNotFound', { ns: 'tasks' })}</CardTitle>
              <CardDescription>
                {t('taskMayHaveBeenDeleted', { ns: 'tasks' })}
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => navigate('/tasks/kanban')}>
                {t('backToTasks', { ns: 'tasks' })}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Render comment with @mentions highlighted
  const renderCommentWithMentions = (text?: string) => {
    if (!text) return '';
    
    return text.split(' ').map((word, index) => {
      if (word.startsWith('@')) {
        const username = word.substring(1);
        const mentionedUser = users.find(
          user => user.name.toLowerCase().replace(' ', '') === username.toLowerCase()
        );
        
        if (mentionedUser) {
          return (
            <span key={index}>
              <span className="text-primary font-medium">
                {word}
              </span>{' '}
            </span>
          );
        }
      }
      return <span key={index}>{word} </span>;
    });
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        <div className="mb-6 flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t('back', { ns: 'common' })}
          </Button>
          
          <h1 className="text-2xl font-bold flex-grow">{task.title}</h1>
          
          <div className="flex gap-2">
            <PomodoroButton task={task} />
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleEditTask}
            >
              <Edit className="h-4 w-4 mr-2" />
              {t('edit', { ns: 'common' })}
            </Button>
            
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash className="h-4 w-4 mr-2" />
              {t('delete', { ns: 'common' })}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column - Task details */}
          <div className="md:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{t('taskDetails', { ns: 'tasks' })}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    {t('description', { ns: 'tasks' })}
                  </h3>
                  <p className="text-base">
                    {task.description || t('noDescription', { ns: 'tasks' })}
                  </p>
                </div>
                
                {task.date && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{formatTaskDate(task.date)}</span>
                    
                    {task.time && (
                      <>
                        <Clock className="h-4 w-4 ml-4 mr-2 text-muted-foreground" />
                        <span>{task.time}{task.duration ? ` (${task.duration}m)` : ''}</span>
                      </>
                    )}
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2">
                  <Badge className={statusColors[task.status]}>
                    {task.status === 'in-progress' ? 'In Progress' : 
                      task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                  </Badge>
                  
                  {task.priority && (
                    <Badge className={priorityColors[task.priority]}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                    </Badge>
                  )}
                  
                  {task.project && (
                    <Badge className={projectColors[task.project] || ''}>
                      {task.project}
                    </Badge>
                  )}
                  
                  {task.recurrence && (
                    <Badge variant="outline">
                      {t(task.recurrence, { ns: 'tasks' })}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Task tabs */}
            <Tabs defaultValue="comments">
              <TabsList className="w-full">
                <TabsTrigger value="comments" className="flex-1">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {t('comments', { ns: 'tasks' })} {task.comments?.length ? `(${task.comments.length})` : ''}
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex-1">
                  {t('activity', { ns: 'tasks' })}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="comments">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>{t('comments', { ns: 'tasks' })}</CardTitle>
                    <CardDescription>
                      {t('discussionAboutTask', { ns: 'tasks' })}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto mb-4 p-1">
                      {task.comments && task.comments.length > 0 ? (
                        task.comments.map((comment) => {
                          const commentUser = users.find(u => u.name === comment.author) || users[0];
                          
                          return (
                            <div key={comment.id} className="flex gap-3 animate-fade-in">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>{commentUser.avatar}</AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1">
                                <div className="bg-muted p-3 rounded-lg rounded-tl-none">
                                  <div className="flex justify-between items-start">
                                    <div className="font-medium mb-1">{comment.author}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                                    </div>
                                  </div>
                                  
                                  <div className="text-sm text-foreground">
                                    {renderCommentWithMentions(comment.content || comment.text)}
                                  </div>
                                  
                                  {comment.attachments && comment.attachments.length > 0 && (
                                    <div className="mt-2 flex gap-2">
                                      {comment.attachments.map((attachment, index) => (
                                        <div 
                                          key={index} 
                                          className="bg-background flex items-center px-2 py-1 rounded text-xs"
                                        >
                                          <Paperclip className="h-3 w-3 mr-1" />
                                          {attachment.name}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {comment.reactions && comment.reactions.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {comment.reactions.map((reaction, index) => (
                                        <div 
                                          key={index} 
                                          className="bg-background flex items-center px-2 py-1 rounded text-xs"
                                        >
                                          <span className="mr-1">{reaction.emoji}</span>
                                          {reaction.count}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                
                                {comment.mentions && comment.mentions.length > 0 && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Mentioned: {comment.mentions.join(', ')}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center text-muted-foreground py-8">
                          {t('noCommentsYet', { ns: 'tasks' })}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{currentUser.avatar}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 flex gap-2">
                        <Textarea 
                          placeholder={t('addComment', { ns: 'tasks' })}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="min-h-[70px] flex-1"
                        />
                        
                        <div className="flex flex-col gap-2">
                          <Button 
                            size="sm"
                            variant="ghost"
                            className="rounded-full"
                            type="button"
                          >
                            <Smile className="h-4 w-4" />
                          </Button>
                          
                          <Button 
                            size="sm"
                            variant="ghost"
                            className="rounded-full"
                            type="button"
                          >
                            <Paperclip className="h-4 w-4" />
                          </Button>
                          
                          <Button 
                            size="sm"
                            variant="default"
                            className="rounded-full"
                            onClick={handleAddComment}
                            disabled={!comment.trim()}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="activity">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('activity', { ns: 'tasks' })}</CardTitle>
                    <CardDescription>
                      {t('recentActivity', { ns: 'tasks' })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center text-muted-foreground py-8">
                      {t('comingSoon', { ns: 'tasks' })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right column - Status and assignees */}
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{t('status', { ns: 'tasks' })}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    variant={task.status === 'todo' ? 'default' : 'outline'} 
                    className="w-full justify-start"
                    onClick={() => handleStatusChange('todo')}
                  >
                    <Circle className="h-4 w-4 mr-2" />
                    {t('todo', { ns: 'tasks' })}
                  </Button>
                  
                  <Button 
                    variant={task.status === 'in-progress' ? 'default' : 'outline'} 
                    className="w-full justify-start"
                    onClick={() => handleStatusChange('in-progress')}
                  >
                    <Circle className="h-4 w-4 mr-2 text-blue-500" />
                    {t('inProgress', { ns: 'tasks' })}
                  </Button>
                  
                  <Button 
                    variant={task.status === 'review' ? 'default' : 'outline'} 
                    className="w-full justify-start"
                    onClick={() => handleStatusChange('review')}
                  >
                    <Circle className="h-4 w-4 mr-2 text-amber-500" />
                    {t('review', { ns: 'tasks' })}
                  </Button>
                  
                  <Button 
                    variant={task.status === 'completed' || task.status === 'done' ? 'default' : 'outline'} 
                    className="w-full justify-start"
                    onClick={() => handleStatusChange('completed')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    {t('completed', { ns: 'tasks' })}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('assignees', { ns: 'tasks' })}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {task.assignees && task.assignees.length > 0 ? (
                    task.assignees.map((assignee, index) => {
                      const assigneeUser = users.find(u => u.name === assignee) || 
                        { name: assignee, avatar: assignee.substring(0, 2).toUpperCase() };
                      
                      return (
                        <div key={index} className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarFallback>{assigneeUser.avatar}</AvatarFallback>
                          </Avatar>
                          <span>{assignee}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      {t('noAssignees', { ns: 'tasks' })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Edit task dialog */}
      <TaskDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        editingTask={task}
        defaultProject={task.projectId || undefined}
      />
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDelete', { ns: 'common' })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteTaskConfirmation', { ns: 'tasks' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel', { ns: 'common' })}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              {t('delete', { ns: 'common' })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default TaskDetail;
