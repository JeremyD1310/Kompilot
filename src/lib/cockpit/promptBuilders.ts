import { detectPlatformFromUrl, getSmartCTA } from '../bookingPlatforms';

export function buildSinglePrompt(
  name: string, city: string, activity: string,
  type: string, tone: string, idea: string,
  bookingUrl?: string, includeBooking?: boolean,
  format?: string,
  isCarousel?: boolean,
  captionTone?: string,
  discount?: string,
): string {
  const typeMap: Record<string, string> = {
    promotion: 'Promotion commerciale avec offre ou réduction',
    coulisses: 'Coulisses / Savoir-faire artisanal / Dans les coulisses du métier',
    evenement: 'Actualité ou événement spécial',
  };
  const toneMap: Record<string, string> = {
    professionnel: 'Professionnel et sobre, crédible',
    amical: 'Amical et chaleureux, proche des gens',
    vendeur: 'Vendeur et persuasif, orienté conversion',
    humoristique: 'Léger, avec une touche d\'humour bienveillant',
    // caption tones
    chaleureux: 'Chaleureux, bienveillant, proche des gens',
    direct: 'Direct, percutant, orienté promo et conversion',
    pro: 'Professionnel, sobre et crédible',
    fun: 'Fun, décalé, avec humour bienveillant',
  };
  const citySlug = city.replace(/\s+/g, '');
  const actSlug = activity.replace(/\s+/g, '');
  const detectedPlatform = bookingUrl ? detectPlatformFromUrl(bookingUrl) : null;
  const platformCTAHint = detectedPlatform && bookingUrl
    ? `\n\nCTA RÉSERVATION INTELLIGENT : Intègre en fin de post un CTA personnalisé. Inspire-toi de cette formule adaptée à la plateforme : "${getSmartCTA(detectedPlatform, name)}". Adapte légèrement le texte pour qu'il colle au sujet du post. Inclure le lien "${bookingUrl}" dans le CTA.`
    : includeBooking && bookingUrl
    ? `\n\nCTA RÉSERVATION : Intègre naturellement le lien de réservation "${bookingUrl}" dans l'appel à l'action. Formule exemple : "Réservez en ligne 👉 [lien]" ou "Prenez rendez-vous : [lien]"`
    : '';
  const ctaBooking = platformCTAHint;

  const finalTone = toneMap[captionTone ?? tone] ?? toneMap[tone] ?? tone;

  const formatInstructions = format === 'reel'
    ? `\nFORMAT : Reel/Vidéo Court — génère : 1) Accroche du Reel (≤8 mots), 2) Description courte (2 phrases), 3) Script Vidéo rapide (ex: "Idée de plan : filmez votre salon pendant 5 secondes..."), 4) Hashtags`
    : format === 'story'
    ? `\nFORMAT : Story Éphémère — texte ULTRA-court (≤15 mots), percutant, conçu pour être lu en 3 secondes, avec une incitation forte à cliquer sur le lien de réservation. Pas de hashtags dans le corps.${isCarousel ? ' Crée 3 slides story consécutives séparées par "---SLIDE---".' : ''}`
    : isCarousel
    ? `\nFORMAT : Carrousel — intègre des mentions comme "Faites défiler pour voir la suite ➡️" ou "Découvrez le résultat en images 👇" dans l'accroche ou le CTA.`
    : '';

  const discountInstruction = discount
    ? `\nOFFRE FLASH : Intègre en fin de légende un CTA ultra-vendeur avec une remise de ${discount}. Génère un code promo court et mémorable (ex: "FLASH10"). Format : "🔥 -${discount} avec le code [CODE] — offre valable aujourd'hui seulement !"`
    : '';

  return `Tu es le Directeur Commercial et expert en communication digitale de Kompilot pour les commerces locaux français. Tu parles comme un associé qui connaît le métier, pas comme un outil d'automatisation.

COMMERCE : ${name} — ${activity} à ${city}

CHARTE ÉDITORIALE KOMPILOT — À RESPECTER IMPÉRATIVEMENT :
❌ INTERDIT ABSOLU :
- Phrases d'introduction creuses : "En tant qu'IA...", "Il est important de noter...", "Je vous conseille de..."
- Jargon technique : "Tokens", "LLM", "Prompt", "API", "algorithme"
- Formules génériques : "Plongez dans notre univers", "Découvrez notre savoir-faire exceptionnel", "N'hésitez pas à", "N'oubliez pas"
- Tutoiement des clients finaux (sauf profil Agence explicitement configuré)
- Expressions Casino/Spam : "OFFRE EXCEPTIONNELLE !!!", majuscules abusives

✅ OBLIGATOIRE — TON PREMIUM KOMPILOT :
- Style Directeur Commercial : concis, percutant, factuel. Chaque mot compte.
- Vocabulaire métier élégant : "Intelligence locale" > "IA", "Moteur de croissance" > "automatisation", "Ressources IA" > "tokens"
- Valoriser l'expertise du commerçant : "Valorisation de votre dernier savoir-faire" > "Voici un post simple"
- Ancrage local fort à ${city} — géographie concrète, noms de quartiers, réalités locales
- Posture de Protecteur : sécuriser la trésorerie, aller chercher le chiffre d'affaires

STRUCTURE DU POST :
1. Accroche ≤ 10 mots — percutante, locale, concrète
2. Corps — 2 à 4 phrases aérées ou courtes puces, sincère
3. Call-to-action — inclure le nom de ${name}${ctaBooking}
4. 3 à 5 emojis bien placés
5. Hashtags sur une ligne : #${citySlug} et #${actSlug} obligatoires + 2-3 autres${formatInstructions}${discountInstruction}

TYPE : ${typeMap[type] ?? type}
TON : ${finalTone}
${idea.trim() ? `IDÉE DU COMMERÇANT : "${idea.trim()}"` : `Génère un post "coulisses" valorisant ${name} à ${city}.`}

GÉNÈRE UNIQUEMENT le post final en français, sans introduction ni commentaire.`;
}

