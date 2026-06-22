import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const, delay: i * 0.08 },
  }),
};

export interface ActionCardProps {
  icon: React.ReactNode;
  label: string;
  desc: string;
  onClick: () => void;
  badge?: number;
  index: number;
  iconBg?: string;
}

export function ActionCard({
  icon,
  label,
  desc,
  onClick,
  badge,
  index,
  iconBg = 'bg-teal-500/10',
}: ActionCardProps) {
  return (
    <motion.button
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      onClick={onClick}
      className={[
        'group flex items-center gap-3.5 rounded-xl border border-white/[0.07]',
        'bg-[#0F172A] px-4 py-3.5 text-left w-full',
        'hover:border-white/[0.13] hover:bg-white/[0.03]',
        'hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] active:scale-[0.98]',
        'transition-all duration-200 cursor-pointer',
      ].join(' ')}
    >
      <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-tight">{label}</p>
        <p className="text-[11px] text-muted-foreground/70 mt-0.5 leading-tight">{desc}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {badge !== undefined && badge > 0 && (
          <span className="text-[10px] font-bold bg-teal-500/20 text-teal-400 rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
            {badge}
          </span>
        )}
        <ArrowRight
          size={14}
          className="text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors"
        />
      </div>
    </motion.button>
  );
}
