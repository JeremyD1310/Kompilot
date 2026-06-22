import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Conversation, Platform } from './ConversationList';
import { Button, Textarea, Badge, toast, Card } from '@blinkdotnew/ui';
import { Send, Sparkles, Camera, Users, MapPin, RefreshCw, MessageCircle } from 'lucide-react';

interface ChatThreadProps {
  conversation: Conversation | null;
}

export function ChatThread({ conversation }: ChatThreadProps) {
  const [reply, setReply] = useState('');
  const [suggestionIndex, setSuggestionIndex] = useState(0);

  useEffect(() => {
    setSuggestionIndex(0);
    setReply('');
  }, [conversation?.id]);

  if (!conversation) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 bg-muted/5">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <MessageCircle size={32} />
        </div>
        <p className="text-lg font-medium">← Sélectionnez une conversation</p>
        <p className="text-sm text-center">Vos messages de WhatsApp Business, Instagram, Facebook et Google Maps apparaîtront ici.</p>
        <div className="flex items-center gap-2 mt-4">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full px-2.5 py-1">💬 WhatsApp</span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-100 text-rose-600 border border-rose-200 rounded-full px-2.5 py-1">📸 Instagram</span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-100 text-blue-600 border border-blue-200 rounded-full px-2.5 py-1">👥 Facebook</span>
        </div>
      </div>
    );
  }

  const getPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case 'instagram': return <Camera size={14} />;
      case 'facebook': return <Users size={14} />;
      case 'google': return <MapPin size={14} />;
      case 'whatsapp': return <span className="text-[11px] font-bold">WA</span>;
    }
  };

  const getPlatformLabel = (platform: Platform) => {
    switch (platform) {
      case 'instagram': return 'Instagram';
      case 'facebook': return 'Facebook';
      case 'google': return 'Google Maps';
      case 'whatsapp': return 'WhatsApp Business';
    }
  };

  const getPlatformBadgeColor = (platform: Platform) => {
    switch (platform) {
      case 'instagram': return 'bg-rose-100 text-rose-600 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800';
      case 'facebook': return 'bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      case 'google': return 'bg-red-100 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      case 'whatsapp': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
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

  // AI Suggestion Logic
  const getAISuggestions = (conv: Conversation) => {
    const name = conv.name.split(' ')[0];
    const previewLower = conv.preview.toLowerCase();
    
    if (previewLower.includes('dispo') || previewLower.includes('créneau') || previewLower.includes('ouvert')) {
      return [
        `Bonjour ${name} ! 😊 Oui, nous avons encore des créneaux disponibles samedi. Réservez directement en ligne pour garantir votre place 👉 planity.com/votre-commerce – Confirmation immédiate ! ✨`,
        `Bonjour ${name} ! Il nous reste quelques places pour ce week-end. Vous pouvez consulter nos disponibilités en temps réel et réserver ici 👉 planity.com/votre-commerce 😊`,
      ];
    }
    
    if (previewLower.includes('tarif') || previewLower.includes('prix') || previewLower.includes('combien')) {
      return [
        `Bonjour ${name} ! Nos tarifs démarrent à 45€. Pour voir toutes nos prestations et réserver 👉 planity.com/votre-commerce 🌟`,
        `Bonjour ${name} ! Vous trouverez l'ensemble de notre carte de soins et nos tarifs sur notre page de réservation en ligne 👉 planity.com/votre-commerce ✨`,
      ];
    }
    
    if (previewLower.includes('dimanche') || previewLower.includes('horaire')) {
      return [
        `Bonsoir ${name} ! Oui, nous sommes ouverts ce dimanche 12h–22h. Réservez en ligne 👉 planity.com/votre-commerce ✨`,
        `Bonjour ${name} ! Nous sommes bien ouverts dimanche de 12h à 22h. Au plaisir de vous recevoir ! Réservez ici 👉 planity.com/votre-commerce 😊`,
      ];
    }
    
    return [
      `Bonjour ${name} ! Merci pour votre message 😊 N'hésitez pas à réserver directement en ligne 👉 planity.com/votre-commerce — confirmation immédiate et annulation flexible ! ✨`,
      `Bonjour ${name} ! Ravi de vous lire. Pour toute question ou réservation, notre agenda en ligne est disponible 24h/24 ici 👉 planity.com/votre-commerce 😊`,
    ];
  };

  const suggestions = getAISuggestions(conversation);
  const currentSuggestion = suggestions[suggestionIndex % suggestions.length];

  const handleUseSuggestion = () => {
    setReply(currentSuggestion);
    toast.success('Suggestion copiée');
  };

  const handleRegenerate = () => {
    setSuggestionIndex(prev => prev + 1);
  };

  const handleSend = () => {
    if (!reply.trim()) return;
    toast.success('Message envoyé !');
    setReply('');
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Header */}
      <div className="px-6 py-3 border-b border-border flex items-center justify-between shrink-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm relative",
            getPlatformColor(conversation.platform)
          )}>
            {conversation.avatar}
          </div>
          <div>
            <h3 className="font-bold text-sm leading-none mb-1">{conversation.name}</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("text-[10px] h-4 px-1 flex items-center gap-1 font-bold border", getPlatformBadgeColor(conversation.platform))}>
                {getPlatformIcon(conversation.platform)}
                {getPlatformLabel(conversation.platform)}
              </Badge>
              <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                En ligne
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] font-bold cursor-pointer hover:bg-secondary/80">
            Répondre via {getPlatformLabel(conversation.platform)}
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0 bg-muted/5">
        {conversation.messages.map((msg) => (
          <div 
            key={msg.id} 
            className={cn(
              "flex flex-col max-w-[80%]",
              msg.from === 'me' ? "ml-auto items-end" : "items-start"
            )}
          >
            <div className={cn(
              "px-4 py-2.5 rounded-2xl text-sm shadow-sm",
              msg.from === 'me' 
                ? "bg-primary text-primary-foreground rounded-tr-none" 
                : "bg-background border border-border rounded-tl-none dark:bg-muted/40"
            )}>
              {msg.text}
            </div>
            <span className="text-[10px] text-muted-foreground mt-1 px-1">
              {msg.time}
            </span>
          </div>
        ))}
      </div>

      {/* Reply Area */}
      <div className="p-4 border-t border-border bg-background shrink-0">
        <div className="relative mb-4">
          <Textarea 
            placeholder={`Répondre à ${conversation.name.split(' ')[0]}...`}
            className="pr-12 min-h-[100px] resize-none focus-visible:ring-primary/20 border-border/60"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
          <Button 
            size="icon" 
            className="absolute right-3 bottom-3 rounded-xl h-8 w-8"
            disabled={!reply.trim()}
            onClick={handleSend}
          >
            <Send size={14} />
          </Button>
        </div>

        {/* AI Suggestion */}
        <Card className="p-4 border-primary/20 bg-primary/5 dark:bg-primary/10 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
            <Sparkles size={40} className="text-primary" />
          </div>
          
          <div className="flex items-center gap-2 text-primary text-xs font-bold mb-3">
            <Sparkles size={14} />
            ✨ Réponse suggérée par Kompilot
          </div>
          
          <p className="text-sm text-foreground/90 leading-relaxed mb-4 italic">
            "{currentSuggestion}"
          </p>
          
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              className="h-8 text-[11px] font-bold bg-primary hover:bg-primary/90 rounded-lg"
              onClick={handleUseSuggestion}
            >
              Utiliser cette réponse
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 text-[11px] font-bold gap-1.5 border-primary/20 hover:bg-primary/5 rounded-lg"
              onClick={handleRegenerate}
            >
              <RefreshCw size={12} />
              Régénérer ✨
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
