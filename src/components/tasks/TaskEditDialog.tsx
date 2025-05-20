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
import { format, parseISO, addMinutes } from 'date-fns';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ApiTaskCreatePayload } from '@/contexts/tasks/taskActions';
import { fetchApi, useAuth } from '@/contexts/AuthContext';

// Define UserSimple interface locally if not already imported broadly
// For now, assuming UserSimple is available or we'll define it
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
  standalone?: boolean; // For use in the TaskEdit page
}

const availableProjects: {id: string, name: string}[] = []; // Initialize with empty array

// Mock users for the dialog
const availableUsers: {name: string}[] = []; // Initialize with empty array

// Schema for the form
const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  taskType: z.enum(["task", "meeting"]),
  status: z.enum(["todo", "in-progress", "review", "done", "completed"]),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: z.date().nullable().optional(),
  projectId: z.string().min(1, "Project is required"),
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
  const { token } = useAuth();

  const [availableProjects, setAvailableProjects] = React.useState<{id: string, name: string}[]>([]);
  const [projectMembers, setProjectMembers] = React.useState<UserSimple[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = React.useState<boolean>(false);
  const [selectedAssignee, setSelectedAssignee] = React.useState<string>(""); // To hold ID from select
  
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
      projectId: "",
      assignees: [],
      date: initialDate ? format(initialDate, "yyyy-MM-dd") : undefined,
      time: undefined,
      duration: 30,
      dependencies: [],
      dependencyType: "finish-to-start",
    }
  });
  
  // Fetch projects when the dialog is open
  useEffect(() => {
    const fetchProjects = async () => {
      if (isOpen && token) {
        try {
          const projectsFromApi = await fetchApi<{ id: string; name: string; }[], undefined>(
            '/projects/', 
            'GET', 
            undefined, 
            token
          );
          if (projectsFromApi && Array.isArray(projectsFromApi)) {
            const mappedProjects = projectsFromApi.map(p => ({ id: p.id, name: p.name }));
            setAvailableProjects(mappedProjects);
            if (defaultProject && mappedProjects.some(p => p.id === defaultProject)) {
              form.setValue("projectId", defaultProject);
            } else if (mappedProjects.length > 0 && !editingTask) {
              form.setValue("projectId", mappedProjects[0].id);
            }
          }
        } catch (error) {
          console.error("Failed to fetch projects:", error);
          toast.error("Failed to load projects for selection.");
        }
      }
    };
    fetchProjects();
  }, [isOpen, token, defaultProject, form, editingTask]);

  // Fetch project members when projectId changes
  useEffect(() => {
    const selectedProjectId = form.watch("projectId");
    const fetchMembers = async () => {
      if (isOpen && token && selectedProjectId) {
        setIsLoadingMembers(true);
        setProjectMembers([]); // Clear previous members
        try {
          const members = await fetchApi<UserSimple[], undefined>(
            `/projects/${selectedProjectId}/members`,
            'GET',
            undefined,
            token
          );
          if (members && Array.isArray(members)) {
            // The members from API are likely ProjectMemberOutput, we need to extract the user
            // Assuming the API returns ProjectMemberOutput which has a 'user' field of type UserSimple
            const extractedUsers = members.map((member: any) => member.user).filter(Boolean);
            setProjectMembers(extractedUsers);
          } else {
            setProjectMembers([]);
          }
        } catch (error) {
          console.error("Failed to fetch project members:", error);
          toast.error("Failed to load project members.");
          setProjectMembers([]);
        } finally {
          setIsLoadingMembers(false);
        }
      } else if (!selectedProjectId) {
        setProjectMembers([]); // Clear members if no project is selected
      }
    };

    fetchMembers();
  }, [isOpen, token, form.watch("projectId"), form]);

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
        dueDate: editingTask.dueDate ? (typeof editingTask.dueDate === 'string' ? parseISO(editingTask.dueDate) : editingTask.dueDate) : null,
        projectId: editingTask.project_id,
        assignees: editingTask.assignees ? editingTask.assignees.map(a => a.id) : [],
        date: editingTask.date || "",
        time: editingTask.time || "",
        duration: editingTask.duration || 30,
        dependencies: editingTask.dependencies ? editingTask.dependencies.map(d => d.id) : [],
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
        projectId: defaultProject && availableProjects.some(p => p.id === defaultProject) 
                      ? defaultProject 
                      : availableProjects.length > 0 
                          ? availableProjects[0].id 
                          : undefined,
        assignees: [],
        date: initialDate ? format(initialDate, "yyyy-MM-dd") : undefined,
        time: undefined,
        duration: 30,
        dependencies: [],
        dependencyType: "finish-to-start",
      });
    }
  }, [isOpen, editingTask, defaultProject, initialDate, form, availableProjects]);

  const onSubmit = async (data: TaskFormValues) => {
    if (editingTask) {
      // Logic for updating an existing task (to be reviewed separately)
      const project = availableProjects.find(p => p.id === data.projectId);
      const projectName = project ? project.name : "Unknown Project";
      const taskData: Partial<Task> = {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        taskType: data.taskType,
        project_id: data.projectId,
        project: { id: data.projectId || '', name: projectName },
        assignees: [],
        dependencies: [],
        dependencyType: data.dependencyType,
      };
      if (data.taskType === "task") {
        taskData.dueDate = data.dueDate || new Date();
      } else {
        taskData.date = data.date;
        taskData.time = data.time;
        taskData.duration = data.duration;
      }
      taskData.showInKanban = data.taskType === "task";
      taskData.showInTimeline = data.taskType === "meeting";
      
      updateTask({ id: editingTask.id, ...taskData } as Task);
      toast.success("Task updated successfully (local - API call pending)");
      
      if (onSave) {
        onSave({ id: editingTask.id, ...taskData } as Task);
      } else {
        onClose();
        navigate(`/tasks/${editingTask.id}`);
      }

    } else {
      // Creating a new task
      const payload: ApiTaskCreatePayload = {
        title: data.title,
        description: data.description || null,
        status: data.status,
        priority: data.priority || null,
        task_type: data.taskType,
        project_id: data.projectId || '', // Ensure this is a valid UUID string
        assignee_ids: data.assignees || [], // data.assignees should now be an array of IDs
        depends_on_task_ids: data.dependencies || [],
        dependency_type_for_new: data.dependencyType || null,
      };

      if (data.taskType === "task") {
        payload.due_date = data.dueDate ? format(data.dueDate, "yyyy-MM-dd") : null;
      } else { // 'meeting'
        if (data.date && data.time) {
          try {
            const startDateIso = parseISO(`${data.date}T${data.time}:00`).toISOString();
            payload.start_date = startDateIso;
            if (data.duration) {
              const endDate = addMinutes(parseISO(startDateIso), data.duration);
              payload.end_date = endDate.toISOString();
            }
            payload.duration_minutes = data.duration;
          } catch (e) {
            console.error("Error parsing date/time for meeting:", e);
            toast.error("Invalid date or time format for meeting.");
            return; // Prevent submission with invalid dates
          }
        }
      }
      
      try {
        const createdTask = await addTask(payload);
        if (createdTask) {
          toast.success("Task created successfully!");
          if (onSave) {
            onSave(createdTask); // Pass the task returned from API
          } else {
            onClose();
            navigate(`/tasks/${createdTask.id}`); // Navigate using ID from API response
          }
        } else {
          // addTask might return null if API call fails or validation within action fails
          // toast.error("Failed to create task. Please try again."); // addTask already shows a toast on error
        }
      } catch (error: any) {
        console.error("Error in onSubmit calling addTask:", error);
        toast.error(`Error creating task: ${error.message || 'Unknown error'}`);
      }
    }
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
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableProjects.length === 0 && <SelectItem value="" disabled>Loading projects...</SelectItem>}
                      {availableProjects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
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
                          onSelect={(date) => field.onChange(date)}
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
            
            {/* Assignees Selection */}
            <FormField
              control={form.control}
              name="assignees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignees</FormLabel>
                  <div className="flex items-center gap-2 mb-2">
                    <Select
                      onValueChange={setSelectedAssignee} // Update temp state
                      value={selectedAssignee} // Controlled by temp state
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingMembers ? "Loading members..." : "Select a project member to add"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingMembers && <SelectItem value="loading" disabled>Loading...</SelectItem>}
                        {!isLoadingMembers && projectMembers.length === 0 && <SelectItem value="no-members" disabled>No members in project or project not selected</SelectItem>}
                        {projectMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name || member.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (selectedAssignee && !field.value.includes(selectedAssignee)) {
                          form.setValue("assignees", [...field.value, selectedAssignee]);
                          setSelectedAssignee(""); // Reset select
                        }
                      }}
                      disabled={!selectedAssignee || isLoadingMembers}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="space-x-1 space-y-1">
                    {field.value.map((assigneeId) => {
                      const member = projectMembers.find(m => m.id === assigneeId);
                      return (
                        <Badge key={assigneeId} variant="secondary" className="mr-1 mb-1">
                          {member ? (member.name || member.email) : assigneeId}
                          <button
                            type="button"
                            className="ml-1.5 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            onClick={() => {
                              form.setValue("assignees", field.value.filter(id => id !== assigneeId));
                            }}
                          >
                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </button>
                        </Badge>
                      );
                    })}
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
