/**
 * WizardStep2 — "Who are your main competitors?"
 * Collects: competitor1Name, competitor1Url, competitor2Name (optional), competitor2Url (optional)
 */
import { Search, ArrowRight } from 'lucide-react';

interface Props {
  competitor1Name: string;
  setCompetitor1Name: (v: string) => void;
  competitor1Url: string;
  setCompetitor1Url: (v: string) => void;
  competitor2Name: string;
  setCompetitor2Name: (v: string) => void;
  competitor2Url: string;
  setCompetitor2Url: (v: string) => void;
  onNext: () => void;
}

function DomainInput({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
        {label} {required && <span className="text-orange-500">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 transition-all"
      />
    </div>
  );
}

export function WizardStep2({
  competitor1Name, setCompetitor1Name,
  competitor1Url, setCompetitor1Url,
  competitor2Name, setCompetitor2Name,
  competitor2Url, setCompetitor2Url,
  onNext,
}: Props) {
  const canNext = competitor1Name.trim().length > 0 && competitor1Url.trim().length > 0;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 leading-tight">Who are your main competitors?</h2>
        <p className="text-sm text-gray-500 mt-1.5">We'll map their funnels so you can spy on what's working</p>
      </div>

      {/* Competitor 1 */}
      <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 space-y-3">
        <p className="text-xs font-bold text-orange-500 uppercase tracking-wider">Competitor #1</p>
        <DomainInput
          label="Name"
          value={competitor1Name}
          onChange={setCompetitor1Name}
          placeholder="Competitor Inc."
          required
        />
        <DomainInput
          label="Domain URL"
          value={competitor1Url}
          onChange={setCompetitor1Url}
          placeholder="competitor.com"
          required
        />
      </div>

      {/* Competitor 2 */}
      <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 space-y-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Competitor #2 <span className="normal-case font-normal text-gray-400">(optional)</span></p>
        <DomainInput
          label="Name"
          value={competitor2Name}
          onChange={setCompetitor2Name}
          placeholder="Another Rival Ltd."
        />
        <DomainInput
          label="Domain URL"
          value={competitor2Url}
          onChange={setCompetitor2Url}
          placeholder="rival.com"
        />
      </div>

      {/* Info badge */}
      <div className="flex items-center gap-2.5 rounded-xl bg-orange-50 border border-orange-100 px-4 py-3">
        <Search size={14} className="text-orange-400 shrink-0" />
        <p className="text-xs text-orange-700 leading-relaxed">
          🔍 Kompilot will analyze their ads, funnel structure & tech stack
        </p>
      </div>

      <button
        onClick={onNext}
        disabled={!canNext}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-lg shadow-orange-200"
      >
        Next <ArrowRight size={16} />
      </button>
    </div>
  );
}
