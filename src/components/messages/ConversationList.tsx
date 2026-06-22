import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@blinkdotnew/ui';
import { MessageCircle, Camera, Users, MapPin } from 'lucide-react';

export type Platform = 'instagram' | 'facebook' | 'google' | 'whatsapp';

export interface Message {
  id: string;
  from: 'client' | 'me';
  text: string;
  time: string;
}

export interface Conversation {
  id: string;
  platform: Platform;
  name: string;
  avatar: string;
  preview: string;
  time: string;
  unread: boolean;
  messages: Message[];
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  filter: string;
  onFilterChange: (filter: string) => void;
}

export function ConversationList({ 
  conversations, 
  selectedId, 
  onSelect, 
  filter, 
  onFilterChange 
}: ConversationListProps) {
  
  const getPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case 'instagram': return <Camera size={12} />;
      case 'facebook': return <Users size={12} />;
      case 'google': return <MapPin size={12} />;
      case 'whatsapp': return <MessageCircle size={12} />;
    }
  };

  const getPlatformColor = (platform: Platform) => {
    switch (platform) {
      case 'instagram': return 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white';
      case 'facebook': return 'bg-[#1877F2] text-white';
      case 'google': return 'bg-[#EA4335] text-white';
      case 'whatsapp': return 'bg-[#25D366] text-white';
    }
  };

  const getBadgeColor = (platform: Platform) => {
    switch (platform) {
      case 'instagram': return 'bg-rose-100 text-rose-600 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800';
      case 'facebook': return 'bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      case 'google': return 'bg-red-100 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      case 'whatsapp': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
    }
  };

  const getBadgeLabel = (platform: Platform) => {
    switch (platform) {
      case 'instagram': return 'IG';
      case 'facebook': return 'FB';
      case 'google': return 'GM';
      case 'whatsapp': return 'WA 💬';
    }
  };

  const filteredConversations = conversations.filter(c => {
    if (filter === 'Tous') return true;
    if (filter === 'Instagram 📸') return c.platform === 'instagram';
    if (filter === 'Facebook 👥') return c.platform === 'facebook';
    if (filter === 'Google 📍') return c.platform === 'google';
    if (filter === 'WhatsApp 💬') return c.platform === 'whatsapp';
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-4 border-b border-border space-y-4 shrink-0">
        <h2 className="text-xl font-bold flex items-center gap-2">
          Messages Clients 💬
        </h2>
        
        <div className="flex flex-wrap gap-2">
          {['Tous', 'WhatsApp 💬', 'Instagram 📸', 'Facebook 👥', 'Google 📍'].map((f) => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border",
                filter === f 
                  ? f === 'WhatsApp 💬'
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "bg-primary text-primary-foreground border-primary" 
                  : "bg-muted/50 text-muted-foreground hover:bg-muted border-transparent"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Aucun message trouvé
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={cn(
                "p-4 border-b border-border cursor-pointer transition-all hover:bg-muted/30 relative",
                selectedId === conv.id && "bg-primary/5 border-l-2 border-l-primary"
              )}
            >
              <div className="flex gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0 shadow-sm relative",
                  getPlatformColor(conv.platform)
                )}>
                  {conv.avatar}
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-background shadow-xs",
                    getPlatformColor(conv.platform)
                  )}>
                    {getPlatformIcon(conv.platform)}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold truncate text-sm">{conv.name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{conv.time}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className={cn("text-[9px] px-1 py-0 h-4 uppercase font-bold", getBadgeColor(conv.platform))}>
                      {getBadgeLabel(conv.platform)}
                    </Badge>
                  </div>

                  <p className={cn(
                    "text-xs truncate",
                    conv.unread ? "font-bold text-foreground" : "text-muted-foreground"
                  )}>
                    {conv.preview}
                  </p>
                </div>

                {conv.unread && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse" />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
