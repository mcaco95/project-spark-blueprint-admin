
export interface PomodoroSession {
  taskId?: string;
  startTime: Date;
  endTime?: Date;
  completed: boolean;
  type: 'focus' | 'shortBreak' | 'longBreak';
  duration: number; // in minutes
}

export interface PomodoroTaskStats {
  taskId: string;
  taskTitle: string;
  completedPomodoros: number;
  totalFocusMinutes: number;
}

// Export sound paths so they can be imported dynamically
export const POMODORO_SOUNDS = {
  START: '/sounds/start.mp3',
  BREAK: '/sounds/break.mp3',
  COMPLETE: '/sounds/complete.mp3',
};
