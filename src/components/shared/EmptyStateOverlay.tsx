import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from '@tanstack/react-router';
import { Calendar } from 'lucide-react';
import { Card, CardContent, Button } from '@blinkdotnew/ui';

interface EmptyStateOverlayProps {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref?: string;
  ctaOnClick?: () => void;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function EmptyStateOverlay({
  title,
  description,
  ctaLabel,
  ctaHref,
  ctaOnClick,
  icon,
  children,
}: EmptyStateOverlayProps) {
  const navigate = useNavigate();

  const handleCta = () => {
    if (ctaHref) {
      navigate({ to: ctaHref });
    } else if (ctaOnClick) {
      ctaOnClick();
    }
  };

  return (
    <div className="relative">
      {/* Background skeleton content */}
      <div className="pointer-events-none select-none" aria-hidden="true">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm bg-background/60 rounded-lg">
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <Card className="w-[340px] max-w-[90vw] shadow-xl border border-border/60">
            <CardContent className="flex flex-col items-center gap-4 pt-8 pb-7 px-7 text-center">
              {/* Icon */}
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                {icon ?? <Calendar className="h-12 w-12 text-primary" />}
              </div>

              {/* Text */}
              <div className="space-y-1.5">
                <h3 className="text-base font-semibold text-foreground leading-tight">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>

              {/* CTA */}
              <Button
                onClick={handleCta}
                className="mt-1 w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                size="sm"
              >
                {ctaLabel}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
