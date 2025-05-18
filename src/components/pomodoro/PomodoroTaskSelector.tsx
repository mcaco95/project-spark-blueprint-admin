
import React, { useState, useEffect } from 'react';
import { usePomodoroContext } from '@/contexts/PomodoroContext';
import { useTaskContext } from '@/contexts/TaskContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, CheckCircle2, Timer as TimerIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const PomodoroTaskSelector = () => {
  const { currentTask, setCurrentTask } = usePomodoroContext();
  const { getAllTasks } = useTaskContext();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTasks, setFilteredTasks] = useState(getAllTasks().filter(t => t.status !== 'completed' && t.status !== 'done'));

  useEffect(() => {
    const tasks = getAllTasks().filter(t => t.status !== 'completed' && t.status !== 'done');
    
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      setFilteredTasks(
        tasks.filter(
          task => 
            task.title.toLowerCase().includes(lowerQuery) || 
            task.description?.toLowerCase().includes(lowerQuery)
        )
      );
    } else {
      setFilteredTasks(tasks);
    }
  }, [searchQuery, getAllTasks]);

  const handleSelectTask = (taskId: string) => {
    const task = getAllTasks().find(t => t.id === taskId);
    if (task) {
      setCurrentTask(task);
      setIsOpen(false);
    }
  };

  const clearTask = () => {
    setCurrentTask(null);
  };

  return (
    <>
      {currentTask ? (
        <div className="flex items-center justify-between bg-muted p-2 rounded-md">
          <div className="flex items-center">
            <TimerIcon className="h-4 w-4 mr-2 text-primary" />
            <span className="text-sm font-medium truncate max-w-[150px]">
              {currentTask.title}
            </span>
          </div>
          <div className="flex space-x-2">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  Change
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Select a Task</DialogTitle>
                </DialogHeader>
                <Command>
                  <CommandInput 
                    placeholder="Search tasks..." 
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandList>
                    <CommandEmpty>No tasks found.</CommandEmpty>
                    <CommandGroup>
                      <ScrollArea className="h-72">
                        {filteredTasks.map((task) => (
                          <CommandItem
                            key={task.id}
                            onSelect={() => handleSelectTask(task.id)}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center">
                              {task.id === currentTask?.id ? (
                                <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4 mr-2 text-muted-foreground" />
                              )}
                              <span>{task.title}</span>
                            </div>
                            {task.priority && (
                              <Badge variant="outline" className="ml-2">
                                {task.priority}
                              </Badge>
                            )}
                          </CommandItem>
                        ))}
                      </ScrollArea>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="sm" onClick={clearTask}>
              Clear
            </Button>
          </div>
        </div>
      ) : (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <TimerIcon className="h-4 w-4 mr-2" />
              Select a Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select a Task</DialogTitle>
            </DialogHeader>
            <Command>
              <CommandInput 
                placeholder="Search tasks..." 
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                <CommandEmpty>No tasks found.</CommandEmpty>
                <CommandGroup>
                  <ScrollArea className="h-72">
                    {filteredTasks.map((task) => (
                      <CommandItem
                        key={task.id}
                        onSelect={() => handleSelectTask(task.id)}
                      >
                        <span>{task.title}</span>
                        {task.priority && (
                          <Badge variant="outline" className="ml-2">
                            {task.priority}
                          </Badge>
                        )}
                      </CommandItem>
                    ))}
                  </ScrollArea>
                </CommandGroup>
              </CommandList>
            </Command>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default PomodoroTaskSelector;