export function buildMultiNetworkPrompt(
  name: string, city: string, activity: string,
  type: string, tone: string, idea: string,
  channels: string[], bookingUrl?: string, includeBooking?: boolean,
): string {
  const base = buildSinglePrompt(name, city, activity, type, tone, idea, bookingUrl, includeBooking);
  const ctaBooking = includeBooking && bookingUrl ? `\nInclure le lien de réservation "${bookingUrl}" dans le CTA.` : '';
  const detectedPlatformMulti = bookingUrl ? detectPlatformFromUrl(bookingUrl) : null;
  const bioCTAHint = detectedPlatformMulti ? ` Bio CTA suggéré : "${detectedPlatformMulti.bioCtaTemplate}"` : '';

  const platformSpecs: Record<string, string> = {
    instagram: `Post Instagram : court, très aéré (saut de ligne entre chaque idée), 5 hashtags en dernière ligne groupés, 3-5 emojis visuels${ctaBooking}${bioCTAHint}`,
    facebook: `Post Facebook : légèrement plus développé qu'Instagram, plus chaleureux et narratif, 2-3 hashtags seulement, ton communautaire${ctaBooking}`,
    google: `Post Google Business Profile : 2-3 phrases maximum, 280 caractères MAX, AUCUN hashtag, AUCUN numéro de téléphone dans le texte (interdit par Google), AUCUNE URL brute dans le corps du texte — redirige EXCLUSIVEMENT vers le bouton d'action officiel (CTA). CTA concret avec le nom "${name}"${ctaBooking ? ` et le lien de réservation officiel` : ''}. Règle anti-rejet Google : si le commerçant mentionne un téléphone ou une URL, les supprimer du corps et les mettre uniquement dans le CTA.`,
    linkedin: `Post LinkedIn : ton professionnel et inspirant, sans hashtag inutile, focus sur le savoir-faire et la valeur, 1 seul CTA clair${ctaBooking}`,
  };

  const sections = channels.map(ch => {
    const spec = platformSpecs[ch] ?? '';
    const tag = ch.toUpperCase();
    return `\n===${tag}===\n[${spec}]`;
  }).join('\n');

  return `${base}

OPTIMISATION MULTI-RÉSEAUX :
Génère maintenant UNE VERSION ADAPTÉE pour chaque réseau ci-dessous.
Respecte IMPÉRATIVEMENT les codes de chaque plateforme.
Utilise exactement ces délimiteurs :
${sections}

GÉNÈRE UNIQUEMENT les sections délimitées, sans texte avant ni après.`;
}

// ── Business profile: CTA + audience intelligence per sector ─────────────────

interface BusinessProfile {
  /** Primary audience persona (who is the reader) */
  audience: string;
  /** Specific pain point / desire the audience has */
  painPoint: string;
  /** 3 CTA verb phrases, from warmest to most urgent */
  ctaVerbs: [string, string, string];
  /** Urgency or scarcity signal relevant to this business */
  urgency: string;
  /** Emotional promise specific to this business type */
  emotionalHook: string;
  /** Tone nuance for this sector */
  tone: string;
}

