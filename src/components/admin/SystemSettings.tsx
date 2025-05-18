
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SystemSetting } from '@/types/admin';

// Mock data
const mockSettings: Record<string, SystemSetting[]> = {
  general: [
    {
      id: '1',
      name: 'appName',
      value: 'Project Management App',
      type: 'string',
      description: 'Name of the application',
      category: 'general',
    },
    {
      id: '2',
      name: 'defaultLanguage',
      value: 'en',
      type: 'string',
      description: 'Default language for new users',
      category: 'general',
    },
    {
      id: '3',
      name: 'allowRegistration',
      value: true,
      type: 'boolean',
      description: 'Allow users to register accounts',
      category: 'general',
    },
  ],
  security: [
    {
      id: '4',
      name: 'requireEmailVerification',
      value: true,
      type: 'boolean',
      description: 'Require email verification for new accounts',
      category: 'security',
    },
    {
      id: '5',
      name: 'passwordMinLength',
      value: 8,
      type: 'number',
      description: 'Minimum password length',
      category: 'security',
    },
    {
      id: '6',
      name: 'passwordRequireSpecialChar',
      value: true,
      type: 'boolean',
      description: 'Require at least one special character in passwords',
      category: 'security',
    },
    {
      id: '7',
      name: 'sessionTimeout',
      value: 60,
      type: 'number',
      description: 'Session timeout in minutes',
      category: 'security',
    },
  ],
  notifications: [
    {
      id: '8',
      name: 'enableEmailNotifications',
      value: true,
      type: 'boolean',
      description: 'Send email notifications for important events',
      category: 'notifications',
    },
    {
      id: '9',
      name: 'dailyDigestEnabled',
      value: false,
      type: 'boolean',
      description: 'Send daily digest of activities',
      category: 'notifications',
    },
  ],
};

export const SystemSettings = () => {
  const { t } = useTranslation(['admin', 'common']);
  const [settings, setSettings] = useState(mockSettings);
  const [activeTab, setActiveTab] = useState('general');
  
  const handleSettingChange = (settingId: string, newValue: string | boolean | number) => {
    setSettings(prev => {
      // Create deep copy
      const newSettings = JSON.parse(JSON.stringify(prev));
      
      // Find and update the setting
      Object.keys(newSettings).forEach(category => {
        const settingIndex = newSettings[category].findIndex((s: SystemSetting) => s.id === settingId);
        if (settingIndex !== -1) {
          newSettings[category][settingIndex].value = newValue;
        }
      });
      
      return newSettings;
    });
  };

  const renderSettingInput = (setting: SystemSetting) => {
    switch (setting.type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch 
              id={setting.id} 
              checked={setting.value as boolean}
              onCheckedChange={(checked) => handleSettingChange(setting.id, checked)}
            />
            <Label htmlFor={setting.id}>{setting.value ? t('enabled', { ns: 'admin' }) : t('disabled', { ns: 'admin' })}</Label>
          </div>
        );
      case 'number':
        return (
          <Input 
            type="number" 
            id={setting.id}
            value={setting.value as number} 
            onChange={(e) => handleSettingChange(setting.id, parseInt(e.target.value))}
          />
        );
      default:
        return (
          <Input 
            type="text" 
            id={setting.id}
            value={setting.value as string} 
            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
          />
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('systemSettings', { ns: 'admin' })}</CardTitle>
        <CardDescription>{t('systemSettingsDescription', { ns: 'admin' })}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">{t('general', { ns: 'admin' })}</TabsTrigger>
            <TabsTrigger value="security">{t('security', { ns: 'admin' })}</TabsTrigger>
            <TabsTrigger value="notifications">{t('notifications', { ns: 'admin' })}</TabsTrigger>
          </TabsList>
          
          {Object.keys(settings).map((category) => (
            <TabsContent key={category} value={category} className="space-y-6 pt-4">
              {settings[category].map((setting) => (
                <div key={setting.id} className="space-y-2">
                  <Label htmlFor={setting.id}>{t(setting.name, { ns: 'admin' })}</Label>
                  {renderSettingInput(setting)}
                  <p className="text-sm text-muted-foreground">{t(`${setting.name}Description`, { ns: 'admin', defaultValue: setting.description })}</p>
                </div>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
      <CardFooter className="border-t pt-6 flex justify-end space-x-2">
        <Button variant="outline">{t('cancel', { ns: 'common' })}</Button>
        <Button>{t('saveSettings', { ns: 'admin' })}</Button>
      </CardFooter>
    </Card>
  );
};
