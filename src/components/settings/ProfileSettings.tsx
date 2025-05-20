
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContextExtended';
import { toast } from 'sonner';

const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email(),
  bio: z.string().max(160).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileSettings() {
  const { t } = useTranslation('common');
  const { user, updateUserProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize form with user data
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      bio: '',
    },
  });

  function getInitials(name: string) {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  function onSubmit(data: ProfileFormValues) {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      updateUserProfile({
        ...user,
        name: data.name,
        email: data.email,
      });
      
      toast.success(t('settings.profile_updated', 'Profile updated successfully'));
      setIsLoading(false);
    }, 1000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t('settings.profile', 'Profile')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('settings.profile_description', 'Update your profile information and how others see you.')}
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.avatar', 'Avatar')}</CardTitle>
          <CardDescription>
            {t('settings.avatar_description', 'Click on the avatar to upload a custom one from your files.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <Avatar className="h-24 w-24 cursor-pointer hover:opacity-90 transition-opacity">
            <AvatarImage src={user?.avatar} alt={user?.name} />
            <AvatarFallback className="text-xl">{user ? getInitials(user.name) : 'U'}</AvatarFallback>
          </Avatar>
          <Button size="sm" variant="outline">
            {t('settings.change_avatar', 'Change Avatar')}
          </Button>
        </CardContent>
      </Card>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.personal_info', 'Personal Information')}</CardTitle>
              <CardDescription>
                {t('settings.personal_info_description', 'Update your personal information.')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.name', 'Name')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('settings.name_placeholder', 'Enter your name')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.email', 'Email')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('settings.email_placeholder', 'Enter your email')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.bio', 'Bio')}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t('settings.bio_placeholder', 'Tell us a little bit about yourself')} 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      {t('settings.bio_description', 'This will be displayed on your profile.')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('settings.saving', 'Saving...') : t('settings.update_profile', 'Update profile')}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
