
import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { MainLayout } from '@/components/layout/MainLayout';
import { useMessagingData } from '@/hooks/useMessagingData';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from '@/components/ui/popover';
import { MessageChannel, Message } from '@/types/project';
import { toast } from 'sonner';
import {
  MessageSquare,
  Users,
  Hash,
  Send,
  PaperclipIcon,
  AtSign,
  Smile,
  Plus,
  Search,
  Edit,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Reply
} from 'lucide-react';

// Emoji reactions
const reactionEmojis = ['👍', '👎', '❤️', '🎉', '👀', '🚀', '👏'];

const Messaging = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userName = user?.name || 'Current User';
  
  const { 
    channels, 
    getChannelById, 
    addChannel, 
    addMessage, 
    updateChannel, 
    updateMessage,
    deleteMessage,
    getChannelsByType
  } = useMessagingData();
  
  const [newMessage, setNewMessage] = useState('');
  const [isNewChannelDialogOpen, setIsNewChannelDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannelType, setSelectedChannelType] = useState<'all' | 'project' | 'task' | 'general' | 'direct'>('all');
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  
  // New channel form data
  const [newChannelData, setNewChannelData] = useState({
    name: '',
    description: '',
    type: 'general' as 'project' | 'task' | 'general' | 'direct',
    isPrivate: false
  });
  
  // Get current active channel
  const activeChannel = channelId ? getChannelById(channelId) : null;
  
  // Filter channels based on search query and selected type
  const filteredChannels = channels.filter(channel => {
    const matchesSearch = searchQuery === '' || 
      channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (channel.description && channel.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = selectedChannelType === 'all' || channel.type === selectedChannelType;
    
    return matchesSearch && matchesType;
  });
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeChannel?.messages]);
  
  // Handle sending a new message
  const handleSendMessage = () => {
    if (!activeChannel || !newMessage.trim()) return;
    
    // Extract mentions
    const mentions = extractMentions(newMessage);
    
    // Add new message to channel
    addMessage(activeChannel.id, {
      text: newMessage,
      author: userName,
      mentions,
      parentMessageId: replyingTo
    });
    
    setNewMessage('');
    setReplyingTo(null);
    toast.success('Message sent');
  };
  
  // Handle creating a new channel
  const handleCreateChannel = () => {
    if (!newChannelData.name.trim()) return;
    
    const newChannel = addChannel({
      name: newChannelData.name,
      description: newChannelData.description,
      type: newChannelData.type,
      members: [userName],
      createdBy: userName,
      isPrivate: newChannelData.isPrivate
    });
    
    setIsNewChannelDialogOpen(false);
    setNewChannelData({
      name: '',
      description: '',
      type: 'general',
      isPrivate: false
    });
    
    // Navigate to the new channel
    navigate(`/messaging/${newChannel.id}`);
    toast.success(`Channel ${newChannel.name} created successfully`);
  };
  
  // Extract mentions from message text
  const extractMentions = (text: string) => {
    const mentionRegex = /@(\w+)/g;
    const matches = text.match(mentionRegex);
    return matches ? matches.map(match => match.substring(1)) : [];
  };
  
  // Format message text with mentions highlighted
  const formatMessageText = (text: string) => {
    return text.replace(/@(\w+)/g, '<span class="text-blue-500 font-medium">@$1</span>');
  };
  
  // Handle adding a reaction to a message
  const handleReaction = (message: Message, emoji: string) => {
    const updatedMessage = { ...message };
    
    if (!updatedMessage.reactions) {
      updatedMessage.reactions = [];
    }
    
    const existingReactionIndex = updatedMessage.reactions.findIndex(r => r.emoji === emoji);
    
    if (existingReactionIndex >= 0) {
      // User has already reacted with this emoji
      const existingReaction = updatedMessage.reactions[existingReactionIndex];
      
      if (existingReaction.users.includes(userName)) {
        // Remove user from the reaction
        existingReaction.users = existingReaction.users.filter(u => u !== userName);
        existingReaction.count = existingReaction.count - 1;
        
        // Remove reaction entirely if no users left
        if (existingReaction.count === 0) {
          updatedMessage.reactions = updatedMessage.reactions.filter(r => r.emoji !== emoji);
        }
      } else {
        // Add user to the reaction
        existingReaction.users.push(userName);
        existingReaction.count = existingReaction.count + 1;
      }
    } else {
      // First reaction with this emoji
      updatedMessage.reactions.push({
        emoji,
        count: 1,
        users: [userName]
      });
    }
    
    updateMessage(updatedMessage);
    setShowReactionPicker(null);
  };
  
  // Handle updating an existing message
  const handleUpdateMessage = () => {
    if (!editingMessage || !editingMessage.text.trim()) return;
    
    // Update the message
    updateMessage({
      ...editingMessage,
      mentions: extractMentions(editingMessage.text)
    });
    
    setEditingMessage(null);
    toast.success('Message updated');
  };
  
  // Get channel icon based on type
  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'project':
        return <MessageSquare className="h-4 w-4 mr-2" />;
      case 'task':
        return <Hash className="h-4 w-4 mr-2" />;
      case 'direct':
        return <Users className="h-4 w-4 mr-2" />;
      default:
        return <Hash className="h-4 w-4 mr-2" />;
    }
  };
  
  // Group messages by date
  const groupMessagesByDate = (messages: Message[] = []) => {
    const grouped: Record<string, Message[]> = {};
    
    messages.forEach(message => {
      const date = format(new Date(message.createdAt), 'yyyy-MM-dd');
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(message);
    });
    
    return grouped;
  };
  
  // Get formatted date for message groups
  const getFormattedDate = (dateKey: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
    
    if (dateKey === today) {
      return 'Today';
    } else if (dateKey === yesterday) {
      return 'Yesterday';
    }
    
    return format(new Date(dateKey), 'MMMM d, yyyy');
  };
  
  // Render messages grouped by date
  const renderMessages = () => {
    if (!activeChannel || !activeChannel.messages || activeChannel.messages.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center p-8">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No messages yet</h3>
          <p className="text-muted-foreground mt-2">
            Be the first to send a message in this channel.
          </p>
        </div>
      );
    }
    
    const groupedMessages = groupMessagesByDate(activeChannel.messages);
    
    return Object.keys(groupedMessages).sort().map(dateKey => (
      <div key={dateKey} className="mb-6">
        <div className="flex items-center mb-4">
          <div className="bg-muted h-px flex-grow mr-3"></div>
          <span className="text-xs font-medium text-muted-foreground">
            {getFormattedDate(dateKey)}
          </span>
          <div className="bg-muted h-px flex-grow ml-3"></div>
        </div>
        
        {groupedMessages[dateKey].map(message => (
          <div key={message.id} className="group mb-4 relative">
            {/* If this is a reply, show indicator */}
            {message.parentMessageId && (
              <div className="flex items-center text-xs text-muted-foreground mb-1 ml-12">
                <Reply className="h-3 w-3 mr-1" />
                <span>Replied to a message</span>
              </div>
            )}
            
            <div className="flex gap-3">
              <Avatar className="h-10 w-10 mt-0.5">
                <AvatarFallback>
                  {message.author.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{message.author}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(message.createdAt), 'h:mm a')}
                    </span>
                    {message.updatedAt && (
                      <span className="text-xs text-muted-foreground">(edited)</span>
                    )}
                  </div>
                  
                  {message.author === userName && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => setEditingMessage(message)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-destructive"
                        onClick={() => {
                          if (activeChannel) {
                            deleteMessage(activeChannel.id, message.id);
                            toast.success('Message deleted');
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {editingMessage?.id === message.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editingMessage.text}
                      onChange={(e) => setEditingMessage({...editingMessage, text: e.target.value})}
                      className="min-h-[80px]"
                    />
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setEditingMessage(null)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm"
                        onClick={handleUpdateMessage}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: formatMessageText(message.text) }}
                  />
                )}
                
                {/* Reactions */}
                {message.reactions && message.reactions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {message.reactions.map((reaction) => (
                      <button 
                        key={reaction.emoji}
                        onClick={() => handleReaction(message, reaction.emoji)}
                        className={`text-xs px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          reaction.users.includes(userName) 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        <span>{reaction.emoji}</span>
                        <span>{reaction.count}</span>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Message actions */}
                <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Reaction button */}
                  <Popover open={showReactionPicker === message.id} onOpenChange={(open) => {
                    if (open) setShowReactionPicker(message.id);
                    else setShowReactionPicker(null);
                  }}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 px-2">
                        <Smile className="h-3.5 w-3.5 mr-1" />
                        <span className="text-xs">React</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-1 flex">
                      {reactionEmojis.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(message, emoji)}
                          className="p-1.5 hover:bg-gray-100 rounded text-lg"
                        >
                          {emoji}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
                  
                  {/* Reply button */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2"
                    onClick={() => setReplyingTo(message.id)}
                  >
                    <Reply className="h-3.5 w-3.5 mr-1" />
                    <span className="text-xs">Reply</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    ));
  };
  
  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Sidebar */}
        <div className="w-64 border-r overflow-hidden flex flex-col">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold">Channels</h2>
              <Button onClick={() => setIsNewChannelDialogOpen(true)} size="icon" variant="ghost" className="h-7 w-7">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search channels..."
                className="pl-9 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="p-2 border-b">
            <div className="flex gap-1">
              <Button 
                variant={selectedChannelType === 'all' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="flex-1 h-7 text-xs justify-start px-2"
                onClick={() => setSelectedChannelType('all')}
              >
                All
              </Button>
              <Button 
                variant={selectedChannelType === 'project' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="flex-1 h-7 text-xs justify-start px-2"
                onClick={() => setSelectedChannelType('project')}
              >
                Projects
              </Button>
              <Button 
                variant={selectedChannelType === 'direct' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="flex-1 h-7 text-xs justify-start px-2"
                onClick={() => setSelectedChannelType('direct')}
              >
                Direct
              </Button>
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredChannels.length > 0 ? (
                filteredChannels.map((channel) => (
                  <Button
                    key={channel.id}
                    variant={activeChannel?.id === channel.id ? 'secondary' : 'ghost'}
                    className="w-full justify-start mb-1"
                    onClick={() => navigate(`/messaging/${channel.id}`)}
                  >
                    {getChannelIcon(channel.type)}
                    <span className="truncate">{channel.name}</span>
                    {channel.isPrivate && (
                      <span className="ml-1 text-xs opacity-70">🔒</span>
                    )}
                  </Button>
                ))
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No channels found
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeChannel ? (
            <>
              {/* Channel header */}
              <div className="border-b p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center">
                      {getChannelIcon(activeChannel.type)}
                      <h2 className="font-bold text-lg">{activeChannel.name}</h2>
                      {activeChannel.isPrivate && (
                        <span className="ml-2 text-xs bg-gray-200 px-1.5 py-0.5 rounded">Private</span>
                      )}
                    </div>
                    {activeChannel.description && (
                      <p className="text-sm text-muted-foreground">{activeChannel.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Users className="h-4 w-4" />
                      <span>{activeChannel.members.length}</span>
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Messages area */}
              <ScrollArea className="flex-1 p-6">
                {renderMessages()}
                <div ref={messagesEndRef} />
              </ScrollArea>
              
              {/* Reply indicator */}
              {replyingTo && activeChannel.messages && (
                <div className="bg-muted/50 px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center">
                    <Reply className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">
                      Replying to{" "}
                      <span className="font-medium">
                        {activeChannel.messages.find(m => m.id === replyingTo)?.author || "message"}
                      </span>
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => setReplyingTo(null)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
              
              {/* Message input */}
              <div className="p-4 border-t">
                <div className="flex items-start gap-3">
                  <Avatar>
                    <AvatarFallback>{userName.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <Textarea
                      placeholder={`Message ${activeChannel.name}...`}
                      className="min-h-[80px] resize-none"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <PaperclipIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <AtSign className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Smile className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <MessageSquare className="h-16 w-16 text-muted-foreground mb-6" />
              <h2 className="text-2xl font-bold mb-2">Welcome to Messaging</h2>
              <p className="text-muted-foreground max-w-md mb-6">
                Select a channel from the sidebar or create a new one to start messaging with your team.
              </p>
              <Button onClick={() => setIsNewChannelDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create a Channel
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* New channel dialog */}
      <Dialog open={isNewChannelDialogOpen} onOpenChange={setIsNewChannelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a New Channel</DialogTitle>
            <DialogDescription>
              Create a channel to communicate with your team about projects, tasks, or general topics.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Channel Name
              </label>
              <Input
                id="name"
                placeholder="e.g., project-discussion"
                value={newChannelData.name}
                onChange={(e) => setNewChannelData({...newChannelData, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description (optional)
              </label>
              <Input
                id="description"
                placeholder="What's this channel about?"
                value={newChannelData.description}
                onChange={(e) => setNewChannelData({...newChannelData, description: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Channel Type</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={newChannelData.type === 'general' ? 'default' : 'outline'}
                  onClick={() => setNewChannelData({...newChannelData, type: 'general'})}
                  className="flex-1"
                >
                  <Hash className="h-4 w-4 mr-2" />
                  General
                </Button>
                <Button
                  type="button"
                  variant={newChannelData.type === 'project' ? 'default' : 'outline'}
                  onClick={() => setNewChannelData({...newChannelData, type: 'project'})}
                  className="flex-1"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Project
                </Button>
                <Button
                  type="button"
                  variant={newChannelData.type === 'task' ? 'default' : 'outline'}
                  onClick={() => setNewChannelData({...newChannelData, type: 'task'})}
                  className="flex-1"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Task
                </Button>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="private-channel"
                checked={newChannelData.isPrivate}
                onChange={(e) => setNewChannelData({...newChannelData, isPrivate: e.target.checked})}
              />
              <label htmlFor="private-channel" className="text-sm font-medium">
                Make this channel private
              </label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewChannelDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateChannel}>
              Create Channel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Messaging;
