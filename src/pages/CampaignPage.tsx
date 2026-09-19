/**
 * CampaignPage — Kompilot Campagnes Email
 * /campaigns route — 3 views: List · Wizard (3-step) · Report
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Page, PageHeader, PageTitle, PageDescription, PageBody, Button, Input, toast } from '@blinkdotnew/ui';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Send, Users, BarChart3, FileSpreadsheet, Upload, Check,
  Clock, AlertTriangle, Zap, ArrowRight, ChevronRight, Plus,
  Eye, MousePointer, Shield, Loader2, X, FileUp, CheckCircle2,
} from 'lucide-react';
import { blink } from '../blink/client';
import { MobileKpiCard, AgencyBadge, UpgradeCTA, PlanGate, DetailButton } from '../components/shared/ResponsiveShared';
import { useSubscription } from '../context/SubscriptionContext';
import { SendCampaignDialog } from '../components/emailing/SendCampaignDialog';
import { type CampaignRecipient, type SendResult } from '../lib/campaignEmailService';
import { BACKEND_URL } from '../lib/backend';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 } };
const stagger = { animate: { transition: { staggerChildren: 0.06 } } };

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface Campaign { id: string; name: string; status: 'draft'|'sending'|'sent'|'scheduled'; recipientCount: number; openRate: number; clickRate: number; templateId?: string; subject?: string; createdAt: string; }
interface Template { id: string; name: string; subject: string; htmlPreview: string; }
interface CampaignReport { sent: number; opened: number; clicked: number; bounced: number; unsubscribed: number; openRate: number; clickRate: number; recentEvents: Array<{ type: string; email: string; timestamp: string }>; }

/* ── Helpers ───────────────────────────────────────────────────────────────── */

async function campaignApi(path: string, options: RequestInit = {}) {
  const token = await blink.auth.getValidToken().catch(() => null);
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    if (res.status === 403 && data.code === 'UPGRADE_REQUIRED') throw { code: 'UPGRADE_REQUIRED', message: data.message, currentPlan: data.currentPlan };
    throw new Error(data.error || `Erreur ${res.status}`);
  }
  return res.json();
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return { headers: [], rows: [] };
  const parseLine = (line: string) => {
    const r: string[] = []; let cur = ''; let q = false;
    for (const ch of line) { if (ch === '"') q = !q; else if (ch === ',' && !q) { r.push(cur.trim()); cur = ''; } else cur += ch; }
    r.push(cur.trim()); return r;
  };
  return { headers: parseLine(lines[0]), rows: lines.slice(1).map(parseLine) };
}

const COL_MAP: Record<string, string> = {
  email:'email', courriel:'email', mail:'email', 'e-mail':'email',
  prenom:'firstName', prénom:'firstName', first_name:'firstName', nom:'lastName',
  last_name:'lastName', telephone:'phone', tel:'phone', phone:'phone',
  entreprise:'company', societe:'company', company:'company',
};

function autoMap(headers: string[]) {
  const m: Record<number, string> = {};
  headers.forEach((h, i) => { const k = h.toLowerCase().replace(/[^a-z_]/g, ''); if (COL_MAP[k]) m[i] = COL_MAP[k]; });
  return m;
}

const STATUS_CLS: Record<string, string> = {
  draft:'bg-muted text-muted-foreground border-border', sending:'bg-primary/10 text-primary border-primary/20',
  sent:'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', scheduled:'bg-violet-500/10 text-violet-600 border-violet-500/20',
};
const STATUS_TXT: Record<string, string> = { draft:'Brouillon', sending:'En cours', sent:'Envoyé', scheduled:'Planifié' };

