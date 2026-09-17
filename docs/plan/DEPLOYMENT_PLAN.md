# Quotebot: Deployment Plan (v0.2)

> **Reference snapshot (Sep 17, 2026).** Written during planning in Claude (Cowork). Some details here were later refined. If this file disagrees with `docs/PROJECT_BRIEF.md` or `docs/DECISIONS.md`, those win.

**Question:** Is GitHub + Vercel + Supabase enough to run Quotebot for real clients?
**Short answer:** It's the right core, and it covers most of what we need. But you need their **paid plans** once a real business uses it, plus a few extra pieces your personal projects never needed.
**Date:** Sep 15, 2026 (prices as listed this month; check before signing up)

---

## Team decisions (Sep 15)

| Decision | Status | What it means |
|---|---|---|
| **Lead alerts by email + leads stored in Supabase** | In, on free tiers | Every lead is saved in the database and emailed to the owner. Resend's free tier (3,000 emails a month, 100 a day) is plenty for pilots. |
| **Spending limits on every paid account** | In | Caps on the AI accounts, Vercel, and Supabase before anything goes live. |
| **API keys stay on the server** | In | The widget never holds a key. Only our server endpoints do. |
| **Shrink photos in the browser before upload** | In | Faster, cheaper, and removes hidden GPS location data. |
| **Stripe** | Later | Pilots are free, so billing can wait. See "Later" below. |
| **Shared password manager** | Later | Use the interim key rules below until then. |

**Still recommended, not decided yet:** the domain name (**email sending needs one**, see below), abuse protection, and error/uptime alerts. All three are free or nearly free.

---

## Why this is different from your local projects

| | Your personal projects | Quotebot |
|---|---|---|
| Who uses it | You | Strangers, on someone else's website |
| Cost of a bug | Nothing | A wrong price shown to a real homeowner, or a lost lead |
| Data | Yours | Photos of people's homes, names, phone numbers, addresses |
| API keys | Safe on your computer | Must stay hidden from anyone who opens the page code |
| Downtime | Annoying | The client loses customers and blames you |
| Money | Free tiers | AI usage, which anyone on the internet can trigger |

Every extra piece below exists because of one of these rows.

---

## 1. What we actually hand the client

**For the business owner:**

1. **Chat widget on their website.** One line of code pasted into their site.
2. **A hosted quote page link** (like `quote.ourdomain.com/example-drywall`). They can put it on their Google Business Profile, Facebook, or in texts. It's also the backup if their website builder won't allow custom code.
3. **Lead alerts.** An email (text messages later) with the customer's details, the job, the estimate, and photos.
4. **An owner portal.** A login where they see their leads, chats, current prices, and monthly numbers.
5. **Price updates.** They send changes (or edit a price sheet), we update the rules, test them, and publish.
6. **Service.** Setup, a monthly report, and someone to call when something's off.

**For the homeowner:** chat, get an estimate card, leave their name and number, get a confirmation.

**For us only (admin):** client list, rules versions, test results, GPT checker results, AI spend, and an on/off switch per client.

---

## 2. One system for everyone, not one per client

Think of it like an apartment building. We run **one** building (one Vercel project, one Supabase database). Each client gets their own locked unit. Adding a client means adding their info and rules, not setting up new servers.

**Why:**

- **Cheaper.** Supabase charges per project, and the free plan only allows 2 active projects.
- **One fix fixes everyone.**
- **One place to watch** for errors and costs.

**The lock on each unit** is a Supabase feature called Row Level Security (RLS). It's a rule on each table that says "an owner can only see rows with their own client ID." If we get this wrong, one client could see another client's customers. It's the most important security setting in the whole system.

---

## 3. The components, and exactly why we need each one

### Core (what you already use, on paid plans)

