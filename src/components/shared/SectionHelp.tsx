import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Play, X } from 'lucide-react';
import { Button, Card, CardContent } from '@blinkdotnew/ui';
import { cn } from '@blinkdotnew/ui';

interface FAQ {
  q: string;
  a: string;
}

interface SectionHelpProps {
  title: string;
  description: string;
  tutorialUrl?: string;
  faqs: FAQ[];
  className?: string;
}

export function SectionHelp({ title, description, tutorialUrl, faqs, className }: SectionHelpProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <div className={cn("relative inline-block", className)}>
      <button
        onClick={() => setIsOpen(true)}
        className="group relative flex items-center justify-center w-8 h-8 rounded-full bg-accent/50 hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
        title="Besoin d'aide ?"
      >
        <HelpCircle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="absolute inset-0 rounded-full border border-primary/20 animate-ping opacity-20 pointer-events-none" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-2xl border-primary/10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b flex items-center justify-between bg-accent/30">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">{title}</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <CardContent className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>

              {tutorialUrl && (
                <Button 
                  className="w-full gap-2 bg-primary/10 hover:bg-primary/20 text-primary border-none shadow-none"
                  onClick={() => window.open(tutorialUrl, '_blank')}
                >
                  <Play className="w-4 h-4 fill-current" />
                  Voir le tutoriel
                </Button>
              )}

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Questions fréquentes</h4>
                <div className="space-y-2">
                  {faqs.map((faq, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden border-primary/5">
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                        className="w-full px-4 py-3 flex items-center justify-between text-left bg-accent/10 hover:bg-accent/20 transition-colors"
                      >
                        <span className="text-sm font-medium">{faq.q}</span>
                        {expandedFaq === index ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {expandedFaq === index && (
                        <div className="px-4 py-3 bg-background border-t border-primary/5 animate-in slide-in-from-top-2 duration-200">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {faq.a}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>

            <div className="p-4 bg-accent/30 border-t">
              <Button className="w-full" onClick={() => setIsOpen(false)}>
                J'ai compris
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