function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${STATUS_CLS[status]||STATUS_CLS.draft}`}>
    {status==='sending' && <Loader2 size={10} className="animate-spin"/>}{STATUS_TXT[status]||status}
  </span>;
}

/* ── Campaign List ─────────────────────────────────────────────────────────── */

function CampaignList({ campaigns, loading, onNew, onSelect }: { campaigns: Campaign[]; loading: boolean; onNew: () => void; onSelect: (c: Campaign) => void }) {
  return (
    <motion.div {...fadeUp} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2"><Mail size={20} className="text-primary"/> Campagnes Email</h2>
          <p className="text-sm text-muted-foreground mt-1">Créez et gérez vos campagnes d'emailing</p>
        </div>
        <Button onClick={onNew} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 min-h-[44px]"><Plus size={16}/> Nouvelle campagne</Button>
      </div>
      {loading ? <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map(i=><div key={i} className="nc-skeleton h-44 rounded-2xl"/>)}</div>
      : campaigns.length === 0 ? (
        <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4"><Send size={28} className="text-primary"/></div>
          <h3 className="text-lg font-bold text-foreground mb-2">Aucune campagne</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">Créez votre première campagne email pour toucher vos contacts en masse.</p>
          <Button onClick={onNew} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 min-h-[44px]"><Zap size={16}/> Créer ma première campagne</Button>
        </motion.div>
      ) : (
        <motion.div variants={stagger} initial="initial" animate="animate" className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map(c => (
            <motion.button key={c.id} variants={fadeUp} onClick={() => onSelect(c)} className="text-left rounded-2xl border border-border bg-card p-3 sm:p-4 nc-hover-lift cursor-pointer group min-h-[44px]">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-foreground text-sm truncate pr-2">{c.name}</h3>
                <StatusBadge status={c.status}/>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[{ v:c.recipientCount, l:'Contacts' },{ v:`${c.openRate}%`, l:'Ouvertures', cls:'text-primary' },{ v:`${c.clickRate}%`, l:'Clics' }].map(s => (
                  <div key={s.l} className="text-center">
                    <p className={`text-lg font-bold ${s.cls||'text-foreground'}`}>{s.v}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.l}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock size={12}/>{new Date(c.createdAt).toLocaleDateString('fr-FR')}</span>
                <ChevronRight size={14} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity"/>
              </div>
            </motion.button>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

/* ── Wizard ────────────────────────────────────────────────────────────────── */

const STEPS = [{ l:'Contacts', i:Users },{ l:'Template', i:FileSpreadsheet },{ l:'Envoi', i:Send }];

function StepIndicator({ current }: { current: number }) {
  return <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-2 mb-6 sm:mb-8">
    {STEPS.map((s, i) => { const Icon = s.i; const a = i===current, d = i<current;
      return <div key={i} className="flex items-center gap-2">
        {i>0 && <div className={`hidden sm:block w-8 h-px ${d?'bg-primary':'bg-border'}`}/>}
        {i>0 && <div className={`sm:hidden w-px h-5 ml-3 ${d?'bg-primary':'bg-border'}`}/>}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold min-h-[44px] ${a?'bg-primary text-primary-foreground shadow-sm':d?'bg-primary/15 text-primary':'bg-muted text-muted-foreground'}`}>
          {d?<Check size={12}/>:<Icon size={12}/>}<span>{s.l}</span>
        </div>
      </div>;
    })}
  </div>;
}

