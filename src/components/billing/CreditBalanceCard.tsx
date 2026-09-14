/**
 * CreditBalanceCard — Circular progress ring showing current credit balance.
 * Displays the balance number in center, animated ring, and plan name.
 */

import { Card, CardContent } from '@blinkdotnew/ui';
import { Zap } from 'lucide-react';

interface CreditBalanceCardProps {
  balance: number;
  quota: number;
  planName: string;
}

export function CreditBalanceCard({ balance, quota, planName }: CreditBalanceCardProps) {
  const percentage = quota > 0 ? Math.min(100, Math.round(((quota - balance) / quota) * 100)) : 0;
  const remaining = Math.max(0, balance);

  // SVG circle params
  const size = 140;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference;

  // Color based on usage
  const ringColor =
    percentage >= 90
      ? 'hsl(var(--destructive))'
      : percentage >= 70
        ? 'hsl(38 92% 50%)'
        : 'hsl(var(--primary))';

  return (
    <Card className="card-hover">
      <CardContent className="flex flex-col items-center justify-center pt-6 pb-5">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            {/* Background track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth={strokeWidth}
            />
            {/* Progress arc */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={ringColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
            />
          </svg>
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Zap size={18} className="text-primary mb-1" />
            <span className="text-3xl font-black text-foreground tracking-tight">
              {remaining}
            </span>
            <span className="text-[11px] text-muted-foreground font-medium">
              crédits
            </span>
          </div>
        </div>
        <div className="mt-3 text-center">
          <p className="text-sm font-bold text-foreground">{planName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {percentage}% utilisé ce mois
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
