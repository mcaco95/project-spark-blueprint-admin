import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SystemSetting } from '@/types/admin';
import { adminService } from '@/services/adminService';
import { useToast } from '@/hooks/use-toast';

interface SettingsByCategory {
  [category: string]: SystemSetting[];
}

export const SystemSettings = () => {
  const { t } = useTranslation(['admin', 'common']);
  const { toast } = useToast();
  const [settings, setSettings] = useState<SettingsByCategory>({});
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, any>>({});
  
  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminService.getSettings();
      
      // Group settings by category
      const grouped = response.items.reduce((acc: SettingsByCategory, setting: SystemSetting) => {
        if (!acc[setting.category]) {
          acc[setting.category] = [];
        }
        acc[setting.category].push(setting);
        return acc;
      }, {});
      
      setSettings(grouped);
    } catch (err) {
      setError(t('errorLoadingSettings', { ns: 'admin' }));
      console.error('Error loading settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (settingId: string, newValue: string | boolean | number) => {
    setPendingChanges(prev => ({
      ...prev,
      [settingId]: newValue
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Update each changed setting
      await Promise.all(
        Object.entries(pendingChanges).map(([settingId, value]) =>
          adminService.updateSetting(settingId, { value })
        )
      );

      // Reload settings to get latest state
      await loadSettings();
      setPendingChanges({});
      toast({
        title: t('settingsSaved', { ns: 'admin' }),
        description: t('settingsSavedDescription', { ns: 'admin' }),
        variant: "default",
      });
    } catch (err) {
      setError(t('errorSavingSettings', { ns: 'admin' }));
      console.error('Error saving settings:', err);
      toast({
        title: t('errorSavingSettings', { ns: 'admin' }),
        description: String(err),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setPendingChanges({});
    loadSettings(); // Reload original values
  };

  const renderSettingInput = (setting: SystemSetting) => {
    const value = pendingChanges[setting.id] ?? setting.value;
    
    switch (setting.type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch 
              id={setting.id} 
              checked={value as boolean}
              onCheckedChange={(checked) => handleSettingChange(setting.id, checked)}
            />
            <Label htmlFor={setting.id}>{value ? t('enabled', { ns: 'admin' }) : t('disabled', { ns: 'admin' })}</Label>
          </div>
        );
      case 'number':
        return (
          <Input 
            type="number" 
            id={setting.id}
            value={value as number} 
            onChange={(e) => handleSettingChange(setting.id, parseInt(e.target.value))}
          />
        );
      default:
        return (
          <Input 
            type="text" 
            id={setting.id}
            value={value as string} 
            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
          />
        );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center min-h-[400px]">
          <Spinner className="w-8 h-8" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const hasChanges = Object.keys(pendingChanges).length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('systemSettings', { ns: 'admin' })}</CardTitle>
        <CardDescription>{t('systemSettingsDescription', { ns: 'admin' })}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            {Object.keys(settings).map((category) => (
              <TabsTrigger key={category} value={category}>
                {t(category, { ns: 'admin' })}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {Object.entries(settings).map(([category, categorySettings]) => (
            <TabsContent key={category} value={category} className="space-y-6 pt-4">
              {categorySettings.map((setting) => (
                <div key={setting.id} className="space-y-2">
                  <Label htmlFor={setting.id}>{t(setting.name, { ns: 'admin', defaultValue: setting.name })}</Label>
                  {renderSettingInput(setting)}
                  <p className="text-sm text-muted-foreground">
                    {t(`${setting.name}Description`, { ns: 'admin', defaultValue: setting.description })}
                  </p>
                </div>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
      <CardFooter className="border-t pt-6 flex justify-between">
        <div className="text-sm text-muted-foreground">
          {hasChanges && t('unsavedChanges', { ns: 'admin' })}
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={!hasChanges || isSaving}
          >
            {t('cancel', { ns: 'common' })}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                {t('saving', { ns: 'common' })}
              </>
            ) : (
              t('saveSettings', { ns: 'admin' })
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
