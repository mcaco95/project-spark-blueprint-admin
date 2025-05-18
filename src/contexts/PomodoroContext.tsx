import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Task } from '@/types/task';
import { useTaskContext } from '@/contexts/tasks/TaskContext';

// Sound assets
const NOTIFICATION_SOUNDS = {
  start: new Audio('/sounds/start.mp3'),
  break: new Audio('/sounds/break.mp3'),
  complete: new Audio('/sounds/complete.mp3'),
};

// Types
export type TimerState = 'idle' | 'focus' | 'shortBreak' | 'longBreak' | 'paused';

export type TimerSettings = {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  cyclesBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
};

export type TaskPomodoro = {
  taskId: string;
  estimatedPomodoros: number;
  completedPomodoros: number;
};

type PomodoroContextType = {
  timerState: TimerState;
  settings: TimerSettings;
  currentTask: Task | null;
  secondsLeft: number;
  completedCycles: number;
  completedPomodoros: number;
  setCurrentTask: (task: Task | null) => void;
  startFocus: () => void;
  startShortBreak: () => void;
  startLongBreak: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  skipTimer: () => void;
  updateSettings: (newSettings: Partial<TimerSettings>) => void;
  isTimerActive: boolean;
  progress: number;
  taskPomodoros: TaskPomodoro[];
  getTaskPomodoros: (taskId: string) => TaskPomodoro | undefined;
  updateTaskPomodoros: (taskId: string, estimatedPomodoros: number) => void;
  incrementTaskCompletedPomodoros: (taskId: string) => void;
  addTaskToPomodoros: (taskId: string, estimatedPomodoros?: number) => void;
  removeTaskFromPomodoros: (taskId: string) => void;
  activeTaskIds: string[];
  addTaskToActive: (taskId: string) => void;
  removeTaskFromActive: (taskId: string) => void;
};

const DEFAULT_SETTINGS: TimerSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLongBreak: 4,
  autoStartBreaks: true,
  autoStartFocus: true,
  soundEnabled: true,
  notificationsEnabled: true,
};

// Create the context
const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

