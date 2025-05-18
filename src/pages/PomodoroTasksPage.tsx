
import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import PomodoroTasks from '@/components/pomodoro/PomodoroTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Timer } from 'lucide-react';
import { TaskProvider } from '@/contexts/tasks/TaskContext';

const PomodoroTasksPage: React.FC = () => {
  return (
    <MainLayout>
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-1">Pomodoro Tasks</h1>
              <p className="text-muted-foreground">
                Manage your tasks using the Pomodoro technique
              </p>
            </div>
            
            <TaskProvider>
              <PomodoroTasks />
            </TaskProvider>
          </div>
          
          <div className="md:w-1/3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  <Timer className="h-5 w-5 inline mr-2" />
                  Pomodoro Technique
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="about">
                  <TabsList className="mb-4">
                    <TabsTrigger value="about">About</TabsTrigger>
                    <TabsTrigger value="tips">Tips</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="about">
                    <div className="space-y-4">
                      <p>
                        The Pomodoro Technique is a time management method that uses a timer to break work into intervals, 
                        traditionally 25 minutes in length, separated by short breaks.
                      </p>
                      <ol className="list-decimal list-inside space-y-2">
                        <li>Choose a task to accomplish</li>
                        <li>Set the Pomodoro timer (traditionally for 25 minutes)</li>
                        <li>Work on the task until the timer rings</li>
                        <li>Take a short break (5 minutes)</li>
                        <li>After four pomodoros, take a longer break (15-30 minutes)</li>
                      </ol>
                      <p>
                        This technique helps improve focus and avoid burnout by incorporating regular breaks into your work schedule.
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="tips">
                    <div className="space-y-4">
                      <p className="font-medium">Tips for effective Pomodoro sessions:</p>
                      <ul className="list-disc list-inside space-y-2">
                        <li>Choose one specific task for each Pomodoro session</li>
                        <li>Minimize distractions - put your phone on silent mode</li>
                        <li>Break complex tasks into smaller tasks</li>
                        <li>Use the short breaks to stretch, walk around, or drink water</li>
                        <li>Adjust the Pomodoro length if needed (some prefer 50/10 splits)</li>
                        <li>Track your completed Pomodoros to measure productivity</li>
                        <li>Respect the timer - when it rings, take your break</li>
                      </ul>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PomodoroTasksPage;
