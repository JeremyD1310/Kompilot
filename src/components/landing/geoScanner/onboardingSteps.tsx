/**
 * onboardingSteps.tsx — The 4 step sub-components for ScanOnboardingModal:
 * ScanMetricsBar, Step1Identity, Step2Networks, Step3Activate
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { ScanData } from './DashboardPreviewOverlay';
import {
  type Sector,
  SECTORS,
  SECTOR_CONNECTORS,
  SECTOR_AI_TONE,
  SECTOR_WEBHOOK_INBOX,
  UNIVERSAL_NETWORKS,
} from './sectorData';

// ── Scan metrics summary bar ───────────────────────────────────────────────────

export function ScanMetricsBar({ scanData }: { scanData: ScanData | null }) {
  if (!scanData) return null;
  const { aiScore, googleRating, impressions } = scanData;

  return (
    <div style={{
      display: 'flex', gap: 8, flexWrap: 'wrap',
      background: 'rgba(13,148,136,.06)', border: '1px solid rgba(13,148,136,.2)',
      borderRadius: 12, padding: '10px 14px', marginBottom: 18,
    }}>
      <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
        <div style={{
          fontSize: '1.25rem', fontWeight: 900, lineHeight: 1,
          color: aiScore >= 60 ? '#34D399' : aiScore >= 35 ? '#FBBF24' : '#F87171',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {aiScore}%
        </div>
        <div style={{ color: '#475569', fontSize: '.6rem', fontWeight: 600, marginTop: 2 }}>Score G.E.O.</div>
      </div>
      <div style={{ width: 1, background: 'rgba(255,255,255,.06)' }} />
      <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 900, lineHeight: 1, color: '#FBBF24', fontVariantNumeric: 'tabular-nums' }}>
          {googleRating.toFixed(1)} ★
        </div>
        <div style={{ color: '#475569', fontSize: '.6rem', fontWeight: 600, marginTop: 2 }}>Avis Google</div>
      </div>
      <div style={{ width: 1, background: 'rgba(255,255,255,.06)' }} />
      <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 900, lineHeight: 1, color: '#0D9488', fontVariantNumeric: 'tabular-nums' }}>
          {impressions.toLocaleString('fr-FR')}
        </div>
        <div style={{ color: '#475569', fontSize: '.6rem', fontWeight: 600, marginTop: 2 }}>Impressions IA</div>
      </div>
    </div>
  );
}

// ── Step 1: Identity + Sector selector ────────────────────────────────────────

export function Step1Identity({
  query, sector, onSectorChange,
}: { query: string; sector: Sector; onSectorChange: (s: Sector) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Pre-fill notice */}
      <div style={{
        background: 'rgba(13,148,136,.08)', border: '1px solid rgba(13,148,136,.2)',
        borderRadius: 10, padding: '9px 13px',
        display: 'flex', alignItems: 'center', gap: 7,
      }}>
        <span style={{ color: '#6EE7B7', fontSize: '.72rem', fontWeight: 600 }}>
          ✓ Données importées automatiquement depuis votre scan
        </span>
      </div>

      {/* Fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { label: 'Nom de l\'établissement', value: query || 'Votre établissement', icon: '🏪' },
          { label: 'Ville', value: '', placeholder: 'Paris, Lyon, Bordeaux…', icon: '📍' },
          { label: 'Numéro SIRET (optionnel)', value: '', placeholder: '123 456 789 01234', icon: '📋' },
        ].map((field) => (
          <div key={field.label}>
            <label style={{
              color: '#94A3B8', fontSize: '.64rem', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '.04em',
              display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4,
            }}>
              <span>{field.icon}</span> {field.label}
            </label>
            <input
              defaultValue={field.value}
              placeholder={field.placeholder}
              style={{
                width: '100%', background: 'rgba(255,255,255,.04)',
                border: '1px solid rgba(255,255,255,.1)', borderRadius: 9,
                padding: '9px 13px', color: '#E2E8F0', fontSize: '.82rem',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        ))}
      </div>

      {/* ── Mandatory sector selector ── */}
      <div>
        <label style={{
          color: '#94A3B8', fontSize: '.64rem', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '.04em',
          display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8,
        }}>
          <span>🏷️</span> Secteur d'activité
          <span style={{
            marginLeft: 4, background: 'rgba(239,68,68,.15)',
            border: '1px solid rgba(239,68,68,.3)', borderRadius: 4,
            padding: '1px 5px', color: '#F87171', fontSize: '.58rem', fontWeight: 700,
          }}>
            Obligatoire
          </span>
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {SECTORS.map((s) => {
            const active = sector === s.id;
            return (
              <motion.button
                key={s.id}
                onClick={() => onSectorChange(s.id)}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: active ? 'rgba(13,148,136,.12)' : 'rgba(255,255,255,.03)',
                  border: `1px solid ${active ? 'rgba(13,148,136,.45)' : 'rgba(255,255,255,.08)'}`,
                  borderRadius: 10, padding: '10px 13px',
                  cursor: 'pointer', transition: 'all .18s', textAlign: 'left',
                  boxShadow: active ? '0 0 16px rgba(13,148,136,.1)' : 'none',
                }}
              >
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{s.emoji}</span>
                <span style={{ color: active ? '#6EE7B7' : '#CBD5E1', fontWeight: active ? 700 : 400, fontSize: '.82rem' }}>
                  {s.label}
                </span>
                {active && (
                  <motion.span
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    style={{
                      marginLeft: 'auto', width: 18, height: 18, borderRadius: '50%',
                      background: '#10B981', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', flexShrink: 0,
                    }}
                  >
                    <span style={{ color: '#fff', fontSize: '.6rem', fontWeight: 900 }}>✓</span>
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </div>
        {!sector && (
          <p style={{ color: '#F87171', fontSize: '.66rem', marginTop: 6 }}>
            ⚠️ Sélectionnez votre secteur pour continuer
          </p>
        )}
      </div>
    </div>
  );
}

// ── Step 2: Dynamic sector-aware connectors ────────────────────────────────────

export function Step2Networks({ sector }: { sector: Sector }) {
  const [connected, setConnected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setConnected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const sectorConnectors = SECTOR_CONNECTORS[sector] ?? [];
  const sectorInfo = SECTORS.find(s => s.id === sector);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Sector context banner */}
      {sector && sectorInfo && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(13,148,136,.07)', border: '1px solid rgba(13,148,136,.2)',
            borderRadius: 10, padding: '8px 13px',
            display: 'flex', alignItems: 'center', gap: 7,
          }}
        >
          <span style={{ fontSize: '.9rem' }}>{sectorInfo.emoji}</span>
          <span style={{ color: '#6EE7B7', fontSize: '.72rem', fontWeight: 600 }}>
            Connecteurs sélectionnés pour : {sectorInfo.label}
          </span>
        </motion.div>
      )}

      {/* Sector-specific platforms */}
      {sectorConnectors.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={{ color: '#64748B', fontSize: '.68rem', margin: '0 0 2px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>
            🔗 Plateformes sectorielles
          </p>
          {sectorConnectors.map((net) => {
            const isOn = connected.has(net.id);
            return (
              <motion.button
                key={net.id}
                onClick={() => toggle(net.id)}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 11,
                  background: isOn ? 'rgba(13,148,136,.1)' : 'rgba(255,255,255,.04)',
                  border: `1px solid ${isOn ? 'rgba(13,148,136,.4)' : 'rgba(255,255,255,.1)'}`,
                  borderRadius: 11, padding: '10px 13px',
                  cursor: 'pointer', transition: 'all .18s', textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{net.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#E2E8F0', fontWeight: 700, fontSize: '.8rem', margin: 0 }}>🔗 Connecter {net.name}</p>
                  <p style={{ color: '#64748B', fontSize: '.66rem', margin: 0 }}>{net.desc}</p>
                </div>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                  background: isOn ? '#10B981' : 'rgba(255,255,255,.1)',
                  border: `2px solid ${isOn ? '#10B981' : 'rgba(255,255,255,.15)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .18s',
                }}>
                  {isOn && <span style={{ color: '#fff', fontSize: '.55rem', fontWeight: 900 }}>✓</span>}
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Universal platforms */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p style={{ color: '#64748B', fontSize: '.68rem', margin: '4px 0 2px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>
          🌐 Réseaux universels
        </p>
        {UNIVERSAL_NETWORKS.map((net) => {
          const isOn = connected.has(net.id);
          return (
            <motion.button
              key={net.id}
              onClick={() => toggle(net.id)}
              whileTap={{ scale: 0.97 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 11,
                background: isOn ? 'rgba(13,148,136,.1)' : 'rgba(255,255,255,.04)',
                border: `1px solid ${isOn ? 'rgba(13,148,136,.4)' : 'rgba(255,255,255,.1)'}`,
                borderRadius: 11, padding: '10px 13px',
                cursor: 'pointer', transition: 'all .18s', textAlign: 'left',
              }}
            >
              <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{net.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#E2E8F0', fontWeight: 700, fontSize: '.8rem', margin: 0 }}>{net.name}</p>
                <p style={{ color: '#64748B', fontSize: '.66rem', margin: 0 }}>{net.desc}</p>
              </div>
              <div style={{
                width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                background: isOn ? '#10B981' : 'rgba(255,255,255,.1)',
                border: `2px solid ${isOn ? '#10B981' : 'rgba(255,255,255,.15)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all .18s',
              }}>
                {isOn && <span style={{ color: '#fff', fontSize: '.55rem', fontWeight: 900 }}>✓</span>}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* ── Webhook / Inbox auto-import preview ── */}
      {sector && SECTOR_WEBHOOK_INBOX[sector]?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{
            background: 'rgba(6,182,212,.05)', border: '1px solid rgba(6,182,212,.2)',
            borderRadius: 12, padding: '12px 14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
            <span style={{ fontSize: '.85rem' }}>📥</span>
            <span style={{ color: '#67E8F9', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>
              Inbox unifiée — auto-import
            </span>
            <span style={{
              marginLeft: 'auto', background: 'rgba(6,182,212,.1)',
              border: '1px solid rgba(6,182,212,.25)', borderRadius: 20,
              padding: '1px 8px', color: '#22D3EE', fontSize: '.58rem', fontWeight: 700,
            }}>
              WEBHOOK
            </span>
          </div>
          <p style={{ color: '#64748B', fontSize: '.67rem', margin: '0 0 8px', lineHeight: 1.5 }}>
            Ces sources seront centralisées automatiquement dans votre inbox Kompilot :
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {SECTOR_WEBHOOK_INBOX[sector].map((src) => (
              <div key={src.platform} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ fontSize: '.8rem', flexShrink: 0, marginTop: 1 }}>{src.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ color: '#CBD5E1', fontWeight: 700, fontSize: '.72rem' }}>{src.platform} </span>
                  <span style={{ color: '#475569', fontSize: '.68rem' }}>
                    → {src.events.join(' · ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <p style={{ color: '#475569', fontSize: '.64rem', textAlign: 'center', marginTop: 4 }}>
        La connexion réelle s'effectuera après création de votre compte.
      </p>
    </div>
  );
}

// ── Step 3: Activate + AI tone preview ────────────────────────────────────────

export function Step3Activate({ onFinish, sector }: { onFinish: () => void; sector: Sector }) {
  const tone = SECTOR_AI_TONE[sector] || SECTOR_AI_TONE[''];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* AI tone preview for sector */}
      <div style={{
        background: 'rgba(129,140,248,.06)', border: '1px solid rgba(129,140,248,.2)',
        borderRadius: 12, padding: '13px 15px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
          <span style={{ fontSize: '.9rem' }}>🤖</span>
          <span style={{ color: '#A5B4FC', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>
            Ton IA adapté à votre métier
          </span>
          <span style={{
            marginLeft: 'auto',
            background: `rgba(${tone.color === '#0EA5E9' ? '14,165,233' : '13,148,136'},.12)`,
            border: `1px solid ${tone.color}44`,
            borderRadius: 20, padding: '1px 8px',
            color: tone.color, fontSize: '.6rem', fontWeight: 700,
          }}>
            {tone.tone}
          </span>
        </div>
        <p style={{
          color: '#94A3B8', fontSize: '.74rem', margin: 0, lineHeight: 1.6,
          fontStyle: 'italic',
          borderLeft: `2px solid ${tone.color}88`,
          paddingLeft: 10,
        }}>
          {tone.example}
        </p>
      </div>

      {/* Plan card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(13,148,136,.12), rgba(13,148,136,.06))',
        border: '1px solid rgba(13,148,136,.35)', borderRadius: 14, padding: '14px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: '1.3rem' }}>🎯</span>
          <div>
            <p style={{ color: '#E2E8F0', fontWeight: 800, fontSize: '.92rem', margin: 0 }}>Offre Starter</p>
            <p style={{ color: '#0D9488', fontWeight: 700, fontSize: '.76rem', margin: 0 }}>14 jours gratuits inclus</p>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <p style={{ color: '#E2E8F0', fontWeight: 900, fontSize: '1.05rem', margin: 0 }}>49€</p>
            <p style={{ color: '#64748B', fontSize: '.62rem', margin: 0 }}>/mois après essai</p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {[
            'Toutes les corrections GEO appliquées',
            'Calendrier éditorial IA + ton sectoriel',
            'Inbox unifiée (plateformes sectorielles + réseaux)',
            'ROI tracker & analytics en temps réel',
          ].map((feat) => (
            <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#10B981', fontSize: '.68rem', flexShrink: 0 }}>✓</span>
              <span style={{ color: '#94A3B8', fontSize: '.7rem' }}>{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Guarantee */}
      <div style={{
        background: 'rgba(251,191,36,.06)', border: '1px solid rgba(251,191,36,.2)',
        borderRadius: 10, padding: '9px 13px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: '.9rem', flexShrink: 0 }}>🛡️</span>
        <p style={{ color: '#FDE68A', fontSize: '.7rem', margin: 0, lineHeight: 1.4 }}>
          <strong>Garantie 14 jours</strong> — Aucune carte bancaire requise. Résiliez en 1 clic.
        </p>
      </div>

      <motion.button
        whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(13,148,136,.5)' }}
        whileTap={{ scale: 0.98 }}
        onClick={onFinish}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: 'linear-gradient(135deg, #0D9488, #0f766e)',
          color: '#fff', fontWeight: 800, fontSize: '.88rem',
          borderRadius: 12, padding: '13px 22px',
          border: 'none', cursor: 'pointer',
          boxShadow: '0 0 28px rgba(13,148,136,.4)',
        }}
      >
        🔒 Verrouiller mon espace de travail →
      </motion.button>
      <p style={{ color: '#475569', fontSize: '.66rem', textAlign: 'center', margin: 0 }}>
        ✓ Essai 14 jours gratuit · Accès immédiat · Sans carte bancaire
      </p>
    </div>
  );
}
