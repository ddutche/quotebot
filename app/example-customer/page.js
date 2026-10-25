// A fictional contractor's own website with the Scoparity widget installed, the way a paying
// customer would run it: one script tag, floating "Get a price" button. Server component.
// Brightwater Drywall & Paint is not a real business (golden rule 3): no logo, reviews, years in
// business, or license claims, and a visible banner says so. Phone uses the 555-01xx fiction range.
// Business details come from clients/brightwater-drywall so the page and the chat always agree.

import Script from "next/script";
import localFont from "next/font/local";
import { loadClient } from "../../lib/rules.js";
import OpenChatButton from "./OpenChatButton.js";

// Self-hosted (app/_fonts) so the build doesn't depend on reaching Google Fonts.
const workSans = localFont({
  src: [{ path: "../_fonts/work-sans-variable.woff2", weight: "100 900", style: "normal" }],
  display: "swap",
});

const CLIENT_ID = "brightwater-drywall";

// Town names for the ZIPs in the rules file.
const TOWNS = { "11718": "Brightwaters", "11706": "Bay Shore", "11795": "West Islip", "11730": "East Islip", "11751": "Islip" };

function listTowns(zips) {
  const towns = zips.map((z) => TOWNS[z] ?? z);
  return towns.length > 1 ? `${towns.slice(0, -1).join(", ")}, and ${towns.at(-1)}` : towns.join("");
}

export const metadata = {
  title: "Brightwater Drywall & Paint (sample contractor site)",
  description: "A fictional Long Island contractor's website running the Scoparity estimate chat.",
};

