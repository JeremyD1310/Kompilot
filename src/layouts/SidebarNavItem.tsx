/**
 * SidebarNavItem — Reusable collapsible sidebar navigation item.
 * Handles active state, collapsed/expanded layout, custom colors, and badges.
 */
import { cn } from '@blinkdotnew/ui';
import { Link } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';

interface SidebarNavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  sublabel?: string;
  active: boolean;
  collapsed: boolean;
  /** Tailwind classes for active container bg+text, e.g. 'bg-primary/10 text-primary' */
  activeStyle?: string;
  /** Tailwind classes for hover container, e.g. 'hover:bg-primary/8 hover:text-primary' */
  hoverStyle?: string;
  /** Tailwind classes for active icon bg+text */
  activeIconStyle?: string;
  /** Tailwind classes for default icon bg+text */
  defaultIconStyle?: string;
  /** Tailwind classes for group-hover icon style */
  hoverIconStyle?: string;
  dataTour?: string;
  badgeText?: string;
  /** Extra JSX appended after label (e.g. NEW badge) */
  suffix?: React.ReactNode;
  /** Extra wrapper className (e.g. 'relative') */
  wrapperClass?: string;
  /** Extra JSX placed after the item div (e.g. unread dot) */
  after?: React.ReactNode;
}

const DEFAULT_ACTIVE = 'bg-primary/10 text-primary';
const DEFAULT_HOVER = 'hover:bg-primary/8 hover:text-primary';
const DEFAULT_ACTIVE_ICON = 'bg-primary text-primary-foreground';
const DEFAULT_DEFAULT_ICON = 'bg-primary/10 text-primary';
const DEFAULT_HOVER_ICON = 'group-hover:bg-primary group-hover:text-primary-foreground';

export function SidebarNavItem({
  to, icon: Icon, label, sublabel, active, collapsed,
  activeStyle = DEFAULT_ACTIVE,
  hoverStyle = DEFAULT_HOVER,
  activeIconStyle = DEFAULT_ACTIVE_ICON,
  defaultIconStyle = DEFAULT_DEFAULT_ICON,
  hoverIconStyle = DEFAULT_HOVER_ICON,
  dataTour, badgeText, suffix, wrapperClass = '', after,
}: SidebarNavItemProps) {
  return (
    <div className={wrapperClass} data-tour={dataTour}>
      <Link to={to}>
        <div className={cn(
          'flex items-center rounded-xl py-2.5 transition-all duration-150 cursor-pointer group text-muted-foreground',
          collapsed ? 'justify-center px-2' : 'gap-2.5 px-3',
          active ? activeStyle : hoverStyle,
        )}>
          <div className={cn(
            'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors',
            active ? activeIconStyle : cn(defaultIconStyle, hoverIconStyle),
          )}>
            <Icon size={14} />
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold leading-tight truncate flex items-center gap-1">
                  {label}
                  {badgeText && (
                    <span className="text-[9px] font-bold text-primary bg-primary/10 rounded px-1 py-0.5 leading-none">
                      {badgeText}
                    </span>
                  )}
                </p>
                {sublabel && (
                  <p className="text-[10px] leading-tight text-muted-foreground truncate">{sublabel}</p>
                )}
              </div>
              {suffix}
            </>
          )}
        </div>
      </Link>
      {after}
    </div>
  );
}
