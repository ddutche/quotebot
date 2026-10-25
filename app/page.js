// Scoparity company site. Server component.
// Who reads it: Long Island contractors (the paying customer), homeowners, and the MBA 571 panel.
// Job: make the two-step idea obvious (instant itemized estimate, then a contractor-confirmed quote)
// and send people to the working example on a contractor's site.
// The sample estimate is priced by engine/price.js from the fictional brightwater-drywall rules,
// so the page can't show a number the engine wouldn't produce.

import { estimate } from "../engine/price.js";
import { loadClient } from "../lib/rules.js";
import { fontVariables } from "./_scoparity/fonts.js";
import EstimateSheet from "./_scoparity/EstimateSheet.js";

export const metadata = {
  title: "Scoparity: see the vision, know the cost",
  description:
    "An estimate chat that runs on a contractor's website. Homeowners get an itemized range from the contractor's own prices; the contractor confirms the firm quote.",
};

const SAMPLE_CLIENT = "brightwater-drywall";
const WIDGET_SRC = "https://quotebot-vert.vercel.app/widget.js";

async function sampleVariants() {
  const client = await loadClient(SAMPLE_CLIENT);
  const variants = {};
  for (const texture of ["smooth", "knockdown"]) {
    for (const paint of ["yes", "no"]) {
      for (const water of ["no", "yes"]) {
        const result = estimate(client.rules, {
          service_id: "patch_medium",
          quantity: 2,
          location: "wall",
          texture,
          paint_included: paint === "yes",
          zip: "11706",
          water_damage: water === "yes",
          built_before_1980: "no",
        });
        variants[`${texture}|${paint}|${water}`] = result;
      }
    }
  }
  return { businessName: client.brand.business_name, variants };
}

const SOURCES = {
  houzz: "https://pro.houzz.com/pro-learn/blog/renovation-nation-9-home-remodeling-trends-for-2026",
  census:
    "https://www.census.gov/content/dam/Census/library/visualizations/2024/demo/2023%20Home%20Improvements%20Infographic.pdf",
  suffolk: "https://www.nycourts.gov/reporter/3dseries/2024/2024_02218.htm",
  nassau: "https://www.nassaucountyny.gov/1563/Licensing",
};

