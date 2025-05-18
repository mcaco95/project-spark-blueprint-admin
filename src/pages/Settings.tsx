
import { useTranslation } from 'react-i18next';
import { MainLayout } from '@/components/layout/MainLayout';

const Settings = () => {
  const { t } = useTranslation('common');

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('settings')}</h1>
          <p className="text-muted-foreground mt-2">
            Manage your preferences and account settings
          </p>
        </div>
        
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Settings page coming soon</p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
