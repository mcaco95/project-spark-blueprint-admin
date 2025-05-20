
import React from 'react';
import { usePomodoroContext } from '@/contexts/PomodoroContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Timer } from 'lucide-react';

interface PomodoroStatsProps {
  className?: string;
}

const PomodoroStats: React.FC<PomodoroStatsProps> = ({ className = '' }) => {
  const { completedPomodoros, completedCycles, settings } = usePomodoroContext();
  
  const totalMinutes = completedPomodoros * settings.focusMinutes;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center">
              <Timer className="h-5 w-5 mr-2" />
              Pomodoro Stats
            </CardTitle>
            <CardDescription>
              Your productivity statistics
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Completed</p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {completedPomodoros} pomodoros
              </Badge>
              <Badge variant="outline">
                {completedCycles} cycles
              </Badge>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Total Focus Time</p>
            <Badge className="bg-primary">
              {hours > 0 ? `${hours}h ` : ''}{minutes}m
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PomodoroStats;
