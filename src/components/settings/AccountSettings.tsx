import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContextExtended';

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, {
    message: "Current password is required.",
  }),
  newPassword: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  confirmPassword: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export function AccountSettings() {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  function onSubmit(data: PasswordFormValues) {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success(t('settings.password_updated', 'Password updated successfully'));
      form.reset();
      setIsLoading(false);
    }, 1000);
  }
  
  function handleToggleTwoFactor(checked: boolean) {
    setTwoFactorEnabled(checked);
    
    if (checked) {
      toast.success(t('settings.2fa_enabled', '2FA has been enabled'));
    } else {
      toast.success(t('settings.2fa_disabled', '2FA has been disabled'));
    }
  }

  function handleDeleteAccount() {
    toast.error(t('settings.account_delete_prevented', 'Account deletion is disabled in this demo'));
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t('settings.account', 'Account')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('settings.account_description', 'Manage your account settings, password and security.')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.account_info', 'Account Information')}</CardTitle>
          <CardDescription>
            {t('settings.account_info_description', 'Your account details and role.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-1">{t('settings.account_id', 'Account ID')}</h4>
              <p className="text-sm text-muted-foreground">{user?.id || 'user-123456'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">{t('settings.role', 'Role')}</h4>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{user?.role || 'user'}</Badge>
                {(user?.role === 'admin') && (
                  <Badge className="bg-primary">{t('settings.admin', 'Admin')}</Badge>
                )}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">{t('settings.created_at', 'Account Created')}</h4>
              <p className="text-sm text-muted-foreground">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '2023-05-01'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.change_password', 'Change Password')}</CardTitle>
              <CardDescription>
                {t('settings.change_password_description', 'Update your password to keep your account secure.')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.current_password', 'Current Password')}</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.new_password', 'New Password')}</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.confirm_password', 'Confirm Password')}</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('settings.updating', 'Updating...') : t('settings.update_password', 'Update Password')}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            {t('settings.security', 'Security')}
          </CardTitle>
          <CardDescription>
            {t('settings.security_description', 'Manage your account security settings.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">
                {t('settings.two_factor_auth', 'Two-factor Authentication')}
              </label>
              <p className="text-sm text-muted-foreground">
                {t('settings.two_factor_description', 'Add an extra layer of security to your account.')}
              </p>
            </div>
            <Switch 
              checked={twoFactorEnabled} 
              onCheckedChange={handleToggleTwoFactor}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {t('settings.danger_zone', 'Danger Zone')}
          </CardTitle>
          <CardDescription>
            {t('settings.danger_zone_description', 'Permanently delete your account and all of your content.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {t('settings.delete_warning', 'Once you delete your account, there is no going back. Please be certain.')}
          </p>
          <Button variant="destructive" onClick={handleDeleteAccount}>
            {t('settings.delete_account', 'Delete Account')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
