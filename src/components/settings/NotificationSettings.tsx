
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Bell, Mail, MessageSquare, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export function NotificationSettings() {
  const { t } = useTranslation('common');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);
  const [projectUpdates, setProjectUpdates] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [digestFrequency, setDigestFrequency] = useState('daily');
  
  const handleSaveNotifications = () => {
    toast.success(t('settings.notification_preferences_saved', 'Notification preferences saved'));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t('settings.notifications', 'Notifications')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('settings.notifications_description', 'Configure how you receive notifications.')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t('settings.notification_preferences', 'Notification Preferences')}
          </CardTitle>
          <CardDescription>
            {t('settings.notification_preferences_description', 'Choose when and how you want to be notified.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {t('settings.email_notifications', 'Email Notifications')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.email_notifications_description', 'Receive updates and alerts via email.')}
                </p>
              </div>
              <Switch 
                id="email-notifications" 
                checked={emailNotifications} 
                onCheckedChange={setEmailNotifications} 
              />
            </div>
          
            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  {t('settings.push_notifications', 'Push Notifications')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.push_notifications_description', 'Receive real-time notifications in the app.')}
                </p>
              </div>
              <Switch 
                id="push-notifications" 
                checked={pushNotifications} 
                onCheckedChange={setPushNotifications} 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {t('settings.notification_categories', 'Notification Categories')}
          </CardTitle>
          <CardDescription>
            {t('settings.notification_categories_description', 'Select which types of notifications you want to receive.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="task-reminders" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t('settings.task_reminders', 'Task Reminders')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.task_reminders_description', 'Get reminded about upcoming task deadlines.')}
              </p>
            </div>
            <Switch 
              id="task-reminders" 
              checked={taskReminders} 
              onCheckedChange={setTaskReminders} 
            />
          </div>
          
          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="project-updates" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                {t('settings.project_updates', 'Project Updates')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.project_updates_description', 'Stay informed about changes to your projects.')}
              </p>
            </div>
            <Switch 
              id="project-updates" 
              checked={projectUpdates} 
              onCheckedChange={setProjectUpdates} 
            />
          </div>
          
          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="message-notifications" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                {t('settings.message_notifications', 'Message Notifications')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.message_notifications_description', 'Get notified when you receive new messages.')}
              </p>
            </div>
            <Switch 
              id="message-notifications" 
              checked={messageNotifications} 
              onCheckedChange={setMessageNotifications} 
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {t('settings.daily_digest', 'Daily Digest')}
          </CardTitle>
          <CardDescription>
            {t('settings.daily_digest_description', 'Get a summary of activity at your preferred frequency.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup defaultValue={digestFrequency} onValueChange={setDigestFrequency}>
            <div className="flex items-center space-x-2 mb-2">
              <RadioGroupItem value="daily" id="daily" />
              <Label htmlFor="daily">{t('settings.daily', 'Daily')}</Label>
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <RadioGroupItem value="weekly" id="weekly" />
              <Label htmlFor="weekly">{t('settings.weekly', 'Weekly')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="never" id="never" />
              <Label htmlFor="never">{t('settings.never', 'Never')}</Label>
            </div>
          </RadioGroup>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveNotifications}>
            {t('settings.save_preferences', 'Save preferences')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
