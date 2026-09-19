// What the browser is allowed to know about a client. Public: no rules, prices, or modifiers.

import { buildTheme } from "./theme.js";

export function isDemoClient(brand) {
  return brand.is_demo === true;
}

export function publicClientConfig({ rules, brand, tokens }) {
  const font = tokens.font.allowed_families.includes(brand.font) ? brand.font : tokens.font.allowed_families[0];
  return {
    client_id: rules.client_id,
    business_name: brand.business_name ?? rules.business.name,
    trade: brand.trade ?? null,
    tagline: brand.tagline ?? null,
    logo_url: brand.logo_url || null,
    phone: rules.business.phone,
    hours: rules.business.hours,
    is_demo: isDemoClient(brand),
    font,
    theme: buildTheme(tokens, brand),
  };
}
