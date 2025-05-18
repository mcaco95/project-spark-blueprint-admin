import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePomodoroContext } from '@/contexts/PomodoroContext';
import { useTaskContext } from '@/contexts/TaskContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Timer, Play, Calendar, CheckCircle2, Edit, Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Task } from '@/types/task';

const PomodoroTasks = () => {
  const navigate = useNavigate();
  const { 
    taskPomodoros, 
    getTaskPomodoros, 
    currentTask, 
    setCurrentTask, 
    startFocus, 
    activeTaskIds,
    addTaskToActive,
    removeTaskFromActive,
    updateTaskPomodoros,
    removeTaskFromPomodoros
  } = usePomodoroContext();
  const { getAllTasks, getTaskById } = useTaskContext();
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(1);
  
  const activeTasks = useMemo(() => {
    return getAllTasks().filter(task => 
      activeTaskIds.includes(task.id) && 
      task.status !== 'completed' && 
      task.status !== 'done'
    );
  }, [getAllTasks, activeTaskIds]);
  
  const todayTasks = useMemo(() => {
    return activeTasks.filter(task => {
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      if (!dueDate) return false;
      
      const today = new Date();
      return (
        dueDate.getDate() === today.getDate() &&
        dueDate.getMonth() === today.getMonth() &&
        dueDate.getFullYear() === today.getFullYear()
      );
    });
  }, [activeTasks]);
  
  const weekTasks = useMemo(() => {
    return activeTasks.filter(task => {
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      if (!dueDate) return false;
      
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      
      return dueDate >= today && dueDate <= nextWeek;
    });
  }, [activeTasks]);

  const handleTaskClick = (task: Task) => {
    navigate(`/tasks/${task.id}`);
  };

  const handleStartPomodoro = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentTask(task);
    startFocus();
  };

  const openEditDialog = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTaskId(taskId);
    const taskPomodoro = getTaskPomodoros(taskId);
    setEstimatedPomodoros(taskPomodoro?.estimatedPomodoros || 1);
    setIsEditingTask(true);
  };

  const saveEstimate = () => {
    if (selectedTaskId) {
      updateTaskPomodoros(selectedTaskId, estimatedPomodoros);
      setIsEditingTask(false);
    }
  };

  const getProgressPercentage = (taskId: string) => {
    const task = getTaskPomodoros(taskId);
    if (!task || task.estimatedPomodoros === 0) return 0;
    return (task.completedPomodoros / task.estimatedPomodoros) * 100;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">
            <Timer className="h-5 w-5 inline mr-2" />
            Pomodoro Tasks
          </CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Task to Pomodoro</DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[300px] mt-2">
                {getAllTasks()
                  .filter(t => 
                    !activeTaskIds.includes(t.id) && 
                    t.status !== 'completed' && 
                    t.status !== 'done'
                  )
                  .map(task => (
                    <div 
                      key={task.id}
                      className="flex items-center justify-between p-2 hover:bg-accent rounded-md cursor-pointer"
                      onClick={() => addTaskToActive(task.id)}
                    >
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        <span>{task.title}</span>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All ({activeTasks.length})</TabsTrigger>
            <TabsTrigger value="today">Today ({todayTasks.length})</TabsTrigger>
            <TabsTrigger value="week">This Week ({weekTasks.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <ScrollArea className="h-[300px]">
              {activeTasks.length > 0 ? (
                activeTasks.map(task => (
                  <TaskItem 
                    key={task.id}
                    task={task}
                    isActive={task.id === currentTask?.id}
                    pomodoro={getTaskPomodoros(task.id)}
                    onTaskClick={() => handleTaskClick(task)}
                    onStartPomodoro={(e) => handleStartPomodoro(task, e)}
                    onEditClick={(e) => openEditDialog(task.id, e)}
                    onRemoveClick={(e) => {
                      e.stopPropagation();
                      removeTaskFromPomodoros(task.id);
                    }}
                  />
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No active tasks. Add tasks to start tracking with Pomodoro.</p>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="today">
            <ScrollArea className="h-[300px]">
              {todayTasks.length > 0 ? (
                todayTasks.map(task => (
                  <TaskItem 
                    key={task.id}
                    task={task}
                    isActive={task.id === currentTask?.id}
                    pomodoro={getTaskPomodoros(task.id)}
                    onTaskClick={() => handleTaskClick(task)}
                    onStartPomodoro={(e) => handleStartPomodoro(task, e)}
                    onEditClick={(e) => openEditDialog(task.id, e)}
                    onRemoveClick={(e) => {
                      e.stopPropagation();
                      removeTaskFromPomodoros(task.id);
                    }}
                  />
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No tasks due today.</p>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="week">
            <ScrollArea className="h-[300px]">
              {weekTasks.length > 0 ? (
                weekTasks.map(task => (
                  <TaskItem 
                    key={task.id}
                    task={task}
                    isActive={task.id === currentTask?.id}
                    pomodoro={getTaskPomodoros(task.id)}
                    onTaskClick={() => handleTaskClick(task)}
                    onStartPomodoro={(e) => handleStartPomodoro(task, e)}
                    onEditClick={(e) => openEditDialog(task.id, e)}
                    onRemoveClick={(e) => {
                      e.stopPropagation();
                      removeTaskFromPomodoros(task.id);
                    }}
                  />
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No tasks due this week.</p>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Edit Task Dialog */}
      <Dialog open={isEditingTask} onOpenChange={setIsEditingTask}>
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
            <Button 
              variant="destructive" 
              onClick={() => {
                if (selectedTaskId) {
                  removeTaskFromPomodoros(selectedTaskId);
                  setIsEditingTask(false);
                }
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Remove Task
            </Button>
            <Button variant="outline" onClick={() => setIsEditingTask(false)}>
              Cancel
            </Button>
            <Button onClick={saveEstimate}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

interface TaskItemProps {
  task: Task;
  isActive: boolean;
  pomodoro?: {
    estimatedPomodoros: number;
    completedPomodoros: number;
  };
  onTaskClick: () => void;
  onStartPomodoro: (e: React.MouseEvent) => void;
  onEditClick: (e: React.MouseEvent) => void;
  onRemoveClick: (e: React.MouseEvent) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  isActive,
  pomodoro,
  onTaskClick,
  onStartPomodoro,
  onEditClick,
  onRemoveClick
}) => {
  const progress = pomodoro 
    ? (pomodoro.completedPomodoros / pomodoro.estimatedPomodoros) * 100
    : 0;
    
  const formatDate = (date: Date | undefined | string) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString();
  };

  return (
    <div 
      className={`mb-2 p-3 rounded-md cursor-pointer hover:bg-accent ${isActive ? 'bg-primary/10 border-l-4 border-primary' : 'border border-border'}`}
      onClick={onTaskClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <CheckCircle2 className={`h-4 w-4 mr-2 ${isActive ? 'text-primary' : ''}`} />
          <span className={`font-medium ${isActive ? 'text-primary' : ''}`}>{task.title}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Button 
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={onStartPomodoro}
          >
            <Play className="h-3.5 w-3.5" />
          </Button>
          <Button 
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={onEditClick}
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button 
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onRemoveClick}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      
      {task.dueDate && (
        <div className="flex items-center mb-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3 mr-1" />
          <span>Due: {formatDate(task.dueDate)}</span>
        </div>
      )}
      
      <div className="flex items-center justify-between text-xs mb-1">
        <div className="flex items-center">
          <Timer className="h-3 w-3 mr-1" />
          <span>
            {pomodoro?.completedPomodoros || 0}/{pomodoro?.estimatedPomodoros || 1} pomodoros
          </span>
        </div>
        <Badge variant={progress >= 100 ? "secondary" : "outline"} className="text-xs">
          {Math.round(progress)}%
        </Badge>
      </div>
      
      <Progress value={progress} className="h-1" />
    </div>
  );
};

export default PomodoroTasks;