function StepImport({ campaignId, onComplete }: { campaignId: string; onComplete: (contactCount: number) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<{ headers: string[]; rows: string[][]; mapping: Record<number, string> }|null>(null);
  const [stats, setStats] = useState({ valid:0, invalid:0, duplicates:0 });
  const [manualEmail, setManualEmail] = useState('');
  const [manualList, setManualList] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const { headers, rows } = parseCSV(e.target?.result as string);
      const mapping = autoMap(headers);
      const eIdx = Object.entries(mapping).find(([,v])=>v==='email')?.[0];
      let valid=0, invalid=0, dupes=0; const seen = new Set<string>();
      if (eIdx!==undefined) rows.forEach(r => { const em=r[+eIdx]?.toLowerCase(); if(!em)return; if(seen.has(em)){dupes++;return;} seen.add(em); EMAIL_RE.test(em)?valid++:invalid++; });
      setParsed({ headers, rows, mapping }); setStats({ valid, invalid, duplicates: dupes });
    };
    reader.readAsText(file);
  }, []);

  const handleImport = async () => {
    setImporting(true);
    try {
      if (parsed) {
        const contacts = parsed.rows.map(r => { const o: Record<string,string>={}; Object.entries(parsed.mapping).forEach(([i,f])=>{o[f]=r[+i]||'';}); return o; }).filter(c=>c.email&&EMAIL_RE.test(c.email));
        await campaignApi(`/api/campaigns/${campaignId}/contacts`, { method:'POST', body: JSON.stringify({ contacts }) });
        toast.success(`${contacts.length} contacts importés`);
      }
      if (manualList.length) {
        await campaignApi(`/api/campaigns/${campaignId}/contacts`, { method:'POST', body: JSON.stringify({ contacts: manualList.map(e=>({email:e})) }) });
        toast.success(`${manualList.length} contacts ajoutés`);
      }
      const refreshed = await campaignApi(`/api/campaigns/${campaignId}`);
      onComplete(Number(refreshed?.contactCount ?? total));
    } catch (err: any) { toast.error(err.message||'Erreur import'); } finally { setImporting(false); }
  };

  const addManual = () => {
    if (!EMAIL_RE.test(manualEmail)) return toast.error('Email invalide');
    if (manualList.includes(manualEmail.toLowerCase())) return toast.error('Déjà ajouté');
    setManualList(p => [...p, manualEmail.toLowerCase()]); setManualEmail('');
  };

  const total = stats.valid + manualList.length;

  return (
    <motion.div {...fadeUp} transition={{ duration:0.3 }}>
      <div onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={e=>{e.preventDefault();setDragOver(false);e.dataTransfer.files[0]&&handleFile(e.dataTransfer.files[0]);}}
        onClick={()=>fileRef.current?.click()}
        className={`w-full rounded-2xl border-2 border-dashed p-6 sm:p-10 text-center cursor-pointer transition-all min-h-[120px] sm:min-h-0 ${dragOver?'border-primary bg-primary/5 scale-[1.01]':'border-border bg-card/50 hover:border-primary/40'}`}>
        <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={e=>e.target.files?.[0]&&handleFile(e.target.files[0])}/>
        <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4"><FileUp size={24} className="text-primary"/></div>
        <p className="font-semibold text-foreground mb-1">Glissez votre fichier CSV ici</p>
        <p className="text-xs text-muted-foreground">ou cliquez pour parcourir — .csv, .txt</p>
      </div>

      {parsed && (
        <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} className="mt-4">
          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <table className="w-full text-xs"><thead><tr className="bg-muted/50">
              {parsed.headers.map((h,i)=><th key={i} className="px-3 py-2 text-left font-semibold text-muted-foreground">{h}{parsed.mapping[i]&&<span className="ml-1 text-primary">→ {parsed.mapping[i]}</span>}</th>)}
            </tr></thead><tbody>
              {parsed.rows.slice(0,5).map((r,ri)=><tr key={ri} className="border-t border-border">{r.map((c,ci)=><td key={ci} className="px-3 py-2 text-foreground">{c}</td>)}</tr>)}
            </tbody></table>
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400"><CheckCircle2 size={12}/> {stats.valid} valides</span>
            {stats.invalid>0&&<span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-400"><AlertTriangle size={12}/> {stats.invalid} invalides</span>}
            {stats.duplicates>0&&<span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400"><AlertTriangle size={12}/> {stats.duplicates} doublons</span>}
          </div>
        </motion.div>
      )}

      <div className="mt-6 pt-6 border-t border-border">
        <p className="text-sm font-semibold text-foreground mb-3">Ajout manuel</p>
        <div className="flex gap-2">
          <Input placeholder="email@exemple.com" value={manualEmail} onChange={e=>setManualEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addManual()} className="flex-1 min-h-[44px]"/>
          <Button variant="outline" onClick={addManual} className="shrink-0 gap-1.5 min-h-[44px]"><Plus size={14}/> Ajouter</Button>
        </div>
        {manualList.length>0&&<div className="flex flex-wrap gap-2 mt-3">{manualList.map((em,i)=>
          <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-muted text-foreground">{em}<button onClick={()=>setManualList(p=>p.filter((_,j)=>j!==i))} className="text-muted-foreground hover:text-destructive"><X size={10}/></button></span>
        )}</div>}
      </div>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">{total>0?<><strong className="text-foreground">{total}</strong> contact{total>1?'s':''} prêt{total>1?'s':''}</>:'Aucun contact'}</p>
        <Button onClick={handleImport} disabled={!total||importing} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 min-h-[44px]">
          {importing?<Loader2 size={14} className="animate-spin"/>:<Upload size={14}/>} Importer
        </Button>
      </div>
    </motion.div>
  );
}

