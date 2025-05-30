
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Task } from '@/types/task';
import { useTaskContext } from '@/contexts/tasks/TaskContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { X, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

interface TaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingTask: Task | null;
  defaultProject?: string;
  onSave?: (task: Task) => void;
  initialDate?: Date;
}

// Mock projects for the dialog
const availableProjects = [
  { id: '1', name: 'Website Redesign' },
  { id: '2', name: 'Mobile App Development' },
  { id: '3', name: 'Marketing Campaign' },
];

// Mock users for the dialog
const availableUsers = [
  { name: 'Admin User' },
  { name: 'Regular User' },
  { name: 'Project Manager' },
  { name: 'Developer 1' },
  { name: 'Designer 1' },
  { name: 'Designer 2' },
];

export function TaskDialog({ isOpen, onClose, editingTask, defaultProject, onSave, initialDate }: TaskDialogProps) {
  const { addTask, updateTask, getAllTasks } = useTaskContext();
  const navigate = useNavigate();
  
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [status, setStatus] = React.useState<'todo' | 'in-progress' | 'review' | 'done'>('todo');
  const [priority, setPriority] = React.useState<'low' | 'medium' | 'high'>('medium');
  const [assignees, setAssignees] = React.useState<string[]>([]);
  const [selectedAssignee, setSelectedAssignee] = React.useState<string>('');
  const [projectId, setProjectId] = React.useState<string>('');
  const [projectName, setProjectName] = React.useState<string>('');
  const [taskType, setTaskType] = React.useState<'task' | 'meeting'>('task');
  
  // Date and time fields
  const [dueDate, setDueDate] = React.useState<Date | undefined>(undefined);
  const [date, setDate] = React.useState<string>('');
  const [time, setTime] = React.useState<string>('');
  const [duration, setDuration] = React.useState<number>(30);

  // Dependencies
  const [dependencies, setDependencies] = React.useState<string[]>([]);
  const [dependencyType, setDependencyType] = React.useState<string>('finish-to-start');
  
  // Get all tasks for dependencies
  const allTasks = getAllTasks();

  // Reset form or populate with task data when opening
  useEffect(() => {
    if (isOpen) {
      if (editingTask) {
        setTitle(editingTask.title);
        setDescription(editingTask.description || '');
        setStatus(editingTask.status as 'todo' | 'in-progress' | 'review' | 'done');
        setPriority(editingTask.priority || 'medium');
        setAssignees(editingTask.assignees || []);
        setProjectId(editingTask.projectId || '1');
        setProjectName(editingTask.project || 'Website Redesign');
        setTaskType(editingTask.taskType || 'task');
        
        // Set date fields if available
        if (editingTask.dueDate) {
          setDueDate(new Date(editingTask.dueDate));
        }
        
        setDate(editingTask.date || '');
        setTime(editingTask.time || '');
        setDuration(editingTask.duration || 30);
        
        // Set dependencies
        setDependencies(editingTask.dependencies || []);
        setDependencyType(editingTask.dependencyType || 'finish-to-start');
      } else {
        // Reset form for new task
        setTitle('');
        setDescription('');
        setStatus('todo');
        setPriority('medium');
        setAssignees([]);
        setTaskType('task');
        setDueDate(undefined);
        setDate(initialDate ? format(initialDate, 'yyyy-MM-dd') : '');
        setTime('');
        setDuration(30);
        setDependencies([]);
        setDependencyType('finish-to-start');
        
        // Use defaultProject if provided
        if (defaultProject) {
          setProjectId(defaultProject);
          const project = availableProjects.find(p => p.id === defaultProject);
          setProjectName(project ? project.name : '');
        } else {
          setProjectId('1');
          setProjectName('Website Redesign');
        }
      }
    }
  }, [isOpen, editingTask, defaultProject, initialDate, getAllTasks]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare task data based on task type
    const taskData: Omit<Task, 'id'> = {
      title,
      description: description || undefined,
      status,
      priority,
      assignees,
      projectId,
      project: projectName,
      taskType,
      dependencies,
      dependencyType: dependencyType as any,
    };

    // Add specific fields based on task type
    if (taskType === 'task') {
      taskData.dueDate = dueDate;
    } else {
      // It's a meeting
      taskData.date = date;
      taskData.time = time;
      taskData.duration = duration;
    }
    
    let taskId = '';
    
    if (editingTask) {
      taskId = editingTask.id;
      updateTask({ id: taskId, ...taskData });
    } else {
      taskId = `task-${Math.random().toString(36).substring(2, 9)}`;
      addTask({ id: taskId, ...taskData });
    }
    
    // If onSave is provided, call it with the task data
    if (onSave) {
      onSave({ id: taskId, ...taskData });
    } else {
      onClose();
      
      // Navigate to task detail page
      navigate(`/tasks/${taskId}`);
    }
  };

  const handleAddAssignee = () => {
    if (selectedAssignee && !assignees.includes(selectedAssignee)) {
      setAssignees([...assignees, selectedAssignee]);
      setSelectedAssignee('');
    }
  };

  const handleRemoveAssignee = (assignee: string) => {
    setAssignees(assignees.filter(a => a !== assignee));
  };

  const handleProjectChange = (value: string) => {
    const project = availableProjects.find(p => p.id === value);
    setProjectId(value);
    setProjectName(project ? project.name : '');
  };

  // Fix the calendar component's onSelect handling
  const handleDateSelect = (date: Date | undefined) => {
    setDueDate(date);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
            <DialogDescription>
              {editingTask 
                ? 'Make changes to the task here.'
                : 'Add a new task to your project.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Task Type */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="taskType" className="text-right">Task Type</Label>
              <Select
                value={taskType}
                onValueChange={(value: 'task' | 'meeting') => setTaskType(value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select task type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="task">Regular Task</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Title */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
                required
                placeholder="Enter task title"
              />
            </div>
            
            {/* Description */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                rows={3}
                placeholder="Define task scope and details"
              />
            </div>
            
            {/* Project */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project" className="text-right">Project</Label>
              <Select 
                value={projectId} 
                onValueChange={handleProjectChange}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {availableProjects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Status */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Status</Label>
              <Select 
                value={status} 
                onValueChange={(value) => setStatus(value as any)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Priority */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="priority" className="text-right">Priority</Label>
              <Select 
                value={priority} 
                onValueChange={(value) => setPriority(value as any)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Date fields based on task type */}
            {taskType === 'task' ? (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dueDate" className="text-right">Due Date</Label>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dueDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={dueDate}
                        onSelect={handleDateSelect}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            ) : (
              <>
                {/* Meeting fields */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">Date</Label>
                  <div className="col-span-3 flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="time" className="text-right">Time</Label>
                  <div className="col-span-3 flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="time"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="duration" className="text-right">Duration (min)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min={5}
                    step={5}
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
                    className="col-span-3"
                  />
                </div>
              </>
            )}
            
            {/* Assignees */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="assignees" className="text-right">Assignees</Label>
              <div className="col-span-3 space-y-2">
                <div className="flex gap-2">
                  <Select 
                    value={selectedAssignee} 
                    onValueChange={setSelectedAssignee}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map(user => (
                        <SelectItem key={user.name} value={user.name}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={handleAddAssignee} size="sm">
                    Add
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-1 mt-2">
                  {assignees.map((assignee, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      <Avatar className="h-4 w-4">
                        <AvatarFallback className="text-[10px]">
                          {assignee.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {assignee}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-4 w-4 p-0 rounded-full"
                        onClick={() => handleRemoveAssignee(assignee)}
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Dependencies */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dependencies" className="text-right">Dependencies</Label>
              <Select
                value={dependencies.length > 0 ? "has-dependencies" : "no-dependencies"}
                onValueChange={(value) => {
                  if (value === "no-dependencies") {
                    setDependencies([]);
                  }
                }}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Dependencies">
                    {dependencies.length === 0 ? "No dependencies" : `${dependencies.length} dependencies`}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-dependencies">No dependencies</SelectItem>
                  {allTasks.map(task => (
                    <SelectItem 
                      key={task.id} 
                      value={task.id}
                      onClick={() => {
                        if (task.id !== editingTask?.id && !dependencies.includes(task.id)) {
                          setDependencies([...dependencies, task.id]);
                        }
                      }}
                    >
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {dependencies.length > 0 && (
              <>
                <div className="grid grid-cols-4 items-start gap-4">
                  <div className="col-start-2 col-span-3">
                    <div className="flex flex-wrap gap-1">
                      {dependencies.map((depId) => {
                        const task = allTasks.find(t => t.id === depId);
                        return task ? (
                          <Badge key={depId} variant="outline" className="flex items-center gap-1">
                            {task.title}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-4 w-4 p-0 rounded-full"
                              onClick={() => setDependencies(dependencies.filter(id => id !== depId))}
                              type="button"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dependencyType" className="text-right">Dependency Type</Label>
                  <Select 
                    value={dependencyType} 
                    onValueChange={setDependencyType}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select dependency type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="finish-to-start">Finish to Start (FS)</SelectItem>
                      <SelectItem value="start-to-start">Start to Start (SS)</SelectItem>
                      <SelectItem value="finish-to-finish">Finish to Finish (FF)</SelectItem>
                      <SelectItem value="start-to-finish">Start to Finish (SF)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{editingTask ? 'Update Task' : 'Create Task'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