export default async function Home() {
  const { businessName, variants } = await sampleVariants();

  return (
    <div className={`sc ${fontVariables}`}>
      <style>{css}</style>

      <header className="sc-nav">
        <div className="sc-wrap sc-nav-inner">
          <a href="/" className="sc-brand" aria-label="Scoparity home">
            <img src="/brand/scoparity-mark.png" alt="" width="40" height="35" />
            <img src="/brand/scoparity-wordmark.png" alt="Scoparity" width="117" height="28" />
          </a>
          <nav aria-label="Sections" className="sc-nav-links">
            <a href="#how">How it works</a>
            <a href="#contractors">For contractors</a>
            <a href="#guardrails">Guardrails</a>
            <a href="#team">Team</a>
          </nav>
          <a href="/example-customer" className="sc-btn sc-btn-small">
            Live example
          </a>
        </div>
      </header>

      <main>
        <section className="sc-hero">
          <div className="sc-wrap sc-hero-grid">
            <div className="sc-hero-copy">
              <h1 className="sc-h1">See the vision. Know the cost.</h1>
              <p className="sc-lede">
                Scoparity is an estimate chat for home service businesses. It runs on a contractor&apos;s own
                website, asks the homeowner a few plain questions, and returns an itemized price range built from
                that contractor&apos;s real prices. The contractor confirms it before it becomes a quote.
              </p>
              <div className="sc-actions">
                <a href="/example-customer" className="sc-btn">
                  See it on a contractor&apos;s site
                </a>
                <a href="#how" className="sc-link">
                  How it works
                </a>
              </div>
              <p className="sc-note">Starting with interior repairs in Nassau and Suffolk counties.</p>
            </div>

            <div className="sc-hero-sample">
              <EstimateSheet
                businessName={businessName}
                jobSummary="Two fist-sized holes in a living room wall, Bay Shore, NY 11706"
                variants={variants}
              />
              <p className="sc-caption">
                Try the options. Fictional contractor, sample prices. Every number comes from the contractor&apos;s
                price list, calculated in code, not by the AI.
              </p>
            </div>
          </div>
        </section>

        <section className="sc-section" aria-labelledby="problem-h">
          <div className="sc-wrap">
            <h2 id="problem-h" className="sc-h2">
              Pricing a repair still takes a call and a visit
            </h2>
            <div className="sc-two">
              <div>
                <h3 className="sc-h3">Homeowners plan blind</h3>
                <p>
                  Most people learn the price by calling around and waiting for someone to come look. Online
                  calculators give a national average that doesn&apos;t know the room, the materials, or Long Island
                  labor rates. In the 2026 Houzz &amp; Home Study, <strong>37% of homeowners who renovated</strong>{" "}
                  in 2025 went over budget, and the top reason was unexpected costs.{" "}
                  <a className="sc-cite" href={SOURCES.houzz}>
                    Houzz, 2026
                  </a>
                </p>
              </div>
              <div>
                <h3 className="sc-h3">Contractors quote for free</h3>
                <p>
                  Every estimate is unpaid time: judging labor, pricing materials, adding travel. Service workers we
                  spoke with put it at about an hour a day. We haven&apos;t verified that figure yet, so measuring it
                  is part of the pilot. The market is large: <strong>51.6 million U.S. homeowners</strong> made
                  improvements from 2021 to 2023, and professionals did 64% of those projects.{" "}
                  <a className="sc-cite" href={SOURCES.census}>
                    U.S. Census Bureau &amp; HUD, 2024
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="sc-section sc-tint" aria-labelledby="how-h">
          <div className="sc-wrap">
            <h2 id="how-h" className="sc-h2">
              From a description to a firm quote
            </h2>
            <ol className="sc-steps">
              <li>
                <h3 className="sc-h3">The homeowner describes the job</h3>
                <p>
                  In a chat on the contractor&apos;s website: what&apos;s damaged, rough measurements, the ZIP code,
                  the finish they want, and a photo if they have one. It asks one short question at a time.
                </p>
              </li>
              <li>
                <h3 className="sc-h3">It&apos;s priced from the contractor&apos;s own list</h3>
                <p>
                  The chat collects details. A pricing engine, written in plain code, builds the itemized range from
                  the contractor&apos;s prices and local labor rates. Change an option and the total follows.
                </p>
              </li>
              <li>
                <h3 className="sc-h3">Anything hidden goes to a person</h3>
                <p>
                  Water stains, popcorn ceilings, older homes, or a photo that doesn&apos;t match the story get
                  flagged for an inspection, with no price shown.
                </p>
              </li>
              <li>
                <h3 className="sc-h3">The contractor confirms the quote</h3>
                <p>
                  The contractor checks the scope, measurements, and site, then sends a firm quote that says
                  what&apos;s included and what isn&apos;t. Until then, the number is labeled an estimate.
                </p>
              </li>
            </ol>
          </div>
        </section>

        <section className="sc-section" aria-labelledby="install-h">
          <div className="sc-wrap sc-install">
            <div>
              <h2 id="install-h" className="sc-h2">
                It lives on the contractor&apos;s website
              </h2>
              <p>
                A contractor adds one line to the site they already have. A &ldquo;Get a price&rdquo; button appears
                in the corner and the chat takes on the business&apos;s name, color, and font. Homeowners stay on
                the contractor&apos;s site the whole time.
              </p>
              <p>
                Each new business is a folder of settings (brand, price list, and test cases), not a custom build.
                That&apos;s what keeps setup fast and the price low.
              </p>
              <a href="/example-customer" className="sc-link">
                See it on Brightwater Drywall &amp; Paint&apos;s site (fictional)
              </a>
            </div>
            <figure className="sc-code">
              <figcaption>Added to the contractor&apos;s site</figcaption>
              <pre>
                <code>
                  {`<script\n  src="${WIDGET_SRC}"\n  data-client="your-business"\n  async></script>`}
                </code>
              </pre>
            </figure>
          </div>
        </section>

        <section id="contractors" className="sc-section sc-tint" aria-labelledby="contractors-h">
          <div className="sc-wrap">
            <h2 id="contractors-h" className="sc-h2">
              Three ways contractors use it
            </h2>
            <p className="sc-intro">
              Homeowners never pay. Contractors subscribe to the parts they need. We&apos;ll set prices after the
              pilot, once we&apos;ve measured the time it saves.
            </p>
            <div className="sc-tiers" role="table" aria-label="Scoparity tiers">
              <div className="sc-tier" role="row">
                <h3 className="sc-h3" role="rowheader">
                  Website chat
                </h3>
                <p role="cell">
                  The estimate chat on your site, running on your prices. Customers get a range right away and your
                  staff stops building every quote by hand.
                </p>
                <span role="cell" className="sc-chip">
                  In the pilot
                </span>
              </div>
              <div className="sc-tier" role="row">
                <h3 className="sc-h3" role="rowheader">
                  Staff view
                </h3>
                <p role="cell">
                  The same estimate with your markup, gas and travel, and expected profit beside what the customer
                  sees, so you can tell quickly whether a job is worth taking.
                </p>
                <span role="cell" className="sc-chip sc-chip-plain">
                  Planned
                </span>
              </div>
              <div className="sc-tier" role="row">
                <h3 className="sc-h3" role="rowheader">
                  Phone line
                </h3>
                <p role="cell">
                  Customers who would rather call get the same itemized estimate over the phone.
                </p>
                <span role="cell" className="sc-chip sc-chip-plain">
                  Planned
                </span>
              </div>
            </div>
          </div>
        </section>

        <section id="guardrails" className="sc-section" aria-labelledby="guardrails-h">
          <div className="sc-wrap">
            <h2 id="guardrails-h" className="sc-h2">
              How the number stays honest
            </h2>
            <div className="sc-rules">
              <div>
                <h3 className="sc-h3">The AI never does the math</h3>
                <p>
                  The chat gathers details. Prices come only from the contractor&apos;s rules, calculated in code,
                  and a check blocks any reply with a price the engine didn&apos;t produce.
                </p>
              </div>
              <div>
                <h3 className="sc-h3">An estimate is called an estimate</h3>
                <p>
                  Every range lists what it assumes and carries a plain disclaimer. Only the contractor turns it into
                  a firm quote.
                </p>
              </div>
              <div>
                <h3 className="sc-h3">When in doubt, a person looks</h3>
                <p>
                  Signs of concealed damage send the job to an inspection. A wrong remote price hurts the homeowner
                  who planned around it and the contractor whose margin depended on it.
                </p>
              </div>
              <div>
                <h3 className="sc-h3">Licensed contractors do the work</h3>
                <p>
                  Suffolk and Nassau require home improvement licenses, so Scoparity never does or contracts the
                  work itself. It connects homeowners with licensed contractors.{" "}
                  <a className="sc-cite" href={SOURCES.suffolk}>
                    Suffolk
                  </a>{" "}
                  <a className="sc-cite" href={SOURCES.nassau}>
                    Nassau
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="sc-section sc-tint" aria-labelledby="roadmap-h">
          <div className="sc-wrap">
            <h2 id="roadmap-h" className="sc-h2">
              Where it goes from here
            </h2>
            <ol className="sc-timeline">
              <li>
                <p className="sc-when">Pilot</p>
                <p>
                  Nassau and Suffolk. Interior work: painting, flooring, drywall, and basic kitchen and bath jobs. We
                  compare our estimates with contractors&apos; own quotes and final invoices.
                </p>
              </li>
              <li>
                <p className="sc-when">By 2031</p>
                <p>
                  Exterior repairs, landscaping, power washing, and mechanical work. The New York City boroughs.
                  Phone and video calls for customers who would rather show the problem.
                </p>
              </li>
              <li>
                <p className="sc-when">By 2036</p>
                <p>
                  Other regions with dense homeownership, with time saved and estimate accuracy tracked against real
                  invoices.
                </p>
              </li>
            </ol>
          </div>
        </section>

        <section id="team" className="sc-section" aria-labelledby="team-h">
          <div className="sc-wrap sc-team">
            <div>
              <h2 id="team-h" className="sc-h2">
                Who&apos;s building it
              </h2>
              <p>
                Five MBA students at Stony Brook University&apos;s College of Business, building Scoparity for MBA
                571.
              </p>
              <ul className="sc-names">
                <li>Donovan Dutcher</li>
                <li>Ethan Rountree</li>
                <li>Kristen Rodrigues</li>
                <li>Linda Oppong</li>
                <li>Sophie Zarate</li>
              </ul>
            </div>
            <div className="sc-name-why">
              <img src="/brand/scoparity-logo.png" alt="Scoparity logo" width="320" height="238" />
              <p>
                <strong>Scope + clarity.</strong> Understanding the job and understanding its price. Navy stands for
                trust and professionalism, teal for innovation and clarity.
              </p>
            </div>
          </div>
        </section>

        <section className="sc-cta">
          <div className="sc-wrap sc-cta-inner">
            <div>
              <h2 className="sc-h2">Run a home service business on Long Island?</h2>
              <p>We&apos;re recruiting a small group of Nassau and Suffolk contractors for the pilot.</p>
            </div>
            <a href="/example-customer" className="sc-btn sc-btn-light">
              See it on a contractor&apos;s site
            </a>
          </div>
        </section>
      </main>

      <footer className="sc-footer">
        <div className="sc-wrap sc-footer-inner">
          <div className="sc-footer-brand">
            <img src="/brand/scoparity-wordmark-reversed.png" alt="Scoparity" width="134" height="32" />
            <p>Your vision. A clearer quote.</p>
          </div>
          <p className="sc-footer-note">
            A student venture from Stony Brook University, MBA 571. Concept stage: there are no live customers yet,
            and every business and price shown on this site is a sample.
          </p>
        </div>
      </footer>
    </div>
  );
}

