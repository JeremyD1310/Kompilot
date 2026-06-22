import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Sparkles, Send } from 'lucide-react';
import { Button, Badge, Textarea, cn } from '@blinkdotnew/ui';

interface AIDraftBannerProps {
  message: {
    senderName: string;
    subject: string;
    body: string;
  };
  onUseReply: (text: string) => void;
}

export function AIDraftBanner({ message, onUseReply }: AIDraftBannerProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [draftText, setDraftText] = useState('');

  useEffect(() => {
    const generateReply = () => {
      const { senderName, subject, body } = message;
      const bodyLower = body.toLowerCase();
      const isComplaint = bodyLower.includes('problème') || bodyLower.includes('plainte');
      
      if (isComplaint) {
        return `Bonjour ${senderName}, je comprends votre frustration et je vous présente nos sincères excuses. Nous allons traiter votre demande en priorité. Cordialement.`;
      }
      return `Bonjour ${senderName}, merci pour votre message concernant ${subject}. Je vous reviens rapidement avec une réponse complète. Cordialement.`;
    };

    setDraftText(generateReply());
  }, [message]);

  return (
    <div className={cn(
      "w-full rounded-xl border border-teal-500/30 bg-teal-500/5 transition-all duration-300 overflow-hidden",
      isCollapsed ? "max-h-12" : "max-h-[500px]"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-teal-500/10 text-teal-600 border-teal-500/20 px-2 py-0.5 flex items-center gap-1.5 font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            🤖 Réponse IA prête
          </Badge>
        </div>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-teal-600 hover:bg-teal-500/10 p-1 rounded-md transition-colors"
        >
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>

      {/* Content */}
      <div className={cn(
        "px-4 pb-4 space-y-3 transition-opacity duration-300",
        isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
      )}>
        <Textarea
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          className="min-h-[120px] bg-background border-teal-500/20 focus-visible:ring-teal-500/30 resize-none text-sm leading-relaxed"
          placeholder="Rédigez votre réponse ici..."
        />
        
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-teal-600/70 italic font-medium">
            Rédigé par l'IA · Modifiable avant envoi
          </p>
          <Button 
            onClick={() => onUseReply(draftText)}
            className="bg-teal-600 hover:bg-teal-700 text-white h-9 px-4 rounded-lg flex items-center gap-2 transition-transform active:scale-95"
          >
            <Send className="h-3.5 w-3.5" />
            Utiliser cette réponse
          </Button>
        </div>
      </div>
    </div>
  );
}
