
import { useState, useEffect } from 'react';
import { Check, ChevronsDown } from 'lucide-react';
import { Project } from '@/types/project';
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
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface ProjectHierarchySelectProps {
  projects: Project[];
  currentProjectId?: string;
  control: any;
  name: string;
}

export function ProjectHierarchySelect({ projects, currentProjectId, control, name }: ProjectHierarchySelectProps) {
  const [open, setOpen] = useState(false);

  // Filter out current project and its descendants to prevent circular references
  const eligibleParentProjects = projects.filter(project => {
    // Skip current project
    if (currentProjectId && project.id === currentProjectId) return false;
    
    // Skip if this project is a descendant of current project
    if (currentProjectId && project.path) {
      // Check if the project path contains the current project ID
      const pathParts = project.path.split('/');
      if (pathParts.includes(currentProjectId)) return false;
    }
    
    return true;
  });

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>Parent Project</FormLabel>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  {field.value
                    ? projects.find((project) => project.id === field.value)?.name || "Select project"
                    : "None (Root Project)"}
                  <ChevronsDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
              <Command>
                <CommandInput placeholder="Search projects..." />
                <CommandList>
                  <CommandEmpty>No projects found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="none"
                      onSelect={() => {
                        field.onChange(null);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${field.value === null ? "opacity-100" : "opacity-0"}`}
                      />
                      None (Root Project)
                    </CommandItem>
                    {eligibleParentProjects.map((project) => (
                      <CommandItem
                        key={project.id}
                        value={project.name.toLowerCase()}
                        onSelect={() => {
                          field.onChange(project.id);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            field.value === project.id ? "opacity-100" : "opacity-0"
                          }`}
                        />
                        {project.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
