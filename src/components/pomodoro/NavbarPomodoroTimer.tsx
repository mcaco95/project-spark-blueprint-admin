import React, { useState } from 'react';
import { usePomodoroContext, TimerState } from '@/contexts/PomodoroContext';
import { 
  Play, 
  Pause, 
  Clock, 
  Timer as TimerIcon,
  ChevronDown, 
  ChevronUp,
  CheckCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import PomodoroSettings from './PomodoroSettings';
import PomodoroTaskSelector from './PomodoroTaskSelector';

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

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
      return 'text-gray-600';
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

const NavbarPomodoroTimer: React.FC = () => {
  const {
    timerState,
    secondsLeft,
    pauseTimer,
    resumeTimer,
    startFocus,
    isTimerActive,
    currentTask,
    handleTimerComplete
  } = usePomodoroContext();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleToggleTimer = () => {
    if (timerState === 'paused') {
      resumeTimer();
    } else if (isTimerActive) {
      pauseTimer();
    } else {
      startFocus();
    }
  };

  const handleFinishFocus = () => {
    if (timerState === 'focus') {
      handleTimerComplete();
    }
  };

  return (
    <div className="flex items-center">
      <div 
        className={`flex items-center rounded-md border transition-all ${
          isTimerActive 
            ? `${getTimerStateColor(timerState)} ${getTimerStateTextColor(timerState)}` 
            : 'bg-background'
        }`}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-8 w-8 ${isTimerActive ? getTimerStateTextColor(timerState) : ''}`}
                onClick={handleToggleTimer}
              >
                {isTimerActive ? 
                  (timerState === 'paused' ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />) : 
                  <Clock className="h-4 w-4" />
                }
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isTimerActive 
                ? (timerState === 'paused' ? 'Resume timer' : 'Pause timer') 
                : 'Start timer'
              }
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className={`px-2 flex items-center ${isTimerActive ? getTimerStateTextColor(timerState) : ''}`}>
          {secondsLeft > 0 && (
            <>
              <span className="text-sm font-medium mr-1">{formatTime(secondsLeft)}</span>
              <Badge 
                variant="outline" 
                className={`text-xs ${getTimerStateTextColor(timerState)} border-current`}
              >
                {getTimerStateLabel(timerState)}
              </Badge>
            </>
          )}
        </div>

        {timerState === 'focus' && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`h-8 w-8 ${isTimerActive ? getTimerStateTextColor(timerState) : ''}`}
                  onClick={handleFinishFocus}
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Finish focus session
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <Drawer open={isExpanded} onOpenChange={setIsExpanded}>
          <DrawerTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`h-8 w-8 ${secondsLeft > 0 ? getTimerStateTextColor(timerState) : ''}`}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <TimerIcon className="h-5 w-5 mr-2" />
                  <h3 className="font-medium">Pomodoro Timer</h3>
                </div>
              </div>

              <PomodoroTaskSelector />

              <div className="mt-4">
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setShowSettings(true)}
                >
                  Settings
                </Button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      <Drawer open={showSettings} onOpenChange={setShowSettings}>
        <DrawerContent>
          <PomodoroSettings onClose={() => setShowSettings(false)} />
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default NavbarPomodoroTimer;