// Provider component
export const PomodoroProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const { getAllTasks } = useTaskContext();
  const [settings, setSettings] = useState<TimerSettings>(() => {
    // Load settings from localStorage or use defaults
    const savedSettings = localStorage.getItem('pomodoroSettings');
    return savedSettings ? JSON.parse(savedSettings) : DEFAULT_SETTINGS;
  });

  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [intervalId, setIntervalId] = useState<number | null>(null);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [completedCycles, setCompletedCycles] = useState<number>(0);
  const [completedPomodoros, setCompletedPomodoros] = useState<number>(0);
  const [targetSeconds, setTargetSeconds] = useState<number>(0);
  const [taskPomodoros, setTaskPomodoros] = useState<TaskPomodoro[]>(() => {
    const saved = localStorage.getItem('taskPomodoros');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeTaskIds, setActiveTaskIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('activeTaskIds');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Calculate progress percentage (0-100)
  const progress = targetSeconds > 0 ? 100 - ((secondsLeft / targetSeconds) * 100) : 0;
  
  // Check if timer is active (not idle or paused)
  const isTimerActive = timerState !== 'idle' && timerState !== 'paused';

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
  }, [settings]);

  // Save task pomodoros to localStorage when they change
  useEffect(() => {
    localStorage.setItem('taskPomodoros', JSON.stringify(taskPomodoros));
  }, [taskPomodoros]);

  // Save active task IDs to localStorage when they change
  useEffect(() => {
    localStorage.setItem('activeTaskIds', JSON.stringify(activeTaskIds));
  }, [activeTaskIds]);

  // Get task pomodoro information
  const getTaskPomodoros = useCallback((taskId: string) => {
    return taskPomodoros.find(tp => tp.taskId === taskId);
  }, [taskPomodoros]);

  // Update task pomodoro estimates
  const updateTaskPomodoros = useCallback((taskId: string, estimatedPomodoros: number) => {
    setTaskPomodoros(prev => {
      const existing = prev.find(tp => tp.taskId === taskId);
      if (existing) {
        return prev.map(tp => 
          tp.taskId === taskId 
            ? { ...tp, estimatedPomodoros } 
            : tp
        );
      } else {
        return [
          ...prev,
          { taskId, estimatedPomodoros, completedPomodoros: 0 }
        ];
      }
    });
  }, []);

  // Increment completed pomodoros for a task
  const incrementTaskCompletedPomodoros = useCallback((taskId: string) => {
    setTaskPomodoros(prev => {
      const existing = prev.find(tp => tp.taskId === taskId);
      if (existing) {
        return prev.map(tp => 
          tp.taskId === taskId 
            ? { ...tp, completedPomodoros: tp.completedPomodoros + 1 } 
            : tp
        );
      }
      return prev;
    });
  }, []);

  // Add a task to pomodoro tracking
  const addTaskToPomodoros = useCallback((taskId: string, estimatedPomodoros: number = 1) => {
    setTaskPomodoros(prev => {
      if (prev.some(tp => tp.taskId === taskId)) {
        return prev;
      }
      return [
        ...prev,
        { taskId, estimatedPomodoros, completedPomodoros: 0 }
      ];
    });
    addTaskToActive(taskId);
  }, []);

  // Remove a task from pomodoro tracking
  const removeTaskFromPomodoros = useCallback((taskId: string) => {
    setTaskPomodoros(prev => prev.filter(tp => tp.taskId !== taskId));
    removeTaskFromActive(taskId);
  }, []);

  // Add a task to active tasks
  const addTaskToActive = useCallback((taskId: string) => {
    setActiveTaskIds(prev => {
      if (prev.includes(taskId)) {
        return prev;
      }
      return [...prev, taskId];
    });
  }, []);

  // Remove a task from active tasks
  const removeTaskFromActive = useCallback((taskId: string) => {
    setActiveTaskIds(prev => prev.filter(id => id !== taskId));
  }, []);

  // Handle timer completion
  const handleTimerComplete = useCallback(() => {
    if (timerState === 'focus') {
      // Completed a focus session
      setCompletedPomodoros(prev => prev + 1);
      
      // Increment task completed pomodoros if there is a current task
      if (currentTask) {
        incrementTaskCompletedPomodoros(currentTask.id);
      }
      
      const newCycleCount = completedCycles + 1;
      setCompletedCycles(newCycleCount);
      
      // Play sound
      if (settings.soundEnabled) {
        NOTIFICATION_SOUNDS.complete.play().catch(e => console.error("Error playing sound:", e));
      }
      
      // Show notification
      if (settings.notificationsEnabled) {
        new Notification('Focus session complete!', { 
          body: currentTask ? `Task: ${currentTask.title} - Great job!` : 'Take a break!',
          icon: '/favicon.ico'
        });
      }
      
      // Show toast
      toast({
        title: "Focus session complete!",
        description: currentTask ? `Task: ${currentTask.title}` : '',
      });
      
      // Start break
      if (settings.autoStartBreaks) {
        if (newCycleCount % settings.cyclesBeforeLongBreak === 0) {
          startLongBreak();
        } else {
          startShortBreak();
        }
      } else {
        setTimerState('idle');
      }
    } else if (timerState === 'shortBreak' || timerState === 'longBreak') {
      // Completed a break
      if (settings.soundEnabled) {
        NOTIFICATION_SOUNDS.start.play().catch(e => console.error("Error playing sound:", e));
      }
      
      // Show notification
      if (settings.notificationsEnabled) {
        new Notification('Break complete!', { 
          body: 'Ready to focus again?',
          icon: '/favicon.ico'
        });
      }
      
      // Show toast
      toast({
        title: `${timerState === 'shortBreak' ? 'Short' : 'Long'} break complete!`,
        description: "Ready to focus again?",
      });
      
      // Start next focus session
      if (settings.autoStartFocus) {
        startFocus();
      } else {
        setTimerState('idle');
      }
    }
  }, [timerState, completedCycles, settings, currentTask, toast, incrementTaskCompletedPomodoros]);

  // Request notification permission when needed
  useEffect(() => {
    if (settings.notificationsEnabled && 
        Notification.permission !== 'granted' && 
        Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, [settings.notificationsEnabled]);

  // Timer tick function
  useEffect(() => {
    if (isTimerActive && secondsLeft > 0) {
      const id = window.setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(id);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      setIntervalId(id);
      
      return () => clearInterval(id);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isTimerActive, secondsLeft, handleTimerComplete, intervalId]);

  // Start focus session
  const startFocus = useCallback(() => {
    if (intervalId) clearInterval(intervalId);
    
    const focusSeconds = settings.focusMinutes * 60;
    setSecondsLeft(focusSeconds);
    setTargetSeconds(focusSeconds);
    setTimerState('focus');
    
    if (settings.soundEnabled) {
      NOTIFICATION_SOUNDS.start.play().catch(e => console.error("Error playing sound:", e));
    }
    
    toast({
      title: "Focus session started",
      description: currentTask ? `Working on: ${currentTask.title}` : '',
    });
  }, [settings, intervalId, currentTask, toast]);

  // Start short break
  const startShortBreak = useCallback(() => {
    if (intervalId) clearInterval(intervalId);
    
    const breakSeconds = settings.shortBreakMinutes * 60;
    setSecondsLeft(breakSeconds);
    setTargetSeconds(breakSeconds);
    setTimerState('shortBreak');
    
    if (settings.soundEnabled) {
      NOTIFICATION_SOUNDS.break.play().catch(e => console.error("Error playing sound:", e));
    }
    
    toast({
      title: "Short break started",
      description: "Take a quick breather",
    });
  }, [settings, intervalId, toast]);

  // Start long break
  const startLongBreak = useCallback(() => {
    if (intervalId) clearInterval(intervalId);
    
    const breakSeconds = settings.longBreakMinutes * 60;
    setSecondsLeft(breakSeconds);
    setTargetSeconds(breakSeconds);
    setTimerState('longBreak');
    
    if (settings.soundEnabled) {
      NOTIFICATION_SOUNDS.break.play().catch(e => console.error("Error playing sound:", e));
    }
    
    toast({
      title: "Long break started",
      description: "Take a well-deserved longer break",
    });
  }, [settings, intervalId, toast]);

  // Pause the timer
  const pauseTimer = useCallback(() => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setTimerState('paused');
  }, [intervalId]);

  // Resume the timer
  const resumeTimer = useCallback(() => {
    if (timerState === 'paused') {
      setTimerState(prevState => {
        // Get the previous active state (before pausing)
        const activeState = prevState === 'paused' ? 'focus' : prevState;
        return activeState;
      });
    }
  }, [timerState]);

  // Reset the timer
  const resetTimer = useCallback(() => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setTimerState('idle');
    setSecondsLeft(0);
    setTargetSeconds(0);
    setCompletedCycles(0);
  }, [intervalId]);

  // Skip to next timer state
  const skipTimer = useCallback(() => {
    if (timerState === 'focus') {
      if ((completedCycles + 1) % settings.cyclesBeforeLongBreak === 0) {
        startLongBreak();
      } else {
        startShortBreak();
      }
    } else if (timerState === 'shortBreak' || timerState === 'longBreak') {
      startFocus();
    }
  }, [timerState, completedCycles, settings, startFocus, startShortBreak, startLongBreak]);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<TimerSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Provide the context value
  const contextValue = {
    timerState,
    settings,
    currentTask,
    secondsLeft,
    completedCycles,
    completedPomodoros,
    setCurrentTask,
    startFocus,
    startShortBreak,
    startLongBreak,
    pauseTimer,
    resumeTimer,
    resetTimer,
    skipTimer,
    updateSettings,
    isTimerActive,
    progress,
    taskPomodoros,
    getTaskPomodoros,
    updateTaskPomodoros,
    incrementTaskCompletedPomodoros,
    addTaskToPomodoros,
    removeTaskFromPomodoros,
    activeTaskIds,
    addTaskToActive,
    removeTaskFromActive,
  };

  return (
    <PomodoroContext.Provider value={contextValue}>
      {children}
    </PomodoroContext.Provider>
  );
};

// Custom hook
export const usePomodoroContext = () => {
  const context = useContext(PomodoroContext);
  if (context === undefined) {
    throw new Error('usePomodoroContext must be used within a PomodoroProvider');
  }
  return context;
};
