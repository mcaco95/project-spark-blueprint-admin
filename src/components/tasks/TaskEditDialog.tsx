
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
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
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Task } from '@/types/task';
import { useTaskContext } from '@/contexts/tasks/TaskContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { X, Calendar, Clock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { TaskDependencySelect } from '@/components/tasks/TaskDependencySelect';
import { format } from 'date-fns';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingTask: Task | null;
  defaultProject?: string;
  onSave?: (task: Task) => void;
  initialDate?: Date;
  standalone?: boolean; // For use in the TaskEdit page
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

// Schema for the form
const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  taskType: z.enum(["task", "meeting"]),
  status: z.enum(["todo", "in-progress", "review", "done", "completed"]),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: z.date().nullable().optional(),
  projectId: z.string().optional(),
  assignees: z.array(z.string()),
  date: z.string().optional(),
  time: z.string().optional(),
  duration: z.number().min(5).optional(),
  dependencies: z.array(z.string()).optional(),
  dependencyType: z.enum(['finish-to-start', 'start-to-start', 'finish-to-finish', 'start-to-finish']).optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

export function TaskDialog({ 
  isOpen, 
  onClose, 
  editingTask, 
  defaultProject, 
  onSave, 
  initialDate,
  standalone = false
}: TaskDialogProps) {
  const { addTask, updateTask, getAllTasks } = useTaskContext();
  const navigate = useNavigate();
  
  // Get all tasks for dependencies selector
  const allTasks = getAllTasks();
  
  // Initialize the form with default values
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      taskType: "task",
      status: "todo",
      priority: "medium",
      dueDate: null,
      projectId: defaultProject || "1",
      assignees: [],
      date: initialDate ? format(initialDate, "yyyy-MM-dd") : undefined,
      time: undefined,
      duration: 30,
      dependencies: [],
      dependencyType: "finish-to-start",
    }
  });
  
  // Conditionally require dueDate based on taskType
  useEffect(() => {
    const taskType = form.watch("taskType");
    if (taskType === "task") {
      form.register("dueDate", { required: "Due date is required for tasks" });
    }
  }, [form.watch("taskType"), form]);

  // Reset form or populate with task data when opening
  useEffect(() => {
    if (isOpen && editingTask) {
      // Determine if this is a task or meeting based on existing data
      const taskType = editingTask.date && editingTask.time ? "meeting" : "task";
      
      form.reset({
        title: editingTask.title,
        description: editingTask.description || "",
        taskType: editingTask.taskType || taskType,
        status: editingTask.status as any,
        priority: editingTask.priority || "medium",
        dueDate: editingTask.dueDate ? new Date(editingTask.dueDate) : null,
        projectId: editingTask.projectId || "1",
        assignees: editingTask.assignees || [],
        date: editingTask.date || "",
        time: editingTask.time || "",
        duration: editingTask.duration || 30,
        dependencies: editingTask.dependencies || [],
        dependencyType: editingTask.dependencyType || "finish-to-start",
      });
    } else if (isOpen) {
      form.reset({
        title: "",
        description: "",
        taskType: "task", // Default to regular task
        status: "todo",
        priority: "medium",
        dueDate: null,
        projectId: defaultProject || "1",
        assignees: [],
        date: initialDate ? format(initialDate, "yyyy-MM-dd") : undefined,
        time: undefined,
        duration: 30,
        dependencies: [],
        dependencyType: "finish-to-start",
      });
    }
  }, [isOpen, editingTask, defaultProject, initialDate, form]);

  const onSubmit = (data: TaskFormValues) => {
    // Find the project name from the project ID
    const project = availableProjects.find(p => p.id === data.projectId);
    const projectName = project ? project.name : "Unknown Project";
    
    // Prepare the task data
    const taskData: Partial<Task> = {
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      taskType: data.taskType,
      projectId: data.projectId,
      project: projectName,
      assignees: data.assignees,
      dependencies: data.dependencies,
      dependencyType: data.dependencyType,
    };

    // Add type-specific fields
    if (data.taskType === "task") {
      taskData.dueDate = data.dueDate || new Date();
    } else { // It's a meeting
      taskData.date = data.date;
      taskData.time = data.time;
      taskData.duration = data.duration;
    }
    
    // Determine if the task should appear in Kanban and/or Timeline
    taskData.showInKanban = data.taskType === "task";
    taskData.showInTimeline = data.taskType === "meeting";
    
    let taskId = '';
    
    if (editingTask) {
      taskId = editingTask.id;
      updateTask({ id: taskId, ...taskData } as Task);
      toast.success("Task updated successfully");
    } else {
      taskId = `task-${Math.random().toString(36).substring(2, 9)}`;
      addTask({ id: taskId, ...taskData } as Task);
      toast.success("Task created successfully");
    }
    
    // If onSave is provided, call it with the task data
    if (onSave) {
      onSave({ id: taskId, ...taskData } as Task);
    } else {
      onClose();
      
      // Navigate to task detail page
      navigate(`/tasks/${taskId}`);
    }
  };

  const handleAddAssignee = (value: string) => {
    const currentAssignees = form.getValues("assignees");
    if (!currentAssignees.includes(value)) {
      form.setValue("assignees", [...currentAssignees, value]);
    }
  };

  const handleRemoveAssignee = (assignee: string) => {
    const currentAssignees = form.getValues("assignees");
    form.setValue("assignees", currentAssignees.filter(a => a !== assignee));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={!standalone}>
      <DialogContent className={cn("sm:max-w-[600px] max-h-[90vh] overflow-y-auto", standalone ? "p-6 border max-w-3xl mx-auto" : "")}>
        <DialogHeader>
          <DialogTitle>{editingTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Task Type Selection */}
            <FormField
              control={form.control}
              name="taskType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select task type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="task">Regular Task</SelectItem>
                      <SelectItem value="meeting">Meeting/Event</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter task title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Define task scope and details" 
                      {...field} 
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Project Selection */}
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableProjects.map(project => (
                        <SelectItem key={project.id || 'null'} value={project.id || 'null'}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Priority */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Conditional fields based on task type */}
            {form.watch("taskType") === "task" ? (
              // Due Date for regular tasks
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              // Date, Time, Duration for meetings
              <>
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="date"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="time"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="5"
                          step="5"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            
            {/* Assignees */}
            <FormField
              control={form.control}
              name="assignees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignees</FormLabel>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Select 
                        onValueChange={handleAddAssignee}
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
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {field.value.map((assignee, index) => (
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
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Task Dependencies */}
            <TaskDependencySelect
              tasks={allTasks}
              currentTaskId={editingTask?.id}
              control={form.control}
              name="dependencies"
            />
            
            <FormField
              control={form.control}
              name="dependencyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dependency Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select dependency type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="finish-to-start">Finish to Start (FS)</SelectItem>
                      <SelectItem value="start-to-start">Start to Start (SS)</SelectItem>
                      <SelectItem value="finish-to-finish">Finish to Finish (FF)</SelectItem>
                      <SelectItem value="start-to-finish">Start to Finish (SF)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">{editingTask ? 'Update Task' : 'Create Task'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