function StepTemplate({ templates, name, subject, selId, onName, onSubject, onSelect, onNext, loading, onOpenEditor }: {
  templates: Template[]; name: string; subject: string; selId: string;
  onName: (v:string)=>void; onSubject: (v:string)=>void; onSelect: (id:string)=>void; onNext: ()=>void; loading: boolean; onOpenEditor: () => void;
}) {
  return (
    <motion.div {...fadeUp} transition={{ duration:0.3 }}>
      <div className="space-y-4 mb-6">
        <div><label className="text-sm font-semibold text-foreground mb-1.5 block">Nom de la campagne</label><Input placeholder="Ex: Newsletter Novembre 2024" value={name} onChange={e=>onName(e.target.value)}/></div>
        <div><label className="text-sm font-semibold text-foreground mb-1.5 block">Objet de l'email</label><Input placeholder="Ex: Découvrez nos offres exclusives" value={subject} onChange={e=>onSubject(e.target.value)}/></div>
      </div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">Choisir un template</p>
        <Button type="button" variant="outline" size="sm" onClick={onOpenEditor} className="gap-2"><FileSpreadsheet size={14}/> Créer ou modifier un template</Button>
      </div>
      {loading ? <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map(i=><div key={i} className="nc-skeleton h-48 rounded-2xl"/>)}</div>
      : !templates.length ? <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center"><FileSpreadsheet size={32} className="mx-auto text-muted-foreground mb-3"/><p className="text-sm text-muted-foreground">Aucun template disponible</p><Button type="button" variant="outline" size="sm" onClick={onOpenEditor} className="mt-4">Ouvrir l’éditeur de templates</Button></div>
      : <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">{templates.map(t => {
        const sel = t.id===selId;
        return <button key={t.id} onClick={()=>onSelect(t.id)} className={`text-left rounded-2xl border-2 p-3 sm:p-4 transition-all cursor-pointer min-h-[44px] ${sel?'border-primary bg-primary/5 shadow-sm shadow-primary/10':'border-border bg-card hover:border-primary/30'}`}>
          <div className="flex items-start justify-between mb-2"><h4 className="font-semibold text-sm text-foreground truncate pr-2">{t.name}</h4>{sel&&<CheckCircle2 size={16} className="text-primary shrink-0"/>}</div>
          <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{t.subject}</p>
          <p className="text-[11px] text-muted-foreground/70 line-clamp-3 leading-relaxed">{t.htmlPreview?.replace(/<[^>]*>/g,'').slice(0,100)}...</p>
        </button>;
      })}</div>}
      <div className="flex justify-end mt-6 pt-4 border-t border-border">
        <Button onClick={onNext} disabled={!selId||!name.trim()} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 min-h-[44px]">Continuer <ArrowRight size={14}/></Button>
      </div>
    </motion.div>
  );
}

