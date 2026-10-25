// A fictional contractor's own website with the Scoparity widget installed, the way a paying
// customer would run it: one script tag, floating "Get a price" button. Server component.
// The look is deliberately the classic small-contractor site (charcoal and construction yellow,
// condensed caps, big phone number, "free estimate" box) so it reads as someone else's business.
// Brightwater Drywall & Paint is not a real business (golden rule 3): no logo, reviews, ratings,
// years in business, or license claims, and a visible banner says so. The phone number is a
// placeholder, (XXX) XXX-XXXX. Business details come from clients/brightwater-drywall so the page and chat agree.

import Script from "next/script";
import localFont from "next/font/local";
import { loadClient } from "../../lib/rules.js";
import OpenChatButton from "./OpenChatButton.js";

// Self-hosted (app/_fonts) so the build doesn't depend on reaching Google Fonts.
const oswald = localFont({
  src: [{ path: "../_fonts/oswald-variable.woff2", weight: "200 700", style: "normal" }],
  variable: "--bw-display",
  display: "swap",
});
const roboto = localFont({
  src: [{ path: "../_fonts/roboto-variable.woff2", weight: "100 900", style: "normal" }],
  variable: "--bw-body",
  display: "swap",
});

const CLIENT_ID = "brightwater-drywall";

// Town names for the ZIPs in the rules file.
const TOWNS = { "11718": "Brightwaters", "11706": "Bay Shore", "11795": "West Islip", "11730": "East Islip", "11751": "Islip" };

// What the price list and escalation rules in clients/brightwater-drywall actually cover.
const SERVICES = [
  ["Hole & crack repair", "Doorknob dings, fist-sized holes, and stress cracks patched smooth and sanded flush."],
  ["Ceiling repair", "Old light-fixture holes and damaged spots overhead, patched without the mess."],
  ["Drywall replacement", "Damaged sections cut out and replaced with new board, priced by the square foot."],
  ["Texture matching", "Orange peel and knockdown matched to the rest of the wall so the patch disappears."],
  ["Patch painting", "We prime and paint the repaired area, so you aren't left with a white square."],
  ["Water damage", "Stains or soft spots get an in-person look first. We find the source before we quote."],
];

export const metadata = {
  title: "Brightwater Drywall & Paint (sample contractor site)",
  description: "A fictional Long Island contractor's website running the Scoparity estimate chat.",
};

