// Copies the widget source to public/widget.js so Next.js serves it at /widget.js.
// The widget has no dependencies and no build step beyond this, so what we write is what ships.

import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";

const src = "widget/widget.js";
const out = "public/widget.js";

if (!existsSync(src)) {
  console.log(`build-widget: ${src} not found yet, skipping`);
  process.exit(0);
}
mkdirSync("public", { recursive: true });
copyFileSync(src, out);
const kb = (statSync(out).size / 1024).toFixed(1);
console.log(`build-widget: ${out} (${kb} KB, target under 100 KB)`);
