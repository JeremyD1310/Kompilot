import { useState, useEffect } from 'react';
import { MobileSidebarTrigger, Popover, PopoverTrigger, PopoverContent, cn } from '@blinkdotnew/ui';
import { ChevronDown, Store, Check, Tv2, User, Shield, CreditCard, LogOut, Building2 } from 'lucide-react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useDemoMode } from '../context/DemoModeContext';
import { useEstablishment } from '../context/EstablishmentContext';
import { useAuth } from '../hooks/useAuth';
import { useUserProfile } from '../context/UserProfileContext';
import { NotificationBell } from '../components/layout/NotificationBell';
import { PWAInstallButton } from '../components/layout/PWAInstallButton';
import { AsyncJobToast } from '../components/shared/AsyncJobToast';
import { MentorTopbarButton } from '../components/layout/MentorCopilote';
import { openAIChat } from '../hooks/useMentorTriggers';
import { useTrial } from '../context/TrialContext';
import { FirebaseStatusBadge } from '../components/firebase/FirebaseStatusBadge';
import { KompilotLogo } from '../components/brand/KompilotLogo';

// ── UserChipDropdown ──────────────────────────────────────────────────────────
function UserChipDropdown({ displayName, userInitials }: { displayName: string; userInitials: string }) {
  const [open, setOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    setOpen(false);
    try { await logout(); } catch { /* ignore */ }
    navigate({ to: '/' });
  };

  const menuItems = [
    { label: 'Mon compte', icon: User, to: '/account' as const },
    { label: 'Sécurité', icon: Shield, to: '/account' as const },
    { label: 'Abonnement', icon: CreditCard, to: '/subscription' as const },
  ] as const;

  const handleMenuClick = (label: string) => {
    setOpen(false);
    if (label === 'Sécurité') {
      // Navigate to /account and force tab via sessionStorage
      sessionStorage.setItem('account_deep_tab', 'securite');
      navigate({ to: '/account' });
    } else if (label === 'Abonnement') {
      navigate({ to: '/subscription' });
    } else {
      navigate({ to: '/account' });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="hidden md:flex items-center gap-2 rounded-xl border border-border/60 bg-muted/40 hover:bg-muted/70 transition-colors px-3 py-1.5">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-[10px] font-bold text-primary-foreground leading-none">
              {userInitials}
            </span>
          </div>
          <span className="text-xs font-medium text-foreground max-w-[120px] truncate">{displayName}</span>
          <ChevronDown size={12} className={cn('text-muted-foreground shrink-0 transition-transform duration-150', open && 'rotate-180')} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 p-1.5 rounded-2xl shadow-xl border-border z-50">
        <div className="px-2.5 py-2 mb-1 border-b border-border/60">
          <p className="text-xs font-semibold text-foreground truncate">{displayName}</p>
        </div>
        <div className="space-y-0.5 mt-0.5">
          {menuItems.map(item => (
            <button
              key={item.label}
              onClick={() => handleMenuClick(item.label)}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-foreground hover:bg-muted transition-colors w-full text-left"
            >
              <item.icon size={13} className="text-muted-foreground shrink-0" />
              {item.label}
            </button>
          ))}
          <div className="pt-1 mt-1 border-t border-border/60">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 transition-colors w-full text-left"
            >
              <LogOut size={13} className="shrink-0" />
              Déconnexion
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface DashboardTopbarProps {
  /** @deprecated No longer used — trial end is handled via openPaywall from TrialContext. Kept for backward compatibility only. */
  onTrialEnd?: () => void;
  onAuditFlash: () => void;
  onDisplayMode: () => void;
  impersonatedClient: { name: string } | null;
}

export function DashboardTopbar({
  onAuditFlash,
  onDisplayMode,
  impersonatedClient
}: DashboardTopbarProps) {
  const { isDemoActive, activateDemo } = useDemoMode();
  const { establishments, activeEstablishment, setActiveEstablishment } = useEstablishment();
  const { user } = useAuth();
  const { isB2C } = useUserProfile();
  const { trialDaysLeft, isTrialActive, openPaywall } = useTrial();
  const [topbarEstOpen, setTopbarEstOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [mentorUnread, setMentorUnread] = useState(0);
  const [roiAlertCount, setRoiAlertCount] = useState(0);

  // Track unread mentor notifications from MentorCopilote
  useEffect(() => {
    const handler = (e: Event) => {
      const count = (e as CustomEvent<{ count: number }>).detail.count;
      setMentorUnread(count);
    };
    window.addEventListener('mentor_unread_changed', handler);
    return () => window.removeEventListener('mentor_unread_changed', handler);
  }, []);

  // Track ROI push alerts
  useEffect(() => {
    const onAlert = () => setRoiAlertCount(c => c + 1);
    const onClear = () => setRoiAlertCount(0);
    window.addEventListener('kompilot:push-alert', onAlert);
    window.addEventListener('kompilot:roi-alerts-cleared', onClear);
    return () => {
      window.removeEventListener('kompilot:push-alert', onAlert);
      window.removeEventListener('kompilot:roi-alerts-cleared', onClear);
    };
  }, []);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Utilisateur';
  const userInitials = (() => {
    const parts = displayName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  })();

  return (
    <div className="shrink-0 flex items-center gap-2 px-4 h-14 border-b border-border bg-background/95 backdrop-blur-sm">
      {/* Left: Mobile hamburger + logo */}
      <div className="flex items-center gap-2 md:hidden">
        <MobileSidebarTrigger />
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <KompilotLogo variant="full" height={22} textColor="currentColor" />
        </Link>
      </div>

      {/* ── Demo mode button (center) ── */}
      <div className="flex-1 flex items-center justify-center gap-2">
        {isDemoActive ? (
          <div className="flex items-center gap-2 rounded-full bg-emerald-500/15 border border-emerald-500/40 px-3 py-1.5 text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-xs font-bold hidden sm:inline">Mode Démo Actif · Offre Business</span>
            <span className="text-xs font-bold sm:hidden">Démo Active</span>
          </div>
        ) : (
          <button
            onClick={activateDemo}
            className="hidden sm:flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-50 hover:bg-amber-100 text-amber-700 px-4 py-1.5 text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
          >
            <span className="text-sm">⚡</span>
            Activer le mode Démo
          </button>
        )}
        {/* Audit IA Flash CTA */}
        <button
          onClick={onAuditFlash}
          className="hidden md:flex items-center gap-1.5 rounded-full border border-emerald-500 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
        >
          🏷️ Tester ma visibilité
        </button>
      </div>

      {/* Right: PWA install + Mentor + Notification bell + Display mode + user + async job toast */}
      <div className="flex items-center gap-1.5 md:gap-2.5">
        {/* ── Trial countdown badge ── */}
        {isTrialActive && trialDaysLeft <= 14 && (
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-amber-300/60 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
              Essai : {trialDaysLeft}j restant{trialDaysLeft > 1 ? 's' : ''}
            </span>
          </div>
        )}
        {establishments.length >= 2 && (
          <Link to="/agence/dashboard">
            <div className="hidden md:flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/8 hover:bg-primary/15 px-3 py-1.5 text-xs font-bold text-primary transition-all cursor-pointer">
              <Building2 size={12} />
              Vue Agence
            </div>
          </Link>
        )}
        <AsyncJobToast />
        <PWAInstallButton />
        <div className="hidden md:block">
          <FirebaseStatusBadge />
        </div>
        <MentorTopbarButton
          unreadCount={mentorUnread}
          onClick={() => openAIChat()}
        />
        <div className="relative">
          <NotificationBell open={bellOpen} onToggle={() => setBellOpen(v => !v)} />
          {roiAlertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 border-2 border-background flex items-center justify-center animate-pulse">
              <span className="text-[8px] font-black text-white leading-none">{roiAlertCount > 9 ? '9+' : roiAlertCount}</span>
            </span>
          )}
        </div>

        {/* TV / Display mode button */}
        <button
          onClick={onDisplayMode}
          title="Mode Affichage Commerce (TV)"
          className="hidden md:flex items-center justify-center w-8 h-8 rounded-xl border border-border/60 bg-muted/40 hover:bg-muted/70 transition-colors text-muted-foreground hover:text-foreground"
        >
          <Tv2 size={16} />
        </button>

        {/* ── Establishment dropdown ── */}
        <Popover open={topbarEstOpen} onOpenChange={setTopbarEstOpen}>
          <PopoverTrigger asChild>
            <button className="hidden md:flex items-center gap-2 rounded-xl border border-border/60 bg-muted/40 hover:bg-muted/70 transition-colors px-3 py-1.5">
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 bg-gradient-to-br",
                activeEstablishment?.color || 'from-primary to-teal-400'
              )}>
                {activeEstablishment?.avatar || '🏪'}
              </div>
              <span className="text-xs font-medium text-foreground max-w-[100px] truncate">
                {activeEstablishment?.shortName || 'Établissement'}
              </span>
              <ChevronDown size={12} className={cn("text-muted-foreground shrink-0 transition-transform", topbarEstOpen && "rotate-180")} />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 p-2 rounded-2xl shadow-xl border-border z-50">
            <p className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Store size={10} /> Établissement actif
            </p>
            <div className="mt-1 space-y-1">
              {establishments.map(est => {
                const isActive = activeEstablishment?.id === est.id;
                return (
                  <button
                    key={est.id}
                    onClick={() => { setActiveEstablishment(est.id); setTopbarEstOpen(false); }}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left transition-all text-sm",
                      isActive ? "bg-primary/5 border border-primary/20" : "hover:bg-muted border border-transparent"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 bg-gradient-to-br shadow-sm",
                      est.color
                    )}>
                      {est.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-semibold truncate leading-tight", isActive ? "text-primary" : "text-foreground")}>{est.shortName}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{est.category}</p>
                    </div>
                    {isActive && <Check size={14} className="text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
            <div className="mt-1 pt-1 border-t border-border">
              <Link to="/establishments" className="flex items-center gap-2 px-2 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <Store size={12} /> Gérer mes établissements
              </Link>
            </div>
          </PopoverContent>
        </Popover>

        {/* User chip — dropdown with account links */}
        <UserChipDropdown displayName={displayName} userInitials={userInitials} />
      </div>
    </div>
  );
}
