
import React from 'react';
import { usePomodoroContext } from '@/contexts/PomodoroContext';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';

interface PomodoroSettingsProps {
  onClose?: () => void;
}

const settingsSchema = z.object({
  focusMinutes: z
    .number()
    .min(1, 'Must be at least 1 minute')
    .max(120, 'Must not exceed 120 minutes'),
  shortBreakMinutes: z
    .number()
    .min(1, 'Must be at least 1 minute')
    .max(30, 'Must not exceed 30 minutes'),
  longBreakMinutes: z
    .number()
    .min(1, 'Must be at least 1 minute')
    .max(60, 'Must not exceed 60 minutes'),
  cyclesBeforeLongBreak: z
    .number()
    .min(1, 'Must be at least 1 cycle')
    .max(10, 'Must not exceed 10 cycles'),
  autoStartBreaks: z.boolean(),
  autoStartFocus: z.boolean(),
  soundEnabled: z.boolean(),
  notificationsEnabled: z.boolean(),
});

const PomodoroSettings: React.FC<PomodoroSettingsProps> = ({ onClose }) => {
  const { settings, updateSettings, resetTimer } = usePomodoroContext();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      ...settings,
    },
  });

  const onSubmit = (data: z.infer<typeof settingsSchema>) => {
    updateSettings(data);
    toast({
      title: "Settings updated",
      description: "Your Pomodoro timer settings have been saved.",
    });
    if (onClose) onClose();
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Pomodoro Settings</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Time Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="focusMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Focus Duration (mins)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="shortBreakMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short Break (mins)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="longBreakMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Long Break (mins)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="cyclesBeforeLongBreak"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cycles before Long Break</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Behavior</h3>
            <FormField
              control={form.control}
              name="autoStartBreaks"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel>Auto-start Breaks</FormLabel>
                    <FormDescription>
                      Automatically start breaks after focus sessions
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="autoStartFocus"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel>Auto-start Focus</FormLabel>
                    <FormDescription>
                      Automatically start focus sessions after breaks
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Notifications</h3>
            <FormField
              control={form.control}
              name="soundEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel>Sound Notifications</FormLabel>
                    <FormDescription>
                      Play sounds when timer changes state
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notificationsEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel>Browser Notifications</FormLabel>
                    <FormDescription>
                      Show browser notifications
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      onClick={() => {
                        if (!field.value && Notification.permission !== 'granted') {
                          Notification.requestPermission();
                        }
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => {
              form.reset();
              if (onClose) onClose();
            }}>
              Cancel
            </Button>
            <Button type="submit">Save Settings</Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default PomodoroSettings;
