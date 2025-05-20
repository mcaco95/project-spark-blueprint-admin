import React, { useEffect, useState } from 'react';
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
import { format, parseISO, addMinutes, parse } from 'date-fns';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useAuth, fetchApi } from '@/contexts/AuthContext';
import { ApiTaskCreatePayload } from '@/contexts/tasks/taskActions';
import { toast } from 'sonner';

// Define UserSimple interface locally if not already imported broadly
interface UserSimple {
  id: string;
  name?: string | null;
  email: string;
}

interface TaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingTask: Task | null;
  defaultProject?: string;
  onSave?: (task: Task) => void;
  initialDate?: Date;
}

const availableUsers: {name: string}[] = [];

export function TaskDialog({ isOpen, onClose, editingTask, defaultProject, onSave, initialDate }: TaskDialogProps) {
  const { addTask, updateTask, getAllTasks } = useTaskContext();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [internalFetchedProjects, setInternalFetchedProjects] = useState<{id: string, name: string}[]>([]);
  const [projectMembers, setProjectMembers] = useState<UserSimple[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState<boolean>(false);

  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [status, setStatus] = React.useState<'todo' | 'in-progress' | 'review' | 'done'>('todo');
  const [priority, setPriority] = React.useState<'low' | 'medium' | 'high'>('medium');
  const [assignees, setAssignees] = React.useState<string[]>([]);
  const [selectedAssignee, setSelectedAssignee] = React.useState<string>('');
  const [projectId, setProjectId] = React.useState<string>('');
  const [projectName, setProjectName] = React.useState<string>('');
  const [taskType, setTaskType] = React.useState<'task' | 'meeting'>('task');
  
  const [dueDate, setDueDate] = React.useState<Date | undefined>(undefined);
  const [date, setDate] = React.useState<string>('');
  const [time, setTime] = React.useState<string>('');
  const [duration, setDuration] = React.useState<number>(30);

  const [dependencies, setDependencies] = React.useState<string[]>([]);
  const [dependencyType, setDependencyType] = React.useState<string>('finish-to-start');
  
  const allTasks = getAllTasks();

  useEffect(() => {
    const loadProjects = async () => {
      if (isOpen && token && internalFetchedProjects.length === 0) {
        try {
          const projectsFromApi = await fetchApi<{ id: string; name: string; }[], undefined>(
            '/projects/',
            'GET',
            undefined,
            token
          );
          if (projectsFromApi && Array.isArray(projectsFromApi)) {
            setInternalFetchedProjects(projectsFromApi);
          }
        } catch (error) {
          console.error("Failed to fetch projects:", error);
          toast.error("Failed to load projects for selection.");
        }
      }
    };
    loadProjects();
  }, [isOpen, token, internalFetchedProjects.length]);

  // Fetch project members when projectId changes
  useEffect(() => {
    const fetchMembers = async () => {
      if (isOpen && token && projectId) {
        setIsLoadingMembers(true);
        setProjectMembers([]); // Clear previous members
        try {
          const members = await fetchApi<
            // Assuming API returns ProjectMemberOutput[] which contains a nested user object
            { user: UserSimple }[], 
            undefined
          >(
            `/projects/${projectId}/members`,
            'GET',
            undefined,
            token
          );
          if (members && Array.isArray(members)) {
            const extractedUsers = members.map(member => member.user).filter(Boolean);
            setProjectMembers(extractedUsers);
          } else {
            setProjectMembers([]);
          }
        } catch (error) {
          console.error(`Failed to fetch project members for project ${projectId}:`, error);
          toast.error("Failed to load project members.");
          setProjectMembers([]);
        } finally {
          setIsLoadingMembers(false);
        }
      } else if (!projectId) {
        setProjectMembers([]); // Clear members if no project is selected
      }
    };

    fetchMembers();
  }, [isOpen, token, projectId]); // Depend on the projectId state of this dialog

  useEffect(() => {
    if (isOpen) {
      if (editingTask) {
        setTitle(editingTask.title);
        setDescription(editingTask.description || '');
        setStatus(editingTask.status as 'todo' | 'in-progress' | 'review' | 'done');
        setPriority(editingTask.priority || 'medium');
        setAssignees(editingTask.assignees ? editingTask.assignees.map(a => a.id) : []);
        setProjectId(editingTask.project_id || '');
        setProjectName(editingTask.project ? editingTask.project.name : '');
        setTaskType(editingTask.taskType || 'task');
        
        if (editingTask.dueDate && typeof editingTask.dueDate === 'string') {
          try {
            setDueDate(parse(editingTask.dueDate, 'yyyy-MM-dd', new Date()));
          } catch (err) {
            console.error("Error parsing dueDate string for edit:", editingTask.dueDate, err);
            setDueDate(undefined); // Fallback if parsing fails
          }
        } else if (editingTask.dueDate instanceof Date) {
          setDueDate(editingTask.dueDate); // If it's already a Date object
        } else {
          setDueDate(undefined);
        }
        setDate(editingTask.date || '');
        setTime(editingTask.time || '');
        setDuration(editingTask.duration || 30);
        
        setDependencies(editingTask.dependencies ? editingTask.dependencies.map(d => d.id) : []);
        setDependencyType(editingTask.dependencyType || 'finish-to-start');

      } else {
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
        
        if (defaultProject && internalFetchedProjects.some(p => p.id === defaultProject)) {
          setProjectId(defaultProject);
          const project = internalFetchedProjects.find(p => p.id === defaultProject);
          setProjectName(project ? project.name : '');
        } else if (internalFetchedProjects.length > 0) {
          setProjectId(internalFetchedProjects[0].id);
          setProjectName(internalFetchedProjects[0].name);
        } else {
          setProjectId('');
          setProjectName('');
        }
      }
    }
  }, [isOpen, editingTask, defaultProject, initialDate, internalFetchedProjects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTask) {
      const taskDataToUpdate: Omit<Task, 'id' | 'assignees' | 'dependencies' | 'project'> & { project: {id: string, name: string}, assignees: string[], dependencies: string[] } = {
        title,
        description: description || undefined,
        status,
        priority,
        project_id: projectId,
        project: { id: projectId, name: projectName },
        taskType,
        assignees: assignees,
        dependencies: dependencies,
        dependencyType: dependencyType as any,
        dueDate: taskType === 'task' ? dueDate : undefined,
        date: taskType === 'meeting' ? date : undefined,
        time: taskType === 'meeting' ? time : undefined,
        duration: taskType === 'meeting' ? duration : undefined,
        owner_id: editingTask.owner_id,
        owner: editingTask.owner,
        created_at: editingTask.created_at,
      };
      console.log('Prepared for local update (API pending):', taskDataToUpdate);
      console.warn("Task update with API not yet implemented for kanban/TaskDialog. Local update simulated.");
      toast.info("Task update (local) - API integration pending.");
      if (onSave) {
      }
      onClose();

    } else {
      if (!projectId) {
        toast.error("Project is required to create a task.");
        return;
      }

      const payload: ApiTaskCreatePayload = {
        title,
        description: description || null,
        status,
        priority: priority || null,
        task_type: taskType,
        project_id: projectId, 
        assignee_ids: assignees || [],
        depends_on_task_ids: dependencies || [],
        dependency_type_for_new: dependencyType || null,
      };

      if (taskType === 'task') {
        payload.due_date = dueDate ? format(dueDate, "yyyy-MM-dd") : null;
      } else {
        if (date && time) {
          try {
            const startDateIso = parseISO(`${date}T${time}:00`).toISOString();
            payload.start_date = startDateIso;
            if (duration) {
              const endDate = addMinutes(parseISO(startDateIso), duration);
              payload.end_date = endDate.toISOString();
            }
            payload.duration_minutes = duration;
          } catch (err) {
            console.error("Error parsing meeting date/time:", err);
            toast.error("Invalid date or time format for meeting.");
            return;
          }
        }
      }
      
      try {
        const createdTask = await addTask(payload);
        if (createdTask) {
          toast.success("Task created successfully!");
          if (onSave) {
            onSave(createdTask); 
          } else {
            onClose();
            navigate(`/tasks/${createdTask.id}`); 
          }
        } else {
        }
      } catch (error: any) {
        console.error("Error in handleSubmit calling addTask:", error);
        toast.error(`Error creating task: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleAddAssignee = () => {
    if (selectedAssignee && !assignees.includes(selectedAssignee)) {
      setAssignees([...assignees, selectedAssignee]);
      setSelectedAssignee('');
    }
  };

  const handleRemoveAssignee = (assigneeToRemove: string) => {
    setAssignees(assignees.filter(a => a !== assigneeToRemove));
  };

  const handleProjectChange = (selectedProjectId: string) => {
    const project = internalFetchedProjects.find(p => p.id === selectedProjectId);
    setProjectId(selectedProjectId);
    setProjectName(project ? project.name : '');
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDueDate(selectedDate);
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
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project" className="text-right">Project</Label>
              <Select 
                value={projectId} 
                onValueChange={handleProjectChange}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select project">
                    {projectName || "Select project"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {internalFetchedProjects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                  {internalFetchedProjects.length === 0 && token && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">No projects found or still loading...</div>
                  )}
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
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="assignees" className="text-right">Assignees</Label>
              <div className="col-span-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Select onValueChange={setSelectedAssignee} value={selectedAssignee}>
                    <SelectTrigger id="task-assignees">
                      <SelectValue placeholder={isLoadingMembers ? "Loading members..." : "Select member to add"} />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingMembers && <SelectItem value="loading" disabled>Loading...</SelectItem>}
                      {!isLoadingMembers && projectMembers.length === 0 && <SelectItem value="no-members" disabled>No members or project not selected</SelectItem>}
                      {projectMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id} disabled={assignees.includes(member.id)}>
                          {member.name || member.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" onClick={handleAddAssignee} disabled={!selectedAssignee || isLoadingMembers}>
                    Add
                  </Button>
                </div>
                
                <div className="mt-2 space-x-1 space-y-1">
                  {assignees.map((assigneeId) => {
                    const member = projectMembers.find(m => m.id === assigneeId);
                    return (
                      <Badge key={assigneeId} variant="secondary" className="mr-1 mb-1">
                        {member ? (member.name || member.email) : assigneeId}
                        <button
                          type="button"
                          className="ml-1.5 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          onClick={() => handleRemoveAssignee(assigneeId)}
                        >
                          <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>
            
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
                      onMouseDownCapture={(e) => {
                        e.preventDefault();
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
                      {dependencies.map((depIdOrTitle) => {
                        const task = allTasks.find(t => t.id === depIdOrTitle || t.title === depIdOrTitle);
                        return task ? (
                          <Badge key={task.id} variant="outline" className="flex items-center gap-1">
                            {task.title}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-4 w-4 p-0 rounded-full"
                              onClick={() => setDependencies(dependencies.filter(id => id !== task.id))}
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
