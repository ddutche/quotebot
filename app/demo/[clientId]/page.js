// Branded demo / landing page for one client. Server component only.
// The persuasion here is the working chat widget, not the decoration around it
// (see design/DESIGN_RULES.md section 0). Keep this page quiet.

import { notFound } from "next/navigation";
import Script from "next/script";
import { loadClient } from "../../../lib/rules.js";
import { loadTokens } from "../../../lib/tokens.js";
import { publicClientConfig } from "../../../lib/client-config.js";

export const dynamic = "force-dynamic";

async function getData(clientId) {
  const client = await loadClient(clientId);
  if (!client) return null;
  const tokens = await loadTokens();
  const config = publicClientConfig({ ...client, tokens });
  return { client, config };
}

export async function generateMetadata({ params }) {
  const { clientId } = await params;
  const data = await getData(clientId);
  if (!data) return {};
  return { title: `${data.config.business_name}: get an estimate` };
}

export default async function DemoPage({ params }) {
  const { clientId } = await params;
  const data = await getData(clientId);
  if (!data) notFound();

  const { client, config } = data;
  const { rules, brand } = client;
  const trade = config.trade || "repair";
  const zips = rules.business?.service_zips ?? [];
  const trust = brand.trust_facts ?? {};
  const hasTrust =
    trust.licensed_insured === true ||
    typeof trust.years_in_business === "number" ||
    (trust.review_rating != null && trust.review_count != null);
  const telHref = `tel:${String(config.phone ?? "").replace(/[^\d+]/g, "")}`;
  const fontHref = `https://fonts.googleapis.com/css2?family=${config.font.replace(/ /g, "+")}:wght@400;700&display=swap`;

  return (
    <div
      className="qb-demo"
      style={{
        ...config.theme,
        background: "var(--qb-color-surface)",
        color: "var(--qb-color-text)",
        fontFamily: "var(--qb-font)",
      }}
    >
      <link rel="stylesheet" href={fontHref} precedence="default" />
      <style>{css}</style>

      {config.is_demo ? (
        <div className="qb-demo-label">Demo business, sample prices. This isn't a real company.</div>
      ) : null}

      <header className="qb-hero">
        <div className="qb-hero-grid">
          {config.logo_url ? (
            <img className="qb-logo" src={config.logo_url} alt={`${config.business_name} logo`} />
          ) : null}
          <h1 className="qb-h1">{config.business_name}</h1>
          <p className="qb-pitch">Get a {trade} estimate in about a minute.</p>
          <div id="quotebot-chat" className="qb-chat-container">
            <p className="qb-chat-loading">Loading the estimate chat…</p>
          </div>
          {config.tagline ? <p className="qb-tagline">{config.tagline}</p> : null}
        </div>
      </header>

      <section className="qb-section">
        <h2 className="qb-h2">How it works</h2>
        <ol className="qb-steps">
          <li>
            <p className="qb-step-title">Describe the job</p>
            <p className="qb-step-text">Tell us what's damaged, in your own words.</p>
          </li>
          <li>
            <p className="qb-step-title">Add a photo if you can</p>
            <p className="qb-step-text">It helps us check the details.</p>
          </li>
          <li>
            <p className="qb-step-title">Get your estimate range</p>
            <p className="qb-step-text">Then leave your number and we'll call to confirm.</p>
          </li>
        </ol>
      </section>

      {hasTrust ? (
        <section className="qb-section">
          <h2 className="qb-h2">About {config.business_name}</h2>
          <ul className="qb-trust">
            {trust.licensed_insured === true ? <li>Licensed and insured</li> : null}
            {typeof trust.years_in_business === "number" ? (
              <li>{trust.years_in_business} years in business</li>
            ) : null}
            {trust.review_rating != null && trust.review_count != null ? (
              <li>{trust.review_rating} average from {trust.review_count} reviews</li>
            ) : null}
          </ul>
        </section>
      ) : null}

      <footer className="qb-footer">
        <p>
          <a className="qb-phone-link" href={telHref}>Call {config.phone}</a>
        </p>
        <p>{config.hours}</p>
        {zips.length > 0 ? <p>Serving ZIP codes {zips.join(", ")}</p> : null}
        <p className="qb-disclaimer">Estimates are ranges. Final price is confirmed in person.</p>
      </footer>

      <Script src="/widget.js" strategy="afterInteractive" data-client={clientId} data-mode="inline" data-target="#quotebot-chat" />
    </div>
  );
}

