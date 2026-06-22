/**
 * SiretSection — SIRET input + inline business search panel.
 * Used inside SignupPage for B2B profile type.
 */
import { Building2 } from 'lucide-react';
import { SiretBadge } from './SignupLogo';

interface SiretSearchResult {
  name: string;
  siret: string;
  city: string;
  activity: string;
}

interface SiretSectionProps {
  siret: string;
  siretValid: boolean;
  siretChecking: boolean;
  siretSearchMode: boolean;
  searchName: string;
  searchCity: string;
  searchResults: SiretSearchResult[];
  searching: boolean;
  searchDone: boolean;
  onSiretChange: (v: string) => void;
  onSearchNameChange: (v: string) => void;
  onSearchCityChange: (v: string) => void;
  onSearch: () => void;
  onSelectResult: (r: SiretSearchResult) => void;
  onToggleSearchMode: (open: boolean) => void;
  formatSiret: (v: string) => string;
}

export function SiretSection({
  siret, siretValid, siretChecking, siretSearchMode,
  searchName, searchCity, searchResults, searching, searchDone,
  onSiretChange, onSearchNameChange, onSearchCityChange,
  onSearch, onSelectResult, onToggleSearchMode, formatSiret,
}: SiretSectionProps) {
  const siretDigits = siret.replace(/\s/g, '');
  const showStatus = siretDigits.length > 0;

  return (
    <div className="siret-field-wrap">
      {/* Label row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <label className="nc-label" style={{ marginBottom: 0 }}>
          Numéro SIRET (14 chiffres)
          <span title="Le SIRET est le numéro d'identification unique de votre entreprise."
            style={{ marginLeft: 6, color: 'rgba(100,116,139,.7)', cursor: 'help', fontSize: '.78rem', fontWeight: 400 }}> (?)</span>
        </label>
        {showStatus && (
          <div className="siret-badge">
            <SiretBadge valid={siretValid && !siretChecking} />
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ position: 'relative' }}>
        <Building2 size={15} className="field-icon" />
        <input
          className="nc-field"
          type="text"
          inputMode="numeric"
          placeholder="123 456 789 01234"
          value={siret}
          onChange={e => onSiretChange(formatSiret(e.target.value))}
          maxLength={17}
          style={{
            borderColor: siretValid ? 'rgba(34,197,94,.4)' : siretDigits.length > 0 && siretDigits.length < 14 ? 'rgba(239,68,68,.3)' : undefined,
            boxShadow: siretValid ? '0 0 0 3px rgba(34,197,94,.08)' : undefined,
          }}
        />
      </div>
      <p style={{ color: '#334155', fontSize: '.7rem', marginTop: 6, marginLeft: 2 }}>
        {siretDigits.length}/14 chiffres
        {siretValid && <span style={{ color: '#4ade80', marginLeft: 6 }}>✓ Entreprise vérifiée</span>}
      </p>

      {/* Search toggle */}
      {!siretSearchMode && (
        <button type="button" onClick={() => onToggleSearchMode(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0D9488', fontSize: '.72rem', fontWeight: 600, textDecoration: 'underline', marginTop: 4, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
          🔍 Je ne connais pas mon SIRET
        </button>
      )}

      {/* Search panel */}
      {siretSearchMode && (
        <div style={{ marginTop: 12, background: 'rgba(13,148,136,.06)', border: '1px solid rgba(13,148,136,.2)', borderRadius: 12, padding: '14px 16px', animation: 'slideDown .3s cubic-bezier(.4,0,.2,1) both' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <p style={{ color: '#2DD4BF', fontSize: '.75rem', fontWeight: 700, margin: 0 }}>🔍 Rechercher mon entreprise</p>
            <button type="button" onClick={() => onToggleSearchMode(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: '.72rem' }}>
              ✕ Annuler
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input className="nc-field" type="text" placeholder="Nom de l'entreprise" value={searchName}
              onChange={e => onSearchNameChange(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') onSearch(); }}
              style={{ paddingLeft: 16, marginBottom: 0 }} autoFocus />
            <input className="nc-field" type="text" placeholder="Ville (ex: Lyon)" value={searchCity}
              onChange={e => onSearchCityChange(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') onSearch(); }}
              style={{ paddingLeft: 16 }} />
            <button type="button" onClick={onSearch} disabled={!searchName.trim() || searching}
              style={{ background: '#0D9488', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 0', fontSize: '.82rem', fontWeight: 700, cursor: 'pointer', opacity: !searchName.trim() || searching ? .5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {searching ? '⏳ Recherche en cours…' : '🔍 Rechercher'}
            </button>
          </div>

          {searchDone && searchResults.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={{ color: '#64748B', fontSize: '.68rem', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                {searchResults.length} résultat(s)
              </p>
              {searchResults.map((r, i) => (
                <button key={i} type="button" onClick={() => onSelectResult(r)}
                  style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(13,148,136,.3)', borderRadius: 10, padding: '10px 14px', cursor: 'pointer', textAlign: 'left', transition: 'background .2s' }}>
                  <p style={{ color: '#F1F5F9', fontSize: '.82rem', fontWeight: 700, margin: 0 }}>{r.name}</p>
                  <p style={{ color: '#475569', fontSize: '.7rem', margin: '2px 0 0' }}>{r.city} — {r.activity}</p>
                  <p style={{ color: '#0D9488', fontSize: '.68rem', fontFamily: 'monospace', margin: '4px 0 0', fontWeight: 600 }}>SIRET : {formatSiret(r.siret)}</p>
                </button>
              ))}
            </div>
          )}
          {searchDone && searchResults.length === 0 && (
            <p style={{ color: '#f87171', fontSize: '.72rem', marginTop: 10 }}>Aucun résultat trouvé.</p>
          )}
        </div>
      )}
    </div>
  );
}