const BUSINESS_PROFILES: Record<string, BusinessProfile> = {
  Restaurant: {
    audience: 'familles, couples et collègues à la recherche d\'une bonne table',
    painPoint: 'Trouver un restaurant qui allie qualité, ambiance et rapport qualité-prix sans mauvaise surprise',
    ctaVerbs: ['Réservez votre table en ligne', 'Venez savourer ce soir', 'Découvrez le menu du jour'],
    urgency: 'Les places du week-end partent vite — réservez dès maintenant pour ne pas manquer votre créneau.',
    emotionalHook: 'une expérience gustative mémorable dans un cadre chaleureux',
    tone: 'chaleureux, appétissant, convivial',
  },
  Coiffeur: {
    audience: 'femmes et hommes cherchant un coiffeur de confiance pour un résultat impeccable',
    painPoint: 'Trouver un coiffeur expert qui comprend les désirs du client et propose un résultat qui dure',
    ctaVerbs: ['Prenez rendez-vous en ligne', 'Réservez votre séance', 'Offrez-vous ce soin'],
    urgency: 'Les créneaux du samedi se remplissent — assurez votre place dès aujourd\'hui.',
    emotionalHook: 'un résultat qui booste votre confiance à chaque regard dans le miroir',
    tone: 'bienveillant, expert, rassurant',
  },
  Boulangerie: {
    audience: 'habitants du quartier et gourmands à la recherche d\'une boulangerie artisanale authentique',
    painPoint: 'Trouver une boulangerie qui propose du vrai pain artisanal et des pâtisseries faites maison chaque matin',
    ctaVerbs: ['Commandez votre gâteau sur mesure', 'Venez déguster nos créations', 'Passez nous voir demain matin'],
    urgency: 'Nos fournées sont limitées — les meilleures pièces partent tôt le matin.',
    emotionalHook: 'le plaisir simple d\'une baguette croustillante sortie du four',
    tone: 'artisanal, authentique, chaleureux',
  },
  Spa: {
    audience: 'adultes stressés cherchant une parenthèse bien-être, couples souhaitant un cadeau original',
    painPoint: 'Trouver un spa qui propose une vraie détente complète loin du stress du quotidien, avec des soins professionnels',
    ctaVerbs: ['Réservez votre soin en ligne', 'Offrez un moment de bien-être', 'Craquez pour un duo relaxant'],
    urgency: 'Les plages du week-end sont limitées — réservez votre bulle de sérénité maintenant.',
    emotionalHook: 'une parenthèse de sérénité absolue où le stress s\'évapore dès la première minute',
    tone: 'apaisant, sensoriel, premium',
  },
  Pharmacie: {
    audience: 'patients et familles du quartier cherchant conseils santé et médicaments de qualité',
    painPoint: 'Trouver une pharmacie disponible, à l\'écoute, qui dépasse la simple délivrance d\'ordonnances',
    ctaVerbs: ['Venez nous consulter sans rendez-vous', 'Posez vos questions à nos pharmaciens', 'Bénéficiez de notre conseil personnalisé'],
    urgency: 'Notre équipe est disponible 6j/7 pour vous accompagner, même en urgence.',
    emotionalHook: 'un suivi santé de proximité avec des professionnels qui vous connaissent vraiment',
    tone: 'rassurant, professionnel, de proximité',
  },
  Médecin: {
    audience: 'patients en quête d\'un médecin généraliste de confiance, disponible et à l\'écoute',
    painPoint: 'Trouver un médecin conventionné disponible rapidement, sans file d\'attente interminable',
    ctaVerbs: ['Prenez rendez-vous en ligne', 'Consultez dès aujourd\'hui', 'Bénéficiez d\'une prise en charge rapide'],
    urgency: 'Des créneaux de consultation sont disponibles cette semaine — ne tardez pas.',
    emotionalHook: 'une prise en charge médicale attentive et personnalisée, sans stress',
    tone: 'rassurant, sérieux, humain',
  },
  Opticien: {
    audience: 'personnes portant des lunettes ou lentilles, familles cherchant un bilan visuel sérieux',
    painPoint: 'Trouver un opticien qui allie conseil expert, montures tendance et remboursement mutuelle simplifié',
    ctaVerbs: ['Prenez rendez-vous pour un bilan visuel gratuit', 'Essayez nos montures en boutique', 'Bénéficiez de la prise en charge mutuelle'],
    urgency: 'Les bilans visuels gratuits sont sur rendez-vous — réservez votre créneau.',
    emotionalHook: 'voir le monde avec netteté dans des lunettes qui vous ressemblent vraiment',
    tone: 'expert, attentionné, moderne',
  },
  Dentiste: {
    audience: 'adultes et familles cherchant un cabinet dentaire de confiance pour des soins sans douleur',
    painPoint: 'Trouver un dentiste disponible rapidement, doux et transparent sur les tarifs et remboursements',
    ctaVerbs: ['Prenez rendez-vous en ligne', 'Consultez notre cabinet sans attente', 'Appelez pour un rendez-vous urgent'],
    urgency: 'Un créneau d\'urgence est souvent disponible sous 48h — ne laissez pas une douleur s\'aggraver.',
    emotionalHook: 'retrouver un sourire sain et confiant grâce à des soins doux et modernes',
    tone: 'rassurant, humain, transparent',
  },
  Sport: {
    audience: 'actifs de tous niveaux souhaitant se (re)mettre au sport avec un encadrement professionnel',
    painPoint: 'Trouver une salle de sport accessible, bien équipée et avec de vrais coachs motivants',
    ctaVerbs: ['Essayez une séance découverte gratuite', 'Inscrivez-vous sans engagement', 'Rejoignez nos cours collectifs'],
    urgency: 'Les places en cours collectifs sont limitées — rejoignez la prochaine session.',
    emotionalHook: 'sentir chaque jour les progrès qui transforment votre énergie et votre silhouette',
    tone: 'dynamique, motivant, inclusif',
  },
  Plombier: {
    audience: 'propriétaires et locataires confrontés à une urgence ou projet de rénovation',
    painPoint: 'Trouver un plombier disponible rapidement, honnête sur les devis et certifié pour les travaux',
    ctaVerbs: ['Appelez pour une intervention rapide', 'Demandez votre devis gratuit en ligne', 'Bénéficiez d\'un dépannage sous 2h'],
    urgency: 'En cas de fuite ou urgence, notre équipe peut intervenir dans les 2 heures.',
    emotionalHook: 'une intervention rapide, propre et au bon prix — sans mauvaise surprise sur la facture',
    tone: 'direct, fiable, efficace',
  },
  Electricien: {
    audience: 'particuliers et petites entreprises ayant besoin de travaux ou dépannage électrique',
    painPoint: 'Trouver un électricien certifié, disponible et transparent sur les prix pour sécuriser son installation',
    ctaVerbs: ['Demandez un devis gratuit', 'Appelez notre dépanneur disponible', 'Bénéficiez d\'une mise aux normes certifiée'],
    urgency: 'Une installation vétuste est un risque — faites intervenir un professionnel certifié dès cette semaine.',
    emotionalHook: 'une installation sécurisée et aux normes pour dormir sur vos deux oreilles',
    tone: 'sérieux, technique, rassurant',
  },
};

