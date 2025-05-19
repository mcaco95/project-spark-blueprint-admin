
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { AccountSettings } from '@/components/settings/AccountSettings';
import { ThemeSettings } from '@/components/settings/ThemeSettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { LanguageSettings } from '@/components/settings/LanguageSettings';
import { PomodoroSettings } from '@/components/settings/PomodoroSettings';

const Settings = () => {
  const { t } = useTranslation('common');
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get tab from URL query parameter or default to "profile"
  const getTabFromUrl = () => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    return tab && ['profile', 'account', 'appearance', 'notifications', 'language', 'pomodoro'].includes(tab) 
      ? tab 
      : 'profile';
  };
  
  const [activeTab, setActiveTab] = useState(getTabFromUrl());
  
  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/settings?tab=${value}`, { replace: true });
  };
  
  // Update tab when URL changes
  useEffect(() => {
    setActiveTab(getTabFromUrl());
  }, [location.search]);

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-6 pb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('settings')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('settings.description', 'Manage your preferences and account settings')}
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-6 w-full mb-4">
            <TabsTrigger value="profile">{t('settings.profile', 'Profile')}</TabsTrigger>
            <TabsTrigger value="account">{t('settings.account', 'Account')}</TabsTrigger>
            <TabsTrigger value="appearance">{t('settings.appearance', 'Appearance')}</TabsTrigger>
            <TabsTrigger value="notifications">{t('settings.notifications', 'Notifications')}</TabsTrigger>
            <TabsTrigger value="language">{t('settings.language', 'Language')}</TabsTrigger>
            <TabsTrigger value="pomodoro">{t('settings.pomodoro', 'Pomodoro')}</TabsTrigger>
          </TabsList>
          
          <div className="border rounded-lg p-6 bg-card">
            <TabsContent value="profile" className="mt-0">
              <ProfileSettings />
            </TabsContent>
            
            <TabsContent value="account" className="mt-0">
              <AccountSettings />
            </TabsContent>
            
            <TabsContent value="appearance" className="mt-0">
              <ThemeSettings />
            </TabsContent>
            
            <TabsContent value="notifications" className="mt-0">
              <NotificationSettings />
            </TabsContent>
            
            <TabsContent value="language" className="mt-0">
              <LanguageSettings />
            </TabsContent>
            
            <TabsContent value="pomodoro" className="mt-0">
              <PomodoroSettings />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Settings;
