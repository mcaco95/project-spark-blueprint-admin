
import React, { useState } from 'react';
import { usePomodoroContext, TimerState } from '@/contexts/PomodoroContext';
import {
  Play,
  Pause,
  SkipForward,
  Settings,
  Timer as TimerIcon,
  X,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import PomodoroSettings from './PomodoroSettings';
import PomodoroTaskSelector from './PomodoroTaskSelector';

const getTimerStateColor = (state: TimerState): string => {
  switch (state) {
    case 'focus':
      return 'bg-[#ea384c]';
    case 'shortBreak':
      return 'bg-[#F2FCE2]';
    case 'longBreak':
      return 'bg-[#D3E4FD]';
    default:
      return 'bg-gray-500';
  }
};

const getTimerStateTextColor = (state: TimerState): string => {
  switch (state) {
    case 'focus':
      return 'text-white';
    case 'shortBreak':
      return 'text-gray-800';
    case 'longBreak':
      return 'text-gray-800';
    default:
      return 'text-white';
  }
};

const getTimerStateLabel = (state: TimerState): string => {
  switch (state) {
    case 'focus':
      return 'Focus';
    case 'shortBreak':
      return 'Short Break';
    case 'longBreak':
      return 'Long Break';
    case 'paused':
      return 'Paused';
    default:
      return 'Idle';
  }
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const PomodoroTimer: React.FC = () => {
  const {
    timerState,
    secondsLeft,
    startFocus,
    startShortBreak,
    startLongBreak,
    pauseTimer,
    resumeTimer,
    skipTimer,
    resetTimer,
    isTimerActive,
    progress,
    completedPomodoros,
    currentTask
  } = usePomodoroContext();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ease-in-out rounded-lg shadow-lg bg-background border ${isExpanded ? 'w-80' : 'w-auto'}`}>
      {/* Compact View */}
      <div className="flex items-center p-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsExpanded(!isExpanded)}
                className="relative"
              >
                <Clock className={`h-5 w-5 ${isTimerActive ? 'text-primary animate-pulse' : ''}`} />
                {isTimerActive && (
                  <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getTimerStateColor(timerState)}`}></span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>{isExpanded ? 'Minimize' : 'Expand'} Pomodoro Timer</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {!isExpanded && isTimerActive && (
          <Badge variant="outline" className="ml-2">
            {formatTime(secondsLeft)}
          </Badge>
        )}
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <TimerIcon className="h-5 w-5 mr-2" />
              <h3 className="font-medium">Pomodoro Timer</h3>
            </div>
            <div className="flex items-center space-x-1">
              <Drawer open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DrawerTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <PomodoroSettings onClose={() => setIsSettingsOpen(false)} />
                </DrawerContent>
              </Drawer>
              <Button variant="ghost" size="icon" onClick={() => setIsExpanded(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mb-2">
            <div className="flex justify-between items-center">
              <Badge 
                variant={timerState === 'idle' ? 'outline' : 'secondary'} 
                className={`mb-2 ${timerState !== 'idle' ? getTimerStateColor(timerState) + ' ' + getTimerStateTextColor(timerState) : ''}`}
              >
                {getTimerStateLabel(timerState)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {completedPomodoros} pomodoro{completedPomodoros !== 1 ? 's' : ''} completed
              </span>
            </div>
            
            <div className="mb-4 text-center">
              <span className="text-3xl font-bold">{formatTime(secondsLeft)}</span>
            </div>
            
            <Progress 
              value={progress} 
              className={`h-2 mb-4 ${timerState !== 'idle' ? getTimerStateColor(timerState) : ''}`}
            />
          </div>

          {/* Task Selector Component */}
          <div className="mb-4">
            <PomodoroTaskSelector />
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <Button 
              variant="outline"
              className={`text-xs ${timerState === 'focus' ? getTimerStateColor(timerState) + ' ' + getTimerStateTextColor(timerState) : ''}`}
              onClick={() => startFocus()}
            >
              Focus
            </Button>
            <Button 
              variant="outline" 
              className={`text-xs ${timerState === 'shortBreak' ? getTimerStateColor(timerState) + ' ' + getTimerStateTextColor(timerState) : ''}`}
              onClick={() => startShortBreak()}
            >
              Short Break
            </Button>
          </div>
          
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              className={`text-xs ${timerState === 'longBreak' ? getTimerStateColor(timerState) + ' ' + getTimerStateTextColor(timerState) : ''}`}
              onClick={() => startLongBreak()}
            >
              Long Break
            </Button>
            
            <div className="flex space-x-2">
              {isTimerActive ? (
                timerState === 'paused' ? (
                  <Button size="icon" variant="outline" onClick={resumeTimer}>
                    <Play className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button size="icon" variant="outline" onClick={pauseTimer}>
                    <Pause className="h-4 w-4" />
                  </Button>
                )
              ) : (
                <Button size="icon" variant="outline" onClick={startFocus}>
                  <Play className="h-4 w-4" />
                </Button>
              )}
              
              <Button 
                size="icon" 
                variant="outline" 
                onClick={skipTimer}
                disabled={timerState === 'idle'}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;
