/**
 * WizardStep1 — "Tell us about your business"
 * Collects: businessName, websiteUrl, industry
 */
import { Building2, Globe, ChevronDown, ArrowRight } from 'lucide-react';

const INDUSTRIES = [
  'SaaS / Tech',
  'Infopreneur / Creator',
  'Agency / Consulting',
  'E-commerce',
  'Local Business',
  'Other',
];

function isValidUrl(url: string) {
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('www.');
}

interface Props {
  businessName: string;
  setBusinessName: (v: string) => void;
  websiteUrl: string;
  setWebsiteUrl: (v: string) => void;
  industry: string;
  setIndustry: (v: string) => void;
  onNext: () => void;
}

export function WizardStep1({
  businessName, setBusinessName,
  websiteUrl, setWebsiteUrl,
  industry, setIndustry,
  onNext,
}: Props) {
  const urlValid = isValidUrl(websiteUrl.trim());
  const canNext = businessName.trim().length > 0 && websiteUrl.trim().length > 0 && urlValid && industry.length > 0;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 leading-tight">Tell us about your business</h2>
        <p className="text-sm text-gray-500 mt-1.5">We'll pre-populate your dashboard with relevant data</p>
      </div>

      {/* Business Name */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Business Name *</label>
        <div className="relative">
          <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={businessName}
            onChange={e => setBusinessName(e.target.value)}
            placeholder="Acme Corp"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 transition-all"
          />
        </div>
      </div>

      {/* Website URL */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Website URL *</label>
        <div className="relative">
          <Globe size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="url"
            value={websiteUrl}
            onChange={e => setWebsiteUrl(e.target.value)}
            placeholder="https://yoursite.com"
            className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-orange-400 transition-all ${
              websiteUrl && !urlValid
                ? 'border-red-300 focus:ring-red-200/50'
                : 'border-gray-200 focus:ring-orange-400/40'
            }`}
          />
        </div>
        {websiteUrl && !urlValid && (
          <p className="text-xs text-red-500">URL must start with http://, https://, or www.</p>
        )}
      </div>

      {/* Industry */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Industry *</label>
        <div className="relative">
          <select
            value={industry}
            onChange={e => setIndustry(e.target.value)}
            className="w-full appearance-none px-4 py-3 pr-10 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 transition-all cursor-pointer"
          >
            <option value="" disabled>Select your industry…</option>
            {INDUSTRIES.map(ind => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
          <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
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
