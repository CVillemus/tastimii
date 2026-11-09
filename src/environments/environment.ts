/**
 * Configuration publique du front.
 * La clé « publishable » de Supabase est faite pour être exposée dans le navigateur.
 * Ne JAMAIS mettre ici la clé `service_role` / `secret`.
 */
export const environment = {
  supabaseUrl: 'https://msfezixjrsdcihzlluwa.supabase.co',
  supabasePublishableKey: 'sb_publishable_mxkpfYtoZRxUTsixZY9r2w_l18WmhfN',
} as const;
