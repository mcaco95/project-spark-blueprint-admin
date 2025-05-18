
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from '@/components/ui/navigation-menu';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, FolderKanban, Calendar, FileText, Settings, Users } from 'lucide-react';
import LanguageSwitcher from '../LanguageSwitcher';
import { cn } from '@/lib/utils';

export const Navbar = () => {
  const { t } = useTranslation('common');

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex items-center space-x-4 md:space-x-6 mr-4">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold text-lg">PM App</span>
          </Link>
        </div>

        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link to="/" className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>{t('dashboard')}</span>
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link to="/projects" className="flex items-center gap-2">
                  <FolderKanban className="h-4 w-4" />
                  <span>{t('projects')}</span>
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{t('tasks')}</span>
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[300px] gap-2 p-2 md:w-[400px] md:grid-cols-2">
                  <li>
                    <NavigationMenuLink asChild>
                      <Link to="/tasks/kanban" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                        <div className="text-sm font-medium leading-none">Kanban</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Drag and drop task management
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link to="/tasks/timeline" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                        <div className="text-sm font-medium leading-none">Timeline</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Weekly timeline view
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link to="/files" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Files</span>
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link to="/admin" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{t('admin')}</span>
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link to="/settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span>{t('settings')}</span>
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="ml-auto flex items-center space-x-2">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
};
