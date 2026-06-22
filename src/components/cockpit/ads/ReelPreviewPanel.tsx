/**
 * ReelPreviewPanel — Right panel: 9:16 live preview + subtitle style picker
 */
import { useEffect, useRef, useState } from 'react';
import { Play, Volume2, VolumeX, Film, Palette, Check } from 'lucide-react';
import { type SubtitleStyle, SUBTITLE_STYLES } from './adsTypes';

// ── Reel canvas ───────────────────────────────────────────────────────────────

function ReelCanvas({
  isGenerating, subtitleStyle, muted, onToggleMute,
}: {
  isGenerating: boolean;
  subtitleStyle: SubtitleStyle;
  muted: boolean;
  onToggleMute: () => void;
}) {
  const frameRef = useRef(0);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!isGenerating) return;
    const id = setInterval(() => {
      frameRef.current += 1;
      setFrame(frameRef.current);
    }, 80);
    return () => clearInterval(id);
  }, [isGenerating]);

  const subtitleColour = {
    bold_yellow: '#FFD600', minimal_white: '#FFFFFF',
    karaoke_teal: '#0D9488', none: 'transparent',
  }[subtitleStyle];

  return (
    <div style={{
      width: '100%', aspectRatio: '9 / 16', maxHeight: 500,
      background: 'linear-gradient(160deg, #0F172A 0%, #1A2640 100%)',
      borderRadius: 20, border: '1px solid rgba(255,255,255,.1)',
      position: 'relative', overflow: 'hidden',
      boxShadow: '0 0 60px rgba(13,148,136,.08)',
    }}>
      {/* Scan-line texture */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, rgba(0,0,0,.03) 0px, rgba(0,0,0,.03) 1px, transparent 1px, transparent 4px)',
      }} />

      {/* Top chrome */}
      <div style={{ position: 'absolute', top: 14, left: 14, right: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#334155' }} />
          <div>
            <div style={{ height: 8, width: 60, background: '#334155', borderRadius: 4 }} />
            <div style={{ height: 6, width: 40, background: '#1E293B', borderRadius: 4, marginTop: 4 }} />
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,.1)', borderRadius: 6, padding: '4px 10px', fontSize: '.65rem', color: '#94A3B8', fontWeight: 700 }}>
          REEL PREVIEW
        </div>
      </div>

      {/* Content */}
      {isGenerating ? (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            border: '3px solid rgba(13,148,136,.2)', borderTop: '3px solid #0D9488',
            animation: 'ddSpin .8s linear infinite',
          }} />
          <p style={{ color: '#94A3B8', fontSize: '.8rem', fontWeight: 600, textAlign: 'center' }}>
            Génération en cours…<br />
            <span style={{ color: '#475569', fontSize: '.72rem', fontWeight: 400 }}>
              Frame {frame} · Synthèse vocale…
            </span>
          </p>
        </div>
      ) : (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 16px 24px' }}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(to top, rgba(0,0,0,.85) 0%, transparent 100%)', pointerEvents: 'none' }} />
          {/* Wave bars */}
          <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4 }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{
                width: 3, background: '#0D9488', borderRadius: 2,
                opacity: .35 + Math.sin(i * 0.7) * .3,
                height: 8 + Math.sin(i * 0.9) * 18,
                alignSelf: 'flex-end',
              }} />
            ))}
          </div>
          {subtitleStyle !== 'none' && (
            <div style={{ position: 'relative', textAlign: 'center', marginBottom: 12 }}>
              <span style={{
                color: subtitleColour, fontSize: '.82rem', fontWeight: 800,
                textShadow: '0 2px 8px rgba(0,0,0,.8)',
                background: subtitleStyle === 'bold_yellow' ? 'rgba(0,0,0,.5)' : 'transparent',
                borderRadius: 4, padding: '2px 8px',
              }}>
                Essayez gratuitement sur kompilot.fr ✨
              </span>
            </div>
          )}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            width: 52, height: 52, borderRadius: '50%',
            background: 'rgba(255,255,255,.12)', border: '1.5px solid rgba(255,255,255,.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}>
            <Play size={20} style={{ color: '#fff', marginLeft: 3 }} />
          </div>
        </div>
      )}

      {/* Bottom volume bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,.06)',
        background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <button onClick={onToggleMute} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4 }}>
          {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>
        <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,.1)', borderRadius: 2 }}>
          <div style={{ width: '35%', height: '100%', background: '#0D9488', borderRadius: 2 }} />
        </div>
        <span style={{ fontSize: '.65rem', color: '#64748B' }}>0:04 / 0:15</span>
      </div>
    </div>
  );
}

// ── SubtitlePicker ────────────────────────────────────────────────────────────

function SubtitlePicker({ value, onChange }: { value: SubtitleStyle; onChange: (s: SubtitleStyle) => void }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <Palette size={12} style={{ color: '#475569' }} />
        <span style={{ fontSize: '.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.05em' }}>
          Style Sous-titres
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {SUBTITLE_STYLES.map(ss => (
          <button
            key={ss.id}
            onClick={() => onChange(ss.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 8,
              border: value === ss.id ? '1.5px solid rgba(13,148,136,.5)' : '1px solid rgba(255,255,255,.07)',
              background: value === ss.id ? 'rgba(13,148,136,.1)' : 'rgba(255,255,255,.02)',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
            }}
          >
            <span style={{
              width: 12, height: 12, borderRadius: '50%',
              background: ss.preview === 'transparent' ? 'rgba(255,255,255,.1)' : ss.preview,
              border: ss.preview === 'transparent' ? '1px dashed rgba(255,255,255,.2)' : 'none',
              flexShrink: 0,
            }} />
            <span style={{ fontSize: '.78rem', color: value === ss.id ? '#0D9488' : '#94A3B8' }}>{ss.label}</span>
            {value === ss.id && <Check size={11} style={{ color: '#0D9488', marginLeft: 'auto' }} />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── ReelPreviewPanel ──────────────────────────────────────────────────────────

interface ReelPreviewPanelProps {
  isGenerating: boolean;
  subtitleStyle: SubtitleStyle;
  muted: boolean;
  onToggleMute: () => void;
  onSubtitleChange: (s: SubtitleStyle) => void;
}

export function ReelPreviewPanel({ isGenerating, subtitleStyle, muted, onToggleMute, onSubtitleChange }: ReelPreviewPanelProps) {
  return (
    <div style={{
      background: '#111c2e', border: '1px solid rgba(255,255,255,.08)',
      borderRadius: 16, padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Film size={14} style={{ color: '#64748B' }} />
        <span style={{ fontSize: '.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.05em' }}>
          Live Preview
        </span>
      </div>
      <ReelCanvas
        isGenerating={isGenerating}
        subtitleStyle={subtitleStyle}
        muted={muted}
        onToggleMute={onToggleMute}
      />
      <SubtitlePicker value={subtitleStyle} onChange={onSubtitleChange} />
    </div>
  );
}