function getBusinessProfile(activity: string): BusinessProfile {
  const key = Object.keys(BUSINESS_PROFILES).find(k =>
    activity.toLowerCase().includes(k.toLowerCase())
  );
  return key
    ? BUSINESS_PROFILES[key]
    : {
        audience: 'clients locaux cherchant un professionnel de confiance à proximité',
        painPoint: 'Trouver un professionnel local fiable, disponible et avec un excellent rapport qualité-prix',
        ctaVerbs: ['Contactez-nous dès aujourd\'hui', 'Venez découvrir notre établissement', 'Demandez votre devis gratuit'],
        urgency: 'Disponible rapidement — prenez contact dès maintenant pour un rendez-vous.',
        emotionalHook: 'un service de qualité par des professionnels qui connaissent votre quartier',
        tone: 'professionnel, chaleureux, de proximité',
      };
}

export function buildSEOArticlePrompt(
  name: string,
  city: string,
  activity: string,
  keyword: string,
  geoZone: string,
  bookingUrl?: string,
  generateSchema?: boolean,
): string {
  const finalCity = geoZone.trim() || city;
  const finalKeyword = keyword.trim() || activity;
  const profile = getBusinessProfile(activity);

  // Build CTA block — richer when booking URL is provided
  const ctaBlock = bookingUrl
    ? `\n\nCTA FINAL OBLIGATOIRE :
Termine l'article par un appel à l'action puissant et spécifique à ce type de commerce.
- Public visé : ${profile.audience}
- Signal d'urgence à intégrer : "${profile.urgency}"
- Formules CTA à utiliser (choisir la plus adaptée au contexte) :
  • "${profile.ctaVerbs[0]} chez ${name}" + lien ${bookingUrl}
  • "${profile.ctaVerbs[1]} — ${name} vous attend à ${finalCity}"
  • "${profile.ctaVerbs[2]} et profitez de ${profile.emotionalHook}"
- Le CTA doit inclure le nom "${name}", la ville "${finalCity}" ET le lien de réservation ${bookingUrl}.
- Format : 1 phrase accroche (émotion/urgence) + 1 phrase CTA avec lien. Maximum 3 lignes.`
    : `\n\nCTA FINAL OBLIGATOIRE :
Termine l'article par un appel à l'action puissant et spécifique à ce type de commerce.
- Public visé : ${profile.audience}
- Signal d'urgence à intégrer : "${profile.urgency}"
- Formules CTA à utiliser (choisir la plus adaptée) :
  • "${profile.ctaVerbs[0]} chez ${name} à ${finalCity}"
  • "${profile.ctaVerbs[1]} — votre ${activity} de confiance à ${finalCity}"
  • "Profitez de ${profile.emotionalHook} avec ${name}"
- Le CTA doit mentionner le nom "${name}" et la ville "${finalCity}".
- Format : 1 phrase accroche + 1 phrase CTA. Maximum 3 lignes.`;

  const schemaBlock = generateSchema
    ? `\n\n===SCHEMA===\n[Génère un bloc JSON-LD Schema.org complet de type "LocalBusiness" pour "${name}". Inclure : @context, @type, name, description (1 phrase), address (@type:PostalAddress, streetAddress, addressLocality:"${finalCity}", addressCountry:"FR"), url (si disponible${bookingUrl ? ` : "${bookingUrl}"` : ', sinon "#"'}), telephone (laisser "PHONE_PLACEHOLDER"), openingHoursSpecification (exemple générique lun-sam 9h-19h), sameAs (tableau vide []), potentialAction (type:ReserveAction ou OrderAction). JSON valide uniquement, indenté 2 espaces, sans commentaire.]\n===END_SCHEMA===`
    : '';

  return `Tu es un expert SEO local spécialisé dans le référencement de commerces de proximité en France.

COMMERCE : ${name} — ${activity} à ${finalCity}
MOT-CLÉ PRINCIPAL : "${finalKeyword}"
ZONE GÉOGRAPHIQUE CIBLÉE : "${finalCity}"

PROFIL DE L'AUDIENCE CIBLE :
- Lecteur idéal : ${profile.audience}
- Problème ou désir principal : ${profile.painPoint}
- Ton à adopter dans tout l'article : ${profile.tone}
- Promesse émotionnelle à faire ressentir : ${profile.emotionalHook}

OBJECTIF : Rédige un article de blog SEO local de 300 à 500 mots, optimisé pour Google, qui parle directement à cette audience et donne envie d'agir.

STRUCTURE OBLIGATOIRE (respecter dans cet ordre) :

===META===
META_TITLE: [Titre SEO de 55-60 caractères max incluant "${finalKeyword}" et "${finalCity}" — ton : ${profile.tone}]
META_DESCRIPTION: [Description SEO de 150-160 caractères max, persuasive, incluant un appel à l'action adapté au public "${profile.audience}"]
META_KEYWORDS: [Liste de 6 à 10 mots-clés SEO séparés par des virgules : "${finalKeyword}", variantes sémantiques du mot-clé, "${finalCity}", quartier ou arrondissement, 2-3 termes locaux pertinents pour ${activity}]
===END_META===

===ARTICLE===
# [Titre H1 percutant (60-70 caractères) incluant "${finalKeyword}" + "${finalCity}" — interpelle directement l'audience]

[Introduction captivante de 2-3 phrases : adresse directement le problème ou désir de l'audience ("${profile.painPoint}"), accroche locale forte, promesse de l'article]

## [Sous-titre H2 incluant "${finalCity}" et la notion de qualité/expertise adaptée au secteur]

[Paragraphe de 80-100 mots : développe le savoir-faire ou l'offre principale sous l'angle de l'audience "${profile.audience}", ancre locale forte]

## [Sous-titre H2 incluant "${finalKeyword}" et un bénéfice concret pour l'audience]

[Paragraphe de 80-100 mots : avantages concrets qui répondent au problème "${profile.painPoint}", détails pratiques, ce qui distingue l'établissement]

## [Sous-titre H2 : Pourquoi choisir ${name} à ${finalCity} ?]

[Paragraphe de 60-80 mots : éléments de confiance, témoignages implicites, proximité — conclure sur la promesse "${profile.emotionalHook}"]${ctaBlock}
===END_ARTICLE===${schemaBlock}

RÈGLES ABSOLUES :
❌ INTERDIT : "N'hésitez pas", "Plongez dans notre univers", "N'attendez plus", tout jargon IA générique
❌ INTERDIT : CTA génériques du type "Contactez-nous" sans mention du nom ou de la ville
✅ OBLIGATOIRE : Ton "${profile.tone}" — chaque phrase doit parler au lecteur "${profile.audience}"
✅ OBLIGATOIRE : Langage naturel, direct, ancrage local "${finalCity}" récurrent mais naturel
✅ OBLIGATOIRE : Densité mot-clé "${finalKeyword}" : environ 2-3% du texte (5-8 occurrences)
✅ OBLIGATOIRE : CTA final personnalisé avec signal d'urgence "${profile.urgency.substring(0, 60)}…"
✅ OBLIGATOIRE : Respecter EXACTEMENT tous les délimiteurs ===

GÉNÈRE UNIQUEMENT le contenu structuré ci-dessus, sans commentaire avant ni après.`;
}