export default async function ExampleCustomer() {
  const { rules, brand } = await loadClient(CLIENT_ID);
  const { name, phone, hours, service_zips: zips } = rules.business;
  const services = rules.services.map((s) => s.label);
  const extras = rules.modifiers.map((m) => m.label);

  return (
    <div className={`bw ${workSans.className}`}>
      <style>{css}</style>

      <div className="bw-demo">
        <p>
          <strong>Sample site.</strong> Brightwater Drywall &amp; Paint is a fictional contractor. The{" "}
          &ldquo;Get a price&rdquo; button in the corner is Scoparity, added with one line of code. Prices are samples.
        </p>
        <a href="/">Back to Scoparity</a>
      </div>

      <header className="bw-header">
        <div className="bw-wrap bw-header-inner">
          <a href="#top" className="bw-name">
            {name}
          </a>
          <nav aria-label="Site" className="bw-nav">
            <a href="#services">Services</a>
            <a href="#area">Service area</a>
            <a href="#pricing">Pricing</a>
          </nav>
          <span className="bw-phone">{phone}</span>
        </div>
      </header>

      <main id="top">
        <section className="bw-hero">
          <div className="bw-wrap bw-hero-grid">
            <div className="bw-hero-copy">
              <h1 className="bw-h1">Drywall repair and paint on the South Shore</h1>
              <p className="bw-lede">
                {`Holes, cracks, and ceiling damage in ${listTowns(zips)}. ${brand.tagline}`}
              </p>
              <div className="bw-actions">
                <OpenChatButton className="bw-btn">Get a price in about a minute</OpenChatButton>
                <span className="bw-or">
                  or call <strong>{phone}</strong>
                </span>
              </div>
            </div>
            <div className="bw-hours">
              <h2 className="bw-h3">Hours</h2>
              <p>{hours.replace("-", " to ").replace("-", " to ")}</p>
              <h2 className="bw-h3">How to get a price</h2>
              <p>
                Tap <strong>Get a price</strong>, tell us what happened, and add a photo if you can. You&apos;ll see a
                range from our price list right away. We confirm the final price when we see the wall.
              </p>
            </div>
          </div>
        </section>

        <section id="services" className="bw-section">
          <div className="bw-wrap bw-two">
            <div>
              <h2 className="bw-h2">What we fix</h2>
              <ul className="bw-list">
                {services.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="bw-h2">Added when needed</h2>
              <ul className="bw-list">
                {extras.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              <p className="bw-small">
                Water damage, popcorn ceilings, and homes built before 1980 get an in-person look before we quote.
              </p>
            </div>
          </div>
        </section>

        <section id="area" className="bw-section bw-tint">
          <div className="bw-wrap">
            <h2 className="bw-h2">Service area</h2>
            <ul className="bw-area">
              {zips.map((z) => (
                <li key={z}>
                  <span>{TOWNS[z] ?? "Long Island"}</span>
                  <span className="bw-zip">{z}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="pricing" className="bw-section">
          <div className="bw-wrap bw-pricing">
            <h2 className="bw-h2">Straight answers on price</h2>
            <p>
              Our online estimate uses the same price list we use on the job. It&apos;s a range, not a final quote,
              and it lists what it includes. If something looks hidden behind the wall, we&apos;ll tell you we need to
              see it first instead of guessing.
            </p>
            <OpenChatButton className="bw-btn bw-btn-outline">Start an estimate</OpenChatButton>
          </div>
        </section>
      </main>

      <footer className="bw-footer">
        <div className="bw-wrap bw-footer-inner">
          <p>
            <strong>{name}</strong>
            <br />
            {phone} · {hours}
          </p>
          <p className="bw-powered">
            Estimate chat by <a href="/">Scoparity</a>
          </p>
        </div>
      </footer>

      <Script src="/widget.js" strategy="afterInteractive" data-client={CLIENT_ID} />
    </div>
  );
}

const css = `
/* Brightwater's own look: forest green on white, square corners, Work Sans. Deliberately not Scoparity's. */
.bw {
  --green: #2E5E3E;
  --green-dark: #22472F;
  --green-soft: #EDF3EE;
  --ink: #1B1F1C;
  --muted: #535B55;
  --line: #DCE2DD;
  --paper: #FFFFFF;
  --navy: #01305A;
  color-scheme: light;
  background: var(--paper);
  color: var(--ink);
  font-size: 18px;
  line-height: 1.55;
  min-height: 100vh;
}
.bw *, .bw *::before, .bw *::after { box-sizing: border-box; }
.bw p { margin: 0; }
.bw :focus-visible { outline: 2px solid var(--green); outline-offset: 3px; }
.bw-wrap {
  max-width: 1080px; margin: 0 auto;
  padding-left: max(20px, env(safe-area-inset-left, 0px));
  padding-right: max(20px, env(safe-area-inset-right, 0px));
}

/* The Scoparity sample banner: navy, so it reads as outside Brightwater's site */
.bw-demo {
  background: var(--navy); color: #FFFFFF; font-size: 15px;
  display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 4px 20px;
  padding: 10px max(20px, env(safe-area-inset-right, 0px)) 10px max(20px, env(safe-area-inset-left, 0px));
  text-align: center;
}
.bw-demo a { color: #FFFFFF; font-weight: 600; }

.bw-header { border-bottom: 1px solid var(--line); }
.bw-header-inner { display: flex; align-items: center; gap: 32px; padding-block: 18px; flex-wrap: wrap; }
.bw-name { font-weight: 600; font-size: 20px; color: var(--green); text-decoration: none; }
.bw-nav { display: flex; gap: 24px; margin-left: auto; font-size: 16px; }
.bw-nav a { color: var(--ink); text-decoration: none; }
.bw-nav a:hover { color: var(--green); text-decoration: underline; }
.bw-phone { font-weight: 600; font-size: 16px; }
/* On phones the number is already in the hero, so the header is just the name */
@media (max-width: 760px) { .bw-nav, .bw-phone { display: none; } }

.bw-h1 { font-size: clamp(34px, 4.6vw, 50px); line-height: 1.12; font-weight: 600; margin: 0; max-width: 16ch; text-wrap: balance; }
.bw-h2 { font-size: 28px; line-height: 1.2; font-weight: 600; margin: 0 0 20px; }
.bw-h3 { font-size: 16px; font-weight: 600; margin: 0 0 4px; color: var(--green); }

.bw-hero { padding-block: 64px; border-bottom: 1px solid var(--line); }
.bw-hero-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 40px; }
@media (min-width: 880px) { .bw-hero-grid { grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); gap: 64px; align-items: end; } }
.bw-hero-copy { display: flex; flex-direction: column; gap: 24px; }
.bw-lede { font-size: 20px; color: var(--muted); max-width: 40ch; }
.bw-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 20px; }
.bw-or { color: var(--muted); font-size: 17px; }
.bw-or strong { color: var(--ink); }
.bw-hours { background: var(--green-soft); padding: 24px; display: flex; flex-direction: column; gap: 4px; font-size: 16px; }
.bw-hours .bw-h3 + p { margin-bottom: 16px; }

.bw-btn {
  min-height: 52px; padding: 0 24px; border: 2px solid var(--green); border-radius: 2px;
  background: var(--green); color: #FFFFFF; font-family: inherit; font-weight: 600; font-size: 17px; line-height: 1;
  cursor: pointer; transition: background-color 150ms ease;
}
.bw-btn:hover { background: var(--green-dark); border-color: var(--green-dark); }
.bw-btn-outline { background: transparent; color: var(--green); align-self: flex-start; }
.bw-btn-outline:hover { background: var(--green-soft); }

.bw-section { padding-block: 72px; }
.bw-tint { background: var(--green-soft); }
.bw-two { display: grid; grid-template-columns: minmax(0, 1fr); gap: 40px; }
@media (min-width: 760px) { .bw-two { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 64px; } }
.bw-list { margin: 0 0 16px; padding-left: 20px; display: flex; flex-direction: column; gap: 8px; }
.bw-small { font-size: 16px; color: var(--muted); max-width: 46ch; }

.bw-area { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1px; background: var(--line); border: 1px solid var(--line); }
.bw-area li { background: var(--paper); padding: 16px 20px; display: flex; justify-content: space-between; gap: 12px; }
.bw-zip { color: var(--muted); font-variant-numeric: tabular-nums; }

.bw-pricing { display: flex; flex-direction: column; gap: 20px; }
.bw-pricing .bw-h2 { margin: 0; }
.bw-pricing p { max-width: 60ch; color: var(--muted); }

.bw-footer { border-top: 1px solid var(--line); padding-block: 32px 120px; font-size: 16px; color: var(--muted); }
.bw-footer-inner { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 16px 40px; }
.bw-footer strong { color: var(--ink); }
.bw-powered a { color: var(--navy); font-weight: 600; }

@media (prefers-reduced-motion: reduce) { .bw * { transition: none !important; } }
`;
