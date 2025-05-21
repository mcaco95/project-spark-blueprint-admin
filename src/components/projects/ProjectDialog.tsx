import { useState, useEffect, useMemo } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

interface ProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingProject: Project | null;
  onSave: (project: Project) => void;
  projects: Project[];
}

const ProjectFormSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  status: z.enum(['planning', 'active', 'completed', 'on-hold']),
  priority: z.enum(['low', 'medium', 'high']),
  startDate: z.date(),
  dueDate: z.date().optional(),
  progress: z.number().min(0).max(100),
  teamMembers: z.array(z.string()),
  parentId: z.string().nullable(),
});

type ProjectFormValues = z.infer<typeof ProjectFormSchema>;

export function ProjectDialog({ isOpen, onClose, editingProject, onSave, projects }: ProjectDialogProps) {
  const { t } = useTranslation(['common', 'projects']);
  const { user, token } = useAuth();
  
  // Stores User IDs of selected members
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]); 
  // Stores full user objects fetched from API {id, name}
  const [allFetchedUsers, setAllFetchedUsers] = useState<{id: string, name: string}[]>([]); 

  // Memoized list of users available for selection (excludes the current project owner/logged-in user)
  const availableTeamMembersToSelect = useMemo(() => {
    if (!user) return allFetchedUsers;
    return allFetchedUsers.filter(u => u.id !== user.id);
  }, [allFetchedUsers, user]);

  const defaultValues: ProjectFormValues = {
    name: '',
    description: '',
    status: 'planning',
    priority: 'medium',
    startDate: new Date(),
    dueDate: undefined,
    progress: 0,
    teamMembers: [], // This will store IDs
    parentId: null,
  };

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(ProjectFormSchema),
    defaultValues,
  });

  // Populate form when editingProject changes or dialog opens
  useEffect(() => {
    if (isOpen) { // Reset/populate form only when dialog becomes visible or editingProject changes
      if (editingProject) {
        const initialMemberIds = editingProject.teamMembers || []; // Assuming teamMembers are IDs
        
        // Convert dates from UTC to local time
        const convertToLocalDate = (dateInput: Date | string | undefined | null) => {
          if (!dateInput) return undefined;
          const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
          return new Date(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
            12 // Set to noon to avoid any timezone issues
          );
        };

        form.reset({
          name: editingProject.name,
          description: editingProject.description || '',
          status: editingProject.status,
          priority: editingProject.priority,
          startDate: convertToLocalDate(editingProject.startDate) || new Date(),
          dueDate: convertToLocalDate(editingProject.endDate),
          progress: editingProject.progress,
          teamMembers: initialMemberIds, // Store IDs in form
          parentId: editingProject.parentId || null,
        });
        setSelectedMemberIds(initialMemberIds);
      } else {
        form.reset(defaultValues);
        setSelectedMemberIds([]);
      }
    }
  }, [editingProject, form, isOpen]); // Add isOpen to dependencies

  // Fetch all users from backend for team member selection pool
  useEffect(() => {
    if (!isOpen || !token) { // Fetch only if dialog is open and token exists
      if (!isOpen) setAllFetchedUsers([]); // Clear if dialog closes
      return;
    }
    const fetchUsers = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/v1/auth/users`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) throw new Error('Failed to fetch users for team member selection');
        const usersData = await response.json();
        setAllFetchedUsers(
          usersData.map((u: any) => ({ id: u.id, name: u.name || u.email }))
        );
      } catch (err) {
        console.error("Error fetching users:", err);
        toast.error(t('errors.failedToFetchUsers', { ns: 'common' }));
        setAllFetchedUsers([]);
      }
    };
    fetchUsers();
  }, [isOpen, token, t]); // Add isOpen, t to dependencies

  const onSubmit = (data: ProjectFormValues) => {
    // data.teamMembers already contains an array of IDs from the form
    if (editingProject) {
      onSave({ 
        ...editingProject, 
        ...data, 
        startDate: data.startDate, 
        endDate: data.dueDate, 
        teamMembers: data.teamMembers // Pass IDs
      });
    } else {
      onSave({
        id: uuidv4(),
        name: data.name,
        description: data.description,
        status: data.status,
        priority: data.priority,
        startDate: data.startDate,
        endDate: data.dueDate,
        progress: data.progress || 0,
        teamMembers: data.teamMembers, // Pass IDs
        createdBy: user?.name || user?.email || 'N/A', // Use name or email for createdBy display
        createdAt: new Date(),
        ownerId: user?.id || '',
        createdById: user?.id || '',
        // Optional fields for Project type, ensure they are present or undefined
        tasks: [],
        comments: [],
        parentId: data.parentId,
        path: undefined,
        level: undefined,
        subProjects: undefined,
        tags: undefined,
        updatedAt: undefined,
      });
    }
  };

  // Handles toggling a member ID in the selected list and form state
  const toggleTeamMember = (memberId: string) => {
    const currentSelectedIds = form.getValues('teamMembers');
    const newSelectedIds = currentSelectedIds.includes(memberId)
      ? currentSelectedIds.filter(id => id !== memberId)
      : [...currentSelectedIds, memberId];
    
    form.setValue('teamMembers', newSelectedIds, { shouldValidate: true, shouldDirty: true });
    setSelectedMemberIds(newSelectedIds); // Sync visual state if needed, form is source of truth for submit
  };
  
  // Helper to get member name from ID for display in badges
  const getMemberName = (memberId: string): string => {
    const member = allFetchedUsers.find(u => u.id === memberId);
    return member?.name || memberId; // Fallback to ID if name not found
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
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('dueDate', { ns: 'projects' })}</FormLabel>
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
                      onChange={e => field.onChange(Number(e.target.value))}
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
                        {selectedMemberIds.map(memberId => (
                          <Badge key={memberId} className="pl-2">
                            {getMemberName(memberId)}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 ml-1"
                              onClick={() => toggleTeamMember(memberId)}
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
                          {availableTeamMembersToSelect.length === 0 ? (
                            <span className="text-xs text-muted-foreground">No users found or failed to load users.</span>
                          ) : (
                            availableTeamMembersToSelect.map(member => (
                              <Button
                                key={member.id}
                                type="button"
                                variant={selectedMemberIds.includes(member.id) ? "secondary" : "outline"}
                                size="sm"
                                className="flex items-center"
                                onClick={() => toggleTeamMember(member.id)}
                              >
                                <Avatar className="h-5 w-5 mr-1">
                                  <AvatarFallback className="text-xs">
                                    {member.name.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                {member.name}
                              </Button>
                            ))
                          )}
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
