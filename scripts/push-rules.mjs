// Uploads a client's pricing rules to Supabase as a new version.
//
//   node --env-file-if-exists=.env.local scripts/push-rules.mjs clients/example-drywall
//
// Rules stay files in the repo; this makes the database copy the bot prices from.
// signed_off_by_owner is never set here (golden rule 5): a real owner signs the sheet,
// then someone flips it in Supabase.

import { readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { dbEnabled, insertRow, selectRows, upsertRow } from "../lib/db.js";
import { estimate } from "../engine/price.js";

const dir = process.argv[2];
if (!dir) {
  console.error("Usage: node scripts/push-rules.mjs clients/<client-id>");
  process.exit(1);
}
if (!dbEnabled()) {
  console.error("No Supabase settings found. Fill NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local.");
  process.exit(1);
}

const slug = basename(dir);
const rules = JSON.parse(readFileSync(join(dir, "pricing-rules.json"), "utf8"));
const brand = JSON.parse(readFileSync(join(dir, "brand.json"), "utf8"));

// Cheap sanity checks before anything reaches the database.
const problems = [];
if (rules.client_id !== slug) problems.push(`client_id "${rules.client_id}" does not match the folder "${slug}"`);
if (!rules.rules_version) problems.push("rules_version is missing");
if (!Array.isArray(rules.fields) || rules.fields.length === 0) problems.push("fields is empty");
if (!Array.isArray(rules.services) || rules.services.length === 0) problems.push("services is empty");
if (!rules.estimate_policy?.disclaimer) problems.push("estimate_policy.disclaimer is missing");
// The engine must at least run on these rules.
try {
  estimate(rules, {});
} catch (err) {
  problems.push(`the pricing engine can't read these rules: ${err.message}`);
}
if (problems.length) {
  console.error(`Not pushed. Fix these first:\n- ${problems.join("\n- ")}`);
  process.exit(1);
}

const client = await upsertRow(
  "clients",
  { slug, business_name: brand.business_name ?? slug, brand, is_demo: brand.is_demo === true },
  "slug"
);

const existing = await selectRows(
  "rules_versions",
  `client_id=eq.${client.id}&version=eq.${encodeURIComponent(rules.rules_version)}&select=id&limit=1`
);
if (existing[0]) {
  console.error(
    `Version ${rules.rules_version} is already in the database for ${slug}.\n` +
      "Bump rules_version in pricing-rules.json so old estimates still point at the rules that priced them."
  );
  process.exit(1);
}

const row = await insertRow("rules_versions", {
  client_id: client.id,
  version: rules.rules_version,
  rules,
  signed_off_by_owner: false,
});

console.log(`Pushed ${slug} rules version ${row.version}.`);
console.log("signed_off_by_owner is false. Only flip it after a real owner signs the sheet.");
