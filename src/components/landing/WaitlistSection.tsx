/**
 * WaitlistSection — Premium dark-mode waitlist capture for Kompilot early access.
 *
 * Integrates the native Brevo (ex-Sendinblue) SibForms HTML form directly
 * with custom dark-mode styling overrides to match the violet/cyan premium theme.
 */

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Shield, Zap, Lock } from 'lucide-react';

// Brevo dark-mode CSS overrides
const BREVO_DARK_CSS =
  '@font-face{font-display:block;font-family:Roboto;src:url(https://assets.brevo.com/font/Roboto/Latin/normal/normal/7529907e9eaf8ebb5220c5f9850e3811.woff2) format("woff2"),url(https://assets.brevo.com/font/Roboto/Latin/normal/normal/25c678feafdc175a70922a116c9be3e7.woff) format("woff")}' +
  '@font-face{font-display:fallback;font-family:Roboto;font-weight:600;src:url(https://assets.brevo.com/font/Roboto/Latin/medium/normal/6e9caeeafb1f3491be3e32744bc30440.woff2) format("woff2"),url(https://assets.brevo.com/font/Roboto/Latin/medium/normal/71501f0d8d5aa95960f6475d5487d4c2.woff) format("woff")}' +
  '@font-face{font-display:fallback;font-family:Roboto;font-weight:700;src:url(https://assets.brevo.com/font/Roboto/Latin/bold/normal/3ef7cf158f310cf752d5ad08cd0e7e60.woff2) format("woff2"),url(https://assets.brevo.com/font/Roboto/Latin/bold/normal/ece3a1d82f18b60bcce0211725c476aa.woff) format("woff")}' +
  '#sib-container{background:transparent!important;border:none!important;border-radius:0!important;max-width:100%!important}' +
  '#sib-container .sib-form-block p{color:#E2E8F0!important;font-family:Inter,Roboto,Helvetica,sans-serif!important}' +
  '#sib-container .sib-form-block[style*="font-size:32px"] p{font-size:0!important}' +
  '#sib-container .sib-text-form-block p{color:#94A3B8!important;font-size:.92rem!important;line-height:1.6!important}' +
  '#sib-container label.entry__label{color:#CBD5E1!important;font-family:Inter,Roboto,Helvetica,sans-serif!important;font-size:.85rem!important;font-weight:600!important;margin-bottom:6px!important}' +
  '#sib-container input[type="text"]{background:rgba(255,255,255,.04)!important;border:1px solid rgba(255,255,255,.1)!important;border-radius:12px!important;color:#F1F5F9!important;font-family:Inter,Roboto,Helvetica,sans-serif!important;font-size:.95rem!important;padding:14px 16px!important;width:100%!important;transition:border-color .2s,box-shadow .2s!important}' +
  '#sib-container input[type="text"]:focus{border-color:rgba(139,92,246,.5)!important;box-shadow:0 0 0 3px rgba(139,92,246,.12)!important;outline:none!important}' +
  '#sib-container input::placeholder{color:#475569!important;font-family:Inter,Roboto,Helvetica,sans-serif!important}' +
  '#sib-container .entry__specification{color:#475569!important;font-size:.72rem!important}' +
  '#sib-container .entry__error{background:rgba(239,68,68,.1)!important;border-color:rgba(239,68,68,.3)!important;color:#FCA5A5!important;border-radius:8px!important;font-size:.78rem!important}' +
  '#sib-container .sib-form__declaration p{color:#475569!important;font-size:.7rem!important;line-height:1.5!important}' +
  '#sib-container .sib-form__declaration a{color:#A78BFA!important;text-decoration:underline!important}' +
  '#sib-container .declaration-block-icon .svgIcon-sphere{width:40px!important;height:40px!important;opacity:.3!important}' +
  '#sib-container button[type="submit"]{background:linear-gradient(135deg,#7C3AED 0%,#8B5CF6 50%,#6D28D9 100%)!important;color:#fff!important;font-family:Inter,Roboto,Helvetica,sans-serif!important;font-size:.95rem!important;font-weight:700!important;border:none!important;border-radius:12px!important;padding:14px 28px!important;cursor:pointer!important;transition:transform .15s,box-shadow .15s!important;box-shadow:0 8px 24px -4px rgba(124,58,237,.45),0 0 0 1px rgba(139,92,246,.2)!important;width:100%!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:8px!important}' +
  '#sib-container button[type="submit"]:hover{transform:translateY(-1px) scale(1.02)!important;box-shadow:0 12px 32px -4px rgba(124,58,237,.55),0 0 0 1px rgba(139,92,246,.3)!important}' +
  '#sib-container button[type="submit"]:active{transform:scale(.98)!important}' +
  '#sib-container .sib-hide-loader-icon path{fill:#A78BFA!important}' +
  '.sib-form{background:transparent!important}';

