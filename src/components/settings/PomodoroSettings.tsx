
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Clock, Bell, Volume2 } from 'lucide-react';

export function PomodoroSettings() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  
  const handleRedirectToPomodoro = () => {
    navigate('/pomodoro');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t('settings.pomodoro', 'Pomodoro')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('settings.pomodoro_description', 'Configure your Pomodoro timer preferences.')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t('settings.timer_duration', 'Timer Duration')}
          </CardTitle>
          <CardDescription>
            {t('settings.timer_duration_description', 'Set the duration for work sessions and breaks.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="work-duration">{t('settings.work_duration', 'Work Duration')}</Label>
                <span className="text-sm text-muted-foreground">25 {t('settings.minutes', 'minutes')}</span>
              </div>
              <Slider defaultValue={[25]} max={60} step={1} id="work-duration" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="short-break">{t('settings.short_break', 'Short Break')}</Label>
                <span className="text-sm text-muted-foreground">5 {t('settings.minutes', 'minutes')}</span>
              </div>
              <Slider defaultValue={[5]} max={30} step={1} id="short-break" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="long-break">{t('settings.long_break', 'Long Break')}</Label>
                <span className="text-sm text-muted-foreground">15 {t('settings.minutes', 'minutes')}</span>
              </div>
              <Slider defaultValue={[15]} max={60} step={1} id="long-break" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="sessions">{t('settings.sessions_before_long_break', 'Sessions Before Long Break')}</Label>
                <span className="text-sm text-muted-foreground">4 {t('settings.sessions', 'sessions')}</span>
              </div>
              <Slider defaultValue={[4]} max={10} step={1} id="sessions" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t('settings.notifications', 'Notifications')}
          </CardTitle>
          <CardDescription>
            {t('settings.pomodoro_notification_description', 'Configure notifications for Pomodoro sessions.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="desktop-notifications">{t('settings.desktop_notifications', 'Desktop Notifications')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.desktop_notifications_description', 'Display notifications on your desktop when timer ends.')}
              </p>
            </div>
            <Switch id="desktop-notifications" defaultChecked />
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="space-y-0.5">
              <Label htmlFor="sound-notifications" className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                {t('settings.sound_notifications', 'Sound Notifications')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.sound_notifications_description', 'Play sound when timer starts or ends.')}
              </p>
            </div>
            <Switch id="sound-notifications" defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.auto_start_breaks', 'Automatic Timing')}</CardTitle>
          <CardDescription>
            {t('settings.auto_timing_description', 'Configure automatic session behavior.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-start-breaks">{t('settings.auto_start_breaks', 'Auto-start Breaks')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.auto_start_breaks_description', 'Automatically start breaks when work session ends.')}
              </p>
            </div>
            <Switch id="auto-start-breaks" defaultChecked />
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="space-y-0.5">
              <Label htmlFor="auto-start-work">{t('settings.auto_start_work', 'Auto-start Work')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.auto_start_work_description', 'Automatically start work session when break ends.')}
              </p>
            </div>
            <Switch id="auto-start-work" />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleRedirectToPomodoro}>{t('settings.go_to_pomodoro', 'Go to Pomodoro Timer')}</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
