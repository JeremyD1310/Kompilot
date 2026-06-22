import React, { useState } from 'react';
import { Page, PageHeader, PageTitle, PageBody, Card, Badge, Button, Textarea, VStack, HStack, Separator } from '@blinkdotnew/ui';
import { QrCode, Download, ShieldCheck, MapPin, MessageSquare, Star, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SmartQRCodePage() {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [privateMessage, setPrivateMessage] = useState(
    "Désolé que votre expérience n'ait pas été parfaite. Dites-nous ce qui n'a pas été pour que nous puissions nous rattraper immédiatement..."
  );

  // Growth loop UTM link embedded in QR Code footer
  const GROWTH_UTM_URL =
    'https://www.kompilot.com/?utm_source=qr_code_client&utm_medium=print&utm_campaign=review_qr&utm_content=counter_footer';

  const handleDownloadQR = () => {
    // SVG with embedded growth loop footer — "⚡ Sécurisé & Propulsé par Kompilot.com"
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="580" viewBox="0 0 512 580">
      <!-- White background -->
      <rect width="512" height="580" fill="white"/>

      <!-- QR Code pattern (decorative placeholder — replace with real QR lib in production) -->
      <rect x="40" y="40" width="160" height="160" fill="none" stroke="#000" stroke-width="12"/>
      <rect x="60" y="60" width="120" height="120" fill="#000"/>
      <rect x="80" y="80" width="80" height="80" fill="white"/>
      <rect x="100" y="100" width="40" height="40" fill="#000"/>

      <rect x="312" y="40" width="160" height="160" fill="none" stroke="#000" stroke-width="12"/>
      <rect x="332" y="60" width="120" height="120" fill="#000"/>
      <rect x="352" y="80" width="80" height="80" fill="white"/>
      <rect x="372" y="100" width="40" height="40" fill="#000"/>

      <rect x="40" y="312" width="160" height="160" fill="none" stroke="#000" stroke-width="12"/>
      <rect x="60" y="332" width="120" height="120" fill="#000"/>
      <rect x="80" y="352" width="80" height="80" fill="white"/>
      <rect x="100" y="372" width="40" height="40" fill="#000"/>

      <!-- Data modules (center fill) -->
      <g fill="#000">
        <rect x="216" y="56" width="16" height="16"/>
        <rect x="240" y="56" width="16" height="16"/>
        <rect x="216" y="80" width="16" height="16"/>
        <rect x="256" y="80" width="16" height="16"/>
        <rect x="216" y="104" width="32" height="16"/>
        <rect x="216" y="128" width="16" height="16"/>
        <rect x="240" y="128" width="16" height="16"/>
        <rect x="216" y="152" width="16" height="16"/>
        <rect x="240" y="152" width="16" height="16"/>
        <rect x="256" y="40" width="16" height="32"/>
        <rect x="280" y="56" width="16" height="48"/>
        <rect x="56" y="216" width="16" height="16"/>
        <rect x="80" y="216" width="16" height="16"/>
        <rect x="56" y="240" width="32" height="16"/>
        <rect x="104" y="240" width="16" height="16"/>
        <rect x="56" y="264" width="16" height="16"/>
        <rect x="80" y="264" width="16" height="16"/>
        <rect x="56" y="288" width="32" height="16"/>
        <rect x="120" y="216" width="16" height="32"/>
        <rect x="140" y="240" width="16" height="48"/>
        <rect x="216" y="216" width="48" height="16"/>
        <rect x="216" y="240" width="16" height="48"/>
        <rect x="248" y="240" width="16" height="32"/>
        <rect x="280" y="216" width="16" height="48"/>
        <rect x="308" y="216" width="16" height="16"/>
        <rect x="328" y="216" width="16" height="16"/>
        <rect x="348" y="216" width="16" height="16"/>
        <rect x="308" y="240" width="16" height="16"/>
        <rect x="348" y="240" width="16" height="16"/>
        <rect x="308" y="264" width="48" height="16"/>
        <rect x="308" y="288" width="16" height="16"/>
        <rect x="348" y="288" width="16" height="16"/>
        <rect x="308" y="312" width="32" height="16"/>
        <rect x="368" y="260" width="24" height="16"/>
        <rect x="400" y="216" width="16" height="96"/>
        <rect x="440" y="216" width="16" height="40"/>
        <rect x="440" y="272" width="16" height="40"/>
      </g>

      <!-- QR ID label -->
      <text x="256" y="310" text-anchor="middle" font-family="monospace" font-size="14" fill="#555">NET-QR-8829-X</text>

      <!-- ── GROWTH LOOP FOOTER ─────────────────────────────────────────────── -->
      <!-- Separator line -->
      <line x1="32" y1="495" x2="480" y2="495" stroke="#E2E8F0" stroke-width="1.5"/>

      <!-- Footer background pill -->
      <rect x="80" y="505" width="352" height="54" rx="10" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1"/>

      <!-- Lightning bolt icon -->
      <text x="104" y="537" font-family="Arial, sans-serif" font-size="16" fill="#0D9488">⚡</text>

      <!-- Footer text line 1 -->
      <text x="130" y="528" font-family="Arial, sans-serif" font-size="11" fill="#64748B">Sécurisé &amp; Propulsé par</text>

      <!-- Footer branding -->
      <text x="130" y="545" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#0D9488">Kompilot.com</text>

      <!-- Invisible clickable link (SVG href — works in browsers) -->
      <a href="${GROWTH_UTM_URL}" target="_blank">
        <rect x="80" y="505" width="352" height="54" rx="10" fill="transparent"/>
      </a>
    </svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qr-code-NET-QR-8829-X.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Page>
      <PageHeader>
        <PageTitle>Smart QR Code</PageTitle>
      </PageHeader>

      <PageBody>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel - Visual QR */}
          <div className="lg:col-span-5">
            <Card className="h-full">
              <div className="p-8 flex flex-col items-center justify-center text-center gap-6 h-full">
                <div className="relative group">
                  <div className="w-64 h-64 border-4 border-dashed border-muted-foreground/30 rounded-3xl flex flex-col items-center justify-center gap-4 bg-muted/30 group-hover:bg-muted/50 transition-colors">
                    <QrCode size={80} className="text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">QR Code Dynamique</span>
                  </div>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute -top-3 -right-3"
                  >
                    <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none px-4 py-1.5 shadow-lg">
                      Filtrage Actif
                    </Badge>
                  </motion.div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold">L'Établissement Gourmand</h3>
                  <p className="text-sm text-muted-foreground">ID Unique: NET-QR-8829-X</p>
                </div>

                <Button
                  className="w-full max-w-xs gap-2 py-6 bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleDownloadQR}
                >
                  <Download size={18} />
                  Télécharger le QR Code
                </Button>
                
                <p className="text-xs text-muted-foreground italic">
                  Format haute définition (PNG, SVG, PDF) prêt pour l'impression
                </p>
              </div>
            </Card>
          </div>

          {/* Right Panel - Config */}
          <div className="lg:col-span-7 space-y-6">
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 rounded-full bg-blue-500/10 text-blue-500">
                    <ShieldCheck size={20} />
                  </div>
                  <h2 className="text-xl font-semibold">Logique de Routage Intelligent</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold">4+</div>
                      <span className="font-medium">Si note ≥ 4 étoiles</span>
                    </div>
                    <ArrowRight className="text-muted-foreground" size={16} />
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1">
                      <MapPin size={12} /> Google Maps (Avis Public)
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center text-white font-bold">3-</div>
                      <span className="font-medium">Si note ≤ 3 étoiles</span>
                    </div>
                    <ArrowRight className="text-muted-foreground" size={16} />
                    <Badge className="bg-red-500/10 text-red-500 border-red-500/20 gap-1">
                      <MessageSquare size={12} /> Message Privé (Cockpit)
                    </Badge>
                  </div>
                </div>

                <Separator className="my-8" />

                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-3 block">Aperçu interactif (Testez le filtre)</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          onClick={() => setRating(star)}
                          className="transition-all transform hover:scale-110"
                        >
                          <Star
                            size={32}
                            className={`${
                              star <= (hoveredRating || rating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-muted-foreground/30'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      {rating === 0 ? "Cliquez sur une étoile pour simuler l'avis d'un client" : 
                       rating >= 4 ? "✅ Le client sera redirigé vers Google Maps" : 
                       "🔒 Le client restera sur votre formulaire privé"}
                    </p>
                  </div>

                  <div className={`transition-all duration-300 ${rating > 0 && rating <= 3 ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
                    <label className="text-sm font-medium mb-2 block">Message privé personnalisé</label>
                    <Textarea 
                      placeholder="Comment pouvons-nous nous améliorer ?" 
                      className="resize-none"
                      value={privateMessage}
                      onChange={e => setPrivateMessage(e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Bottom Stats Strip */}
        <Card className="mt-6 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-border">
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-1 font-medium">Scans ce mois</p>
              <p className="text-3xl font-bold text-blue-500">47</p>
            </div>
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-1 font-medium">Avis 5★ collectés</p>
              <p className="text-3xl font-bold text-emerald-500">38</p>
            </div>
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-1 font-medium">Avis négatifs interceptés</p>
              <p className="text-3xl font-bold text-red-500">9</p>
            </div>
          </div>
        </Card>
      </PageBody>
    </Page>
  );
}