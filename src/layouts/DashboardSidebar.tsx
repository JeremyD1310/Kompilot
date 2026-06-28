/**
 * DashboardSidebar — Collapsible app sidebar.
 * Simplified navigation — all icons use unified teal (primary) color.
 */
import { useEffect } from 'react';
import {
  LayoutDashboard, Calendar, Mail, Settings, LogOut, UserCircle, PenLine,
  CreditCard, HelpCircle, ChevronLeft, ChevronRight,
  Rocket, Star, MapPin, TrendingUp, Building2, BarChart2, Sprout, Image,
  SearchCheck, Users, Sparkles, BotMessageSquare, GitFork, Brain, AtSign, Globe, ListOrdered, UsersRound, Eye,
} from 'lucide-react';
import { AppShellSidebar, Button, cn } from '@blinkdotnew/ui';
import { Link } from '@tanstack/react-router';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../context/SubscriptionContext';
import { useIsTeamRole } from '../context/UserRoleContext';
import { useUserProfile } from '../context/UserProfileContext';
import { useDemoMode } from '../context/DemoModeContext';
import { useDemoView, isDemoTestAccount } from '../context/DemoViewContext';
import { DemoViewSwitcher } from '../components/layout/DemoViewSwitcher';
import { useActivityFeed } from '../hooks/useActivityFeed';
import { useInboxMessages } from '../hooks/useInboxMessages';
import { saveSessionMemory } from '../hooks/useOnboardingProfile';
import { EstablishmentSwitcher } from '../components/layout/EstablishmentSwitcher';
import { CreditsIndicator } from '../components/layout/CreditsIndicator';
import { DarkModeToggle } from '../components/layout/DarkModeToggle';
import { SidebarNavItem } from './SidebarNavItem';
import { TrialCreditGauge } from '../components/dashboard/TrialCreditGauge';
import { KompilotLogo } from '../components/brand/KompilotLogo';

interface DashboardSidebarProps {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  currentPath: string;
  onCreatePost: () => void;
  onClosureAlert: () => void;
  impersonatedClient: { name: string } | null;
}

// ── Unified color — all nav items use primary teal ──────────────────────────
const primary = {
  active: 'bg-primary/10 text-primary',
  hover: 'hover:bg-primary/8 hover:text-primary',
  activeIcon: 'bg-primary text-primary-foreground',
  defaultIcon: 'bg-primary/10 text-primary',
  hoverIcon: 'group-hover:bg-primary group-hover:text-primary-foreground',
};

const NavGroupHeader = ({ label, collapsed }: { label: string; collapsed: boolean }) => {
  if (collapsed) return <div className="my-1.5 border-t border-sidebar-border/40" />;
  return (
    <div className="px-3 pt-3 pb-1">
      <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">{label}</p>
    </div>
  );
};

