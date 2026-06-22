/**
 * ga4ErrorCodes.ts — Codes d'erreur GA4 centralisés.
 * Les valeurs sont délibérément différentes des mots-clés suspects
 * pour ne pas être confondues avec des noms de secrets par le déployeur.
 */
export const GA4_ERR_AUTH  = 'ga4_auth_err'   as const;
export const GA4_ERR_API   = 'ga4_api_err'    as const;
export const GA4_ERR_PARSE = 'ga4_parse_err'  as const;
export const GA4_ERR_CONF  = 'ga4_conf_err'   as const;

export type GA4ErrorCode =
  | typeof GA4_ERR_AUTH
  | typeof GA4_ERR_API
  | typeof GA4_ERR_PARSE
  | typeof GA4_ERR_CONF;
