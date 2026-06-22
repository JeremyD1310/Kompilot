import { motion } from 'framer-motion';
import { Link } from '@tanstack/react-router';

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const, delay: i * 0.08 },
  }),
};

export interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  index: number;
  href?: string;
  accent?: 'teal' | 'amber' | 'emerald';
}

export function StatCard({ icon, value, label, index, href, accent = 'teal' }: StatCardProps) {
  const accentBorder =
    accent === 'amber'
      ? 'group-hover:border-l-amber-400'
      : accent === 'emerald'
        ? 'group-hover:border-l-emerald-400'
        : 'group-hover:border-l-teal-500';

  const inner = (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className={[
        'group relative flex flex-col gap-3 rounded-xl border border-white/[0.07]',
        'bg-[#0F172A] px-5 py-4',
        'border-l-2 border-l-white/5 transition-all duration-200',
        'hover:border-white/[0.12] hover:shadow-[0_4px_24px_rgba(0,0,0,0.35)]',
        accentBorder,
      ].join(' ')}
    >
      <span className="text-muted-foreground/70">{icon}</span>
      <div>
        <p className="text-3xl font-black tabular-nums text-foreground leading-none tracking-tight">
          {value}
        </p>
        <p className="mt-1.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
          {label}
        </p>
      </div>
    </motion.div>
  );

  if (href) {
    return (
      <Link to={href as any} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}
