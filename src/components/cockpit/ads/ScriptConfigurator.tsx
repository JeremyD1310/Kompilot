/**
 * ScriptConfigurator — Left panel of the split workspace
 * Script step editors + AI Actor gallery
 */
import { useState } from 'react';
import { Check, Type, User } from 'lucide-react';
import { type ScriptStep, type Actor, ACTORS } from './adsTypes';

// ── ScriptEditor ──────────────────────────────────────────────────────────────

function ScriptEditor({
  steps, onChange,
}: {
  steps: ScriptStep[];
  onChange: (id: ScriptStep['id'], value: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {steps.map((step, idx) => (
        <div key={step.id}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
            <span style={{
              width: 22, height: 22, borderRadius: '50%',
              background: idx === 0 ? '#7C3AED' : idx === 1 ? '#0D9488' : '#EA580C',
              color: '#fff', fontSize: '.68rem', fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>{idx + 1}</span>
            <span style={{ fontSize: '.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.05em' }}>
              {step.label}
            </span>
          </div>
          <textarea
            value={step.value}
            onChange={e => onChange(step.id, e.target.value)}
            placeholder={step.placeholder}
            rows={3}
            style={{
              width: '100%', background: 'rgba(255,255,255,.03)',
              border: '1px solid rgba(255,255,255,.08)', borderRadius: 10,
              padding: '12px 14px', color: '#E2E8F0', fontSize: '.875rem',
              lineHeight: 1.6, resize: 'vertical', outline: 'none',
              fontFamily: 'inherit', boxSizing: 'border-box',
              transition: 'border-color .15s',
            }}
            onFocus={e => (e.target.style.borderColor = 'rgba(13,148,136,.5)')}
            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,.08)')}
          />
        </div>
      ))}
    </div>
  );
}

// ── ActorGallery ──────────────────────────────────────────────────────────────

const LANG_FILTERS = ['Toutes', 'Français', 'English', 'Espagnol'];

function ActorGallery({
  selected, onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  const [lang, setLang] = useState('Toutes');

  const filtered = ACTORS.filter(a =>
    lang === 'Toutes' || a.accent.toLowerCase().includes(lang.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: '.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.05em' }}>
          Présentateur IA
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          {LANG_FILTERS.map(l => (
            <button key={l} onClick={() => setLang(l)} style={{
              padding: '3px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontSize: '.68rem', fontWeight: 600, fontFamily: 'inherit',
              background: lang === l ? 'rgba(13,148,136,.2)' : 'rgba(255,255,255,.04)',
              color: lang === l ? '#0D9488' : '#64748B', transition: 'all .15s',
            }}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {filtered.map(actor => (
          <button
            key={actor.id}
            onClick={() => actor.available && onSelect(actor.id)}
            disabled={!actor.available}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              padding: '12px 8px', borderRadius: 12,
              cursor: actor.available ? 'pointer' : 'not-allowed',
              border: selected === actor.id
                ? '1.5px solid rgba(13,148,136,.7)'
                : '1px solid rgba(255,255,255,.08)',
              background: selected === actor.id ? 'rgba(13,148,136,.1)' : 'rgba(255,255,255,.02)',
              opacity: actor.available ? 1 : 0.4,
              transition: 'all .15s', fontFamily: 'inherit', position: 'relative',
            }}
          >
            {selected === actor.id && (
              <span style={{
                position: 'absolute', top: 6, right: 6,
                width: 16, height: 16, borderRadius: '50%', background: '#0D9488',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Check size={10} color="#fff" />
              </span>
            )}
            <div style={{
              width: 44, height: 44, borderRadius: '50%', background: actor.avatarBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '.75rem', fontWeight: 800, color: '#fff',
              boxShadow: selected === actor.id ? `0 0 12px ${actor.avatarBg}60` : 'none',
            }}>
              {actor.initials}
            </div>
            <div>
              <p style={{ margin: 0, color: '#E2E8F0', fontSize: '.78rem', fontWeight: 700 }}>{actor.name}</p>
              <p style={{ margin: 0, color: '#64748B', fontSize: '.65rem' }}>{actor.accent}</p>
            </div>
            {!actor.available && (
              <span style={{ fontSize: '.6rem', color: '#475569' }}>Bientôt</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── ScriptConfigurator ────────────────────────────────────────────────────────

interface ScriptConfiguratorProps {
  script: ScriptStep[];
  actor: string;
  onScriptChange: (id: ScriptStep['id'], value: string) => void;
  onActorChange: (id: string) => void;
}

export function ScriptConfigurator({ script, actor, onScriptChange, onActorChange }: ScriptConfiguratorProps) {
  return (
    <div style={{
      background: '#111c2e', border: '1px solid rgba(255,255,255,.08)',
      borderRadius: 16, padding: '22px 22px 18px', display: 'flex', flexDirection: 'column', gap: 22,
    }}>
      {/* Script */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(124,58,237,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Type size={14} style={{ color: '#7C3AED' }} />
          </div>
          <span style={{ fontSize: '.82rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Script Vidéo
          </span>
        </div>
        <ScriptEditor steps={script} onChange={onScriptChange} />
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,.06)' }} />

      {/* Actors */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(13,148,136,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={14} style={{ color: '#0D9488' }} />
          </div>
          <span style={{ fontSize: '.82rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Acteur IA
          </span>
        </div>
        <ActorGallery selected={actor} onSelect={onActorChange} />
      </div>
    </div>
  );
}