const css = `
.qb-demo {
  font-size: var(--qb-text-base);
  line-height: var(--qb-leading-normal);
}

.qb-demo-label {
  background: var(--qb-color-surface-muted);
  color: var(--qb-color-text);
  font-size: var(--qb-text-sm);
  text-align: center;
  padding: var(--qb-space-2) var(--qb-space-4);
}

.qb-hero,
.qb-section,
.qb-footer {
  max-width: var(--qb-page-max-width);
  margin: 0 auto;
  padding-left: var(--qb-space-4);
  padding-right: var(--qb-space-4);
}

.qb-hero {
  padding-top: var(--qb-space-7);
  padding-bottom: var(--qb-space-7);
}

.qb-hero-grid {
  display: grid;
  /* minmax(0, ...) so the chat can't push the column wider than the screen */
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas: "logo" "h1" "pitch" "chat" "tagline";
  gap: var(--qb-space-3);
}

.qb-logo {
  grid-area: logo;
  height: var(--qb-space-8);
  width: auto;
  object-fit: contain;
}

.qb-h1 {
  grid-area: h1;
  font-size: var(--qb-text-3xl);
  font-weight: var(--qb-weight-bold);
  line-height: var(--qb-leading-tight);
  margin: 0;
}

.qb-pitch {
  grid-area: pitch;
  font-size: var(--qb-text-xl);
  margin: 0;
  max-width: 65ch;
}

.qb-tagline {
  grid-area: tagline;
  font-size: var(--qb-text-lg);
  color: var(--qb-color-text-muted);
  margin: 0;
  max-width: 65ch;
}

.qb-chat-container {
  grid-area: chat;
  min-height: calc(var(--qb-space-8) * 9);
}

.qb-chat-loading {
  color: var(--qb-color-text-muted);
  font-size: var(--qb-text-base);
  margin: 0;
}

.qb-chat-container:has(quotebot-widget) .qb-chat-loading {
  display: none;
}

@media (min-width: 768px) {
  .qb-hero-grid {
    grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
    /* The chat spans all rows; let the last row soak up its height so the text stays at the top */
    grid-template-rows: auto auto auto 1fr;
    grid-template-areas:
      "logo chat"
      "h1 chat"
      "pitch chat"
      "tagline chat";
    column-gap: var(--qb-space-6);
    align-content: start;
  }
}

.qb-section {
  padding-top: var(--qb-space-8);
  padding-bottom: var(--qb-space-8);
}

.qb-h2 {
  font-size: var(--qb-text-2xl);
  font-weight: var(--qb-weight-bold);
  line-height: var(--qb-leading-tight);
  margin: 0 0 var(--qb-space-5) 0;
}

.qb-steps {
  margin: 0;
  padding-left: var(--qb-space-5);
  display: flex;
  flex-direction: column;
  gap: var(--qb-space-5);
}

.qb-steps > li {
  padding-left: var(--qb-space-2);
}

.qb-step-title {
  font-weight: var(--qb-weight-bold);
  margin: 0 0 var(--qb-space-1) 0;
}

.qb-step-text {
  color: var(--qb-color-text-muted);
  margin: 0;
  max-width: 65ch;
}

@media (min-width: 768px) {
  .qb-steps {
    flex-direction: row;
    gap: var(--qb-space-6);
  }
  .qb-steps > li {
    flex: 1;
  }
}

.qb-trust {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--qb-space-2);
}

.qb-footer {
  padding-top: var(--qb-space-6);
  padding-bottom: var(--qb-space-7);
  border-top: 1px solid var(--qb-color-border);
  display: flex;
  flex-direction: column;
  gap: var(--qb-space-2);
}

.qb-footer p {
  margin: 0;
}

.qb-phone-link {
  color: var(--qb-color-brand-text);
  font-weight: var(--qb-weight-bold);
  text-decoration: none;
}

.qb-phone-link:hover,
.qb-phone-link:focus {
  text-decoration: underline;
}

.qb-disclaimer {
  font-size: var(--qb-text-sm);
  color: var(--qb-color-text-muted);
}
`;