function StepSend({ campaign, tplName, count, subject, onSend, onSchedule, sending, canSchedule, userPlan, onSendNow }: {
  campaign: Campaign; tplName: string; count: number; subject: string;
  onSend: ()=>void; onSchedule: ()=>void; sending: boolean; canSchedule: boolean; userPlan: 'starter'|'agency';
  onSendNow?: () => void;
}) {
  return (
    <motion.div {...fadeUp} transition={{ duration:0.3 }}>
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h3 className="font-bold text-foreground flex items-center gap-2"><Eye size={16} className="text-primary"/> Récapitulatif</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {[{ l:'Template', v:tplName },{ l:'Objet', v:subject },{ l:'Destinataires', v:`${count} contacts` },{ l:'Expéditeur', v:'Kompilot' }].map(it=>
            <div key={it.l} className="rounded-xl bg-muted/50 p-3"><p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">{it.l}</p><p className="text-sm font-semibold text-foreground">{it.v}</p></div>
          )}
        </div>
      </div>
      {sending&&<motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="mt-6 flex flex-col items-center gap-3 py-8">
        <div className="relative"><div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center"><Send size={24} className="text-primary animate-pulse"/></div><div className="absolute -inset-2 rounded-2xl border-2 border-primary/20 animate-ping"/></div>
        <p className="text-sm font-semibold text-foreground">Envoi en cours…</p>
        <div className="w-48 h-1.5 rounded-full bg-muted overflow-hidden"><motion.div className="h-full bg-primary rounded-full" initial={{ width:'0%' }} animate={{ width:'100%' }} transition={{ duration:3, ease:'easeInOut' }}/></div>
      </motion.div>}
      <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t border-border">
        <Button onClick={onSendNow || onSend} disabled={sending||!count} className="flex-1 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 min-h-[44px]">
          {sending?<Loader2 size={14} className="animate-spin"/>:<Send size={14}/>} {onSendNow ? 'Envoyer via Blink' : 'Envoyer maintenant'}
        </Button>
        {userPlan === 'agency' && canSchedule
          ? <Button variant="outline" onClick={onSchedule} disabled={sending} className="flex-1 gap-2 min-h-[44px]"><Clock size={14}/> Planifier <AgencyBadge size="sm" /></Button>
          : <div className="flex-1"><UpgradeCTA feature="Planification d'envoi" compact onUpgrade={()=>toast.info('Redirection vers la page d\'upgrade Agency')} /></div>
        }
      </div>
    </motion.div>
  );
}

