
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Task } from '@/types/task';
import { useTranslation } from 'react-i18next';
import { useTaskContext } from '@/contexts/tasks/TaskContext';
import { TaskDependencySelect } from '@/components/tasks/TaskDependencySelect';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface TaskEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  task: Task | null;
}

// Mock projects for the dialog
const availableProjects = [
  { id: '1', name: 'Website Redesign' },
  { id: '2', name: 'Mobile App Development' },
  { id: '3', name: 'Marketing Campaign' },
  { id: null, name: 'All Projects' },
];

// Mock users for the dialog
const availableUsers = [
  { id: '1', name: 'Admin User' },
  { id: '2', name: 'Regular User' },
  { id: '3', name: 'Project Manager' },
  { id: '4', name: 'Developer 1' },
  { id: '5', name: 'Designer 1' },
  { id: '6', name: 'Designer 2' },
];

// Define the recurrence type
type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | null;
// Define dependency type
type DependencyType = 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish' | null;

const TaskFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: z.date(),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Must be in format HH:MM'),
  duration: z.number().min(5).max(480),
  project: z.string(),
  assignees: z.array(z.string()).min(1, 'At least one assignee is required'),
  description: z.string().optional(),
  recurrence: z.union([z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']), z.null()]).optional(),
  dependencies: z.array(z.string()).optional(),
  dependencyType: z.enum(['finish-to-start', 'start-to-start', 'finish-to-finish', 'start-to-finish']).optional(),
});

type TaskFormValues = z.infer<typeof TaskFormSchema>;

export function TaskEventDialog({ isOpen, onClose, onSave, task }: TaskEventDialogProps) {
  const { t } = useTranslation(['common', 'tasks']);
  const { updateTask, addTask, getAllTasks } = useTaskContext();
  const navigate = useNavigate();

  // Get all tasks for dependencies
  const allTasks = getAllTasks();

  const defaultValues: TaskFormValues = {
    title: '',
    date: new Date(),
    time: '09:00',
    duration: 30,
    project: availableProjects[0].id || '',
    assignees: [],
    description: '',
    recurrence: null,
    dependencies: [],
    dependencyType: 'finish-to-start',
  };

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(TaskFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (task) {
      const [hours, minutes] = (task.time || '09:00').split(':').map(Number);
      const taskDate = task.date ? new Date(task.date) : new Date();
      taskDate.setHours(hours);
      taskDate.setMinutes(minutes);

      form.reset({
        title: task.title,
        date: taskDate,
        time: task.time || '09:00',
        duration: task.duration || 30,
        project: task.projectId || (task.project ? task.project : availableProjects[0].id || ''),
        assignees: task.assignees || [],
        description: task.description || '',
        recurrence: task.recurrence as RecurrenceType || null,
        dependencies: task.dependencies || [],
        dependencyType: task.dependencyType || 'finish-to-start',
      });
    } else {
      form.reset(defaultValues);
    }
  }, [task, form]);

  const onSubmit = (data: TaskFormValues) => {
    const projectInfo = availableProjects.find(p => p.id === data.project || p.name === data.project);
    
    const savedTask: Task = {
      id: task?.id || Math.random().toString(36).substring(2, 9),
      title: data.title,
      date: format(data.date, 'yyyy-MM-dd'),
      time: data.time,
      duration: data.duration,
      project: projectInfo?.name || 'Untitled Project',
      projectId: projectInfo?.id || null,
      assignees: data.assignees,
      description: data.description,
      recurrence: data.recurrence || undefined,
      status: task?.status || 'todo',
      comments: task?.comments || [],
      dependencies: data.dependencies,
      dependencyType: data.dependencyType,
    };

    if (task) {
      updateTask(savedTask);
    } else {
      addTask(savedTask);
    }
    
    onSave(savedTask);
    onClose();
    
    // Navigate to task detail page
    navigate(`/tasks/${savedTask.id}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{task ? t('editTask', { ns: 'tasks' }) : t('createTask', { ns: 'tasks' })}</DialogTitle>
          <DialogDescription>
            {t('taskDetailsDescription', { ns: 'tasks' })}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('taskTitle', { ns: 'tasks' })}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('date', { ns: 'tasks' })}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Select date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('time', { ns: 'tasks' })}</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <Input {...field} placeholder="09:00" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('duration', { ns: 'tasks' })}: {field.value} {t('minutes', { ns: 'common' })}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="range"
                      min="5"
                      max="480"
                      step="5"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="project"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('project', { ns: 'tasks' })}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectProject', { ns: 'tasks' })} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableProjects.map((project) => (
                        <SelectItem key={project.name} value={project.id || project.name}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assignees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('assignees', { ns: 'tasks' })}</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      // Add user to the assignees array if not already there
                      if (!field.value.includes(value)) {
                        field.onChange([...field.value, value]);
                      }
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('addAssignee', { ns: 'tasks' })} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.name}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {field.value.map((assignee) => (
                      <div key={assignee} className="flex items-center bg-muted rounded-full px-3 py-1">
                        <span className="text-sm">{assignee}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 ml-1"
                          onClick={() => {
                            field.onChange(field.value.filter((a) => a !== assignee));
                          }}
                        >
                          &times;
                        </Button>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('description', { ns: 'tasks' })}</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Task Dependencies Section */}
            <TaskDependencySelect 
              tasks={allTasks}
              currentTaskId={task?.id}
              control={form.control}
              name="dependencies"
            />

            <FormField
              control={form.control}
              name="dependencyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dependency Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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

            <FormField
              control={form.control}
              name="recurrence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('recurrence', { ns: 'tasks' })}</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value || null)}
                    value={field.value || null}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('noRecurrence', { ns: 'tasks' })} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">{t('noRecurrence', { ns: 'tasks' })}</SelectItem>
                      <SelectItem value="daily">{t('daily', { ns: 'tasks' })}</SelectItem>
                      <SelectItem value="weekly">{t('weekly', { ns: 'tasks' })}</SelectItem>
                      <SelectItem value="monthly">{t('monthly', { ns: 'tasks' })}</SelectItem>
                      <SelectItem value="quarterly">{t('quarterly', { ns: 'tasks' })}</SelectItem>
                      <SelectItem value="yearly">{t('yearly', { ns: 'tasks' })}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                {t('cancel', { ns: 'common' })}
              </Button>
              <Button type="submit">
                {task ? t('saveChanges', { ns: 'common' }) : t('createTask', { ns: 'tasks' })}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