export default async function ExampleCustomer() {
  const { rules } = await loadClient(CLIENT_ID);
  const { phone, hours, service_zips: zips } = rules.business;
  const hoursText = hours.replace("Mon-Fri", "Mon to Fri").replace(/(\d+[ap]m)-(\d+[ap]m)/, "$1 to $2");

  return (
    <div className={`bw ${oswald.variable} ${roboto.variable}`}>
      <style>{css}</style>

      <div className="bw-demo">
        <p>
          <strong>Sample site.</strong> Brightwater Drywall &amp; Paint is a fictional contractor. The{" "}
          &ldquo;Get a price&rdquo; button in the corner is Scoparity, added with one line of code. Prices are samples.
        </p>
        <a href="/">Back to Scoparity</a>
      </div>

      <div className="bw-topbar">
        <div className="bw-wrap bw-topbar-inner">
          <span>Serving Bay Shore, Islip &amp; the South Shore</span>
          <span>{hoursText}</span>
        </div>
      </div>

      <header className="bw-header">
        <div className="bw-wrap bw-header-inner">
          <a href="#top" className="bw-name" aria-label="Brightwater Drywall and Paint, home">
            <span className="bw-name-main">Brightwater</span>
            <span className="bw-name-sub">Drywall &amp; Paint</span>
          </a>
          <nav aria-label="Site" className="bw-nav">
            <a href="#services">Services</a>
            <a href="#how">How it works</a>
            <a href="#area">Service area</a>
          </nav>
          <div className="bw-call">
            <span className="bw-call-label">Call today</span>
            <span className="bw-call-number">{phone}</span>
          </div>
          <OpenChatButton className="bw-btn bw-btn-yellow bw-header-btn">Free estimate</OpenChatButton>
        </div>
      </header>

      <main id="top">
        <section className="bw-hero">
          <div className="bw-wrap bw-hero-grid">
            <div className="bw-hero-copy">
              <p className="bw-hero-kicker">South Shore drywall repair</p>
              <h1 className="bw-h1">
                Drywall repair <span className="bw-yellow">done right.</span>
              </h1>
              <p className="bw-lede">
                Holes, cracks, and water-stained ceilings patched, matched, and painted. No job too small.
              </p>
              <ul className="bw-checks">
                <li>Price range online in about a minute</li>
                <li>Texture matched to your wall</li>
                <li>Painting available on every patch</li>
              </ul>
            </div>

            <div className="bw-quote-box">
              <h2 className="bw-quote-title">Get your free estimate</h2>
              <p>
                Answer a few quick questions about the damage, add a photo if you have one, and see a price range from
                our price list right away. No phone tag.
              </p>
              <OpenChatButton className="bw-btn bw-btn-yellow bw-btn-block">Start my estimate</OpenChatButton>
              <p className="bw-quote-or">
                Rather talk? Call <strong>{phone}</strong>
              </p>
              <p className="bw-quote-fine">
                Online estimates are ranges. We confirm the final price when we see the job.
              </p>
            </div>
          </div>
        </section>

        <div className="bw-stripe" aria-hidden="true" />

        <section id="services" className="bw-section">
          <div className="bw-wrap">
            <h2 className="bw-h2">Our services</h2>
            <p className="bw-section-intro">Residential interior drywall work, from a single ding to a full section.</p>
            <ul className="bw-services">
              {SERVICES.map(([title, text]) => (
                <li key={title}>
                  <h3 className="bw-h3">{title}</h3>
                  <p>{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="how" className="bw-section bw-concrete">
          <div className="bw-wrap">
            <h2 className="bw-h2">How it works</h2>
            <ol className="bw-steps">
              <li>
                <h3 className="bw-h3">Tell us about the damage</h3>
                <p>Tap Free estimate and describe what happened. A photo helps.</p>
              </li>
              <li>
                <h3 className="bw-h3">See your price range</h3>
                <p>You get a range from our own price list, with what it includes, on the spot.</p>
              </li>
              <li>
                <h3 className="bw-h3">We confirm and fix it</h3>
                <p>We call to set a time, check the job in person, and confirm the final price.</p>
              </li>
            </ol>
          </div>
        </section>

        <section id="area" className="bw-section">
          <div className="bw-wrap">
            <h2 className="bw-h2">Proudly serving the South Shore</h2>
            <ul className="bw-area">
              {zips.map((z) => (
                <li key={z}>
                  <span className="bw-town">{TOWNS[z] ?? "Long Island"}</span>
                  <span className="bw-zip">{z}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bw-cta">
          <div className="bw-wrap bw-cta-inner">
            <div>
              <h2 className="bw-cta-title">Got a hole in the wall?</h2>
              <p>Get a price range in about a minute, any time of day.</p>
            </div>
            <OpenChatButton className="bw-btn bw-btn-dark">Start my free estimate</OpenChatButton>
          </div>
        </section>
      </main>

      <footer className="bw-footer">
        <div className="bw-wrap bw-footer-grid">
          <div>
            <p className="bw-footer-name">Brightwater Drywall &amp; Paint</p>
            <p>{phone}</p>
            <p>{hoursText}</p>
          </div>
          <div>
            <p className="bw-footer-head">Services</p>
            <ul>
              {SERVICES.map(([title]) => (
                <li key={title}>{title}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="bw-footer-head">Service area</p>
            <ul>
              {zips.map((z) => (
                <li key={z}>
                  {TOWNS[z] ?? "Long Island"}, NY {z}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="bw-wrap bw-footer-bottom">
          <p>Brightwater Drywall &amp; Paint is a fictional business for a class demo.</p>
          <p>
            Estimate chat by <a href="/">Scoparity</a>
          </p>
        </div>
      </footer>

      <Script src="/widget.js" strategy="afterInteractive" data-client={CLIENT_ID} />
    </div>
  );
}

const css = `
/* Classic contractor site: charcoal + construction yellow, condensed caps, square corners. */
.bw {
  --char: #1E2124;
  --char-2: #2B2F33;
  --yellow: #F5B400;
  --yellow-hover: #FFC52E;
  --ink: #1E2124;
  --muted: #565C62;
  --line: #DCDEE0;
  --paper: #FFFFFF;
  --concrete: #F1F1EF;
  --on-dark: #FFFFFF;
  --on-dark-muted: #B8BEC4;
  --navy: #01305A;
  --display: var(--bw-display), "Arial Narrow", Impact, sans-serif;
  --body: var(--bw-body), Arial, Helvetica, sans-serif;
  color-scheme: light;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--body);
  font-size: 17px;
  line-height: 1.6;
  min-height: 100vh;
}
.bw *, .bw *::before, .bw *::after { box-sizing: border-box; }
.bw p { margin: 0; }
.bw ul, .bw ol { margin: 0; padding: 0; list-style: none; }
.bw :focus-visible { outline: 3px solid var(--yellow); outline-offset: 2px; }
.bw-wrap {
  max-width: 1140px; margin: 0 auto;
  padding-left: max(20px, env(safe-area-inset-left, 0px));
  padding-right: max(20px, env(safe-area-inset-right, 0px));
}
.bw-yellow { color: var(--yellow); }

/* Scoparity's sample banner: navy, so it reads as outside Brightwater's site */
.bw-demo {
  background: var(--navy); color: #FFFFFF; font-size: 15px;
  display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 4px 20px;
  padding: 10px max(20px, env(safe-area-inset-right, 0px)) 10px max(20px, env(safe-area-inset-left, 0px));
  text-align: center;
}
.bw-demo a { color: #FFFFFF; font-weight: 700; }

.bw-topbar { background: var(--char); color: var(--on-dark-muted); font-size: 14px; }
.bw-topbar-inner { display: flex; justify-content: space-between; gap: 8px 24px; flex-wrap: wrap; padding-block: 8px; }
@media (max-width: 640px) { .bw-topbar-inner span:last-child { display: none; } }

/* Header */
.bw-header { background: var(--paper); border-bottom: 1px solid var(--line); }
.bw-header-inner { display: flex; align-items: center; gap: 16px 32px; padding-block: 16px; }
.bw-name { display: flex; flex-direction: column; text-decoration: none; color: var(--ink); line-height: 1; }
.bw-name-main { font-family: var(--display); font-weight: 700; font-size: 30px; text-transform: uppercase; letter-spacing: 0.02em; }
.bw-name-sub {
  font-family: var(--display); font-weight: 500; font-size: 14px; text-transform: uppercase; letter-spacing: 0.18em;
  margin-top: 4px; padding-top: 4px; border-top: 3px solid var(--yellow); align-self: flex-start;
}
.bw-nav { display: flex; gap: 28px; margin-left: auto; }
.bw-nav a {
  font-family: var(--display); font-weight: 500; font-size: 16px; text-transform: uppercase; letter-spacing: 0.04em;
  color: var(--ink); text-decoration: none; padding-block: 4px; border-bottom: 3px solid transparent;
}
.bw-nav a:hover { border-bottom-color: var(--yellow); }
.bw-call { display: flex; flex-direction: column; line-height: 1.15; text-align: right; }
.bw-call-label { font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); }
.bw-call-number { font-family: var(--display); font-weight: 700; font-size: 24px; white-space: nowrap; }
@media (max-width: 980px) { .bw-nav { display: none; } .bw-call { margin-left: auto; } }
@media (max-width: 640px) { .bw-call { display: none; } .bw-header-btn { margin-left: auto; } }

/* Buttons */
.bw-btn {
  display: inline-flex; align-items: center; justify-content: center;
  min-height: 52px; padding: 0 26px; border: 0; border-radius: 3px; cursor: pointer;
  font-family: var(--display); font-weight: 700; font-size: 18px; text-transform: uppercase; letter-spacing: 0.05em;
  transition: background-color 150ms ease;
}
.bw-btn-yellow { background: var(--yellow); color: var(--char); }
.bw-btn-yellow:hover { background: var(--yellow-hover); }
.bw-btn-dark { background: var(--char); color: var(--on-dark); }
.bw-btn-dark:hover { background: var(--char-2); }
.bw-btn-block { width: 100%; }
.bw-header-btn { min-height: 46px; padding: 0 20px; font-size: 16px; white-space: nowrap; }

/* Hero */
.bw-hero { background: var(--char); color: var(--on-dark); padding-block: 72px; }
.bw-hero-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 48px; align-items: center; }
@media (min-width: 920px) { .bw-hero-grid { grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 64px; } }
.bw-hero-copy { display: flex; flex-direction: column; gap: 22px; }
.bw-hero-kicker {
  font-family: var(--display); font-weight: 500; font-size: 16px; text-transform: uppercase; letter-spacing: 0.14em;
  color: var(--yellow);
}
.bw-h1 {
  font-family: var(--display); font-weight: 700; text-transform: uppercase;
  font-size: clamp(44px, 7vw, 76px); line-height: 1.0; letter-spacing: 0.01em; margin: 0;
}
.bw-lede { font-size: 20px; color: var(--on-dark-muted); max-width: 34em; }
.bw-checks { display: flex; flex-direction: column; gap: 10px; font-size: 17px; }
.bw-checks li { display: flex; align-items: center; gap: 12px; }
.bw-checks li::before {
  content: ""; flex: none; width: 8px; height: 15px; margin: 0 5px 4px;
  border: solid var(--yellow); border-width: 0 3px 3px 0; transform: rotate(45deg);
}

/* The classic "free estimate" box, here starting the Scoparity chat instead of a form */
.bw-quote-box {
  background: var(--paper); color: var(--ink); border-radius: 3px;
  border-top: 6px solid var(--yellow);
  padding: 32px 28px; display: flex; flex-direction: column; gap: 16px;
}
.bw-quote-title { font-family: var(--display); font-weight: 700; font-size: 30px; line-height: 1.1; text-transform: uppercase; margin: 0; }
.bw-quote-box p { color: var(--muted); font-size: 16px; }
.bw-quote-or { text-align: center; }
.bw-quote-or strong { color: var(--ink); }
.bw-quote-fine { font-size: 14px !important; border-top: 1px solid var(--line); padding-top: 14px; }

/* Hazard stripe: the one decorative flourish, and it's the trade's own */
.bw-stripe {
  height: 12px;
  background: repeating-linear-gradient(-45deg, var(--yellow) 0 18px, var(--char) 18px 36px);
}

/* Sections */
.bw-section { padding-block: 80px; }
.bw-concrete { background: var(--concrete); }
.bw-h2 {
  font-family: var(--display); font-weight: 700; text-transform: uppercase;
  font-size: clamp(32px, 4vw, 42px); line-height: 1.1; margin: 0 0 12px;
}
.bw-h2::after { content: ""; display: block; width: 64px; height: 5px; background: var(--yellow); margin-top: 14px; }
.bw-section-intro { color: var(--muted); max-width: 56ch; margin-bottom: 36px !important; }
.bw-h3 { font-family: var(--display); font-weight: 700; font-size: 22px; text-transform: uppercase; line-height: 1.2; margin: 0 0 8px; }

.bw-services { display: grid; grid-template-columns: minmax(0, 1fr); gap: 20px; }
@media (min-width: 640px) { .bw-services { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (min-width: 980px) { .bw-services { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
.bw-services li { border: 1px solid var(--line); border-top: 4px solid var(--char); border-radius: 2px; padding: 24px; }
.bw-services p { color: var(--muted); font-size: 16px; }

.bw-steps { counter-reset: step; display: grid; grid-template-columns: minmax(0, 1fr); gap: 32px; margin-top: 36px !important; }
@media (min-width: 760px) { .bw-steps { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
.bw-steps li { counter-increment: step; display: flex; flex-direction: column; gap: 4px; }
.bw-steps li::before {
  content: counter(step);
  display: flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 50%;
  background: var(--yellow); color: var(--char);
  font-family: var(--display); font-weight: 700; font-size: 28px; margin-bottom: 12px;
}
.bw-steps p { color: var(--muted); font-size: 16px; max-width: 34ch; }

.bw-area { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 36px !important; }
.bw-area li {
  display: flex; align-items: baseline; gap: 10px;
  background: var(--char); color: var(--on-dark); padding: 12px 18px; border-radius: 2px;
}
.bw-town { font-family: var(--display); font-weight: 500; font-size: 18px; text-transform: uppercase; letter-spacing: 0.04em; }
.bw-zip { color: var(--yellow); font-size: 15px; font-variant-numeric: tabular-nums; }

.bw-cta { background: var(--yellow); color: var(--char); padding-block: 48px; }
.bw-cta-inner { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 20px 40px; }
.bw-cta-title { font-family: var(--display); font-weight: 700; font-size: clamp(30px, 4vw, 40px); text-transform: uppercase; line-height: 1.1; margin: 0 0 4px; }
.bw-cta p { font-size: 18px; }

/* Footer */
.bw-footer { background: var(--char); color: var(--on-dark-muted); font-size: 15px; padding-top: 56px; }
.bw-footer-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 32px; padding-bottom: 40px; }
@media (min-width: 760px) { .bw-footer-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
.bw-footer-grid > div { display: flex; flex-direction: column; gap: 6px; }
.bw-footer-grid ul { display: flex; flex-direction: column; gap: 6px; }
.bw-footer-name, .bw-footer-head {
  font-family: var(--display); font-weight: 700; font-size: 18px; text-transform: uppercase; letter-spacing: 0.04em;
  color: var(--on-dark); margin-bottom: 6px !important;
}
.bw-footer-bottom {
  display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px 24px;
  border-top: 1px solid var(--char-2); padding-block: 20px 120px; font-size: 14px;
}
.bw-footer-bottom a { color: var(--yellow); font-weight: 700; }

@media (prefers-reduced-motion: reduce) { .bw * { transition: none !important; } }
`;
