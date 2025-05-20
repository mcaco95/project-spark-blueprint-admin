
import { useState, useEffect } from 'react';
import { Check, ChevronsDown } from 'lucide-react';
import { Task } from '@/types/task';
import { 
  Command,
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface TaskDependencySelectProps {
  tasks: Task[];
  currentTaskId?: string;
  control: any;
  name: string;
}

export function TaskDependencySelect({ tasks, currentTaskId, control, name }: TaskDependencySelectProps) {
  const [open, setOpen] = useState(false);

  // Filter out current task and tasks that depend on the current task to prevent circular dependencies
  const eligibleTasks = tasks.filter(task => {
    // Skip current task
    if (currentTaskId && task.id === currentTaskId) return false;
    
    // Skip if this task already depends on the current task (would create circular dependency)
    if (currentTaskId && task.dependencies?.includes(currentTaskId)) return false;
    
    return true;
  });

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>Dependencies</FormLabel>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  {field.value && field.value.length > 0
                    ? `${field.value.length} dependencies selected`
                    : "No dependencies"}
                  <ChevronsDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
              <Command>
                <CommandInput placeholder="Search tasks..." />
                <CommandList>
                  <CommandEmpty>No tasks found.</CommandEmpty>
                  <CommandGroup>
                    {eligibleTasks.map((task) => (
                      <CommandItem
                        key={task.id}
                        value={task.title.toLowerCase()}
                        onSelect={() => {
                          const selectedDependencies = [...(field.value || [])];
                          const index = selectedDependencies.indexOf(task.id);
                          
                          if (index === -1) {
                            selectedDependencies.push(task.id);
                          } else {
                            selectedDependencies.splice(index, 1);
                          }
                          
                          field.onChange(selectedDependencies);
                        }}
                      >
                        <div className="flex items-center">
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              field.value?.includes(task.id) ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          <span className="truncate">{task.title}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          
          {field.value && field.value.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {field.value.map((dependencyId: string) => {
                const dependency = tasks.find(t => t.id === dependencyId);
                if (!dependency) return null;
                
                return (
                  <Badge key={dependencyId} variant="secondary" className="flex items-center gap-1">
                    {dependency.title}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 rounded-full"
                      onClick={() => {
                        field.onChange(field.value.filter((id: string) => id !== dependencyId));
                      }}
                    >
                      ×
                    </Button>
                  </Badge>
                );
              })}
            </div>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
