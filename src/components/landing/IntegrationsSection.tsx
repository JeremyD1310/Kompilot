/**
 * IntegrationsSection — Version compacte
 * Logos des plateformes supportées en grille simple
 */

const INTEGRATIONS = [
  { name: 'Google Maps', emoji: '📍', color: '#EA4335' },
  { name: 'Instagram', emoji: '📸', color: '#E1306C' },
  { name: 'Facebook', emoji: '👤', color: '#1877F2' },
  { name: 'WhatsApp', emoji: '💬', color: '#25D366' },
  { name: 'ChatGPT', emoji: '🤖', color: '#10A37F' },
  { name: 'Gemini', emoji: '✨', color: '#4285F4' },
  { name: 'Perplexity', emoji: '🔍', color: '#6366F1' },
  { name: 'Google Ads', emoji: '📢', color: '#FBBC04' },
  { name: 'Meta Ads', emoji: '📣', color: '#0668E1' },
  { name: 'TripAdvisor', emoji: '🦉', color: '#34E0A1' },
];

export function IntegrationsSection() {
  return (
    <section style={{ padding: 'clamp(32px, 5vw, 48px) 16px', borderTop: '1px solid rgba(255,255,255,.05)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ color: '#475569', fontSize: '.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 20 }}>
          Compatible avec vos plateformes
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          {INTEGRATIONS.map(int => (
            <div
              key={int.name}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,.04)',
                border: '1px solid rgba(255,255,255,.08)',
                borderRadius: 10, padding: '8px 14px',
                color: '#94A3B8', fontSize: '.8rem', fontWeight: 600,
              }}
            >
              <span>{int.emoji}</span>
              <span>{int.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
