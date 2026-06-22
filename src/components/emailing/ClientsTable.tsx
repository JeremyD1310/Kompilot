import { useState, useCallback } from 'react';
import { DataTable, toast } from '@blinkdotnew/ui';
import { Upload } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

interface Client {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  totalDepense: string;
  statut: 'Fidèle' | 'Inactif' | 'Nouveau';
}

const ALL_CLIENTS: Client[] = [
  { id: '1', nom: 'Sophie Martin',    email: 'sophie.martin@email.fr',   telephone: '06 12 34 56 78', totalDepense: '1 240 €', statut: 'Fidèle'   },
  { id: '2', nom: 'Jean-Pierre Dubois', email: 'jp.dubois@gmail.com',    telephone: '07 23 45 67 89', totalDepense: '340 €',   statut: 'Inactif'  },
  { id: '3', nom: 'Camille Leroy',    email: 'c.leroy@outlook.fr',       telephone: '06 34 56 78 90', totalDepense: '89 €',    statut: 'Nouveau'  },
  { id: '4', nom: 'Marc Fontaine',    email: 'marc.fontaine@pro.fr',     telephone: '06 45 67 89 01', totalDepense: '2 100 €', statut: 'Fidèle'   },
  { id: '5', nom: 'Isabelle Renard',  email: 'i.renard@wanadoo.fr',      telephone: '07 56 78 90 12', totalDepense: '120 €',   statut: 'Inactif'  },
  { id: '6', nom: 'Thomas Petit',     email: 'thomas.petit@gmail.com',   telephone: '06 67 89 01 23', totalDepense: '67 €',    statut: 'Nouveau'  },
  { id: '7', nom: 'Nathalie Bernard', email: 'n.bernard@yahoo.fr',       telephone: '07 78 90 12 34', totalDepense: '870 €',   statut: 'Fidèle'   },
  { id: '8', nom: 'Lucas Moreau',     email: 'lucas.moreau@gmail.com',   telephone: '06 89 01 23 45', totalDepense: '45 €',    statut: 'Nouveau'  },
  { id: '9', nom: 'Élise Girard',     email: 'elise.g@live.fr',          telephone: '07 90 12 34 56', totalDepense: '430 €',   statut: 'Inactif'  },
  { id: '10', nom: 'Antoine Perrin',  email: 'a.perrin@laposte.net',     telephone: '06 01 23 45 67', totalDepense: '1 680 €', statut: 'Fidèle'   },
];

const SEGMENTS = [
  { key: 'Fidèle',  label: '🔥 Clients Fidèles',       count: 142, colorClass: 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200' },
  { key: 'Inactif', label: '💤 Inactifs +3 mois',      count: 68,  colorClass: 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'     },
  { key: 'Nouveau', label: '🎉 Nouveaux ce mois',       count: 34,  colorClass: 'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200' },
] as const;

const columns: ColumnDef<Client>[] = [
  { accessorKey: 'nom',          header: 'Nom'             },
  { accessorKey: 'email',        header: 'Email'           },
  { accessorKey: 'telephone',    header: 'Téléphone'       },
  { accessorKey: 'totalDepense', header: 'Total Dépensé'   },
  {
    accessorKey: 'statut',
    header: 'Statut',
    cell: ({ row }) => {
      const s = row.getValue('statut') as string;
      const map: Record<string, string> = {
        Fidèle:  'bg-orange-100 text-orange-700 border-orange-200',
        Inactif: 'bg-slate-100 text-slate-500 border-slate-200',
        Nouveau: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      };
      return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${map[s] ?? ''}`}>
          {s}
        </span>
      );
    },
  },
];

export function ClientsTable() {
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const filtered = activeSegment
    ? ALL_CLIENTS.filter(c => c.statut === activeSegment)
    : ALL_CLIENTS;

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const valid = files.filter(f => f.name.endsWith('.csv') || f.name.endsWith('.xlsx'));
    if (valid.length === 0) {
      toast.error('Format invalide', { description: 'Veuillez importer un fichier .csv ou .xlsx' });
      return;
    }
    toast.success(`${valid[0].name} importé !`, {
      description: `✅ ${Math.floor(Math.random() * 50) + 20} nouveaux contacts ajoutés`,
    });
  }, []);

  return (
    <div className="space-y-5">
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-8 transition-all duration-200 cursor-pointer select-none ${
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-primary/[0.02]'
        }`}
      >
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Upload size={22} className="text-primary" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">📥 Importer vos clients</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Glissez un fichier <span className="font-mono font-bold">.csv</span> ou <span className="font-mono font-bold">.xlsx</span> ici
          </p>
        </div>
      </div>

      {/* Segment filters */}
      <div className="flex flex-wrap gap-2">
        {SEGMENTS.map(seg => (
          <button
            key={seg.key}
            onClick={() => setActiveSegment(activeSegment === seg.key ? null : seg.key)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 ${seg.colorClass} ${
              activeSegment === seg.key ? 'ring-2 ring-offset-1 ring-primary/40 shadow-sm' : ''
            }`}
          >
            {seg.label}
            <span className="rounded-full bg-white/60 px-1.5 py-0.5 text-[11px] font-bold">{seg.count}</span>
          </button>
        ))}
        {activeSegment && (
          <button
            onClick={() => setActiveSegment(null)}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 px-2"
          >
            Tout afficher
          </button>
        )}
      </div>

      {/* Table */}
      <DataTable columns={columns} data={filtered} searchable searchColumn="nom" />
    </div>
  );
}