const css = `
/* Layout: a light page on a cool navy-tinted neutral; one raised object (the estimate sheet);
   sections alternate white and mist; the navy band and footer close it out. */
.sc {
  --navy: #01305A;
  --navy-deep: #011F3B;
  --teal: #099491;
  --teal-ink: #07716E;
  --teal-soft: #E2F2F1;
  --paper: #FFFFFF;
  --mist: #F1F5F8;
  --ink: #0D1B2A;
  --muted: #4A5868;
  --line: #D8E0E7;
  --review: #8A4F00;
  --review-soft: #FBF1E2;
  --on-navy: #FFFFFF;
  --on-navy-muted: #B9C8D6;
  --display: var(--font-display), "Segoe UI", system-ui, sans-serif;
  --body: var(--font-body), "Segoe UI", system-ui, sans-serif;
  --mono: var(--font-mono), ui-monospace, Consolas, monospace;
  --r-sm: 4px;
  --r-md: 8px;
  --r-lg: 12px;

  color-scheme: light;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--body);
  font-size: 18px;
  line-height: 1.55;
}
.sc *, .sc *::before, .sc *::after { box-sizing: border-box; }
.sc img { max-width: 100%; height: auto; }
.sc p { margin: 0; }
.sc a { color: inherit; }
.sc :focus-visible { outline: 2px solid var(--teal-ink); outline-offset: 3px; border-radius: var(--r-sm); }

.sc-wrap {
  max-width: 1160px;
  margin: 0 auto;
  padding-left: max(20px, env(safe-area-inset-left, 0px));
  padding-right: max(20px, env(safe-area-inset-right, 0px));
}

/* Type scale: 14 / 18 / 22 / 30 / 40-60 */
.sc-h1 {
  font-family: var(--display);
  font-weight: 700;
  font-size: clamp(40px, 5.4vw, 60px);
  line-height: 1.08;
  letter-spacing: -0.01em;
  color: var(--navy);
  margin: 0;
  text-wrap: balance;
}
.sc-h2 {
  font-family: var(--display);
  font-weight: 600;
  font-size: clamp(26px, 3vw, 32px);
  line-height: 1.2;
  color: var(--navy);
  margin: 0 0 32px;
  max-width: 24ch;
  text-wrap: balance;
}
.sc-h3 {
  font-family: var(--display);
  font-weight: 600;
  font-size: 19px;
  line-height: 1.3;
  color: var(--ink);
  margin: 0 0 8px;
}

/* Nav */
.sc-nav { border-bottom: 1px solid var(--line); background: var(--paper); }
.sc-nav-inner { display: flex; align-items: center; gap: 32px; padding-block: 14px; }
.sc-brand { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; }
.sc-brand img:first-child { width: 40px; }
.sc-brand img:last-child { width: 117px; }
.sc-nav-links { display: flex; gap: 28px; margin-left: auto; font-size: 16px; }
.sc-nav-links a { text-decoration: none; color: var(--muted); }
.sc-nav-links a:hover { color: var(--navy); }
@media (max-width: 860px) {
  .sc-nav-links { display: none; }
  .sc-nav-inner > .sc-btn { margin-left: auto; }
}

/* Buttons and links */
.sc-btn {
  display: inline-flex; align-items: center; justify-content: center;
  min-height: 48px; padding: 0 22px;
  background: var(--navy); color: var(--on-navy);
  font-family: var(--display); font-weight: 600; font-size: 16px;
  border-radius: var(--r-md); text-decoration: none;
  transition: background-color 150ms ease;
}
.sc a.sc-btn { color: var(--on-navy); }
.sc-btn:hover { background: var(--navy-deep); }
.sc-btn-small { min-height: 40px; padding: 0 16px; font-size: 15px; }
.sc a.sc-btn-light { background: var(--paper); color: var(--navy); }
.sc-btn-light:hover { background: var(--teal-soft); }
.sc-link {
  font-weight: 600; color: var(--teal-ink); text-decoration: underline;
  text-underline-offset: 4px; text-decoration-thickness: 1px;
}
.sc a.sc-link { color: var(--teal-ink); }
.sc-link:hover { text-decoration-thickness: 2px; }
.sc-cite { font-size: 14px; color: var(--muted); white-space: nowrap; }
.sc a.sc-cite { color: var(--muted); }

/* Hero */
.sc-hero { background: var(--mist); padding-block: 64px 72px; }
.sc-hero-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 48px; align-items: center; }
@media (min-width: 960px) {
  .sc-hero-grid { grid-template-columns: minmax(0, 1fr) minmax(0, 520px); gap: 64px; }
}
.sc-hero-copy { display: flex; flex-direction: column; gap: 24px; }
.sc-lede { font-size: 18px; line-height: 1.55; color: var(--ink); max-width: 36em; }
@media (min-width: 700px) { .sc-lede { font-size: 20px; } }
.sc-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 16px 28px; }
.sc-note { font-size: 15px; color: var(--muted); }
.sc-hero-sample { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.sc-caption { font-size: 14px; color: var(--muted); max-width: 52ch; }

/* The estimate sheet: the one raised object on the page (shadow, no border) */
.sc-sheet {
  margin: 0;
  background: var(--paper);
  border-radius: var(--r-lg);
  box-shadow: 0 1px 2px rgba(1, 48, 90, 0.06), 0 16px 40px rgba(1, 48, 90, 0.10);
  padding: 24px;
  display: flex; flex-direction: column; gap: 20px;
}
.sc-sheet-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.sc-sheet-from { font-family: var(--display); font-weight: 600; font-size: 15px; color: var(--navy); }
.sc-sheet-job { font-size: 16px; color: var(--muted); }

.sc-chip {
  display: inline-flex; align-items: center; justify-self: start; align-self: start;
  padding: 3px 10px; border-radius: 999px;
  background: var(--teal-soft); color: var(--teal-ink);
  font-size: 14px; font-weight: 600; white-space: nowrap;
}
.sc-chip-review { background: var(--review-soft); color: var(--review); }
.sc-chip-plain { background: var(--mist); color: var(--muted); }

.sc-sheet-options { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
@media (max-width: 520px) { .sc-sheet-options { grid-template-columns: minmax(0, 1fr); } }
.sc-seg { border: 0; margin: 0; padding: 0; min-width: 0; }
.sc-seg-label { font-size: 14px; color: var(--muted); padding: 0; margin-bottom: 6px; }
.sc-seg-buttons { display: flex; border: 1px solid var(--line); border-radius: var(--r-md); padding: 2px; gap: 2px; }
.sc-seg-buttons button {
  flex: 1; min-height: 36px; border: 0; border-radius: 6px;
  background: transparent; color: var(--ink);
  font: 600 14px/1 var(--body); cursor: pointer;
  transition: background-color 150ms ease, color 150ms ease;
}
.sc-seg-buttons button:hover { background: var(--mist); }
.sc-seg-buttons button[aria-pressed="true"] { background: var(--navy); color: var(--on-navy); }

.sc-sheet-result { min-height: 172px; display: flex; flex-direction: column; justify-content: space-between; gap: 16px; }
.sc-lines { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; font-size: 16px; }
.sc-lines li { display: flex; align-items: baseline; gap: 8px; }
.sc-leader { flex: 1; border-bottom: 1px dotted var(--line); transform: translateY(-4px); min-width: 16px; }
.sc-amount { font-family: var(--mono); font-variant-numeric: tabular-nums; font-size: 15px; }
.sc-range {
  display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 4px 16px;
  border-top: 1px solid var(--line); padding-top: 16px;
}
.sc-range-label { font-size: 15px; color: var(--muted); }
.sc-range-value {
  font-family: var(--display); font-weight: 700; font-size: 30px; line-height: 1.1;
  color: var(--navy); font-variant-numeric: tabular-nums;
}
.sc-review { background: var(--review-soft); border-radius: var(--r-md); padding: 16px; display: flex; flex-direction: column; gap: 6px; font-size: 16px; }
.sc-review-title { font-weight: 600; color: var(--review); }

.sc-track { list-style: none; margin: 0; padding: 0; display: flex; gap: 8px; font-size: 14px; color: var(--muted); flex-wrap: wrap; }
.sc-track li { display: flex; align-items: center; gap: 8px; }
.sc-track li + li::before { content: ""; width: 20px; height: 1px; background: var(--line); }
.sc-track li[aria-current="step"] { color: var(--teal-ink); font-weight: 600; }

/* Sections */
.sc-section { padding-block: 88px; }
.sc-tint { background: var(--mist); }
.sc-intro { max-width: 60ch; margin: -16px 0 32px; color: var(--muted); }
.sc-two { display: grid; grid-template-columns: minmax(0, 1fr); gap: 40px; }
@media (min-width: 860px) { .sc-two { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 64px; } }
.sc-two p { max-width: 60ch; }

/* How it works: a real four-step sequence, so it's numbered */
.sc-steps { list-style: none; margin: 0; padding: 0; counter-reset: step; display: grid; grid-template-columns: minmax(0, 1fr); gap: 32px; }
@media (min-width: 700px) { .sc-steps { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (min-width: 1080px) { .sc-steps { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 28px; } }
.sc-steps li { counter-increment: step; border-top: 2px solid var(--navy); padding-top: 16px; }
.sc-steps li::before {
  content: counter(step); display: block;
  font-family: var(--display); font-weight: 600; font-size: 22px; color: var(--teal-ink); margin-bottom: 8px;
}
.sc-steps p { font-size: 17px; color: var(--muted); }

/* Install */
.sc-install { display: grid; grid-template-columns: minmax(0, 1fr); gap: 40px; align-items: center; }
@media (min-width: 900px) { .sc-install { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 64px; } }
.sc-install > div { display: flex; flex-direction: column; gap: 16px; }
.sc-install .sc-h2 { margin-bottom: 8px; }
.sc-install p { max-width: 56ch; }
.sc-code { margin: 0; background: var(--navy-deep); border-radius: var(--r-lg); padding: 20px 24px; min-width: 0; }
.sc-code figcaption { color: var(--on-navy-muted); font-size: 14px; margin-bottom: 12px; }
.sc-code pre { margin: 0; overflow-x: auto; }
.sc-code code { font-family: var(--mono); font-size: 15px; line-height: 1.6; color: var(--on-navy); white-space: pre; }

/* Tiers: a comparison list, not a card grid */
.sc-tiers { border-top: 1px solid var(--line); }
.sc-tier {
  display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px;
  padding-block: 24px; border-bottom: 1px solid var(--line);
}
@media (min-width: 760px) {
  .sc-tier { grid-template-columns: 200px minmax(0, 1fr) 140px; gap: 32px; align-items: baseline; }
  .sc-tier .sc-chip { justify-self: end; }
}
.sc-tier .sc-h3 { margin: 0; }
.sc-tier p { max-width: 62ch; color: var(--muted); }

/* Guardrails */
.sc-rules { display: grid; grid-template-columns: minmax(0, 1fr); gap: 40px 64px; }
@media (min-width: 860px) { .sc-rules { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.sc-rules p { color: var(--muted); max-width: 54ch; }

/* Timeline: a real order in time */
.sc-timeline { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: minmax(0, 1fr); gap: 32px; }
@media (min-width: 860px) { .sc-timeline { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 40px; } }
.sc-timeline li { position: relative; padding-top: 28px; border-top: 1px solid var(--line); }
.sc-timeline li::before {
  content: ""; position: absolute; top: -6px; left: 0;
  width: 11px; height: 11px; border-radius: 50%; background: var(--line);
}
.sc-timeline li:first-child::before { background: var(--teal); }
.sc-when { font-family: var(--display); font-weight: 600; font-size: 19px; color: var(--navy); margin-bottom: 8px !important; }
.sc-timeline p:not(.sc-when) { color: var(--muted); max-width: 46ch; }

/* Team */
.sc-team { display: grid; grid-template-columns: minmax(0, 1fr); gap: 48px; align-items: center; }
@media (min-width: 860px) { .sc-team { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 64px; } }
.sc-team .sc-h2 { margin-bottom: 16px; }
.sc-names { list-style: none; margin: 24px 0 0; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 24px; font-family: var(--display); font-weight: 600; font-size: 18px; color: var(--navy); }
@media (max-width: 420px) { .sc-names { grid-template-columns: minmax(0, 1fr); } }
.sc-name-why { display: flex; flex-direction: column; gap: 20px; align-items: flex-start; }
.sc-name-why img { width: 240px; }
.sc-name-why p { color: var(--muted); max-width: 46ch; }
.sc-name-why strong { color: var(--ink); }

/* Closing band and footer */
.sc-cta { background: var(--navy); color: var(--on-navy); padding-block: 64px; }
.sc-cta-inner { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 24px 48px; }
.sc-cta .sc-h2 { color: var(--on-navy); margin-bottom: 8px; }
.sc-cta p { color: var(--on-navy-muted); }
.sc-footer { background: var(--navy-deep); color: var(--on-navy-muted); padding-block: 40px; font-size: 15px; }
.sc-footer-inner { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 24px 48px; align-items: flex-start; }
.sc-footer-brand { display: flex; flex-direction: column; gap: 10px; }
.sc-footer-brand img { width: 134px; }
.sc-footer-note { max-width: 52ch; }

@media (prefers-reduced-motion: reduce) {
  .sc * { transition: none !important; }
}
`;
