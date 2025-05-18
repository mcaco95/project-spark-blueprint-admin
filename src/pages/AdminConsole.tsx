
import { useTranslation } from 'react-i18next';
import { MainLayout } from '@/components/layout/MainLayout';

const AdminConsole = () => {
  const { t } = useTranslation('common');

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('admin')}</h1>
          <p className="text-muted-foreground mt-2">
            Manage users, roles and system settings
          </p>
        </div>
        
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Admin console coming soon</p>
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminConsole;
