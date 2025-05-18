
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { Plus, MoreHorizontal, Search } from 'lucide-react';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { AdminUser } from '@/types/admin';

// Mock data
const mockUsers: AdminUser[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    status: 'active',
    lastLogin: new Date('2025-05-17T10:30:00'),
    createdAt: new Date('2024-12-01'),
  },
  {
    id: '2',
    name: 'Regular User',
    email: 'user@example.com',
    role: 'user',
    status: 'active',
    lastLogin: new Date('2025-05-15T14:45:00'),
    createdAt: new Date('2025-01-15'),
  },
  {
    id: '3',
    name: 'Project Manager',
    email: 'manager@example.com',
    role: 'manager',
    status: 'active',
    lastLogin: new Date('2025-05-16T09:20:00'),
    createdAt: new Date('2025-02-10'),
  },
  {
    id: '4',
    name: 'New User',
    email: 'newuser@example.com',
    role: 'user',
    status: 'pending',
    createdAt: new Date('2025-05-14'),
  },
  {
    id: '5',
    name: 'Inactive User',
    email: 'inactive@example.com',
    role: 'user',
    status: 'inactive',
    lastLogin: new Date('2025-04-25T11:15:00'),
    createdAt: new Date('2025-03-05'),
  },
];

export const UserManagement = () => {
  const { t, i18n } = useTranslation(['admin', 'common']);
  const [searchTerm, setSearchTerm] = useState('');
  const locale = i18n.language === 'es' ? es : enUS;
  
  // Filter users based on search term
  const filteredUsers = mockUsers.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-0">{t(`${status}Status`, { ns: 'admin' })}</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-0">{t(`${status}Status`, { ns: 'admin' })}</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-0">{t(`${status}Status`, { ns: 'admin' })}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">{t(`${role}Role`, { ns: 'admin' })}</Badge>;
      case 'manager':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">{t(`${role}Role`, { ns: 'admin' })}</Badge>;
      case 'user':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">{t(`${role}Role`, { ns: 'admin' })}</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchUsers', { ns: 'admin' })}
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button className="sm:w-auto w-full">
          <Plus className="mr-2 h-4 w-4" />
          {t('inviteUser', { ns: 'admin' })}
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('name', { ns: 'admin' })}</TableHead>
              <TableHead>{t('email', { ns: 'admin' })}</TableHead>
              <TableHead>{t('role', { ns: 'admin' })}</TableHead>
              <TableHead>{t('status', { ns: 'admin' })}</TableHead>
              <TableHead>{t('lastLogin', { ns: 'admin' })}</TableHead>
              <TableHead className="text-right">{t('actions', { ns: 'admin' })}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell>{getStatusBadge(user.status)}</TableCell>
                <TableCell>
                  {user.lastLogin 
                    ? format(new Date(user.lastLogin), 'Pp', { locale })
                    : t('neverLoggedIn', { ns: 'admin' })}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">{t('openMenu', { ns: 'admin' })}</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{t('actions', { ns: 'admin' })}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>{t('edit', { ns: 'common' })}</DropdownMenuItem>
                      <DropdownMenuItem>{t('resetPassword', { ns: 'admin' })}</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">{user.status === 'active' ? t('deactivate', { ns: 'admin' }) : t('activate', { ns: 'admin' })}</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">{t('delete', { ns: 'common' })}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