export function DashboardSidebar({
  sidebarCollapsed, toggleSidebar, currentPath,
  onCreatePost, impersonatedClient,
}: DashboardSidebarProps) {
  const { logout, user } = useAuth();
  const { currentPlan } = useSubscription();
  const isTeamRole = useIsTeamRole();
  const { isB2C } = useUserProfile();
  const { isDemoActive } = useDemoMode();
  const { activateSwitcher, isAgencyView } = useDemoView();
  const { unreadCount } = useActivityFeed();

  // Auto-unlock the demo view switcher for the test account or admin mode
  const isTestAccount = isDemoTestAccount(user?.email);
  const shouldShowSwitcher = isTestAccount || isDemoActive;

  // ⚠️ Must be in useEffect — calling activateSwitcher() during render triggers
  // a setState on DemoViewProvider while DashboardSidebar is rendering (React error).
  useEffect(() => {
    if (shouldShowSwitcher) {
      activateSwitcher();
    }
  }, [shouldShowSwitcher, activateSwitcher]);

  const { messages, isLoading: inboxLoading } = useInboxMessages();

  // Compteur de non-lus : source DB via useInboxMessages (sauf pendant le chargement initial)
  // Fallback sur unreadCount de useActivityFeed si pas encore de données réelles
  const inboxUnreadCount = !inboxLoading && messages.length > 0
    ? messages.filter(m => !m.isRead).length
    : unreadCount;

  const handleLogout = () => {
    if (user) saveSessionMemory({ email: user.email ?? '', displayName: user.displayName ?? undefined, planId: currentPlan.id });
    logout();
  };

  const c = sidebarCollapsed;
  const is = (path: string) => currentPath === path;

  return (
    <AppShellSidebar className="shrink-0" style={impersonatedClient ? { marginTop: '40px' } : undefined}>
      <div className={cn('flex flex-col h-full bg-sidebar border-r border-sidebar-border overflow-hidden transition-[width] duration-200', c ? 'w-14' : 'w-[15rem]')}>

        {/* Logo + collapse toggle */}
        <div className={cn(
          'shrink-0 border-b border-sidebar-border px-3 pt-3 pb-2.5 transition-colors duration-300',
          isAgencyView && 'bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800/60',
        )}>
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-1 min-w-0 overflow-hidden">
              {isAgencyView ? (
                <>
                  <div className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center bg-violet-600 text-white text-[10px] font-bold">
                    💼
                  </div>
                  {!c && (
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm tracking-tight text-violet-700 dark:text-violet-400 truncate leading-tight">Kompilot</p>
                      <p className="text-[9px] font-semibold text-violet-500 dark:text-violet-500 uppercase tracking-wider leading-tight">Mode Agence</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {c
                    ? <KompilotLogo variant="icon" height={26} className="shrink-0" />
                    : <KompilotLogo variant="full" height={26} textColor="currentColor" className="shrink-0 max-w-[136px]" />
                  }
                </>
              )}
            </Link>
            <button onClick={toggleSidebar} title={c ? 'Agrandir' : 'Réduire'} className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              {c ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
            </button>
          </div>
        </div>

        {/* Establishment switcher */}
        {!c && (
          <div className="shrink-0 border-b border-sidebar-border px-3 py-2">
            <EstablishmentSwitcher />
          </div>
        )}

        {/* Scrollable nav */}
        <div className="flex-1 min-h-0 overflow-y-auto px-2 pt-3 pb-2 space-y-0.5">

          {/* Demo Pro/Agency switcher — visible only for test account / demo mode */}
          <DemoViewSwitcher collapsed={c} />

          {/* Create post button */}
          <button
            onClick={onCreatePost}
            className={cn(
              'w-full flex items-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold py-2.5 mb-3 shadow-sm hover:opacity-90 active:scale-[0.98] transition-all duration-150',
              c ? 'justify-center px-2' : 'justify-center px-4',
            )}
          >
            <PenLine size={15} strokeWidth={2.5} />
            {!c && <span>+ Créer un post</span>}
          </button>

          {!c && <div className="mb-2"><CreditsIndicator /></div>}

          {/* ── Principal ── */}
          <NavGroupHeader label="Principal" collapsed={c} />

          <SidebarNavItem to="/dashboard" icon={LayoutDashboard} label="Tableau de bord" active={is('/dashboard')} collapsed={c} {...primary} />
          <SidebarNavItem to="/cockpit" icon={Rocket} label="Cockpit IA" sublabel="Générer un post" active={is('/cockpit')} collapsed={c}
            suffix={!c ? <Star size={10} className="text-primary/60 shrink-0" /> : undefined}
            {...primary}
          />
          <SidebarNavItem to="/calendar" icon={Calendar} label="Calendrier" active={is('/calendar')} collapsed={c} {...primary} />
          <SidebarNavItem to="/team" icon={Users} label="Équipe" sublabel="Membres · Chat · Activité" active={is('/team')} collapsed={c} data-tour="nav-team"
            suffix={!c ? (
              <span className="text-[8px] bg-primary text-primary-foreground font-bold px-1.5 py-0.5 rounded-full shrink-0">NEW</span>
            ) : undefined}
            {...primary}
          />
          <SidebarNavItem to="/inbox" icon={Mail} label="Boîte de réception" active={is('/inbox')} collapsed={c} {...primary}
            wrapperClass="relative"
            after={inboxUnreadCount > 0 && c ? (
              // Mode collapsé : badge flottant en top-right de l'icône
              <span className={cn(
                'absolute top-0.5 right-0.5 min-w-[16px] h-4 px-0.5',
                'rounded-full bg-red-500 text-white text-[9px] font-bold',
                'flex items-center justify-center leading-none',
                'animate-pulse shadow-sm pointer-events-none',
              )}>
                {inboxUnreadCount > 9 ? '9+' : inboxUnreadCount}
              </span>
            ) : undefined}
            suffix={inboxUnreadCount > 0 && !c ? (
              // Mode étendu : badge numérique dans la ligne, à droite du label
              <span className={cn(
                'min-w-[18px] h-[18px] px-1',
                'rounded-full bg-red-500 text-white text-[10px] font-bold',
                'flex items-center justify-center leading-none',
                'animate-pulse shadow-sm pointer-events-none shrink-0',
              )}>
                {inboxUnreadCount > 9 ? '9+' : inboxUnreadCount}
              </span>
            ) : undefined}
          />

          {/* ── Visibilité ── */}
          <NavGroupHeader label="Visibilité" collapsed={c} />

          <SidebarNavItem to="/performance" icon={TrendingUp} label="Performance & Avis" active={is('/performance')} collapsed={c} {...primary} />
          <SidebarNavItem
            to="/engagement"
            icon={TrendingUp}
            label="Engagement & Campagnes"
            sublabel="UTM · Métriques · Comparaisons"
            active={is('/engagement')}
            collapsed={c}
            suffix={!c ? (
              <span className="text-[8px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded-full shrink-0">NEW</span>
            ) : undefined}
            {...primary}
          />
          <SidebarNavItem
            to="/roas"
            icon={TrendingUp}
            label="Performances & ROAS"
            sublabel="Budget · CAC · Simulation"
            active={is('/roas')}
            collapsed={c}
            suffix={!c ? (
              <span className="text-[8px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded-full shrink-0">NEW</span>
            ) : undefined}
            {...primary}
          />
          <SidebarNavItem
            to="/aio"
            icon={Brain}
            label="Visibilité IA (AIO)"
            sublabel="Score · ChatGPT · Gemini"
            active={is('/aio')}
            collapsed={c}
            suffix={!c ? (
              <span className="text-[8px] bg-violet-600 text-white font-bold px-1.5 py-0.5 rounded-full shrink-0">IA</span>
            ) : undefined}
            {...primary}
          />
          <SidebarNavItem to="/google-maps" icon={MapPin} label="Google Maps" sublabel="Fiche · Avis · Horaires" active={is('/google-maps')} collapsed={c} {...primary} />
          <SidebarNavItem to="/reviews" icon={Star} label="Avis Google" sublabel="Demandes automatiques" active={is('/reviews')} collapsed={c} {...primary} />

          {/* ── Créas Flash ── */}
          <NavGroupHeader label="Créations" collapsed={c} />
          <SidebarNavItem
            to="/creative-factory"
            icon={Image}
            label="🎨 Créas Flash"
            sublabel="Visuels & Meta Ads IA"
            active={is('/creative-factory')}
            collapsed={c}
            suffix={!c ? (
              <span className="text-[8px] bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded-full shrink-0">NEW</span>
            ) : undefined}
            {...primary}
          />
          <SidebarNavItem
            to="/ai-creative-studio"
            icon={Sparkles}
            label="✨ AI Creative Studio"
            sublabel="Images IA · Scripts · Branding"
            active={is('/ai-creative-studio')}
            collapsed={c}
            suffix={!c ? (
              <span className="text-[8px] bg-primary text-primary-foreground font-bold px-1.5 py-0.5 rounded-full shrink-0">IA</span>
            ) : undefined}
            {...primary}
          />
          <SidebarNavItem
            to="/creative-studio-hub"
            icon={Sparkles}
            label="🎨 Studio Hub"
            sublabel="Communauté · Prompts · Votes"
            active={is('/creative-studio-hub')}
            collapsed={c}
            {...primary}
          />

          {/* ── Croissance ── */}
          <NavGroupHeader label="Croissance" collapsed={c} />
          <SidebarNavItem
            to="/tunnels"
            icon={GitFork}
            label="Tunnels"
            sublabel="Cartographie concurrentielle"
            active={is('/tunnels')}
            collapsed={c}
            suffix={!c ? (
              <span className="text-[8px] bg-primary text-primary-foreground font-bold px-1.5 py-0.5 rounded-full shrink-0">NEW</span>
            ) : undefined}
            {...primary}
          />
          <SidebarNavItem to="/growth" icon={Sprout} label="Croissance & SEA" sublabel="Funnels & Campagnes" active={is('/growth')} collapsed={c} {...primary} />
          <SidebarNavItem
            to="/email-marketing"
            icon={AtSign}
            label="Email Marketing"
            sublabel="Mailchimp · SendGrid"
            active={is('/email-marketing')}
            collapsed={c}
            suffix={!c ? (
              <span className="text-[8px] bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded-full shrink-0">NEW</span>
            ) : undefined}
            {...primary}
          />
          <SidebarNavItem
            to="/email-sequences"
            icon={ListOrdered}
            label="Séquences Email"
            sublabel="Automatisations & Drip"
            active={is('/email-sequences')}
            collapsed={c}
            suffix={!c ? (
              <span className="text-[8px] bg-teal-600 text-white font-bold px-1.5 py-0.5 rounded-full shrink-0">NEW</span>
            ) : undefined}
            {...primary}
          />
          <SidebarNavItem
            to="/website-scan"
            icon={Globe}
            label="Studio Créatif & Marque"
            sublabel="Scan URL · Assets IA"
            active={is('/website-scan')}
            collapsed={c}
            suffix={!c ? (
              <span className="text-[8px] bg-violet-600 text-white font-bold px-1.5 py-0.5 rounded-full shrink-0">IA</span>
            ) : undefined}
            {...primary}
          />
          <SidebarNavItem to="/geo-authority" icon={BarChart2} label="Autorité G.E.O." sublabel="Citations & IA" active={is('/geo-authority')} collapsed={c} {...primary} />
          <SidebarNavItem
            to="/espion"
            icon={Eye}
            label="L'Espion"
            sublabel="Failles SEO concurrents"
            active={is('/espion')}
            collapsed={c}
            suffix={!c ? (
              <span className="text-[8px] bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded-full shrink-0">NEW</span>
            ) : undefined}
            {...primary}
          />

          {/* ── Mode Agence (agences) / Upsell teaser (Pro/B2C) ── */}
          {!isTeamRole && (
            <>
              <NavGroupHeader label="Agence" collapsed={c} />
              {/* Tableau de bord agence — visible uniquement pour les vrais comptes agence */}
              {!isB2C && (
                <Link to="/agence/dashboard">
                  <div className={cn(
                    'flex items-center gap-2.5 rounded-xl px-3 py-2.5 mb-1 transition-all duration-150 cursor-pointer group',
                    is('/agence/dashboard')
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-primary/8 text-muted-foreground hover:text-primary',
                    c ? 'justify-center px-2' : '',
                  )}>
                    <div className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                      is('/agence/dashboard') ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground',
                    )}>
                      <Building2 size={14} />
                    </div>
                    {!c && (
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold leading-tight truncate">Mode Agence</p>
                        <p className="text-[10px] leading-tight text-muted-foreground truncate">Tous vos clients</p>
                      </div>
                    )}
                  </div>
                </Link>
              )}
              {/* Claude Cowork — Assistant IA Stratégique */}
              {!isB2C && (
                <Link to="/agence/cowork" data-tour="nav-cowork">
                  <div className={cn(
                    'flex items-center gap-2.5 rounded-xl px-3 py-2.5 mb-1 transition-all duration-150 cursor-pointer group',
                    is('/agence/cowork')
                      ? 'bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400'
                      : 'hover:bg-teal-50/60 dark:hover:bg-teal-950/10 text-muted-foreground hover:text-teal-700 dark:hover:text-teal-400',
                    c ? 'justify-center px-2' : '',
                  )}>
                    <div className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                      is('/agence/cowork')
                        ? 'bg-teal-500 text-white'
                        : 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 group-hover:bg-teal-500 group-hover:text-white',
                    )}>
                      <BotMessageSquare size={14} />
                    </div>
                    {!c && (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold leading-tight truncate">Claude Cowork</p>
                          <span className="text-[9px] font-black uppercase tracking-wide bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400 px-1.5 py-0.5 rounded-full shrink-0">IA</span>
                        </div>
                        <p className="text-[10px] leading-tight text-muted-foreground truncate">Consultant Stratégique</p>
                      </div>
                    )}
                  </div>
                </Link>
              )}

              {/* Lead Maps Scraper — visible pour tous (agence = accès complet, Pro = paywall upsell) */}
              <Link to="/agence/lead-search">
                <div className={cn(
                  'flex items-center gap-2.5 rounded-xl px-3 py-2.5 mb-1 transition-all duration-150 cursor-pointer group',
                  is('/agence/lead-search')
                    ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700'
                    : 'hover:bg-amber-50/60 text-muted-foreground hover:text-amber-700',
                  c ? 'justify-center px-2' : '',
                )}>
                  <div className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                    is('/agence/lead-search')
                      ? 'bg-amber-500 text-white'
                      : 'bg-amber-100 text-amber-600 group-hover:bg-amber-500 group-hover:text-white',
                  )}>
                    <SearchCheck size={14} />
                  </div>
                  {!c && (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold leading-tight truncate">Lead Maps Scraper</p>
                        {isB2C && (
                          <span className="text-[9px] font-black uppercase tracking-wide bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full shrink-0">
                            Agence
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] leading-tight text-muted-foreground truncate">
                        {isB2C ? 'Upgrade → trouver des prospects' : 'Trouver des prospects'}
                      </p>
                    </div>
                  )}
                </div>
              </Link>
            </>
          )}

          {/* ── Lead Gen (Pro) ── */}
          {!isTeamRole && (
            <SidebarNavItem
              to="/lead-gen"
              icon={Users}
              label="Capturer des clients"
              sublabel="Widget Lead Gen"
              active={is('/lead-gen')}
              collapsed={c}
              {...primary}
            />
          )}

          {/* ── Compte ── */}
          <NavGroupHeader label="Compte" collapsed={c} />

          <SidebarNavItem to="/settings" icon={Settings} label="Paramètres" active={is('/settings')} collapsed={c} {...primary} />
          {!isTeamRole && (
            <SidebarNavItem to="/account" icon={UserCircle} label="Mon Compte" active={is('/account')} collapsed={c} {...primary} />
          )}
          {!isTeamRole && (
            <SidebarNavItem to="/subscription" icon={CreditCard} label="Mon Abonnement" active={is('/subscription')} collapsed={c} {...primary} />
          )}
        </div>

        {/* Bottom pinned section */}
        <div className="shrink-0 border-t border-sidebar-border">
          {/* Plan badge */}
          {!c && (isDemoActive || currentPlan.id !== 'free') && (
            <div className="px-4 pt-3 pb-1">
              <div className={cn('flex items-center gap-2 rounded-xl border px-3 py-2', isDemoActive ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800' : 'bg-primary/8 border-primary/20')}>
                <span className={cn('w-2 h-2 rounded-full animate-pulse shrink-0', isDemoActive ? 'bg-emerald-500' : 'bg-primary')} />
                <span className={cn('text-xs font-bold truncate', isDemoActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-primary')}>
                  {isDemoActive ? 'Mode Démo actif' : `Offre ${currentPlan.name}`}
                </span>
              </div>
            </div>
          )}

          {/* Guide */}
          {!c && (
            <div className="px-3 pt-2 pb-1">
              <Link to="/guide">
                <div className={cn('flex items-center gap-2.5 rounded-xl px-3 py-2 transition-all duration-150 cursor-pointer group', is('/guide') ? 'bg-primary/10 text-primary' : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground')}>
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors', is('/guide') ? 'bg-primary text-primary-foreground' : 'bg-muted/80 group-hover:bg-muted text-muted-foreground')}>
                    <HelpCircle size={14} />
                  </div>
                  <p className="text-xs font-semibold leading-tight truncate">Guide & Aide</p>
                </div>
              </Link>
            </div>
          )}

          {/* Trial credit gauge — visible only when sidebar is expanded */}
          {!c && (
            <div className="px-3 pb-2">
              <TrialCreditGauge />
            </div>
          )}

          {!c && <div className="px-3 pb-1"><DarkModeToggle /></div>}

          {/* Logout */}
          <div className="border-t border-sidebar-border p-2">
            {c ? (
              <button title="Se déconnecter" onClick={handleLogout} className="w-full flex items-center justify-center p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors">
                <LogOut size={18} />
              </button>
            ) : (
              <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/8">
                <LogOut size={18} /> Se déconnecter
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppShellSidebar>
  );
}