export interface SEOMeta {
  title: string;
  description: string;
  keywords?: string;
}

export interface ParsedSEOArticle {
  meta: SEOMeta | null;
  article: string;
  schema?: string;
}

export function parseSEOArticle(raw: string): ParsedSEOArticle {
  const metaMatch = raw.match(/===META===([\s\S]*?)===END_META===/);
  const articleMatch = raw.match(/===ARTICLE===([\s\S]*?)===END_ARTICLE===/);
  const schemaMatch = raw.match(/===SCHEMA===([\s\S]*?)===END_SCHEMA===/);

  let meta: SEOMeta | null = null;
  if (metaMatch) {
    const titleMatch = metaMatch[1].match(/META_TITLE:\s*(.+)/);
    const descMatch = metaMatch[1].match(/META_DESCRIPTION:\s*(.+)/);
    const kwMatch = metaMatch[1].match(/META_KEYWORDS:\s*(.+)/);
    if (titleMatch && descMatch) {
      meta = {
        title: titleMatch[1].trim(),
        description: descMatch[1].trim(),
        keywords: kwMatch ? kwMatch[1].trim() : undefined,
      };
    }
  }

  // Extract JSON-LD from schema block (strip surrounding brackets/text if present)
  let schema: string | undefined;
  if (schemaMatch) {
    const raw_schema = schemaMatch[1].trim();
    // Try to find a JSON object within the block
    const jsonStart = raw_schema.indexOf('{');
    const jsonEnd = raw_schema.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      try {
        const jsonStr = raw_schema.slice(jsonStart, jsonEnd + 1);
        // Validate and prettify
        schema = JSON.stringify(JSON.parse(jsonStr), null, 2);
      } catch {
        // Keep raw if JSON parsing fails
        schema = raw_schema.replace(/^\[/, '').replace(/\]$/, '').trim();
      }
    } else {
      schema = raw_schema.replace(/^\[/, '').replace(/\]$/, '').trim();
    }
  }

  const article = articleMatch ? articleMatch[1].trim() : raw;
  return { meta, article, schema };
}

export function parsePlatformVariants(raw: string): Record<string, string> {
  const variants: Record<string, string> = {};
  const parts = raw.split(/===([A-Z]+)===/);
  for (let i = 1; i < parts.length; i += 2) {
    const key = parts[i].toLowerCase().trim();
    const content = (parts[i + 1] ?? '').replace(/^\s*\[/, '').replace(/\]\s*$/, '').trim();
    if (key && content) variants[key] = content;
  }
  return variants;
}

/**
 * Get the platform-aware CTA for use in the Cockpit UI preview
 */
export function getBookingCtaPreview(
  bookingUrl: string | undefined,
  businessName: string,
): string {
  if (!bookingUrl) return '';
  const platform = detectPlatformFromUrl(bookingUrl);
  if (platform) return getSmartCTA(platform, businessName);
  return `📅 Réservez en ligne 👉 ${bookingUrl}`;
}