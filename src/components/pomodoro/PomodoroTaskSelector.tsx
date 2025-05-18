
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
  CommandSeparator,
} from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, CheckCircle2, Timer as TimerIcon, X, Plus, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Task } from '@/types/task';

const PomodoroTaskSelector = () => {
  const { 
    currentTask, 
    setCurrentTask, 
    taskPomodoros, 
    getTaskPomodoros, 
    updateTaskPomodoros,
    addTaskToPomodoros,
    removeTaskFromPomodoros,
    activeTaskIds
  } = usePomodoroContext();
  const { getAllTasks, getTaskById } = useTaskContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isEstimateDialogOpen, setIsEstimateDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);

  // Load active tasks
  useEffect(() => {
    const tasks = getAllTasks();
    const active = tasks.filter(task => 
      activeTaskIds.includes(task.id) && 
      task.status !== 'completed' && 
      task.status !== 'done'
    );
    setActiveTasks(active);
  }, [getAllTasks, activeTaskIds]);

  // Filter tasks based on search query
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
      
      // Add to pomodoros list if not already there
      const pomodoro = getTaskPomodoros(taskId);
      if (!pomodoro) {
        addTaskToPomodoros(taskId);
      }
      
      setIsOpen(false);
    }
  };

  const clearTask = () => {
    setCurrentTask(null);
  };

  const openEstimateDialog = (taskId: string) => {
    setSelectedTaskId(taskId);
    const task = getTaskPomodoros(taskId);
    setEstimatedPomodoros(task?.estimatedPomodoros || 1);
    setIsEstimateDialogOpen(true);
  };

  const saveEstimate = () => {
    if (selectedTaskId) {
      updateTaskPomodoros(selectedTaskId, estimatedPomodoros);
      setIsEstimateDialogOpen(false);
    }
  };

  const getProgressPercentage = (taskId: string) => {
    const task = getTaskPomodoros(taskId);
    if (!task || task.estimatedPomodoros === 0) return 0;
    return (task.completedPomodoros / task.estimatedPomodoros) * 100;
  };

  return (
    <>
      {currentTask ? (
        <div className="flex items-center justify-between bg-muted p-2 rounded-md">
          <div className="flex items-center">
            <TimerIcon className="h-4 w-4 mr-2 text-primary" />
            <div>
              <span className="text-sm font-medium truncate max-w-[150px] block">
                {currentTask.title}
              </span>
              {getTaskPomodoros(currentTask.id) && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <span>{getTaskPomodoros(currentTask.id)?.completedPomodoros || 0}</span>
                  <span>/</span>
                  <span>{getTaskPomodoros(currentTask.id)?.estimatedPomodoros || 1}</span>
                  <span className="ml-1">pomodoros</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  Change
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
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
                    {activeTasks.length > 0 && (
                      <>
                        <CommandGroup heading="Active Tasks">
                          <ScrollArea className="h-[200px]">
                            {activeTasks.map((task) => (
                              <CommandItem
                                key={task.id}
                                onSelect={() => handleSelectTask(task.id)}
                                className="flex items-center justify-between"
                              >
                                <div className="flex items-center flex-1">
                                  {task.id === currentTask?.id ? (
                                    <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                                  ) : (
                                    <CheckCircle2 className="h-4 w-4 mr-2 text-muted-foreground" />
                                  )}
                                  <span className="truncate flex-1">{task.title}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEstimateDialog(task.id);
                                    }}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Badge variant="outline" className="ml-2 whitespace-nowrap">
                                    {getTaskPomodoros(task.id)?.completedPomodoros || 0}/
                                    {getTaskPomodoros(task.id)?.estimatedPomodoros || 1}
                                  </Badge>
                                </div>
                              </CommandItem>
                            ))}
                          </ScrollArea>
                        </CommandGroup>
                        <CommandSeparator />
                      </>
                    )}
                    <CommandEmpty>No tasks found.</CommandEmpty>
                    <CommandGroup heading="All Tasks">
                      <ScrollArea className="h-[200px]">
                        {filteredTasks.map((task) => (
                          <CommandItem
                            key={task.id}
                            onSelect={() => handleSelectTask(task.id)}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center flex-1">
                              {task.id === currentTask?.id ? (
                                <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4 mr-2 text-muted-foreground" />
                              )}
                              <span className="truncate flex-1">{task.title}</span>
                            </div>
                            {getTaskPomodoros(task.id) ? (
                              <div className="flex items-center space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-6 w-6" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEstimateDialog(task.id);
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Badge variant="outline" className="ml-2 whitespace-nowrap">
                                  {getTaskPomodoros(task.id)?.completedPomodoros || 0}/
                                  {getTaskPomodoros(task.id)?.estimatedPomodoros || 1}
                                </Badge>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addTaskToPomodoros(task.id);
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" /> Add
                              </Button>
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
          <DialogContent className="max-w-md">
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
                {activeTasks.length > 0 && (
                  <>
                    <CommandGroup heading="Active Tasks">
                      <ScrollArea className="h-[200px]">
                        {activeTasks.map((task) => (
                          <CommandItem
                            key={task.id}
                            onSelect={() => handleSelectTask(task.id)}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center flex-1">
                              <CheckCircle2 className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span className="truncate flex-1">{task.title}</span>
                            </div>
                            {getTaskPomodoros(task.id) && (
                              <div className="flex items-center space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEstimateDialog(task.id);
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Badge variant="outline" className="ml-2 whitespace-nowrap">
                                  {getTaskPomodoros(task.id)?.completedPomodoros || 0}/
                                  {getTaskPomodoros(task.id)?.estimatedPomodoros || 1}
                                </Badge>
                              </div>
                            )}
                          </CommandItem>
                        ))}
                      </ScrollArea>
                    </CommandGroup>
                    <CommandSeparator />
                  </>
                )}
                <CommandEmpty>No tasks found.</CommandEmpty>
                <CommandGroup heading="All Tasks">
                  <ScrollArea className="h-[200px]">
                    {filteredTasks.map((task) => (
                      <CommandItem
                        key={task.id}
                        onSelect={() => handleSelectTask(task.id)}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center flex-1">
                          <CheckCircle2 className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="truncate flex-1">{task.title}</span>
                        </div>
                        {getTaskPomodoros(task.id) ? (
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-6 w-6" 
                              onClick={(e) => {
                                e.stopPropagation();
                                openEstimateDialog(task.id);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Badge variant="outline" className="ml-2 whitespace-nowrap">
                              {getTaskPomodoros(task.id)?.completedPomodoros || 0}/
                              {getTaskPomodoros(task.id)?.estimatedPomodoros || 1}
                            </Badge>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              addTaskToPomodoros(task.id);
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add
                          </Button>
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

      {/* Pomodoro Estimate Dialog */}
      <Dialog open={isEstimateDialogOpen} onOpenChange={setIsEstimateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Pomodoro Estimate</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedTaskId && (
              <div className="grid gap-2">
                <p className="text-sm font-medium">
                  Task: {getTaskById(selectedTaskId)?.title}
                </p>
                {getTaskPomodoros(selectedTaskId) && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        Progress: {getTaskPomodoros(selectedTaskId)?.completedPomodoros || 0} / 
                        {getTaskPomodoros(selectedTaskId)?.estimatedPomodoros || 1} pomodoros
                      </span>
                      <span>{Math.round(getProgressPercentage(selectedTaskId))}%</span>
                    </div>
                    <Progress value={getProgressPercentage(selectedTaskId)} className="h-2" />
                  </div>
                )}
                <div className="flex flex-col gap-2 mt-4">
                  <label htmlFor="estimate" className="text-sm font-medium">
                    Estimated Pomodoros
                  </label>
                  <Input
                    id="estimate"
                    type="number"
                    min={1}
                    value={estimatedPomodoros}
                    onChange={(e) => setEstimatedPomodoros(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            {getTaskPomodoros(selectedTaskId || '') && (
              <Button 
                variant="destructive" 
                onClick={() => {
                  if (selectedTaskId) {
                    removeTaskFromPomodoros(selectedTaskId);
                    setIsEstimateDialogOpen(false);
                  }
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Remove Task
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsEstimateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEstimate}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PomodoroTaskSelector;
