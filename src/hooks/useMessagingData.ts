import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MessageChannel, Message } from '@/types/project';

// Mock data for initial channels
const mockChannels: MessageChannel[] = [];

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
