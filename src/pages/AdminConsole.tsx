import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserManagement } from '@/components/admin/UserManagement';
import { RoleManagement } from '@/components/admin/RoleManagement';
import { MetricsOverview } from '@/components/admin/MetricsOverview';
import { TemplateManagement } from '@/components/admin/TemplateManagement';

const AdminConsole = () => {
  const { t } = useTranslation(['common', 'admin']);
  const [activeTab, setActiveTab] = useState('users');

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('admin')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('adminDescription', { ns: 'admin' })}
          </p>
        </div>
        
        <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <TabsTrigger value="users">{t('userManagement', { ns: 'admin' })}</TabsTrigger>
            <TabsTrigger value="metrics">{t('metrics', { ns: 'admin' })}</TabsTrigger>
            <TabsTrigger value="roles">{t('roleManagement', { ns: 'admin' })}</TabsTrigger>
            <TabsTrigger value="templates">{t('templates', { ns: 'admin' })}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="p-0">
            <UserManagement />
          </TabsContent>
          
          <TabsContent value="metrics" className="p-0">
            <MetricsOverview />
          </TabsContent>
          
          <TabsContent value="roles" className="p-0">
            <RoleManagement />
          </TabsContent>
          
          <TabsContent value="templates" className="p-0">
            <TemplateManagement />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default AdminConsole;
