
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export function ThemeSettings() {
  const { t } = useTranslation('common');
  
  const handleThemeChange = (value: string) => {
    // In a real app, this would update a theme context/state
    toast.success(`${t('settings.theme_changed', 'Theme changed to')} ${value}`);
  };
  
  const handleDensityChange = (value: string) => {
    toast.success(`${t('settings.density_changed', 'Interface density changed to')} ${value}`);
  };
  
  const handleAnimationsToggle = (checked: boolean) => {
    const message = checked 
      ? t('settings.animations_enabled', 'Animations enabled')
      : t('settings.animations_disabled', 'Animations disabled');
    toast.success(message);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t('settings.appearance', 'Appearance')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('settings.appearance_description', 'Customize the look and feel of the application.')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.theme', 'Theme')}</CardTitle>
          <CardDescription>
            {t('settings.theme_description', 'Select your preferred color theme.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup defaultValue="system" onValueChange={handleThemeChange} className="grid grid-cols-3 gap-4">
            <div>
              <RadioGroupItem value="light" id="light" className="peer sr-only" />
              <Label
                htmlFor="light"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-card p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <Sun className="mb-3 h-6 w-6" />
                {t('settings.light', 'Light')}
              </Label>
            </div>
            <div>
              <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
              <Label
                htmlFor="dark"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-card p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <Moon className="mb-3 h-6 w-6" />
                {t('settings.dark', 'Dark')}
              </Label>
            </div>
            <div>
              <RadioGroupItem value="system" id="system" className="peer sr-only" />
              <Label
                htmlFor="system"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-card p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <Monitor className="mb-3 h-6 w-6" />
                {t('settings.system', 'System')}
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.interface_density', 'Interface Density')}</CardTitle>
          <CardDescription>
            {t('settings.interface_density_description', 'Adjust the density of the interface elements.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup defaultValue="comfortable" onValueChange={handleDensityChange} className="grid grid-cols-3 gap-4">
            <div>
              <RadioGroupItem value="compact" id="compact" className="peer sr-only" />
              <Label
                htmlFor="compact"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-card p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                {t('settings.compact', 'Compact')}
              </Label>
            </div>
            <div>
              <RadioGroupItem value="comfortable" id="comfortable" className="peer sr-only" />
              <Label
                htmlFor="comfortable"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-card p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                {t('settings.comfortable', 'Comfortable')}
              </Label>
            </div>
            <div>
              <RadioGroupItem value="spacious" id="spacious" className="peer sr-only" />
              <Label
                htmlFor="spacious"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-card p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                {t('settings.spacious', 'Spacious')}
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.animations', 'Animations')}</CardTitle>
          <CardDescription>
            {t('settings.animations_description', 'Control interface animations and transitions.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="animations">{t('settings.enable_animations', 'Enable animations')}</Label>
            <Switch id="animations" defaultChecked onCheckedChange={handleAnimationsToggle} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.accent_color', 'Accent Color')}</CardTitle>
          <CardDescription>
            {t('settings.accent_color_description', 'Choose your preferred accent color for the application.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {['blue', 'purple', 'green', 'orange', 'pink', 'red'].map((color) => (
              <div key={color} className="text-center">
                <Button 
                  variant="outline" 
                  className={`w-10 h-10 rounded-full bg-${color}-500 hover:bg-${color}-600`} 
                  onClick={() => toast.success(`${t('settings.color_changed', 'Accent color changed to')} ${color}`)}
                />
                <span className="text-xs block mt-1 capitalize">{color}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
