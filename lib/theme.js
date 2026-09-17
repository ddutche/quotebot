// Turns design/tokens.json + a client's brand.json into CSS custom properties.
// Components only ever read these variables. No component hard-codes a color, size, or font.

const DARK_TEXT_FALLBACK = "#16181D";
const WHITE = "#FFFFFF";
const MIN_CONTRAST = 4.5;

function parseHex(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex ?? "").trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]) {
  return "#" + [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("").toUpperCase();
}

function luminance(rgb) {
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two hex colors. */
export function contrastRatio(a, b) {
  const la = luminance(parseHex(a));
  const lb = luminance(parseHex(b));
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Mixes `hex` over `base` at `amount` (0..1). */
export function mix(hex, base, amount) {
  const a = parseHex(hex);
  const b = parseHex(base);
  return toHex(a.map((c, i) => b[i] + (c - b[i]) * amount));
}

/**
 * Picks the brand color used for buttons and text, and the text color on top of it.
 * DESIGN_RULES section 2: if the client's color fails on white, darken it for buttons and text
 * and keep the original only for the logo area.
 */
export function resolveBrandColors(primary, textColor = DARK_TEXT_FALLBACK) {
  const original = parseHex(primary) ? toHex(parseHex(primary)) : "#1F4E79";
  let brand = original;
  // Try white text on the brand first, then dark text, then darken until white text passes.
  if (contrastRatio(brand, WHITE) >= MIN_CONTRAST) return { brand, original, contrast: WHITE, darkened: false };
  if (contrastRatio(brand, textColor) >= MIN_CONTRAST && contrastRatio(brand, WHITE) < 3) {
    // Light brand colors (yellow, light green) read fine with dark text on buttons,
    // but can't be used as text on white, so text uses a darkened copy.
    let textBrand = brand;
    for (let i = 0; i < 40 && contrastRatio(textBrand, WHITE) < MIN_CONTRAST; i++) textBrand = mix(textBrand, "#000000", 0.92);
    return { brand, original, contrast: textColor, text: textBrand, darkened: true };
  }
  for (let i = 0; i < 40 && contrastRatio(brand, WHITE) < MIN_CONTRAST; i++) brand = mix(brand, "#000000", 0.92);
  return { brand, original, contrast: WHITE, darkened: true };
}

function pickFont(brand, tokens) {
  const allowed = tokens.font.allowed_families;
  return allowed.includes(brand.font) ? brand.font : allowed[0];
}

/** Returns { "--qb-...": value } for every token, with this client's brand applied. */
export function buildTheme(tokens, brand) {
  const vars = {};
  const c = tokens.color;
  for (const [name, value] of Object.entries(c)) {
    if (!String(value).startsWith("{")) vars[`--qb-color-${name}`] = value;
  }

  const colors = resolveBrandColors(brand.primary_color, c.text);
  vars["--qb-color-brand"] = colors.brand;
  vars["--qb-color-brand-contrast"] = colors.contrast;
  vars["--qb-color-brand-text"] = colors.text ?? colors.brand;
  vars["--qb-color-brand-original"] = colors.original;
  vars["--qb-color-brand-soft"] = mix(colors.brand, c.surface, 0.1);

  vars["--qb-font"] = `'${pickFont(brand, tokens)}', ${tokens.font.fallback}`;
  for (const [k, v] of Object.entries(tokens.type_scale_px)) vars[`--qb-text-${k}`] = `${v}px`;
  for (const [k, v] of Object.entries(tokens.line_height)) vars[`--qb-leading-${k}`] = String(v);
  for (const [k, v] of Object.entries(tokens.weight)) vars[`--qb-weight-${k}`] = String(v);
  for (const [k, v] of Object.entries(tokens.space_px)) vars[`--qb-space-${k}`] = `${v}px`;

  const corners = brand.corners === "square" ? "square" : "rounded";
  for (const [k, v] of Object.entries(tokens.radius_px[corners])) vars[`--qb-radius-${k}`] = `${v}px`;
  for (const [k, v] of Object.entries(tokens.shadow)) vars[`--qb-shadow-${k}`] = v;
  for (const [k, v] of Object.entries(tokens.motion_ms)) vars[`--qb-motion-${k}`] = `${v}ms`;
  vars["--qb-widget-width"] = `${tokens.layout.widget_width_px}px`;
  vars["--qb-widget-max-height"] = `${tokens.layout.widget_max_height_vh}vh`;
  vars["--qb-page-max-width"] = `${tokens.layout.page_max_width_px}px`;
  vars["--qb-tap-target"] = `${tokens.layout.tap_target_min_px}px`;
  return vars;
}

/** CSS text for a selector, e.g. themeCss(vars, ":host"). */
export function themeCss(vars, selector = ":root") {
  const body = Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`).join("\n");
  return `${selector} {\n${body}\n}`;
}