function CampaignWizard({ campaign, templates, templatesLoading, onDone, canSchedule, userPlan, onSendNow, onOpenEditor }: {
  campaign: Campaign; templates: Template[]; templatesLoading: boolean; onDone: ()=>void; canSchedule: boolean; userPlan: 'starter'|'agency';
  onSendNow?: () => void; onOpenEditor: () => void;
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(campaign.name||'');
  const [subject, setSubject] = useState(campaign.subject||'');
  const [tplId, setTplId] = useState(campaign.templateId||'');
  const [contactCount, setContactCount] = useState(campaign.recipientCount || 0);
  const [sending, setSending] = useState(false);
  const [savedCampaign, setSavedCampaign] = useState<Campaign>(campaign);
  const tpl = templates.find(t=>t.id===tplId);

  const handleTemplateNext = async () => {
    if (!name.trim() || !tplId) return;
    try {
      const response = await campaignApi(`/api/campaigns/${campaign.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim(),
          subject: subject.trim(),
          templateId: tplId,
          templateName: tpl?.name || '',
          htmlContent: tpl?.htmlPreview || '',
        }),
      });
      setSavedCampaign(response.campaign || { ...campaign, name: name.trim(), subject: subject.trim(), templateId: tplId });
      setStep(2);
    } catch (error) {
      toast.error('Impossible d’enregistrer la campagne', { description: error instanceof Error ? error.message : 'Réessayez dans un instant.' });
    }
  };

  const handleSend = async () => {
    setSending(true);
    try { await campaignApi(`/api/campaigns/${campaign.id}/send`, { method:'POST' }); toast.success('Campagne envoyée !'); onDone(); }
    catch(e:any) { toast.error(e.message||'Erreur envoi'); } finally { setSending(false); }
  };

  return (
    <motion.div {...fadeUp} transition={{ duration:0.3 }}>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={step>0?()=>setStep(s=>s-1):onDone} className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"><ChevronRight size={18} className="rotate-180"/></button>
        <div><h2 className="text-lg font-bold text-foreground">{name||'Nouvelle campagne'}</h2><p className="text-xs text-muted-foreground">Étape {step+1} sur 3</p></div>
      </div>
      <StepIndicator current={step}/>
      <AnimatePresence mode="wait">
        {step===0 && <StepImport key="imp" campaignId={campaign.id} onComplete={(count)=>{setContactCount(count);setStep(1)}}/>}
        {step===1 && <StepTemplate key="tpl" templates={templates} name={name} subject={subject} selId={tplId} onName={setName} onSubject={setSubject} onSelect={setTplId} loading={templatesLoading} onOpenEditor={onOpenEditor} onNext={()=>void handleTemplateNext()}/>}
        {step===2 && <StepSend key="snd" campaign={savedCampaign} tplName={tpl?.name||''} count={contactCount} subject={subject} onSend={handleSend} onSchedule={()=>toast.info('Planification — offre Agency')} sending={sending} canSchedule={canSchedule} userPlan={userPlan} onSendNow={onSendNow}/>}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Campaign Report ───────────────────────────────────────────────────────── */

function CampaignReport({ report, campaign, onBack, upgradeRequired, userPlan }: { report: CampaignReport|null; campaign: Campaign; onBack: ()=>void; upgradeRequired: boolean; userPlan: 'starter'|'agency' }) {
  const [showDetails, setShowDetails] = useState(false);
  const kpis = [
    { l:'Envoyés', v:report?.sent??campaign.recipientCount, icon:Send, c:'text-blue-400', ac:'bg-blue-500/10 text-blue-400' },
    { l:'Ouverts', v:report?.opened??0, icon:Eye, c:'text-emerald-400', ac:'bg-emerald-500/10 text-emerald-400' },
    { l:'Cliqués', v:report?.clicked??0, icon:MousePointer, c:'text-violet-400', ac:'bg-violet-500/10 text-violet-400' },
    { l:'Rebondis', v:report?.bounced??0, icon:AlertTriangle, c:'text-amber-400', ac:'bg-amber-500/10 text-amber-400' },
    { l:'Désabonnés', v:report?.unsubscribed??0, icon:Users, c:'text-red-400', ac:'bg-red-500/10 text-red-400' },
  ];
  return (
    <motion.div {...fadeUp} transition={{ duration:0.3 }}>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"><ChevronRight size={18} className="rotate-180"/></button>
        <div className="min-w-0"><h2 className="text-lg font-bold text-foreground truncate">{campaign.name}</h2><p className="text-xs text-muted-foreground">Rapport de campagne</p></div>
        <StatusBadge status={campaign.status}/>
      </div>
      {upgradeRequired&&userPlan!=='agency'&&<motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} className="rounded-2xl bg-gradient-to-r from-amber-600 to-orange-500 p-4 sm:p-5 text-white mb-6 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><Shield size={20}/></div>
          <div className="flex-1"><h4 className="font-bold mb-1">Rapport détaillé — Offre Agency</h4><p className="text-sm text-white/80">Passez à l'offre Agency pour les rapports avancés et analyses détaillées.</p></div>
          <Button variant="secondary" size="sm" className="shrink-0 bg-white/20 text-white border-white/30 hover:bg-white/30 min-h-[44px]">Upgrader <ArrowRight size={14}/></Button>
        </div>
      </motion.div>}
      {/* Basic KPIs — always visible */}
      <div className="nc-mobile-summary grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 mb-6">
        {kpis.map((k,i)=>{const I=k.icon;return(
          <motion.div key={k.l} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}>
            <MobileKpiCard label={k.l} value={(k.v??0).toLocaleString('fr-FR')} icon={<I size={14}/>} accent={k.ac}/>
          </motion.div>
        );})}
      </div>
      {/* Detailed rates — gated behind PlanGate */}
      <PlanGate currentPlan={userPlan} requiredPlan="agency" onUpgrade={()=>toast.info('Redirection vers l\'upgrade Agency')}>
        {report&&<div className="grid gap-3 grid-cols-1 sm:grid-cols-2 mb-6">
          {[{ l:"Taux d'ouverture", r:report.openRate, icon:Eye, c:'bg-emerald-500' },{ l:'Taux de clic', r:report.clickRate, icon:MousePointer, c:'bg-violet-500' }].map(it=>(
            <div key={it.l} className="rounded-2xl border border-border bg-card p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3"><span className="flex items-center gap-2 text-sm font-semibold text-foreground"><it.icon size={14} className="text-primary"/> {it.l}</span><span className="text-xl font-black text-primary">{it.r}%</span></div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden"><motion.div className={`h-full rounded-full ${it.c}`} initial={{ width:0 }} animate={{ width:`${Math.min(it.r,100)}%` }} transition={{ duration:0.8, ease:'easeOut' }}/></div>
            </div>
          ))}
        </div>}
        {/* Event timeline — toggle on mobile, always visible on desktop */}
        {(report?.recentEvents?.length ?? 0) > 0 && <>
          <DetailButton isOpen={showDetails} onClick={()=>setShowDetails(v=>!v)} label="Analyse détaillée"/>
          <div className={`rounded-2xl border border-border bg-card p-4 sm:p-5 mt-3 ${showDetails ? 'block' : 'hidden'} lg:block`}>
            <h3 className="font-bold text-foreground flex items-center gap-2 mb-4"><Clock size={16} className="text-primary"/> Événements récents</h3>
            <div className="space-y-3">{report.recentEvents.slice(0,10).map((ev,i)=>(
              <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${ev.type==='open'?'bg-emerald-400':ev.type==='click'?'bg-violet-400':ev.type==='bounce'?'bg-amber-400':'bg-muted-foreground'}`}/>
                  <span className="text-foreground font-medium truncate">{ev.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm pl-4 sm:pl-0">
                  <span className="text-muted-foreground capitalize">{ev.type}</span>
                  <span className="text-muted-foreground/60">{new Date(ev.timestamp).toLocaleString('fr-FR')}</span>
                </div>
              </div>
            ))}</div>
          </div>
        </>}
      </PlanGate>
      <div className="flex justify-start mt-6 pt-4 border-t border-border">
        <Button variant="outline" onClick={onBack} className="gap-2 min-h-[44px]"><ChevronRight size={14} className="rotate-180"/> Retour aux campagnes</Button>
      </div>
    </motion.div>
  );
}

