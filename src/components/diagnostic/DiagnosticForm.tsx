/**
 * DiagnosticForm — Step 1 of the lead magnet funnel.
 * Business name with autocomplete simulation, email, and phone fields.
 */
import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Mail, Phone, ChevronRight, Loader2 } from 'lucide-react';

export interface DiagnosticFormData {
  businessName: string;
  address: string;
  city: string;
  email: string;
  phone: string;
}

// Simulated Google Places suggestions (realistic French commerce data)
const PLACE_SUGGESTIONS = [
  { name: 'Boulangerie Dupont', address: '12 Rue de la Paix, 75001 Paris', city: 'Paris' },
  { name: 'Restaurant Le Provençal', address: '8 Bd des Capucines, 75009 Paris', city: 'Paris' },
  { name: 'Salon de coiffure Élégance', address: '34 Av. Victor Hugo, 69006 Lyon', city: 'Lyon' },
  { name: 'Plomberie Martin & Fils', address: '17 Rue Sainte-Catherine, 33000 Bordeaux', city: 'Bordeaux' },
  { name: 'Institut de beauté Belle Vue', address: '5 Rue des Fleurs, 06000 Nice', city: 'Nice' },
  { name: 'Auto-École Réussite', address: '22 Bd Clemenceau, 67000 Strasbourg', city: 'Strasbourg' },
  { name: 'Pizzeria Napoli Express', address: '3 Pl. du Capitole, 31000 Toulouse', city: 'Toulouse' },
  { name: 'Cabinet Dentaire Blanc', address: '11 Rue du Commerce, 59000 Lille', city: 'Lille' },
  { name: 'Librairie Le Bouquin', address: '29 Rue Saint-Jean, 44000 Nantes', city: 'Nantes' },
  { name: 'Garage Renault Expert', address: '45 Av. de la Gare, 13008 Marseille', city: 'Marseille' },
];

interface Props {
  onSubmit: (data: DiagnosticFormData) => void;
}

export function DiagnosticForm({ onSubmit }: Props) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<typeof PLACE_SUGGESTIONS>([]);
  const [selected, setSelected] = useState<typeof PLACE_SUGGESTIONS[0] | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Simulate Google Places autocomplete
  useEffect(() => {
    if (query.length < 2 || selected) { setSuggestions([]); return; }
    const timer = setTimeout(() => {
      const q = query.toLowerCase();
      setSuggestions(PLACE_SUGGESTIONS.filter(s =>
        s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q) || s.city.toLowerCase().includes(q)
      ).slice(0, 5));
    }, 280);
    return () => clearTimeout(timer);
  }, [query, selected]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setSuggestions([]);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (s: typeof PLACE_SUGGESTIONS[0]) => {
    setSelected(s); setQuery(s.name); setSuggestions([]);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!selected && query.trim().length < 2) errs.business = 'Sélectionnez votre établissement';
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errs.email = 'Email invalide';
    if (!phone.match(/^[+\d\s()-]{8,}$/)) errs.phone = 'Numéro invalide';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 600)); // brief UX delay
    onSubmit({
      businessName: selected?.name ?? query.trim(),
      address: selected?.address ?? '',
      city: selected?.city ?? query.split(',').pop()?.trim() ?? '',
      email: email.trim(),
      phone: phone.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Business name with autocomplete */}
      <div ref={dropdownRef} className="relative">
        <label className="block text-sm font-semibold text-foreground mb-1.5">
          Nom de votre établissement
        </label>
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(null); }}
            placeholder="Ex : Boulangerie Dupont, Lyon..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
          {selected && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">✓</span>
            </div>
          )}
        </div>
        {errors.business && <p className="text-xs text-red-500 mt-1">{errors.business}</p>}

        {/* Dropdown suggestions */}
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
            {suggestions.map((s, i) => (
              <button
                key={i} type="button"
                onClick={() => handleSelect(s)}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border/50 last:border-0"
              >
                <MapPin size={14} className="text-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.address}</p>
                </div>
              </button>
            ))}
            <p className="text-[10px] text-muted-foreground px-4 py-2 bg-muted/20">Propulsé par Google Places</p>
          </div>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-1.5">Adresse e-mail professionnelle</label>
        <div className="relative">
          <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="contact@moncommerce.fr"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
        </div>
        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-1.5">Numéro de téléphone (WhatsApp)</label>
        <div className="relative">
          <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="tel" value={phone} onChange={e => setPhone(e.target.value)}
            placeholder="+33 6 12 34 56 78"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
        </div>
        {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
      </div>

      <button
        type="submit" disabled={submitting}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
      >
        {submitting ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
        {submitting ? 'Lancement du scan...' : 'Analyser ma visibilité gratuitement'}
      </button>

      <p className="text-center text-[11px] text-muted-foreground">
        🔒 Gratuit · Sans CB · Résultats en 30 secondes
      </p>
    </form>
  );
}
