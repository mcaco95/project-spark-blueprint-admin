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
import { useTaskContext } from '@/contexts/TaskContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface TaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingTask: Task | null;
  defaultProject?: string;
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

export function TaskDialog({ isOpen, onClose, editingTask, defaultProject }: TaskDialogProps) {
  const { addTask, updateTask } = useTaskContext();
  const navigate = useNavigate();
  
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [status, setStatus] = React.useState<'todo' | 'in-progress' | 'review' | 'done'>('todo');
  const [priority, setPriority] = React.useState<'low' | 'medium' | 'high'>('medium');
  const [assignees, setAssignees] = React.useState<string[]>([]);
  const [selectedAssignee, setSelectedAssignee] = React.useState<string>('');
  const [projectId, setProjectId] = React.useState<string>('');
  const [projectName, setProjectName] = React.useState<string>('');

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
      } else {
        setTitle('');
        setDescription('');
        setStatus('todo');
        setPriority('medium');
        setAssignees([]);
        
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
  }, [isOpen, editingTask, defaultProject]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const taskData: Omit<Task, 'id'> = {
      title,
      description: description || undefined,
      status,
      priority,
      assignees,
      projectId,
      project: projectName,
    };
    
    let taskId = '';
    
    if (editingTask) {
      taskId = editingTask.id;
      updateTask({ id: taskId, ...taskData });
    } else {
      taskId = `task-${Math.random().toString(36).substring(2, 9)}`;
      addTask({ id: taskId, ...taskData });
    }
    
    onClose();
    
    // Navigate to task detail page
    navigate(`/tasks/${taskId}`);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                rows={3}
              />
            </div>
            
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
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
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
