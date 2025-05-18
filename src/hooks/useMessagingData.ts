
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MessageChannel, Message } from '@/types/project';

// Mock data for initial channels
const mockChannels: MessageChannel[] = [
  {
    id: 'general',
    name: 'General',
    description: 'General discussion for all team members',
    type: 'general',
    members: ['User 1', 'User 2', 'User 3', 'User 4', 'Admin User'],
    createdBy: 'Admin User',
    createdAt: new Date('2025-01-01'),
    isPrivate: false,
    messages: [
      {
        id: uuidv4(),
        text: 'Welcome to the general channel! This is where we discuss company-wide topics.',
        author: 'Admin User',
        channelId: 'general',
        createdAt: new Date('2025-01-01T09:00:00'),
      },
      {
        id: uuidv4(),
        text: 'Hey everyone! Excited to collaborate with you all.',
        author: 'User 1',
        channelId: 'general',
        createdAt: new Date('2025-01-01T09:15:00'),
      },
      {
        id: uuidv4(),
        text: 'Quick reminder about our team meeting tomorrow at 10 AM.',
        author: 'User 2',
        channelId: 'general',
        createdAt: new Date('2025-01-01T14:30:00'),
      },
    ]
  },
  {
    id: 'website-redesign',
    name: 'Website Redesign',
    description: 'Discussion for the website redesign project',
    type: 'project',
    members: ['User 1', 'User 2', 'User 3'],
    createdBy: 'Admin User',
    createdAt: new Date('2025-01-02'),
    relatedProjectId: '1',
    isPrivate: false,
    messages: [
      {
        id: uuidv4(),
        text: 'Let\'s use this channel to coordinate the website redesign project.',
        author: 'Admin User',
        channelId: 'website-redesign',
        createdAt: new Date('2025-01-02T10:00:00'),
      },
      {
        id: uuidv4(),
        text: 'I\'ve uploaded the wireframes to the shared folder. @User2 can you review them?',
        author: 'User 1',
        channelId: 'website-redesign',
        createdAt: new Date('2025-01-02T11:30:00'),
        mentions: ['User 2'],
      },
    ]
  },
  {
    id: 'mobile-app',
    name: 'Mobile App',
    description: 'Discussions for mobile app development',
    type: 'project',
    members: ['User 2', 'User 4', 'Admin User'],
    createdBy: 'Admin User',
    createdAt: new Date('2025-01-03'),
    relatedProjectId: '2',
    isPrivate: false,
    messages: [
      {
        id: uuidv4(),
        text: 'Channel created for mobile app development project.',
        author: 'Admin User',
        channelId: 'mobile-app',
        createdAt: new Date('2025-01-03T09:00:00'),
      },
    ]
  },
  {
    id: 'task-homepage-design',
    name: 'Homepage Design Task',
    description: 'Discussions for the homepage design task',
    type: 'task',
    members: ['User 2', 'User 1'],
    createdBy: 'User 2',
    createdAt: new Date('2025-01-05'),
    relatedProjectId: '1',
    relatedTaskId: '1-2',
    isPrivate: true,
    messages: [
      {
        id: uuidv4(),
        text: 'I\'ve started working on the homepage design. Here\'s my initial concept.',
        author: 'User 2',
        channelId: 'task-homepage-design',
        createdAt: new Date('2025-01-05T13:00:00'),
      },
      {
        id: uuidv4(),
        text: 'Looks good! I think we should use a lighter color palette though.',
        author: 'User 1',
        channelId: 'task-homepage-design',
        createdAt: new Date('2025-01-05T14:20:00'),
      },
    ]
  },
  {
    id: 'direct-user1-user2',
    name: 'User 1, User 2',
    type: 'direct',
    members: ['User 1', 'User 2'],
    createdBy: 'User 1',
    createdAt: new Date('2025-01-04'),
    isPrivate: true,
    messages: [
      {
        id: uuidv4(),
        text: 'Hey, do you have a minute to discuss the website redesign?',
        author: 'User 1',
        channelId: 'direct-user1-user2',
        createdAt: new Date('2025-01-04T10:15:00'),
      },
      {
        id: uuidv4(),
        text: 'Sure, what\'s up?',
        author: 'User 2',
        channelId: 'direct-user1-user2',
        createdAt: new Date('2025-01-04T10:17:00'),
      },
    ]
  },
];

export function useMessagingData() {
  const [channels, setChannels] = useState<MessageChannel[]>(mockChannels);

  const getChannelById = (channelId: string) => {
    return channels.find(channel => channel.id === channelId) || null;
  };

  const addChannel = (channelData: Omit<MessageChannel, 'id' | 'createdAt' | 'messages'>) => {
    const newChannel: MessageChannel = {
      ...channelData,
      id: uuidv4(),
      createdAt: new Date(),
      messages: []
    };
    
    setChannels([...channels, newChannel]);
    return newChannel;
  };

  const updateChannel = (channelData: MessageChannel) => {
    setChannels(channels.map(channel => 
      channel.id === channelData.id 
        ? { ...channelData, updatedAt: new Date() } 
        : channel
    ));
    return channelData;
  };

  const deleteChannel = (channelId: string) => {
    setChannels(channels.filter(channel => channel.id !== channelId));
  };

  const addMessage = (channelId: string, messageData: Omit<Message, 'id' | 'createdAt' | 'channelId'>) => {
    const newMessage: Message = {
      ...messageData,
      id: uuidv4(),
      channelId,
      createdAt: new Date()
    };
    
    const updatedChannels = channels.map(channel => {
      if (channel.id === channelId) {
        return {
          ...channel,
          messages: [...(channel.messages || []), newMessage],
          updatedAt: new Date()
        };
      }
      return channel;
    });
    
    setChannels(updatedChannels);
    return newMessage;
  };

  const updateMessage = (messageData: Message) => {
    const updatedChannels = channels.map(channel => {
      if (channel.id === messageData.channelId && channel.messages) {
        return {
          ...channel,
          messages: channel.messages.map(message => 
            message.id === messageData.id 
              ? { ...messageData, updatedAt: new Date() } 
              : message
          )
        };
      }
      return channel;
    });
    
    setChannels(updatedChannels);
    return messageData;
  };

  const deleteMessage = (channelId: string, messageId: string) => {
    const updatedChannels = channels.map(channel => {
      if (channel.id === channelId && channel.messages) {
        return {
          ...channel,
          messages: channel.messages.filter(message => message.id !== messageId)
        };
      }
      return channel;
    });
    
    setChannels(updatedChannels);
  };

  const getChannelsByType = (type: 'project' | 'task' | 'general' | 'direct') => {
    return channels.filter(channel => channel.type === type);
  };

  const getChannelsByMember = (memberName: string) => {
    return channels.filter(channel => channel.members.includes(memberName));
  };

  const getChannelsByProject = (projectId: string) => {
    return channels.filter(channel => channel.relatedProjectId === projectId);
  };

  const getChannelsByTask = (taskId: string) => {
    return channels.filter(channel => channel.relatedTaskId === taskId);
  };

  return {
    channels,
    getChannelById,
    addChannel,
    updateChannel,
    deleteChannel,
    addMessage,
    updateMessage,
    deleteMessage,
    getChannelsByType,
    getChannelsByMember,
    getChannelsByProject,
    getChannelsByTask
  };
}
