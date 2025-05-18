
import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { useNotificationContext } from '@/contexts/notifications/NotificationContext';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationContext();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    setOpen(false);
    
    if (notification.relatedTo) {
      // Navigate based on the notification type
      if (notification.relatedTo.type === 'task') {
        navigate(`/tasks/${notification.relatedTo.id}`);
      } else if (notification.relatedTo.type === 'project') {
        navigate(`/projects/${notification.relatedTo.id}`);
      } else if (notification.relatedTo.type === 'comment') {
        // This would need more info to navigate properly
        // For now, just log it
        console.log('Navigate to comment', notification.relatedTo.id);
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h3 className="font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex h-full items-center justify-center p-4 text-center">
              <p className="text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border-b px-4 py-3 cursor-pointer transition-colors ${
                    !notification.isRead ? 'bg-muted/50' : ''
                  } hover:bg-muted`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium">{notification.title}</span>
                    {!notification.isRead && (
                      <Badge variant="default" className="text-[10px]">
                        New
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{notification.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <div className="border-t p-2 text-center">
            <Button variant="link" size="sm" onClick={() => navigate('/notifications')}>
              View all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
