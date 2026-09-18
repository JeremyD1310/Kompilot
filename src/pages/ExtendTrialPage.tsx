import { BACKEND_URL as KOMPILOT_BACKEND_URL } from '@/lib/backend';
/**
 * ExtendTrialPage — /extend-trial?token=xxx
 *
 * Landing page for the magic link trial extension.
 * - Validates the token
 * - Shows success/error state
 * - Redirects to dashboard on success
 */
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, ArrowRight, Clock, Shield } from 'lucide-react';
import { KompilotLogo } from '../components/brand/KompilotLogo';

type Status = 'loading' | 'valid' | 'invalid' | 'extending' | 'extended' | 'error';

const BACKEND_URL = KOMPILOT_BACKEND_URL;

export default function ExtendTrialPage() {
  const [status, setStatus] = useState<Status>('loading');
  const [email, setEmail] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [errorDetail, setErrorDetail] = useState('');
  const navigate = useNavigate();

  const token = new URLSearchParams(window.location.search).get('token');

  // Check token on mount
  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      setErrorDetail('Aucun token trouvé dans l\'URL.');
      return;
    }

    const checkToken = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/trial/extension/check/${token}`);
        const data = await res.json() as { valid?: boolean; email?: string; reason?: string };
        if (data.valid) {
          setEmail(data.email ?? '');
          setStatus('valid');
        } else {
          setStatus('invalid');
          if (data.reason === 'expired') {
            setErrorDetail('Ce lien a expiré. Demandez un nouveau lien depuis votre tableau de bord.');
          } else {
            setErrorDetail('Ce lien n\'est pas valide ou a déjà été utilisé.');
          }
        }
      } catch {
        setStatus('error');
        setErrorDetail('Impossible de vérifier le lien. Veuillez réessayer.');
      }
    };

    checkToken();
  }, [token]);

  const handleExtend = useCallback(async () => {
    if (!token) return;
    setStatus('extending');

    try {
      const res = await fetch(`${BACKEND_URL}/api/trial/extension/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json() as { success?: boolean; newEndDate?: string; error?: string; code?: string };

      if (data.success && data.newEndDate) {
        setNewEndDate(data.newEndDate);
        setStatus('extended');
        // Auto-redirect to dashboard after 5s
        setTimeout(() => navigate({ to: '/dashboard' }), 5000);
      } else {
        setStatus('error');
        if (data.code === 'ALREADY_EXTENDED') {
          setErrorDetail('Vous avez déjà bénéficié d\'une prolongation d\'essai.');
        } else if (data.code === 'token_expired') {
          setErrorDetail('Ce lien a expiré.');
        } else {
          setErrorDetail(data.error || 'Une erreur est survenue.');
        }
      }
    } catch {
      setStatus('error');
      setErrorDetail('Erreur de connexion. Veuillez réessayer.');
    }
  }, [token, navigate]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{
        background: 'linear-gradient(160deg, #050c18, #0a1628, #0d1e30)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Logo */}
      <div className="mb-8">
        <Link to="/" className="flex items-center gap-3">
          <KompilotLogo variant="icon" height={32} />
          <span className="text-lg font-bold" style={{ color: '#F1F5F9' }}>Kompilot</span>
        </Link>
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        {/* Loading */}
        {status === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl p-8 text-center max-w-md w-full"
            style={{
              background: 'rgba(15,23,42,.85)',
              border: '1px solid rgba(255,255,255,.08)',
              boxShadow: '0 24px 60px rgba(0,0,0,.4)',
            }}
          >
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" style={{ color: '#5EEAD4' }} />
            <p className="text-sm" style={{ color: '#94A3B8' }}>Vérification de votre lien...</p>
          </motion.div>
        )}

        {/* Valid — ready to extend */}
        {status === 'valid' && (
          <motion.div
            key="valid"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="rounded-2xl p-8 text-center max-w-md w-full"
            style={{
              background: 'rgba(15,23,42,.85)',
              border: '1px solid rgba(13,148,136,.3)',
              boxShadow: '0 0 60px rgba(13,148,136,.08), 0 24px 60px rgba(0,0,0,.4)',
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'rgba(13,148,136,.15)', border: '1px solid rgba(13,148,136,.3)' }}
            >
              <Clock className="w-8 h-8" style={{ color: '#5EEAD4' }} />
            </div>

            <h1 className="text-xl font-extrabold mb-2" style={{ color: '#F1F5F9' }}>
              Prolongez votre essai
            </h1>
            <p className="text-sm mb-6" style={{ color: '#94A3B8' }}>
              {email && <span className="block mb-1" style={{ color: '#E2E8F0' }}>{email}</span>}
              Cliquez ci-dessous pour ajouter 14 jours supplémentaires à votre essai gratuit.
            </p>

            <div className="space-y-3 mb-6">
              {[
                { icon: CheckCircle, text: '14 jours d\'accès complet supplémentaires' },
                { icon: Shield, text: 'Sans carte bancaire, sans engagement' },
                { icon: ArrowRight, text: 'Toutes les fonctionnalités conservées' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-left">
                  <Icon className="w-4 h-4 flex-shrink-0" style={{ color: '#5EEAD4' }} />
                  <span className="text-xs" style={{ color: '#CBD5E1' }}>{text}</span>
                </div>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExtend}
              className="w-full py-3.5 rounded-xl text-sm font-bold cursor-pointer transition-all"
              style={{
                background: 'linear-gradient(135deg, #0D9488, #0F766E)',
                color: '#fff',
                border: 'none',
                boxShadow: '0 0 24px rgba(13,148,136,.35)',
              }}
            >
              Prolonger mon essai de 14 jours →
            </motion.button>
          </motion.div>
        )}

        {/* Extending (loading) */}
        {status === 'extending' && (
          <motion.div
            key="extending"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl p-8 text-center max-w-md w-full"
            style={{
              background: 'rgba(15,23,42,.85)',
              border: '1px solid rgba(13,148,136,.4)',
              boxShadow: '0 0 60px rgba(13,148,136,.1)',
            }}
          >
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" style={{ color: '#0D9488' }} />
            <p className="text-sm font-semibold" style={{ color: '#E2E8F0' }}>Activation de votre prolongation...</p>
          </motion.div>
        )}

        {/* Extended — success */}
        {status === 'extended' && (
          <motion.div
            key="extended"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-8 text-center max-w-md w-full"
            style={{
              background: 'rgba(15,23,42,.85)',
              border: '1px solid rgba(13,148,136,.5)',
              boxShadow: '0 0 80px rgba(13,148,136,.12), 0 24px 60px rgba(0,0,0,.4)',
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'rgba(13,148,136,.2)', border: '2px solid #0D9488' }}
            >
              <CheckCircle className="w-8 h-8" style={{ color: '#5EEAD4' }} />
            </motion.div>

            <h1 className="text-xl font-extrabold mb-2" style={{ color: '#5EEAD4' }}>
              Essai prolongé !
            </h1>
            <p className="text-sm mb-4" style={{ color: '#94A3B8' }}>
              Votre accès complet est maintenant étendu jusqu'au
            </p>
            <p className="text-lg font-bold mb-6" style={{ color: '#F1F5F9' }}>
              {newEndDate ? new Date(newEndDate).toLocaleDateString('fr-FR', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              }) : '—'}
            </p>

            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all"
              style={{
                background: 'linear-gradient(135deg, #0D9488, #0F766E)',
                color: '#fff',
                textDecoration: 'none',
                boxShadow: '0 0 20px rgba(13,148,136,.3)',
              }}
            >
              Accéder à mon cockpit
              <ArrowRight className="w-4 h-4" />
            </Link>

            <p className="text-[11px] mt-4" style={{ color: '#475569' }}>
              Redirection automatique dans 5 secondes...
            </p>
          </motion.div>
        )}

        {/* Invalid / Error */}
        {(status === 'invalid' || status === 'error') && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-8 text-center max-w-md w-full"
            style={{
              background: 'rgba(15,23,42,.85)',
              border: '1px solid rgba(239,68,68,.2)',
              boxShadow: '0 24px 60px rgba(0,0,0,.4)',
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)' }}
            >
              <XCircle className="w-8 h-8" style={{ color: '#F87171' }} />
            </div>

            <h1 className="text-xl font-extrabold mb-2" style={{ color: '#F1F5F9' }}>
              Lien invalide
            </h1>
            <p className="text-sm mb-6" style={{ color: '#94A3B8' }}>
              {errorDetail}
            </p>

            <div className="flex flex-col gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: 'rgba(255,255,255,.06)',
                  color: '#CBD5E1',
                  textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,.1)',
                }}
              >
                Aller au tableau de bord
              </Link>
              <a
                href="mailto:support@kompilot.fr"
                className="text-xs hover:underline"
                style={{ color: '#64748B' }}
              >
                Besoin d'aide ? support@kompilot.fr
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <p className="mt-8 text-[11px]" style={{ color: '#334155' }}>
        <Link to="/legal" className="hover:underline" style={{ color: '#475569' }}>Mentions légales</Link>
        {' · '}
        <Link to="/privacy" className="hover:underline" style={{ color: '#475569' }}>Confidentialité</Link>
      </p>
    </div>
  );
}
