import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { notFound } from "next/navigation";
import { loadClient } from "../../lib/rules.js";
import { buildTheme } from "../../lib/theme.js";
import DevChat from "./DevChat.js";

export const dynamic = "force-dynamic";

export default async function DevPage({ searchParams }) {
  if (process.env.NODE_ENV === "production" && process.env.QUOTEBOT_ALLOW_TEST_MODE !== "1") {
    notFound();
  }

  const { client = "example-drywall" } = await searchParams;

  const loaded = await loadClient(client);
  if (!loaded) notFound();
  const { rules, brand } = loaded;

  const tokens = JSON.parse(
    await readFile(join(process.cwd(), "design", "tokens.json"), "utf8")
  );
  const theme = buildTheme(tokens, brand);

  return (
    <div
      style={{
        ...theme,
        minHeight: "100vh",
        background: "var(--qb-color-surface-muted)",
        fontFamily: "var(--qb-font)",
        color: "var(--qb-color-text)",
      }}
    >
      <DevChat
        clientId={client}
        businessName={brand.business_name}
        phone={rules.business.phone}
      />
    </div>
  );
}
