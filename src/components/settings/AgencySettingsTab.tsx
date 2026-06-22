/**
 * AgencySettingsTab — "Mon Agence" tab in AccountSettingsPage.
 * White-label config: logo upload (drag & drop), agency name,
 * and real-time preview of branded sidebar.
 */
import { useState, useRef, useCallback } from 'react';
import { Upload, Building2, Check, Palette, Globe, FileText } from 'lucide-react';
import { Button } from '@blinkdotnew/ui';
import { blink } from '../../blink/client';
import { toast } from '@blinkdotnew/ui';

interface AgencyConfig {
  logoUrl: string | null;
  agencyName: string;
  primaryColor: string;
  customDomain: string;
}

export function AgencySettingsTab() {
  const [config, setConfig] = useState<AgencyConfig>(() => {
    const saved = localStorage.getItem('agency_config');
    return saved ? JSON.parse(saved) : {
      logoUrl: null,
      agencyName: '',
      primaryColor: '#0D9488',
      customDomain: '',
    };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Format invalide. Veuillez utiliser PNG, JPG ou SVG.');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `agency-logos/${Date.now()}.${ext}`;
      const { publicUrl } = await blink.storage.upload(path, file, { upsert: true });
      setConfig(prev => ({ ...prev, logoUrl: publicUrl }));
      toast.success('Logo téléversé avec succès');
    } catch {
      toast.error('Erreur lors du téléversement');
    } finally {
      setUploading(false);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);

  const handleSave = () => {
    localStorage.setItem('agency_config', JSON.stringify(config));
    // Broadcast to other components via storage event
    window.dispatchEvent(new StorageEvent('storage', { key: 'agency_config' }));
    setSaved(true);
    toast.success('Configuration agence sauvegardée');
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* ── Section header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 20, borderBottom: '1px solid hsl(var(--border))' }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(99,89,248,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Building2 size={18} style={{ color: '#A78BFA' }} />
        </div>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'hsl(var(--foreground))', marginBottom: 2 }}>Configuration Marque Blanche</h3>
          <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '.83rem' }}>Personnalisez l'interface pour vos clients avec votre identité visuelle.</p>
        </div>
      </div>

      {/* ── Logo upload ── */}
      <div>
        <label style={{ display: 'block', fontWeight: 600, fontSize: '.84rem', color: 'hsl(var(--foreground))', marginBottom: 10 }}>
          Logo de votre agence
        </label>

        {/* Drop zone */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragging ? '#6359F8' : 'hsl(var(--border))'}`,
            borderRadius: 14,
            padding: '32px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            background: isDragging ? 'rgba(99,89,248,.06)' : 'hsl(var(--muted)/0.4)',
            transition: 'all .2s',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          }}
        >
          {config.logoUrl ? (
            <>
              <img src={config.logoUrl} alt="Logo agence" style={{ maxHeight: 60, maxWidth: 200, objectFit: 'contain', borderRadius: 8 }} />
              <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '.78rem' }}>Cliquez pour remplacer</p>
            </>
          ) : (
            <>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(99,89,248,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Upload size={22} style={{ color: '#A78BFA' }} />
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '.87rem', color: 'hsl(var(--foreground))', marginBottom: 4 }}>
                  {uploading ? 'Téléversement…' : 'Glissez votre logo ici'}
                </p>
                <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '.75rem' }}>PNG, JPG, SVG — max 5 Mo</p>
              </div>
            </>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>

      {/* ── Agency name ── */}
      <div>
        <label style={{ display: 'block', fontWeight: 600, fontSize: '.84rem', color: 'hsl(var(--foreground))', marginBottom: 8 }}>
          Nom de votre agence
        </label>
        <input
          value={config.agencyName}
          onChange={e => setConfig(prev => ({ ...prev, agencyName: e.target.value }))}
          placeholder="Ex: AgenceDigitale Pro"
          style={{
            width: '100%', padding: '10px 14px',
            background: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 10, fontSize: '.88rem',
            color: 'hsl(var(--foreground))', outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '.73rem', marginTop: 6 }}>
          Remplace "Kompilot" dans la sidebar pour tous vos clients invités.
        </p>
      </div>

      {/* ── Custom domain ── */}
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '.84rem', color: 'hsl(var(--foreground))', marginBottom: 8 }}>
          <Globe size={14} /> Domaine personnalisé
          <span style={{ background: 'rgba(99,89,248,.15)', color: '#A78BFA', fontSize: '.62rem', fontWeight: 700, borderRadius: 9999, padding: '2px 8px', letterSpacing: '.05em' }}>GROWTH+</span>
        </label>
        <input
          value={config.customDomain}
          onChange={e => setConfig(prev => ({ ...prev, customDomain: e.target.value }))}
          placeholder="app.votre-agence.com"
          style={{
            width: '100%', padding: '10px 14px',
            background: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 10, fontSize: '.88rem',
            color: 'hsl(var(--foreground))', outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* ── Features preview ── */}
      <div style={{ background: 'rgba(99,89,248,.06)', border: '1px solid rgba(99,89,248,.2)', borderRadius: 14, padding: '18px 20px' }}>
        <p style={{ fontWeight: 700, fontSize: '.83rem', color: '#A78BFA', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Palette size={14} /> Ce que voient vos clients
        </p>
        {[
          { icon: '✓', text: 'Votre logo remplace celui de Kompilot dans la sidebar' },
          { icon: '✓', text: 'Votre nom d\'agence s\'affiche en haut à gauche' },
          { icon: '✓', text: 'Les rapports PDF sont générés avec votre identité visuelle' },
          { icon: '✓', text: 'L\'URL de connexion peut pointer vers votre domaine (Growth+)' },
        ].map(f => (
          <div key={f.text} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
            <span style={{ color: '#22C55E', fontWeight: 800, fontSize: '.75rem', marginTop: 1 }}>{f.icon}</span>
            <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: '.8rem' }}>{f.text}</span>
          </div>
        ))}
      </div>

      {/* ── Save button ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={handleSave} className="gap-2" disabled={uploading}>
          {saved ? <><Check size={14} /> Sauvegardé</> : 'Sauvegarder la configuration'}
        </Button>
      </div>
    </div>
  );
}
