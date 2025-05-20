import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContextExtended';

export function LanguageSettings() {
  const { t, i18n } = useTranslation('common');
  const { user } = useAuth();
  
  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value);
    toast.success(t('settings.language_changed', 'Language changed successfully'));
  };

  const handleFormatChange = (value: string) => {
    toast.success(t('settings.date_format_changed', 'Date format changed successfully'));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t('settings.language', 'Language & Region')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('settings.language_description', 'Choose your preferred language and regional settings.')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.app_language', 'Application Language')}</CardTitle>
          <CardDescription>
            {t('settings.app_language_description', 'Select the language you want to use in the application.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup 
            defaultValue={user?.language || i18n.language || 'en'} 
            onValueChange={handleLanguageChange}
          >
            <div className="flex items-center space-x-2 mb-2">
              <RadioGroupItem value="en" id="en" />
              <Label htmlFor="en">English</Label>
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <RadioGroupItem value="es" id="es" />
              <Label htmlFor="es">Español</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="fr" id="fr" />
              <Label htmlFor="fr">Français</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.date_time_format', 'Date & Time Format')}</CardTitle>
          <CardDescription>
            {t('settings.date_time_format_description', 'Configure how dates and times are displayed.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date-format">{t('settings.date_format', 'Date Format')}</Label>
              <Select defaultValue="MM/DD/YYYY" onValueChange={handleFormatChange}>
                <SelectTrigger id="date-format">
                  <SelectValue placeholder={t('settings.select_date_format', 'Select date format')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (05/19/2025)</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (19/05/2025)</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2025-05-19)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time-format">{t('settings.time_format', 'Time Format')}</Label>
              <Select defaultValue="12">
                <SelectTrigger id="time-format">
                  <SelectValue placeholder={t('settings.select_time_format', 'Select time format')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">{t('settings.12_hour', '12-hour (2:30 PM)')}</SelectItem>
                  <SelectItem value="24">{t('settings.24_hour', '24-hour (14:30)')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">{t('settings.timezone', 'Time Zone')}</Label>
              <Select defaultValue="UTC">
                <SelectTrigger id="timezone">
                  <SelectValue placeholder={t('settings.select_timezone', 'Select time zone')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                  <SelectItem value="EST">EST (Eastern Standard Time)</SelectItem>
                  <SelectItem value="CST">CST (Central Standard Time)</SelectItem>
                  <SelectItem value="PST">PST (Pacific Standard Time)</SelectItem>
                  <SelectItem value="GMT">GMT (Greenwich Mean Time)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.currency', 'Currency')}</CardTitle>
          <CardDescription>
            {t('settings.currency_description', 'Set your preferred currency for budget tracking.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="currency">{t('settings.display_currency', 'Display Currency')}</Label>
            <Select defaultValue="USD">
              <SelectTrigger id="currency">
                <SelectValue placeholder={t('settings.select_currency', 'Select currency')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
                <SelectItem value="JPY">JPY (¥)</SelectItem>
                <SelectItem value="CAD">CAD ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="mt-4" variant="outline">
            {t('settings.apply_regional_settings', 'Apply Regional Settings')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
