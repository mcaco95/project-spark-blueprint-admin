
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Plus, X } from 'lucide-react';
import { Project, ProjectStatus, ProjectPriority } from '@/types/project';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { v4 as uuidv4 } from 'uuid';
import { ProjectHierarchySelect } from './ProjectHierarchySelect';

interface ProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingProject: Project | null;
  onSave: (project: Project) => void;
  projects: Project[];
}

// Sample team members data
const availableTeamMembers = [
  { id: '1', name: 'User 1' },
  { id: '2', name: 'User 2' },
  { id: '3', name: 'User 3' },
  { id: '4', name: 'User 4' },
  { id: '5', name: 'User 5' },
  { id: '6', name: 'User 6' },
  { id: '7', name: 'User 7' },
  { id: '8', name: 'User 8' },
];

const ProjectFormSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  status: z.enum(['planning', 'active', 'completed', 'on-hold']),
  priority: z.enum(['low', 'medium', 'high']),
  startDate: z.date(),
  endDate: z.date().optional(),
  progress: z.number().min(0).max(100),
  teamMembers: z.array(z.string()),
  parentId: z.string().nullable(),
});

type ProjectFormValues = z.infer<typeof ProjectFormSchema>;

export function ProjectDialog({ isOpen, onClose, editingProject, onSave, projects }: ProjectDialogProps) {
  const { t } = useTranslation(['common', 'projects']);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const defaultValues: ProjectFormValues = {
    name: '',
    description: '',
    status: 'planning',
    priority: 'medium',
    startDate: new Date(),
    progress: 0,
    teamMembers: [],
    parentId: null,
  };

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(ProjectFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (editingProject) {
      form.reset({
        name: editingProject.name,
        description: editingProject.description || '',
        status: editingProject.status,
        priority: editingProject.priority,
        startDate: editingProject.startDate,
        endDate: editingProject.endDate,
        progress: editingProject.progress,
        teamMembers: editingProject.teamMembers,
        parentId: editingProject.parentId || null,
      });
      setSelectedMembers(editingProject.teamMembers);
    } else {
      form.reset(defaultValues);
      setSelectedMembers([]);
    }
  }, [editingProject, form]);

  const onSubmit = (data: ProjectFormValues) => {
    // Fix: Ensure name is always provided in the project object
    const projectToSave: Project = {
      id: editingProject?.id || uuidv4(),
      name: data.name, // Make sure name is explicitly assigned
      description: data.description,
      status: data.status,
      priority: data.priority,
      startDate: data.startDate,
      endDate: data.endDate,
      progress: data.progress || 0,
      teamMembers: data.teamMembers,
      createdBy: editingProject?.createdBy || 'Current User',
      createdAt: editingProject?.createdAt || new Date(),
      tasks: editingProject?.tasks || [],
      comments: editingProject?.comments || [],
      parentId: data.parentId,
      // Path and level will be calculated by the useProjectsData hook
    };
    
    onSave(projectToSave);
  };

  const toggleTeamMember = (memberName: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberName)
        ? prev.filter(name => name !== memberName)
        : [...prev, memberName]
    );
    
    const currentMembers = form.getValues('teamMembers');
    const updatedMembers = currentMembers.includes(memberName)
      ? currentMembers.filter(name => name !== memberName)
      : [...currentMembers, memberName];
    
    form.setValue('teamMembers', updatedMembers);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {editingProject 
              ? t('editProject', { ns: 'projects' }) 
              : t('createProject', { ns: 'projects' })}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('projectName', { ns: 'projects' })}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('description', { ns: 'projects' })}</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('status', { ns: 'projects' })}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('selectStatus', { ns: 'projects' })} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="planning">{t('planning', { ns: 'projects' })}</SelectItem>
                        <SelectItem value="active">{t('active', { ns: 'projects' })}</SelectItem>
                        <SelectItem value="on-hold">{t('onHold', { ns: 'projects' })}</SelectItem>
                        <SelectItem value="completed">{t('completed', { ns: 'projects' })}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('priority', { ns: 'projects' })}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('selectPriority', { ns: 'projects' })} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">{t('low', { ns: 'projects' })}</SelectItem>
                        <SelectItem value="medium">{t('medium', { ns: 'projects' })}</SelectItem>
                        <SelectItem value="high">{t('high', { ns: 'projects' })}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('startDate', { ns: 'projects' })}</FormLabel>
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
                              <span>Pick a date</span>
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
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('endDate', { ns: 'projects' })}</FormLabel>
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
                              <span>{t('pickDate', { ns: 'projects' })}</span>
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
                          disabled={(date) => {
                            const startDate = form.getValues('startDate');
                            return startDate ? date < startDate : false;
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Parent Project Selection */}
            <ProjectHierarchySelect 
              projects={projects}
              currentProjectId={editingProject?.id}
              control={form.control}
              name="parentId"
            />

            <FormField
              control={form.control}
              name="progress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('progress', { ns: 'projects' })}: {field.value}%
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="range" 
                      min="0" 
                      max="100" 
                      step="5"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="teamMembers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('teamMembers', { ns: 'projects' })}</FormLabel>
                  <FormControl>
                    <div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {selectedMembers.map(member => (
                          <Badge key={member} className="pl-2">
                            {member}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 ml-1"
                              onClick={() => toggleTeamMember(member)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                      <div className="border rounded-md p-2 max-h-32 overflow-y-auto">
                        <div className="text-sm text-muted-foreground mb-2">
                          {t('availableMembers', { ns: 'projects' })}:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {availableTeamMembers.map(member => (
                            <Button
                              key={member.id}
                              type="button"
                              variant={selectedMembers.includes(member.name) ? "secondary" : "outline"}
                              size="sm"
                              className="flex items-center"
                              onClick={() => toggleTeamMember(member.name)}
                            >
                              <Avatar className="h-5 w-5 mr-1">
                                <AvatarFallback className="text-xs">
                                  {member.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {member.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                {t('cancel', { ns: 'common' })}
              </Button>
              <Button type="submit">
                {editingProject 
                  ? t('saveChanges', { ns: 'common' }) 
                  : t('createProject', { ns: 'projects' })
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
