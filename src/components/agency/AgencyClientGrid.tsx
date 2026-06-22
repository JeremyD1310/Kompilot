/**
 * AgencyClientGrid — search bar + client card grid + empty state for the agency dashboard.
 */
import { useState } from 'react';
import { Building2, Search } from 'lucide-react';
import { ClientCard, type MockClient } from './ClientCard';
import { MonthlyReportGenerator } from './MonthlyReportGenerator';
import { useDebounce } from '../../hooks/useDebounce';

interface AgencyClientGridProps {
  clients: MockClient[];
  isDemoData: boolean;
  onPilot: (id: string) => void;
  onAddClient: () => void;
}

export function AgencyClientGrid({ clients, isDemoData, onPilot, onAddClient }: AgencyClientGridProps) {
  const [search, setSearch] = useState('');
  // Debounce the search query (350ms) to avoid re-filtering on every keystroke
  const debouncedSearch = useDebounce(search, 350);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    c.city.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    c.type.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <>
      {/* ── Demo data banner ── */}
      {isDemoData && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(129,140,248,.08)', border: '1px solid rgba(129,140,248,.3)',
          borderRadius: 10, padding: '10px 16px', marginBottom: 16,
        }}>
          <span style={{ fontSize: '.72rem', fontWeight: 800, letterSpacing: '.1em', color: '#818CF8', textTransform: 'uppercase', flexShrink: 0 }}>
            📊 Données de démonstration
          </span>
          <span style={{ height: 14, width: 1, background: 'rgba(129,140,248,.35)', flexShrink: 0 }} />
          <span style={{ fontSize: '.78rem', color: 'hsl(var(--muted-foreground))' }}>
            Ces clients sont fictifs — remplacez-les avec vos vrais établissements.
          </span>
        </div>
      )}

      {/* ── Search bar ── */}
      <div style={{ position: 'relative', marginBottom: 24, maxWidth: 380 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un client, une ville…"
          style={{
            width: '100%', paddingLeft: 36, paddingRight: 14, paddingTop: 10, paddingBottom: 10,
            background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))',
            borderRadius: 10, fontSize: '.84rem', color: 'hsl(var(--foreground))',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* ── Client grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {filtered.map(client => (
          <div key={client.id} className="flex flex-col gap-2">
            <ClientCard client={client} onPilot={onPilot} />
            <MonthlyReportGenerator clientName={client.name} clientId={client.id} />
          </div>
        ))}
      </div>

      {/* ── Empty state ── */}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'hsl(var(--muted-foreground))' }}>
          <Building2 size={36} style={{ margin: '0 auto 12px', opacity: .3 }} />
          <p style={{ fontWeight: 600 }}>Aucun client trouvé</p>
          <p style={{ fontSize: '.83rem', marginTop: 4 }}>Essayez une autre recherche</p>
        </div>
      )}

      {/* ── Footer production note ── */}
      <div style={{
        marginTop: 20, padding: '12px 16px',
        background: 'hsl(var(--muted))', borderRadius: 10,
        fontSize: '.80rem', color: 'hsl(var(--muted-foreground))',
        lineHeight: 1.5,
      }}>
        💡 En production, vos vrais clients apparaissent ici. Connectez Kompilot à votre CRM ou ajoutez-les manuellement.
      </div>
    </>
  );
}