/* ── Main Page ─────────────────────────────────────────────────────────────── */

type View = 'list'|'wizard'|'report';

export default function CampaignPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>('list');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [tplLoading, setTplLoading] = useState(true);
  const [active, setActive] = useState<Campaign|null>(null);
  const [report, setReport] = useState<CampaignReport|null>(null);
  const [upgradeRequired, setUpgradeRequired] = useState(false);
  const [canSchedule, setCanSchedule] = useState(true);
  const [userPlan, setUserPlan] = useState<'starter'|'agency'>('starter');
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendRecipients, setSendRecipients] = useState<CampaignRecipient[]>([]);
  const { currentPlan } = useSubscription();

  const openSendDialog = async (campaign: Campaign) => {
    try {
      const data = await campaignApi(`/api/campaigns/${campaign.id}/contacts`);
      const contacts = Array.isArray(data?.contacts) ? data.contacts : [];
      if (!contacts.length) {
        toast.error('Aucun contact actif dans cette campagne', { description: 'Ajoutez au moins un destinataire avant l’envoi.' });
        return;
      }
      setSendRecipients(contacts.map((contact: CampaignRecipient) => ({
        email: contact.email,
        firstName: contact.firstName,
        lastName: contact.lastName,
        company: contact.company,
        phone: contact.phone,
      })));
      setSendDialogOpen(true);
    } catch (error) {
      toast.error('Impossible de charger les destinataires', { description: error instanceof Error ? error.message : 'Réessayez dans un instant.' });
    }
  };

  // Sync plan from subscription context
  useEffect(() => {
    if (currentPlan.id === 'agency') setUserPlan('agency');
    else setUserPlan('starter');
  }, [currentPlan.id]);

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try { const d = await campaignApi('/api/campaigns/'); setCampaigns(Array.isArray(d)?d:d.campaigns||[]); }
    catch(e:any) { toast.error(e.message||'Erreur chargement'); } finally { setLoading(false); }
  }, []);

  const loadTemplates = useCallback(async () => {
    setTplLoading(true);
    try { const d = await campaignApi('/api/campaigns/templates'); setTemplates(Array.isArray(d)?d:d.templates||[]); }
    catch { /* non-critical */ } finally { setTplLoading(false); }
  }, []);

  useEffect(() => { loadCampaigns(); loadTemplates(); }, [loadCampaigns, loadTemplates]);

  const handleNew = async () => {
    try {
      const d = await campaignApi('/api/campaigns/', { method:'POST', body: JSON.stringify({ name:'Nouvelle campagne' }) });
      const campaignId = d.campaignId || d.campaign?.id;
      if (!campaignId) throw new Error('La campagne créée est introuvable.');
      const detail = await campaignApi(`/api/campaigns/${campaignId}`);
      setActive(detail.campaign || detail);
      setView('wizard');
    } catch(e:any) { toast.error(e.message||'Erreur création'); }
  };

  const handleSelect = async (c: Campaign) => {
    setActive(c);
    if (c.status==='sent') {
      setView('report'); setReport(null); setUpgradeRequired(false);
      try { const d = await campaignApi(`/api/campaigns/${c.id}/report`); setReport(d); }
      catch(e:any) { if(e?.code==='UPGRADE_REQUIRED'){setUpgradeRequired(true);setCanSchedule(false);} else toast.error(e.message||'Erreur rapport'); }
    } else setView('wizard');
  };

  return (
    <Page>
      <PageHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Mail size={20} className="text-primary"/></div>
          <div><PageTitle>Kompilot Campagnes</PageTitle><PageDescription>Créez, envoyez et analysez vos campagnes email</PageDescription></div>
        </div>
      </PageHeader>
      <PageBody>
        <AnimatePresence mode="wait">
          {view==='list' && <CampaignList key="list" campaigns={campaigns} loading={loading} onNew={handleNew} onSelect={handleSelect}/>}
          {view==='wizard' && active && <CampaignWizard key="wizard" campaign={active} templates={templates} templatesLoading={tplLoading} canSchedule={canSchedule} userPlan={userPlan} onDone={()=>{setView('list');loadCampaigns();}} onOpenEditor={() => navigate({ to: '/email-template-editor' })} onSendNow={() => { void openSendDialog(active); }}/>}
          {view==='report' && active && <CampaignReport key="report" campaign={active} report={report} upgradeRequired={upgradeRequired} userPlan={userPlan} onBack={()=>{setView('list');setActive(null);setReport(null);}}/>}
        </AnimatePresence>
      </PageBody>

      {/* Send Campaign Dialog */}
      {active && (
        <SendCampaignDialog
          open={sendDialogOpen}
          onClose={() => setSendDialogOpen(false)}
          onComplete={() => { setSendDialogOpen(false); setView('list'); loadCampaigns(); }}
          campaignName={active.name}
          subject={active.subject || ''}
          htmlContent={templates.find(t => t.id === active.templateId)?.htmlPreview || '<p>Contenu de la campagne</p>'}
          recipients={sendRecipients}
          onSendCampaign={async (): Promise<SendResult> => {
            const result = await campaignApi(`/api/campaigns/${active.id}/send`, { method: 'POST' });
            if (!result.success) throw new Error(result.error || `${result.failed ?? 0} email(s) n’ont pas pu être envoyé(s).`);
            return {
              totalSent: Number(result.sent ?? 0),
              totalFailed: Number(result.failed ?? 0),
              totalRecipients: Number(result.total ?? sendRecipients.length),
              errors: [],
              duration: 0,
            };
          }}
        />
      )}
    </Page>
  );
}
