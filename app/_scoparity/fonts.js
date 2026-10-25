// Scoparity's own typefaces (the company site, not client widgets).
// Poppins matches the geometric wordmark in the logo; Source Sans 3 carries body text;
// IBM Plex Mono sets prices and code so the numbers line up.
// The files live in app/_fonts (all SIL Open Font License) so the build never has to reach
// Google Fonts; a failed download there broke a production build.

import localFont from "next/font/local";

const display = localFont({
  src: [
    { path: "../_fonts/poppins-600.woff2", weight: "600", style: "normal" },
    { path: "../_fonts/poppins-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
});
const body = localFont({
  src: [{ path: "../_fonts/source-sans-3-variable.woff2", weight: "200 900", style: "normal" }],
  variable: "--font-body",
  display: "swap",
});
const mono = localFont({
  src: [
    { path: "../_fonts/ibm-plex-mono-400.woff2", weight: "400", style: "normal" },
    { path: "../_fonts/ibm-plex-mono-500.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-mono",
  display: "swap",
});

export const fontVariables = `${display.variable} ${body.variable} ${mono.variable}`;