// Pulse animation for accent line
const PULSE_CSS = '@keyframes subtlePulse{0%,100%{opacity:.5}50%{opacity:1}}';

// Brevo form action URL — split to avoid bundler '==' parse issue
const SIB_ACTION_PARTS = [
  'https://17e4d553.sibforms.com/serve/MUIFAPnschAm9wq9A6_TkgRIXSCSVsDVBFLKI4a2JUqsyFDZZQOoc97C',
  'axvRtx2jmsBdZBJTrKWclHGqJriSGCV3VYmfMIKj9z_VeowoAJ94ynZVTpgf',
  '-KADh3bfsk1ZsCW2bAinoxWXe-E3QKns83n3wjToJH8ZT0aQadYVNT15bH8',
  '52Adyc7QijYpFgQpinZqS89pE5K3s_TzOJw',
  '',
];
const SIB_ACTION_URL = SIB_ACTION_PARTS.join('');

function TrustBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: '.7rem', fontWeight: 500, letterSpacing: '.02em' }}>
      {icon}
      {label}
    </span>
  );
}

export function WaitlistSection() {
  useEffect(() => {
    const linkId = 'brevo-sib-styles';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = 'https://sibforms.com/forms/end-form/build/sib-styles.css';
      document.head.appendChild(link);
    }
  }, []);

  return (
    <section style={{ position: 'relative', overflow: 'hidden', padding: 'clamp(56px,10vw,100px) 16px', background: '#06080F' }}>
      <style>{PULSE_CSS}</style>
      <style>{BREVO_DARK_CSS}</style>

      {/* Violet radial glow */}
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '60%', height: '60%', borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,92,246,.12) 0%,transparent 65%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      {/* Cyan radial glow */}
      <div style={{ position: 'absolute', bottom: '-15%', right: '-5%', width: '50%', height: '50%', borderRadius: '50%', background: 'radial-gradient(circle,rgba(34,211,238,.08) 0%,transparent 65%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      {/* Grid pattern */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none', maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%,black 30%,transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%,black 30%,transparent 100%)' }} />

      <div style={{ position: 'relative', maxWidth: 580, margin: '0 auto', textAlign: 'center' }}>

        {/* Badge pill */}
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(139,92,246,.1)', border: '1px solid rgba(139,92,246,.25)', borderRadius: 9999, padding: '7px 18px', marginBottom: 24 }}>
            <Sparkles size={13} style={{ color: '#A78BFA' }} />
            <span style={{ color: '#A78BFA', fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>
              Accès anticipé exclusif
            </span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.55, delay: 0.06, ease: [0.22, 1, 0.36, 1] as const }} style={{ fontSize: 'clamp(1.6rem,4.5vw,2.8rem)', fontWeight: 900, color: '#F1F5F9', lineHeight: 1.15, margin: '0 0 14px', letterSpacing: '-.035em' }}>
          Rejoignez la liste d&#39;attente{' '}
          <span style={{ background: 'linear-gradient(135deg,#A78BFA 0%,#7C3AED 40%,#22D3EE 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>exclusive</span>
        </motion.h2>

        {/* Subtitle */}
        <motion.p initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] as const }} style={{ color: '#64748B', fontSize: 'clamp(.88rem,2vw,1.05rem)', lineHeight: 1.7, margin: '0 auto 36px', maxWidth: 440 }}>
          Lancement officiel le <strong style={{ color: '#A78BFA' }}>7 septembre 2026</strong>. Soyez parmi les premiers à exploiter la puissance de l&#39;IA locale.
        </motion.p>

        {/* ── Brevo Form Container ──────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.6, delay: 0.18, ease: [0.22, 1, 0.36, 1] as const }}>
          <div style={{ position: 'relative', background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 20, padding: 'clamp(28px,5vw,44px) clamp(24px,4vw,40px)', backdropFilter: 'blur(16px)', boxShadow: '0 0 0 1px rgba(139,92,246,.06),0 32px 80px -16px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.04)' }}>
            {/* Animated gradient accent line */}
            <div style={{ position: 'absolute', top: -1, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg,transparent,#A78BFA,#22D3EE,transparent)', borderRadius: 9999, opacity: 0.5, animation: 'subtlePulse 4s ease-in-out infinite' }} />

            {/* Begin Brevo Form */}
            <div className="sib-form" style={{ textAlign: 'center', backgroundColor: 'transparent' }}>
              <div id="sib-form-container" className="sib-form-container">
                <div id="sib-container" className="sib-container--large sib-container--vertical" style={{ maxWidth: 540, textAlign: 'center', backgroundColor: 'transparent', borderWidth: 0 }}>

                  <form id="sib-form" method="POST" action={SIB_ACTION_URL}>
                    {/* Sub-description */}
                    <div style={{ padding: '8px 0' }}>
                      <div className="sib-form-block" style={{ fontFamily: 'Inter,Roboto,Helvetica,sans-serif', fontSize: 14, color: '#94A3B8', backgroundColor: 'transparent', textAlign: 'left' }}>
                        <div className="sib-text-form-block">
                          <p>Inscrivez-vous sur la liste d&#39;attente exclusive pour automatiser vos tâches et accéder au lancement officiel le 7 septembre.</p>
                        </div>
                      </div>
                    </div>

                    {/* Email input */}
                    <div style={{ padding: '8px 0' }}>
                      <div className="sib-input sib-form-block">
                        <div className="form__entry entry_block">
                          <div className="form__label-row">
                            <label className="entry__label" style={{ fontWeight: 700, textAlign: 'left', fontFamily: 'Inter,Roboto,Helvetica,sans-serif', fontSize: 14, color: '#CBD5E1' }} htmlFor="EMAIL" data-required="*">
                              Votre adresse email
                            </label>
                            <div className="entry__field">
                              <input className="input" type="text" id="EMAIL" name="EMAIL" autoComplete="off" defaultValue="" placeholder="votre@email.com" data-required="true" required />
                            </div>
                          </div>
                          <label className="entry__error entry__error--primary" style={{ fontFamily: 'Inter,Roboto,Helvetica,sans-serif', fontSize: 13, color: '#FCA5A5', backgroundColor: 'rgba(239,68,68,.1)', borderColor: 'rgba(239,68,68,.3)', borderRadius: 8 }} />
                          <label className="entry__specification" style={{ fontFamily: 'Inter,Roboto,Helvetica,sans-serif', fontSize: 11, color: '#475569', textAlign: 'left' }}>
                            Ex. : abc@xyz.com
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* RGPD declaration */}
                    <div style={{ padding: '8px 0' }}>
                      <div className="sib-form__declaration" style={{ direction: 'ltr' }}>
                        <div className="declaration-block-icon">
                          <svg className="icon__SVG" width="0" height="0" version="1.1" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                              <symbol id="svgIcon-sphere" viewBox="0 0 63 63">
                                <path className="path1" d="M31.54 0l1.05 3.06 3.385-.01-2.735 1.897 1.05 3.042-2.748-1.886-2.738 1.886 1.044-3.05-2.745-1.897h3.393zm13.97 3.019L46.555 6.4l3.384.01-2.743 2.101 1.048 3.387-2.752-2.1-2.752 2.1 1.054-3.382-2.745-2.105h3.385zm9.998 10.056l1.039 3.382h3.38l-2.751 2.1 1.05 3.382-2.744-2.091-2.743 2.091 1.054-3.381-2.754-2.1h3.385zM58.58 27.1l1.04 3.372h3.379l-2.752 2.096 1.05 3.387-2.744-2.091-2.75 2.092 1.054-3.387-2.747-2.097h3.376zm-3.076 14.02l1.044 3.364h3.385l-2.743 2.09 1.05 3.392-2.744-2.097-2.743 2.097 1.052-3.377-2.752-2.117 3.385-.01zm-9.985 9.91l1.045 3.364h3.393l-2.752 2.09 1.05 3.393-2.745-2.097-2.743 2.097 1.05-3.383-2.751-2.1 3.384-.01zM31.45 55.01l1.044 3.043 3.393-.008-2.752 1.9L34.19 63l-2.744-1.895-2.748 1.891 1.054-3.05-2.743-1.9h3.384zm-13.934-3.98l1.036 3.364h3.402l-2.752 2.09 1.053 3.393-2.747-2.097-2.752 2.097 1.053-3.382-2.743-2.1 3.384-.01zm-9.981-9.91l1.045 3.364h3.398l-2.748 2.09 1.05 3.392-2.753-2.1-2.752 2.096 1.053-3.382-2.743-2.102 3.384-.009zM4.466 27.1l1.038 3.372H8.88l-2.752 2.097 1.053 3.387-2.743-2.09-2.748 2.09 1.053-3.387L0 30.472h3.385zm3.069-14.025l1.045 3.382h3.395L9.23 18.56l1.05 3.381-2.752-2.09-2.752 2.09 1.053-3.381-2.744-2.1h3.384zm9.99-10.056L18.57 6.4l3.393.01-2.743 2.1 1.05 3.373-2.754-2.092-2.751 2.092 1.053-3.382-2.744-2.1h3.384zm24.938 19.394l-10-4.22a2.48 2.48 0 00-1.921 0l-10 4.22A2.529 2.529 0 0019 24.75c0 10.47 5.964 17.705 11.537 20.057a2.48 2.48 0 001.921 0C36.921 42.924 44 36.421 44 24.75a2.532 2.532 0 00-1.537-2.336zm-2.46 6.023l-9.583 9.705a.83.83 0 01-1.177 0l-5.416-5.485a.855.855 0 010-1.192l1.177-1.192a.83.83 0 011.177 0l3.65 3.697 7.819-7.916a.83.83 0 011.177 0l1.177 1.191a.843.843 0 010 1.192z" fill="#0092FF" />
                              </symbol>
                            </defs>
                          </svg>
                          <svg className="svgIcon-sphere" style={{ width: 40, height: 40, opacity: 0.3 }}>
                            <use xlinkHref="#svgIcon-sphere" />
                          </svg>
                        </div>
                        <div style={{ fontFamily: 'Inter,Roboto,Helvetica,sans-serif', fontSize: 12, color: '#475569', backgroundColor: 'transparent' }}>
                          <p>Nous utilisons Brevo en tant que plateforme marketing. En soumettant ce formulaire, vous acceptez que les données personnelles soient transférées à Brevo conformément <a target="_blank" href="https://www.brevo.com/fr/legal/privacypolicy/" rel="nofollow noopener" style={{ color: '#A78BFA' }}>à la politique de confidentialité de Brevo.</a></p>
                        </div>
                      </div>
                    </div>

                    {/* Submit button */}
                    <div style={{ padding: '8px 0' }}>
                      <div className="sib-form-block" style={{ textAlign: 'center' }}>
                        <button className="sib-form-block__button sib-form-block__button-with-loader" style={{ fontFamily: 'Inter,Roboto,Helvetica,sans-serif', fontSize: 15, fontWeight: 700, textAlign: 'center', color: '#FFFFFF', backgroundColor: '#7C3AED', borderWidth: 0, borderRadius: 12 }} form="sib-form" type="submit">
                          <svg className="icon clickable__icon progress-indicator__icon sib-hide-loader-icon" viewBox="0 0 512 512">
                            <path d="M460.116 373.846l-20.823-12.022c-5.541-3.199-7.54-10.159-4.663-15.874 30.137-59.886 28.343-131.652-5.386-189.946-33.641-58.394-94.896-95.833-161.827-99.676C261.028 55.961 256 50.751 256 44.352V20.309c0-6.904 5.808-12.337 12.703-11.982 83.556 4.306 160.163 50.864 202.11 123.677 42.063 72.696 44.079 162.316 6.031 236.832-3.14 6.148-10.75 8.461-16.728 5.01z" />
                          </svg>
                          Rejoindre la waitlist
                        </button>
                      </div>
                    </div>

                    {/* Hidden fields */}
                    <input type="text" name="email_address_check" defaultValue="" className="input--hidden" style={{ display: 'none' }} />
                    <input type="hidden" name="locale" value="fr" />
                    <input type="hidden" name="html_type" value="simple" />
                  </form>

                </div>
              </div>
            </div>
            {/* End Brevo Form */}

          </div>
        </motion.div>

        {/* Trust micro-copy */}
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.5, delay: 0.25 }} style={{ fontSize: '.75rem', color: '#475569', margin: '16px 0 0', letterSpacing: '.01em' }}>
          <Lock size={11} style={{ display: 'inline', verticalAlign: -1, marginRight: 4 }} />
          Pas de spam. Accès prioritaire garanti. Désabonnement en 1 clic.
        </motion.p>

        {/* Trust badges */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.5, delay: 0.3 }} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px 24px', marginTop: 20 }}>
          <TrustBadge icon={<Shield size={12} style={{ color: '#475569' }} />} label="Hébergé en France · RGPD conforme" />
          <TrustBadge icon={<Zap size={12} style={{ color: '#475569' }} />} label="Accès prioritaire garanti" />
          <TrustBadge icon={<Lock size={12} style={{ color: '#475569' }} />} label="Désabonnement en 1 clic" />
        </motion.div>
      </div>
    </section>
  );
}
