
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Unauthorized: React.FC = () => {
  const { t } = useTranslation('auth');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="mx-auto w-16 h-16 bg-destructive/10 flex items-center justify-center rounded-full">
          <Shield className="h-8 w-8 text-destructive" />
        </div>
        
        <h1 className="text-3xl font-bold">{t('unauthorized')}</h1>
        <p className="text-muted-foreground">{t('noPermission')}</p>
        
        <Button asChild>
          <Link to="/">{t('backToDashboard')}</Link>
        </Button>
      </div>
    </div>
  );
};

export default Unauthorized;
