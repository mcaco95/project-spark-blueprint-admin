import { useState, useEffect } from 'react';
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { Plus, MoreHorizontal, Search, AlertTriangle, UserPlus } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { UserRole } from '@/types/auth';
import { AdminUser } from '@/types/admin';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Spinner } from '@/components/ui/spinner';
import { adminService } from '@/services/adminService';

interface UserFormData {
  name: string;
  email: string;
  role: UserRole;
}

const AVAILABLE_ROLES: UserRole[] = ['admin', 'member'];

export const UserManagement = () => {
  const { t, i18n } = useTranslation(['admin', 'common']);
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const locale = i18n.language === 'es' ? es : enUS;
  
  // Dialog states
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form state
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    role: 'member'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUser && showEditDialog) {
      setFormData({
        name: selectedUser.name,
        email: selectedUser.email,
        role: selectedUser.role
      });
    }
  }, [selectedUser, showEditDialog]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminService.getUsers();
      setUsers(response.items);
    } catch (err) {
      setError(t('errorLoadingUsers', { ns: 'admin' }));
      console.error('Error loading users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      setIsProcessing(true);
      const newUser = await adminService.inviteUser(formData);
      setUsers(prev => [...prev, newUser]);
      toast({
        title: t('userInvited', { ns: 'admin' }),
        description: t('userInvitedDescription', { ns: 'admin', email: formData.email }),
      });
      setShowCreateDialog(false);
      resetForm();
    } catch (err) {
      console.error('Error creating user:', err);
      toast({
        title: t('errorCreatingUser', { ns: 'admin' }),
        description: String(err),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      setIsProcessing(true);
      const updatedUser = await adminService.updateUser(selectedUser.id, formData);
      setUsers(prev => prev.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      ));
      toast({
        title: t('userUpdated', { ns: 'admin' }),
        description: t('userUpdatedDescription', { ns: 'admin', name: updatedUser.name }),
      });
      setShowEditDialog(false);
      setSelectedUser(null);
      resetForm();
    } catch (err) {
      console.error('Error updating user:', err);
      toast({
        title: t('errorUpdatingUser', { ns: 'admin' }),
        description: String(err),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    try {
      setIsProcessing(true);
      const updatedUser = await adminService.updateUserRole(userId, newRole);
      setUsers(prev => prev.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      ));
      toast({
        title: t('roleUpdated', { ns: 'admin' }),
        description: t('roleUpdatedDescription', { 
          ns: 'admin', 
          name: updatedUser.name,
          role: t(`${newRole}Role`, { ns: 'admin' })
        }),
      });
    } catch (err) {
      console.error('Error updating role:', err);
      toast({
        title: t('errorUpdatingRole', { ns: 'admin' }),
        description: String(err),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'member'
    });
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      setIsProcessing(true);
      await adminService.deleteUser(selectedUser.id);
      
      setUsers(prevUsers => prevUsers.filter(u => u.id !== selectedUser.id));
      toast({
        title: t('userDeleted', { ns: 'admin' }),
        description: t('userDeletedDescription', { ns: 'admin', name: selectedUser.name }),
      });
    } catch (err) {
      console.error('Error deleting user:', err);
      toast({
        title: t('errorDeletingUser', { ns: 'admin' }),
        description: String(err),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setShowDeleteDialog(false);
      setSelectedUser(null);
    }
  };

  const handleToggleUserStatus = async () => {
    if (!selectedUser) return;
    
    try {
      setIsProcessing(true);
      const newStatus = selectedUser.status === 'active' ? 'inactive' : 'active';
      await adminService.updateUserStatus(selectedUser.id, newStatus);
      
      setUsers(prevUsers => prevUsers.map(user => 
        user.id === selectedUser.id 
          ? { ...user, status: newStatus }
          : user
      ));
      
      toast({
        title: t('userStatusUpdated', { ns: 'admin' }),
        description: t('userStatusUpdatedDescription', { 
          ns: 'admin', 
          name: selectedUser.name,
          status: t(`${newStatus}Status`, { ns: 'admin' })
        }),
      });
    } catch (err) {
      console.error('Error updating user status:', err);
      toast({
        title: t('errorUpdatingStatus', { ns: 'admin' }),
        description: String(err),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setShowDeactivateDialog(false);
      setSelectedUser(null);
    }
  };

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
      case 'member':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">{t(`${role}Role`, { ns: 'admin' })}</Badge>;
      case 'user':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">{t(`${role}Role`, { ns: 'admin' })}</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  const formatLastLogin = (date: Date | undefined) => {
    if (!date) return t('neverLoggedIn', { ns: 'admin' });
    
    const loginDate = new Date(date);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - loginDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 30) {
      return formatDistanceToNow(loginDate, { addSuffix: true, locale });
    }
    
    return format(loginDate, 'Pp', { locale });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-destructive">
        <AlertTriangle className="w-6 h-6 mr-2" />
        <p>{error}</p>
      </div>
    );
  }

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
        <Button 
          className="sm:w-auto w-full"
          onClick={() => {
            resetForm();
            setShowCreateDialog(true);
          }}
        >
          <UserPlus className="mr-2 h-4 w-4" />
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
                <TableCell>{formatLastLogin(user.lastLogin)}</TableCell>
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
                      <DropdownMenuItem onClick={() => {
                        setSelectedUser(user);
                        setShowEditDialog(true);
                      }}>{t('edit', { ns: 'common' })}</DropdownMenuItem>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          {t('changeRole', { ns: 'admin' })}
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuRadioGroup 
                            value={user.role}
                            onValueChange={(value: UserRole) => handleUpdateRole(user.id, value)}
                          >
                            {AVAILABLE_ROLES.map((role) => (
                              <DropdownMenuRadioItem 
                                key={role} 
                                value={role}
                                disabled={isProcessing}
                              >
                                {t(`${role}Role`, { ns: 'admin' })}
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuItem onClick={() => {
                        // TODO: Implement password reset functionality
                        toast({
                          title: t('notImplemented', { ns: 'common' }),
                          description: t('featureComingSoon', { ns: 'common' }),
                        });
                      }}>{t('resetPassword', { ns: 'admin' })}</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowDeactivateDialog(true);
                        }}
                      >
                        {user.status === 'active' ? t('deactivate', { ns: 'admin' }) : t('activate', { ns: 'admin' })}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowDeleteDialog(true);
                        }}
                      >
                        {t('delete', { ns: 'common' })}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchTerm 
                    ? t('noUsersFound', { ns: 'admin' })
                    : t('noUsers', { ns: 'admin' })}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('inviteUser', { ns: 'admin' })}</DialogTitle>
            <DialogDescription>
              {t('inviteUserDescription', { ns: 'admin' })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('name', { ns: 'admin' })}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('email', { ns: 'admin' })}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">{t('role', { ns: 'admin' })}</Label>
              <Select
                value={formData.role}
                onValueChange={(value: UserRole) => setFormData(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {t(`${role}Role`, { ns: 'admin' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={isProcessing}
            >
              {t('cancel', { ns: 'common' })}
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={isProcessing || !formData.name || !formData.email}
            >
              {isProcessing ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  {t('inviting', { ns: 'admin' })}
                </>
              ) : (
                t('invite', { ns: 'admin' })
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('editUser', { ns: 'admin' })}</DialogTitle>
            <DialogDescription>
              {t('editUserDescription', { ns: 'admin' })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">{t('name', { ns: 'admin' })}</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">{t('email', { ns: 'admin' })}</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">{t('role', { ns: 'admin' })}</Label>
              <Select
                value={formData.role}
                onValueChange={(value: UserRole) => setFormData(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {t(`${role}Role`, { ns: 'admin' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setSelectedUser(null);
              }}
              disabled={isProcessing}
            >
              {t('cancel', { ns: 'common' })}
            </Button>
            <Button
              onClick={handleUpdateUser}
              disabled={isProcessing || !formData.name || !formData.email}
            >
              {isProcessing ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  {t('saving', { ns: 'common' })}
                </>
              ) : (
                t('save', { ns: 'common' })
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteUserTitle', { ns: 'admin' })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteUserDescription', { ns: 'admin', name: selectedUser?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              {t('cancel', { ns: 'common' })}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  {t('deleting', { ns: 'common' })}
                </>
              ) : (
                t('delete', { ns: 'common' })
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deactivate User Dialog */}
      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedUser?.status === 'active' 
                ? t('deactivateUserTitle', { ns: 'admin' })
                : t('activateUserTitle', { ns: 'admin' })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser?.status === 'active'
                ? t('deactivateUserDescription', { ns: 'admin', name: selectedUser?.name })
                : t('activateUserDescription', { ns: 'admin', name: selectedUser?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              {t('cancel', { ns: 'common' })}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleToggleUserStatus}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  {t('processing', { ns: 'common' })}
                </>
              ) : (
                selectedUser?.status === 'active'
                  ? t('deactivate', { ns: 'admin' })
                  : t('activate', { ns: 'admin' })
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
