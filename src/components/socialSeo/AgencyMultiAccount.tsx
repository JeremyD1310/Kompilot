/**
 * Agency Multi-Account Selector — Plan Agency (149€) exclusive
 */

import { useState } from 'react'
import { ChevronDown, Check, Building2, Users } from 'lucide-react'

const MOCK_ACCOUNTS = [
  { id: 'acc-1', name: 'Restaurant Le Bio Paris', type: 'principal', avatar: '🌿' },
  { id: 'acc-2', name: 'Boulangerie Maison Dupont', type: 'client', avatar: '🥖' },
  { id: 'acc-3', name: 'Café des Artistes', type: 'client', avatar: '🎨' },
  { id: 'acc-4', name: 'SPA Bien-être Zen', type: 'client', avatar: '🧘' },
]

export function AgencyMultiAccount() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedId, setSelectedId] = useState('acc-1')
  const selected = MOCK_ACCOUNTS.find(a => a.id === selectedId) || MOCK_ACCOUNTS[0]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-teal-600/50 transition-all w-full max-w-sm"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-500/10 text-lg">
          {selected.avatar}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-medium text-white truncate">{selected.name}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">
            {selected.type === 'principal' ? 'Compte principal' : 'Client'}
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-full max-w-sm z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl shadow-slate-900/50 overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                  {MOCK_ACCOUNTS.length} comptes
                </span>
              </div>
            </div>
            <div className="py-1 max-h-64 overflow-y-auto">
              {MOCK_ACCOUNTS.map(account => (
                <button
                  key={account.id}
                  onClick={() => { setSelectedId(account.id); setIsOpen(false) }}
                  className="flex items-center gap-3 px-3 py-2.5 w-full hover:bg-slate-700/50 transition-colors"
                >
                  <span className="text-lg">{account.avatar}</span>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm text-white truncate">{account.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {account.type === 'principal' ? 'Principal' : 'Client'}
                    </p>
                  </div>
                  {account.id === selectedId && <Check className="w-4 h-4 text-teal-400 shrink-0" />}
                </button>
              ))}
            </div>
            <div className="px-3 py-2 border-t border-slate-700/50">
              <button className="flex items-center gap-2 text-xs text-teal-400 hover:text-teal-300 w-full py-1">
                <Building2 className="w-3.5 h-3.5" />
                Ajouter un client
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