| Component | What it does for Quotebot | Why it's needed | Plan and cost |
|---|---|---|---|
| **GitHub** | Stores the code and its history. **GitHub Actions** runs the pricing tests and golden sets on every change. | So a broken pricing engine can never go live without someone noticing. Also lets 5 people work on the same code safely. | Free is fine |
| **Vercel** | Hosts the widget script, demo pages, hosted quote pages, owner portal, and the server endpoints (`/api/chat`, `/api/lead`, `/api/upload-url`). | The widget and pages need to load fast anywhere. The server endpoints keep API keys secret. Preview links let us test changes before they go live. | **Pro: $20/month per developer seat**, includes $20 of usage. The free Hobby plan is for personal, non-commercial use only. Pro has spending caps. |
| **Supabase** | Database (clients, rules, chats, leads), owner logins, photo storage, access rules (RLS), scheduled jobs (weekly reports, photo cleanup). | Everything that needs to be saved lives here. | **Pro: $25/month.** Free projects **pause after 1 week of no activity** (a client's bot would go dead) and have **no backups**. Pro never pauses, keeps 7 days of daily backups, and has a spending cap on by default. |

**When to switch to paid:** free plans are fine while building and for class demos with fake clients. Switch before any real business uses it, even for a free pilot.

### New pieces we need

| Component | What it does | Why it's needed | Cost to start |
|---|---|---|---|
| **Domain name** | Our own web address for the widget, quote pages, and email. | **Needed for the email decision:** email services send from a domain you own and have verified, or alerts end up in spam. Also looks professional. | About $10 to $20 a year for a .com |
| **AI accounts** (OpenRouter or Moonshot for Kimi, OpenAI for the GPT checker) **[decided: spending limits + server-only keys]** | Run the chatbot and the checker. | The keys only live on the server. **Set a monthly spending limit on each account.** | Usage only (a few dollars per client per month; see the Build Framework) |
| **Email sending** (Resend) + **lead storage** (Supabase) **[decided]** | Saves every lead in the `leads` table, then emails the owner (and a confirmation to the homeowner). | Lead alerts are the part owners actually pay for. Saving first means no lead is lost if an email fails; we can resend it. | Free for 3,000 emails a month (100 a day); $20/month for 50,000 when we outgrow it |
| **Abuse protection** (Cloudflare Turnstile, which is free, plus our own limits) | An invisible "are you human" check, a cap on messages per chat and per visitor, and a list of websites allowed to use each client's widget. | The widget is public. Without this, anyone could run up our AI bill or flood an owner with fake leads. | Free |
| **Error tracking** (for example Sentry) and an **uptime monitor** | Tells us when something breaks, with an alert to our phones. | When the bot breaks on a Saturday night, we should know before the client does. | Free tiers to start |

### Later (not needed for the first client)

| Component | Why wait |
|---|---|
| **Text messages** (for example Twilio) | US carriers block unregistered business texts (since Feb 2025, per one guide). Registration (called A2P 10DLC) costs about $25 to $72 one time, up to about $11 a month, plus per-text fees, and takes about 3 to 7 business days. Email works on day one. |
| **Jobber / Housecall Pro connection** | Only worth building once several clients use the same tool. |
| **Booking calendar** | Start by linking to the owner's existing booking page or just "we'll call you." |
| **Extra Vercel seats** | Only people who deploy need a seat ($20 each). Everyone else can view for free. |
| **Payments** (Stripe) **[deferred Sep 15]** | Pilots are free. Add Stripe when the first pilot turns into a paying client. Until then, a simple invoice works for one or two clients. |
| **Shared password manager** (for example 1Password or Bitwarden) **[deferred Sep 15]** | Worth adding once more than one or two people need production access. Follow the interim key rules below until then. |

### Interim key rules (until the password manager is set up)

1. **One person (Donny) holds the production keys.** They live only in the Vercel and Supabase settings, nowhere else.
2. **Teammates use their own staging keys** with low spending limits.
3. **Never paste a key** into a group chat, text, email, doc, or code file.
4. **If a key is ever shared by accident, replace it right away** (every provider has a "revoke" or "rotate" button).
5. **Turn on two-factor login** for GitHub, Vercel, Supabase, and the AI accounts.

---

## 4. How the pieces connect

```
Homeowner on the client's website
   |
   |  1. Widget loads from Vercel (fast, cached)
   |  2. Invisible human check (Turnstile)
   v
Vercel: /api/chat  (the server, holds all secret keys)
   |-- checks: is this website allowed for this client? too many messages?
   |-- loads the client's current rules from Supabase
   |-- sends the conversation to Kimi (through OpenRouter or Moonshot)
   |-- Kimi asks to run get_estimate -> the pricing engine runs HERE, on the server
   |-- the guard checks the reply for made-up prices
   |-- saves messages + estimate (with the rules version) to Supabase
   v
Reply goes back to the widget once the guard approves it

Photos:  widget -> asks /api/upload-url -> uploads the photo straight to Supabase Storage
Leads:   widget -> /api/lead -> saved in Supabase -> email to owner (Resend)
Checker: a scheduled job sends flagged + sampled chats to GPT, saves the grades
Owner:   logs into the portal (Supabase login) -> sees only their own data (RLS)
```

**Why it's built this way:**

- **Keys never go in the widget.** Anyone can open a website's code and read it. The widget only talks to our server, and our server holds the keys.
- **Photos skip our server.** Vercel's server endpoints reject anything over 4.5 MB, and phone photos are often bigger. So the server hands out a one-time upload link and the photo goes straight to Supabase Storage.
- **Shrink photos in the browser first [decided].** It's faster and cheaper, and it removes hidden location data (phone photos can carry GPS coordinates of the house). Suggested defaults:
  - Resize so the longest side is about 1600 pixels and save as JPEG at about 80% quality. Redrawing the image this way also drops the hidden location data.
  - Accept only image files, up to 3 photos per chat.
  - Upload with the one-time link from `/api/upload-url`. The link only works for that one file and expires quickly.
- **Pricing runs on the server, not in the browser.** Otherwise someone could change the numbers on their screen and the lead we save would show a fake estimate.
- **Every estimate saves which rules version priced it.** If an owner says "the bot quoted too low," we can show exactly what rules were live.
- **Time limits aren't a problem.** Vercel lets a request run up to 5 minutes by default, and time spent waiting on the AI doesn't count as active CPU on the bill.
- **Don't stream replies (for now).** The guard has to read the whole reply before the customer sees it, or a made-up price could flash on screen. Replies are short, so a typing indicator is enough.

---

## 5. Starter database tables

| Table | Holds |
|---|---|
| `clients` | Business name, brand settings, status (on/off), plan |
| `client_domains` | Websites allowed to load each client's widget |
| `owners` | Links an owner's login to their client |
| `rules_versions` | Every version of each client's pricing rules, who signed off, and when |
| `conversations` | One row per chat (client, start time, outcome) |
| `messages` | Every message, including blocked ones and why they were blocked |
| `photos` | Photo file location, linked chat, delete-after date |
| `estimates` | Engine input, engine output, rules version |
| `leads` | Name, phone, email, best time, linked estimate, alert sent? |
| `events` | Widget opened, estimate shown, lead submitted (for owner reports) |
| `judge_results` | GPT checker grades per chat |

**Access rules (RLS):** turned on for every table. Owners can read only their own client's rows. The widget never writes to the database directly. Only our server does, using a special key that must never leave the server.

---

## 6. Monthly cost at launch

| Item | Monthly |
|---|---|
| Vercel Pro (1 seat) | $20 |
| Supabase Pro | $25 |
| Domain | about $1 to $2 |
| Email, bot check, error tracking, uptime monitor | $0 on free tiers |
| **Fixed total** | **about $46 to $47** |
| AI per client (chatbot + sampled GPT checks) | a few dollars to about $20 each |
| Extra Vercel seats | $20 each, only if needed |

**What this means:** one paying client at a normal market price covers the fixed costs. Costs grow slowly per client after that.

---

## 7. Before the first real client goes live

**Security**

- [ ] RLS on for every table (Supabase's security advisor shows no warnings)
- [ ] Secret keys only in Vercel and Supabase settings, never in code or the widget
- [ ] Allowed websites set for the client
- [ ] Message limits and the human check working
- [ ] Spending caps set on Vercel, Supabase, and every AI account

**Legal**

- [ ] Privacy policy and terms on our site
- [ ] Client agreement (what we provide, price, who owns the data, estimate disclaimer, what happens if the bot is wrong)
- [ ] Photo retention rule (for example, delete after 90 days; the team decides)

**Quality**

- [ ] Golden set passes; GPT checker meets the ship bar
- [ ] Design checklist passes
- [ ] Tested on the client's actual website builder

**Operations**

- [ ] Error and downtime alerts reach someone's phone
- [ ] Backup confirmed
- [ ] On/off switch tested (when off, the widget shows a "Call us" button instead of breaking)

**Billing**

- [ ] Pilot terms written down (free for 30 days, and the price after)
- [ ] Stripe set up before the first pilot converts to paid (deferred for now)

---

## 8. Adding a client (after the one-time setup)

1. Add the client and their allowed website(s)
2. Upload their signed rules as a new rules version
3. Run the golden set and GPT checker in the test environment
4. Turn the client on and create the owner's login
5. **Install the widget** by pasting one line of code:
   - **Wix:** the site must be published with a connected domain (which needs a paid Wix plan)
   - **Squarespace:** code injection is available on Core, Plus, and Advanced plans
   - **WordPress:** a header/footer plugin or the theme settings
   - **No custom code allowed?** Use the hosted quote page link as a button instead
6. Send a test lead and confirm the owner gets the email
7. Read the first 50 real chats by hand

**Ask about their website builder and plan on the sales call.** It decides which install option you use.

---

## 9. First-time setup order

1. Buy the domain. Turn on two-factor login everywhere. Follow the interim key rules.
2. Create a GitHub organization and repo from the starter kit. Turn on GitHub Actions to run the tests.
3. Create two Supabase projects: **staging** (for testing) and **production** (live clients). Add the tables and RLS.
4. Connect the repo to Vercel. Add secret keys as environment variables. Staging keys go on preview links, production keys on the live site.
5. Create AI accounts and set spending limits. Set spending caps on Vercel and Supabase too.
6. Set up Resend (free tier) and verify the domain. Build the lead flow: save to `leads` first, then send the email, and mark `alert sent` when it succeeds.
7. Build `/api/chat` end to end with the fake drywall client in staging.
8. Add the human check, message limits, error tracking, and the uptime monitor.
9. Publish the privacy policy and terms.
10. Upgrade Vercel and Supabase to paid plans right before the first real business uses it.

---

## Plain-English glossary

- **Environment variable:** a secret setting (like an API key) stored on the hosting service, not in the code.
- **Serverless function / endpoint:** a small piece of server code that runs only when called (like `/api/chat`).
- **RLS (Row Level Security):** database rules that decide who can see which rows.
- **Staging:** a copy of the system for testing, so mistakes don't reach real clients.
- **Signed upload link:** a one-time, time-limited link that lets a browser upload one file without having our keys.
- **Rate limit:** a cap on how often someone can do something (like send 20 messages a minute).
- **CDN / cached:** copies of files stored around the world so they load fast.

---

## Sources

- [Vercel pricing](https://vercel.com/pricing)
- [Vercel function limits](https://vercel.com/docs/functions/limitations)
- [Supabase pricing](https://supabase.com/pricing)
- [Resend pricing](https://resend.com/pricing)
- [Wix: embedding custom code](https://support.wix.com/en/article/embedding-custom-code-on-your-site)
- [Squarespace: using code injection](https://support.squarespace.com/hc/en-us/articles/205815908-Using-code-injection)
- [A2P 10DLC fees explained (GHL Scale Up)](https://www.ghlscaleup.com/blog/a2p-10dlc-fees-explained)
- [Twilio A2P 10DLC campaign registration](https://www.twilio.com/docs/trust-hub/registrations/a2p-10dlc-campaign)
