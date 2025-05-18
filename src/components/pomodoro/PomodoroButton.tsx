
import React from 'react';
import { Task } from '@/types/task';
import { usePomodoroContext } from '@/contexts/PomodoroContext';
import { Button } from '@/components/ui/button';
import { Timer, Play } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip';

interface PomodoroButtonProps {
  task: Task;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

const PomodoroButton: React.FC<PomodoroButtonProps> = ({ 
  task, 
  variant = "outline", 
  size = "default" 
}) => {
  const { setCurrentTask, startFocus, currentTask } = usePomodoroContext();
  
  const handleStartPomodoro = () => {
    setCurrentTask(task);
    startFocus();
  };

  const isCurrentTask = currentTask?.id === task.id;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isCurrentTask ? "default" : variant}
            size={size}
            onClick={handleStartPomodoro}
            className={isCurrentTask ? 'bg-primary text-primary-foreground' : ''}
          >
            {size === "icon" ? (
              <Timer className="h-4 w-4" />
            ) : (
              <>
                {isCurrentTask ? <Timer className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                {isCurrentTask ? 'Active Pomodoro' : 'Start Pomodoro'}
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isCurrentTask ? 'This task is currently active in the Pomodoro timer' : 'Start a Pomodoro session for this task'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default PomodoroButton;
