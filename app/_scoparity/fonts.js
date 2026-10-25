// Scoparity's own typefaces (the company site, not client widgets).
// Poppins matches the geometric wordmark in the logo; Source Sans 3 carries body text;
// IBM Plex Mono sets prices and code so the numbers line up.

import { Poppins, Source_Sans_3, IBM_Plex_Mono } from "next/font/google";

const display = Poppins({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-display", display: "swap" });
const body = Source_Sans_3({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-body", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });

export const fontVariables = `${display.variable} ${body.variable} ${mono.variable}`;
