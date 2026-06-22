import React, { useState, useEffect } from 'react';
import { 
  Card, CardHeader, CardTitle, CardContent, 
  Button, Input, Textarea, Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Switch, toast, Badge
} from '@blinkdotnew/ui';
import { 
  BookOpen, Shield, Ban, Target, Sparkles, Save, Eye,
  Quote
} from 'lucide-react';

interface BrandBookData {
  tone: string;
  forbiddenWords: string;
  brandPromise: string;
  targetAudience: string;
  compulsoryEmoji: boolean;
  postingTone: string;
}

const DEFAULT_DATA: BrandBookData = {
  tone: 'Professionnel & Expert',
  forbiddenWords: 'pas cher, discount, promo, bas de gamme',
  brandPromise: 'Démocratiser la sécurité informatique pour les PME avec élégance et simplicité.',
  targetAudience: 'Dirigeants de PME, Responsables IT, Startups',
  compulsoryEmoji: true,
  postingTone: 'Nous accompagnons votre croissance. Votre sécurité est notre priorité absolue. Toujours à vos côtés.'
};

export const BrandBookAI: React.FC = () => {
  const [data, setData] = useState<BrandBookData>(DEFAULT_DATA);

  useEffect(() => {
    const saved = localStorage.getItem('kompilot_brand_book');
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load brand book', e);
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('kompilot_brand_book', JSON.stringify(data));
    toast.success('Charte graphique enregistrée avec succès');
  };

  const generatePreview = () => {
    const emoji = data.compulsoryEmoji ? ' 🛡️✨' : '';
    return `"${data.postingTone.split('.')[0]} chez Kompilot. ${data.brandPromise}${emoji}"`;
  };

  return (
    <Card className="w-full max-w-2xl bg-gradient-to-br from-[#0F172A] to-[#1E293B] border-amber-500/30 text-slate-100 shadow-xl overflow-hidden">
      <CardHeader className="border-b border-amber-500/20 bg-amber-500/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <BookOpen className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-amber-500">Brand Book AI</CardTitle>
            <p className="text-xs text-slate-400">Définissez l'âme et la voix de votre marque</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" /> Ton de la marque
            </label>
            <Select 
              value={data.tone} 
              onValueChange={(val) => setData({ ...data, tone: val })}
            >
              <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-200">
                <SelectValue placeholder="Sélectionnez un ton" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                <SelectItem value="Premium & Élégant">Premium & Élégant</SelectItem>
                <SelectItem value="Chaleureux & Proche">Chaleureux & Proche</SelectItem>
                <SelectItem value="Professionnel & Expert">Professionnel & Expert</SelectItem>
                <SelectItem value="Dynamique & Moderne">Dynamique & Moderne</SelectItem>
                <SelectItem value="Sobre & Institutionnel">Sobre & Institutionnel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2 text-slate-200">
              <Target className="w-4 h-4 text-amber-500" /> Cible Prioritaire
            </label>
            <Input 
              value={data.targetAudience}
              onChange={(e) => setData({ ...data, targetAudience: e.target.value })}
              className="bg-slate-800/50 border-slate-700 text-slate-200 focus:ring-amber-500"
              placeholder="Ex: CEOs, Tech leads..."
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2 text-slate-200">
            <Shield className="w-4 h-4 text-amber-500" /> Promesse de Marque
          </label>
          <Input 
            value={data.brandPromise}
            maxLength={120}
            onChange={(e) => setData({ ...data, brandPromise: e.target.value })}
            className="bg-slate-800/50 border-slate-700 text-slate-200 focus:ring-amber-500"
            placeholder="Votre valeur unique en 120 caractères..."
          />
          <div className="flex justify-end">
            <span className="text-[10px] text-slate-500">{data.brandPromise.length}/120</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2 text-slate-200">
            <Ban className="w-4 h-4 text-rose-500" /> Mots Interdits
          </label>
          <Textarea 
            value={data.forbiddenWords}
            onChange={(e) => setData({ ...data, forbiddenWords: e.target.value })}
            className="bg-slate-800/50 border-slate-700 text-slate-200 min-h-[60px] focus:ring-rose-500"
            placeholder="Séparez par des virgules..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2 text-slate-200">
            <Quote className="w-4 h-4 text-amber-500" /> Exemples de ton
          </label>
          <Textarea 
            value={data.postingTone}
            onChange={(e) => setData({ ...data, postingTone: e.target.value })}
            className="bg-slate-800/50 border-slate-700 text-slate-200 min-h-[80px] focus:ring-amber-500"
            placeholder="Écrivez 2-3 phrases types..."
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
          <div className="flex flex-col">
            <span className="text-sm font-medium">Usage des Emojis</span>
            <span className="text-xs text-slate-500">Ajoute une touche humaine aux posts</span>
          </div>
          <Switch 
            checked={data.compulsoryEmoji}
            onCheckedChange={(val) => setData({ ...data, compulsoryEmoji: val })}
          />
        </div>

        <div className="pt-4 space-y-4">
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-3 h-3 text-amber-500" />
              <span className="text-[10px] uppercase tracking-wider font-bold text-amber-500">Aperçu de la Charte</span>
            </div>
            <p className="text-sm italic text-slate-300 leading-relaxed">
              {generatePreview()}
            </p>
          </div>

          <Button 
            onClick={handleSave}
            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-2 transition-all active:scale-[0.98]"
          >
            <Save className="w-4 h-4" /> Enregistrer la Charte
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
