import { Link, useNavigate } from 'react-router-dom';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Calendar, 
  FileText, 
  Settings, 
  Users,
  LogOut,
  User,
  MessageSquare,
  Timer,
  Kanban,
  List,
  Timeline
} from 'lucide-react';
import LanguageSwitcher from '../LanguageSwitcher';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import NavbarPomodoroTimer from '../pomodoro/NavbarPomodoroTimer';

export const Navbar = () => {
  const { t } = useTranslation('common');
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex items-center space-x-4 md:space-x-6 mr-4">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold text-lg">PM App</span>
          </Link>
        </div>

        {isAuthenticated && (
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
                        <Link to="/tasks?view=kanban" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                          <div className="flex items-center">
                            <Kanban className="h-4 w-4 mr-2" />
                            <div className="text-sm font-medium leading-none">Kanban</div>
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Drag and drop task management
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link to="/tasks?view=list" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                          <div className="flex items-center">
                            <List className="h-4 w-4 mr-2" />
                            <div className="text-sm font-medium leading-none">List</div>
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Table view of all tasks
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link to="/tasks?view=calendar" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            <div className="text-sm font-medium leading-none">Calendar</div>
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Monthly calendar view
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link to="/tasks?view=timeline" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                          <div className="flex items-center">
                            <Timeline className="h-4 w-4 mr-2" />
                            <div className="text-sm font-medium leading-none">Timeline</div>
                          </div>
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
                  <Link to="/pomodoro" className="flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    <span>Pomodoro</span>
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <Link to="/messaging" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>Messaging</span>
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <Link to="/files" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>{t('files')}</span>
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {user?.role === 'admin' && (
                <NavigationMenuItem>
                  <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                    <Link to="/admin" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{t('admin')}</span>
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )}

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
        )}

        <div className="ml-auto flex items-center space-x-4">
          {isAuthenticated && (
            <NavbarPomodoroTimer />
          )}
          
          <LanguageSwitcher />
          
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>{t('profile')}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link to="/login">
                {t('auth.login')}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
