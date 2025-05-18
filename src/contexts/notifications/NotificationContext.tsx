
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Notification } from '@/types/task';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
}

const initialNotifications: Notification[] = [
  {
    id: 'notification-1',
    type: 'mention',
    title: 'You were mentioned',
    message: '@AdminUser mentioned you in a comment on "Project kickoff meeting"',
    relatedTo: {
      type: 'task',
      id: 'timeline-1'
    },
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
  },
  {
    id: 'notification-2',
    type: 'assignment',
    title: 'Task assigned to you',
    message: 'You have been assigned to the task "Frontend development"',
    relatedTo: {
      type: 'task',
      id: 'timeline-4'
    },
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
  },
  {
    id: 'notification-3',
    type: 'deadline',
    title: 'Upcoming deadline',
    message: 'Task "Bug fixing" is due tomorrow',
    relatedTo: {
      type: 'task',
      id: 'timeline-7'
    },
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5) // 5 hours ago
  }
];

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  
  // Calculate unread count whenever notifications change
  useEffect(() => {
    setUnreadCount(notifications.filter(notification => !notification.isRead).length);
  }, [notifications]);
  
  const addNotification = (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: uuidv4(),
      isRead: false,
      createdAt: new Date()
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Also show a toast for real-time feedback
    toast(notification.title, {
      description: notification.message,
      action: {
        label: "View",
        onClick: () => {
          // Handle navigation to related item
          if (notification.relatedTo) {
            // This would navigate to the related item in a real app
            console.log(`Navigate to ${notification.relatedTo.type} with ID ${notification.relatedTo.id}`);
          }
        }
      }
    });
    
    return newNotification;
  };
  
  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true } 
          : notification
      )
    );
  };
  
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };
  
  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
  };
  
  const clearAllNotifications = () => {
    setNotifications([]);
  };
  
  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAllNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};
