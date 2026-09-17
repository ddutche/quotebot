# Quotebot: Competitor & Market Research (v0.1)

> **Reference snapshot (Sep 17, 2026).** Written during planning in Claude (Cowork). Some details here were later refined. If this file disagrees with `docs/PROJECT_BRIEF.md` or `docs/DECISIONS.md`, those win.

**Researched:** Sep 15, 2026
**Goes with:** Quotebot_Competitor_Matrix.xlsx (full price table, lead costs, niche scorecard, owner value calculator, sources)
**Read this with care:** prices come from vendor pricing pages where possible. Some come from third-party blogs or user reports, and several of those blogs are written by competitors. Those are marked. Check again before putting a number on a slide.

---

## Bottom line

1. **Nobody sells what we're building off the shelf.** Instant-quote tools for home services exist, but they are **forms**, not conversations, and none of the off-the-shelf tools we found for repair trades estimate from a **homeowner's photo** (junk removal is starting to get these). The only company doing photo quoting for handymen sells it as a **custom build for $6,000 to $14,000**.
2. **The price ceiling for off-the-shelf tools is roughly $179 to $299 a month.** ResponsiBid's instant quoting runs $179 to $229 a month (plus a reported $500 to $600 setup). QuoteIQ's instant-quote widget needs its $299 plan.
3. **Big setup fees only show up in two places:** high-ticket trades (Roofle charges roofers $350 a month + $2,000 setup) and custom builds. For owner-operated repair businesses, Ethan's $2,500 to $15,000 setup fee will be a hard sell.
4. **Best first target: owner-operated handyman and drywall repair businesses (1 to 10 people) doing residential interior repairs, in one metro area.** Year-round work, flat per-task pricing, and very little competition for photo-based instant estimates. Power washing is the most crowded niche we looked at.
5. **Suggested pricing to test:** about $99 to $149 a month self-serve, and about $249 to $299 a month done-for-you with a small setup fee. These are guesses to test in interviews, not answers.
6. **Validate with evidence, not opinions:** time how fast local businesses answer a quote request (repeating a Harvard Business Review study method), run 10 to 15 owner interviews about past behavior, and ask for pilot commitments.

---

## 1. The competitive map

Competitors fall into six groups. We compete directly with the first one and partly with the next two.

| Group | Examples | What they do | Price range |
|---|---|---|---|
| **A. Instant-quote calculators** | ResponsiBid, QuoteIQ InstaQuote, BookingKoala, Roofle | Homeowner fills in a form and sees a price based on the owner's rules | $27 to $350/mo |
| **B. Field service software (FSM)** | Jobber, Housecall Pro, Workiz | Scheduling, quotes, invoicing, online booking, now adding AI phone answering | $49 to $699/mo (monthly billing) |
| **C. AI chat and receptionists** | Housecall Pro CSR AI, Jobber AI Receptionist, Podium, Hatch, LeadTruffle, ClevrBot, Avoca | Answer calls/chats, capture leads, book jobs. Don't estimate from photos. | $29 add-on up to $600 to $900/mo |
| **D. Measurement and contractor photo tools** | SatQuote, Hover, SimplyWise, BuildFolio, Handoff | Help the **contractor** measure or build a quote. Homeowner doesn't get an instant answer. | $20 to $599/mo |
| **E. Custom builders and agencies** | OpenClaw Consult, GoHighLevel agencies, AI automation agencies | Build a custom bot for one business | $1,500 to $14,000 setup + $500 to $2,000/mo |
| **F. Lead marketplaces** (not competitors, but the budget we compete for) | Google Local Services Ads, Angi, Thumbtack | Sell leads | About $15 to $120 per lead |

### The closest competitors, up close

**ResponsiBid** ([pricing](https://responsibid.com/pricing/))
- $179 (Scaling) or $229 (Pro) a month; a free Startup plan is listed. One pricing site reports a **$500 to $600 setup fee**.
- Instant online quoting, tiered options, **auto-upsells**, bundles, email and text follow-ups, **customer self-scheduling**, **deposits via PayPal**.
- Connects to Jobber, Housecall Pro, ServiceMonster, Markate, Zapier, and more.
- Built for window cleaning, pressure washing, gutters, maid services, carpet cleaning.
- 4.8/5 from 40 reviews on Software Advice. **Main complaint: setup takes time.** One reviewer says their average ticket rose from $200 to $300.
- **What it isn't:** a conversation, or photo-based.

**QuoteIQ** ([pricing](https://myquoteiq.com/pricing/))
- Five plans from $29.99 to $699 a month. **InstaQuote (the homeowner self-quote widget) needs the $299 Elite plan.**
- InstaQuote is a **form-based calculator** built from the owner's service list. The help docs mention no photos or AI in it.
- Satellite measurement from the $74.99 plan, AI phone answering on all plans, Good/Better/Best estimates, review requests, QR codes for self-quoting.
- Strongest in pressure washing, lawn care, cleaning. Reviewers flag a thin set of integrations.

**Housecall Pro** ([pricing](https://www.housecallpro.com/pricing/))
- $79 to $329 a month (monthly billing). Online booking and payment on every plan.
- **CSR AI** answers calls and chats and books jobs using the business's services and prices. Its price isn't public.
- **Why it matters:** many of our target owners already pay for this or Jobber. **We should plug into them, not replace them.**

**Jobber** ([pricing](https://www.getjobber.com/pricing/))
- $49 to $699 a month with no commitment (cheaper with annual billing). Online booking on every plan. **AI Receptionist is a $29/month add-on.**
- Quote follow-ups from the Connect plan; upsell options from Grow.

**OpenClaw Consult** ([handyman page](https://openclawconsult.com/lab/openclaw-handyman-services))
- The closest match to our idea: photo-based task classification and task-list quoting for handymen, with high-confidence jobs quoted directly and complex jobs flagged.
- Sold as a **custom build: $6,000 to $14,000 plus $900 to $2,000 a month** for a solo handyman, 3 to 4 weeks to launch.
- **What this tells us:** the idea is real enough that someone charges a lot for it. Our edge is packaging it as a repeatable product at a fraction of the price.

**Roofle RoofQuote PRO** ([plans](https://offers.roofle.com/plans))
- $350 a month + $2,000 setup, or $5,500 for the first year. Satellite measurement, financing, e-signatures.
- **What this tells us:** setup + monthly works when each job is worth thousands.

### Other price points worth knowing

| Tool | Price | Note |
|---|---|---|
| ClevrBot (website AI chatbot) | Free (100 msgs), $49 (1,000 msgs), $149 (coming soon) | Answers from website content, captures leads. No pricing engine. |
| Podium | About $450 to $600/mo all-in (third-party estimate) | Annual contracts; Trustpilot 1.5/5 from billing and cancellation complaints |
| Hatch | About $600 to $900/mo (user-reported, from a competitor's blog) | Annual contract; complaints about surprise charges and ROI for small shops |
| Avoca | Quote-based | Built for $10M+ companies using ServiceTitan |
| LeadTruffle | Not public | Website texting widget, missed-call text-back, Thumbtack/Yelp/LSA response, Jobber/HCP booking |
| GoHighLevel | $97 to $497/mo + AI Employee about $50 to $97 per location | Agencies resell it to contractors |
| AI automation agencies | $1,500 to $5,000 setup + $500 to $1,500/mo | From an agency-software vendor's pricing guide, not market data |
| SatQuote | $22/mo | Satellite measurement only |
| BookingKoala | $27 to $597/mo | Instant-price booking forms, mostly cleaning |

---

## 2. What this means for our pricing

**What owners already pay for leads** (this is the budget we tap into):

- Google Local Services Ads: about **$34 per handyman lead** (tiny sample of 2 campaigns) and about **$45 per painting lead** (15 campaigns). [99 Calls, Sep 2026](https://99calls.com/LSA-Cost-Estimator/handyman)
- Angi: roughly $15 to $120 per lead depending on trade, **shared with 3 to 8 contractors**, plus about $300 a year in membership. [LeadTruffle blog](https://www.leadtruffle.co/blog/angi-leads-cost-pricing-contractors-2026/) (vendor with a stake)
- Thumbtack: varies by service and location. [PipelineOn](https://pipelineon.com/blog/how-much-does-thumbtack-charge-per-lead/)

**The pitch in one line:** "You pay about $34 for a Google lead that you might not answer until tomorrow. Quotebot answers every website visitor in seconds, with a price, for about the cost of four of those leads a month."

**Owner value math** (Owner Value Math tab; replace the assumptions with interview data):
With a $300 average job, 50% margin, and 2 extra booked jobs a month, a $149 plan returns about **2x its cost**, and the owner breaks even at **1 extra job a month**.

**Packaging to test (hypotheses):**

| Package | Price to test | What's in it | Why this price |
|---|---|---|---|
| **Starter** | $99 to $149/mo, month-to-month, setup waived for pilots | Chat widget + quote page link, photo estimates, lead alerts, human handoff | Below ResponsiBid ($179+) and QuoteIQ's instant-quote tier ($299), above plain chatbots ($49) |
| **Done-for-you** | $249 to $299/mo + $500 to $1,000 setup | Starter + we build and maintain the rules, Jobber/HCP connection, follow-ups, monthly tune-up and report | Matches ResponsiBid's setup fee; well below custom builds and agencies |
| **High-ticket trades** (later) | Roofle-style $350/mo + $2,000 setup | For painting, cabinets, remodel-type jobs | Only where each job is worth thousands |

**Ethan's $2,500 to $15,000 setup fee** fits custom agency work (agency guides say $1,500 to $5,000; OpenClaw charges $6,000+). It doesn't fit a repeatable product sold to 1 to 10 person repair shops.

**Easy trust wins** (competitors get criticized for these): public pricing, **month-to-month** (no annual lock-in), no surprise fees, and a goal of a live bot within about a week.

---

## 3. Features to consider

Ranked by what matters for winning the first customers. "Seen at" shows who already offers it.

### Must have for the pilot

| Feature | Why | Seen at |
|---|---|---|
| Instant estimate range from the owner's rules | The core promise | ResponsiBid, QuoteIQ, Roofle |
| **Homeowner photo upload that shapes the estimate** | Our main difference | Custom builds (OpenClaw); junk removal tools like JunkQ are starting to |
| Conversation instead of a long form | Easier on a phone, asks only what's needed | Rare. Housecall Pro's CSR AI chats and uses the price book, but the quote tools we found are forms |
| Instant lead alert to the owner | Speed is the value | Everyone |
| Human handoff for tricky jobs | Protects against wrong quotes | HCP CSR AI, LeadTruffle |
| Shareable quote link + QR code | For Google Business Profile, truck wraps, texts | QuoteIQ |

### Add soon after (these win deals)

| Feature | Why | Seen at |
|---|---|---|
| **Jobber and Housecall Pro connection** | Owners won't retype leads | ResponsiBid, LeadTruffle, SatQuote |
| **Automatic follow-up** if the homeowner doesn't book | Recovers lost quotes | ResponsiBid, Jobber, QuoteIQ |
| **Booking request / self-scheduling** | Turns an estimate into a job | ResponsiBid, Housecall Pro, Jobber |
| **Good / Better / Best options and add-ons** | Raises the average job value | ResponsiBid, QuoteIQ, Jobber, BuildFolio |
| **Multi-task package pricing** ("mount TV + patch 2 holes + swap faucet") | Handymen price visits, not single tasks | OpenClaw |
| Deposit at booking | Cuts no-shows | ResponsiBid |
| Owner dashboard: chats, estimates, leads, booked jobs | Proves value every month | Most tools |

### Later

| Feature | Why | Seen at |
|---|---|---|
| Missed-call text-back | Common ask; catches phone leads | LeadTruffle |
| Review requests after the job | Owners love reviews | QuoteIQ, Housecall Pro, Podium |
| Financing for bigger jobs | Only for high-ticket trades | Housecall Pro, Roofle |
| Satellite measurement | Only for exterior trades | QuoteIQ, SatQuote, Roofle |
| Spanish | Big share of trades and homeowners | Housecall Pro |
| AI phone answering | Crowded and cheap ($29 at Jobber) | Jobber, HCP, QuoteIQ |

### Don't build

Scheduling, invoicing, payments, full CRM. Owners already pay $29 to $699 a month for those, and there's no winning there. **Connect to their FSM instead.**

---

## 4. Which market to target

### Scorecard (Niche Scorecard tab)

Draft scores from desk research, weighted toward price predictability, how easy the job is to describe, and how little competition there is. **Kristen should update these after interviews.**

| Rank | Trade | Score (out of 5) | Short reason |
|---|---|---|---|
| 1 | **Handyman (small interior tasks)** | 4.0 | Flat per-task prices, year-round, many small shops, no off-the-shelf photo quoting |
| 2 | **Drywall repair** | 3.8 | Clear size and texture rules, decent job size (Thumbtack average about $515) |
| 3 | Junk removal | 3.4 | Photos are perfect for it, but AI photo tools already exist |
| 4 | Interior painting | 3.3 | Bigger jobs, but needs room measurements |
| 5 | House cleaning | 3.1 | Instant pricing already common |
| 6 | Pressure washing | 2.8 | Crowded and seasonal in New York |
| 7 | Mechanic / Fencing | 2.7 | Hard to describe / hidden conditions |

### Recommendation

**Primary target:** owner-operated **handyman and drywall repair businesses** (1 to 10 people) that do residential interior repair.

- **Why handyman alongside drywall:** drywall patching is a core handyman job, and handymen add more predictable tasks (TV mounting $150 to $300, light fixtures $150 to $350, furniture assembly $100 to $300, per [Housecall Pro](https://www.housecallpro.com/resources/how-to-price-handyman-jobs/)). That means more inquiries per business, which is where instant answers matter most.
- **Something to check:** many businesses listed as "drywall contractors" may do new construction for builders, not homeowner repairs. Filter for ones that advertise repairs.
- **Best-fit owners within that group:**
  - Already paying for leads (Angi, Thumbtack, Google LSA). They know what a lead is worth.
  - Already using Jobber or Housecall Pro. They're comfortable with software, and we can plug in.
  - Have a website with a "request a quote" form they're slow to answer.
- **Geography:** one metro area where someone on the team can meet owners in person (Long Island or Buffalo). Local reputation and word of mouth matter a lot in trades.
- **Secondary test:** interior painters. Bigger jobs could support the higher-priced package.
- **Watch the headwind:** Harvard's Joint Center for Housing Studies (July 23, 2026) expects home improvement and repair spending to [keep losing momentum through mid-2027](https://www.jchs.harvard.edu/research-areas/remodeling/lira). My read: in a softer market, owners fight harder for each lead, which helps our pitch, but they'll also watch costs closely.
- **The trade-off to accept:** small jobs mean owners are price-sensitive. That's why the Starter price is low and the pitch is framed around booked jobs.

---

## 5. How to validate the research

Five steps. The first two can start this week at no cost.

### Step 1: Desk checks (week 1)

| Check | How | What it tells us |
|---|---|---|
| **Count the market** | Google Maps searches ("handyman near [ZIP]", "drywall repair near [ZIP]") in the target metro, logged in a sheet. Cross-check with free Census County Business Patterns data on data.census.gov. | How many possible customers exist locally |
| **Search demand** | Google Trends and Google Keyword Planner (free with an Ads account) for "drywall repair near me", "handyman near me" | Whether homeowners are actively searching, and seasonality |
| **Review mining** | Read 1 to 3 star reviews of Jobber, Housecall Pro, ResponsiBid, QuoteIQ on Capterra and G2, plus owner forums and Reddit | Real complaints we can solve, in owners' own words |
| **Recheck competitor prices** | Visit each pricing page in the matrix | Keeps the slides accurate |

### Step 2: Mystery-shop local businesses (week 1 to 2)

This is the strongest early evidence, and it copies a known study.

- **The study:** Harvard Business Review audited **2,241 US companies** by sending web leads. Only **37% responded within an hour**; the average response time was **42 hours**. Companies that responded within an hour were **nearly 7 times as likely to qualify the lead** as those that waited even slightly longer, and **over 60 times** as likely as those waiting 24+ hours. ([HBR, 2011](https://hbr.org/2011/03/the-short-life-of-online-sales-leads))
- **Our version:** submit a realistic quote request (like "two fist-size holes in drywall, can you give me a price?") through the website forms of **20 to 30 local handyman and drywall businesses**, some in the evening. Record:
  - Did they respond? How fast?
  - Did they give a price, or ask for a visit?
- Be honest if anyone asks, and don't waste their time: follow up with a thank-you and say it was research. **Check with your professor on whether this needs any class ethics approval.**
- **Why it matters:** it turns "we think owners are slow" into "X of 25 local businesses took over a day to reply." That's a strong slide.

### Step 3: Owner interviews (weeks 1 to 3)

- **10 to 15 owners** in the target niche. Use the interview script in the starter kit (`docs/owner-interview.md`).
- **Ask about past behavior, not opinions** (the idea behind the book *The Mom Test* by Rob Fitzpatrick):
  - "Tell me about the last quote request you got. What happened?" beats "Would you use an AI quote bot?"
  - "What do you spend on leads now?" beats "Would you pay $149?"
- **Don't count compliments.** "Cool idea!" isn't evidence. A pilot signup, a shared price sheet, or an intro to another owner is.
- **Avoid:** friends and family, leading questions, pitching before listening.

### Step 4: Demand test (weeks 2 to 4)

- **Static landing page** with the pitch, a demo chat, **visible pricing**, and a "Start a free pilot" button.
- Drive traffic with **direct outreach** (calls, visits, emails) and optionally a $100 to $200 local ad test.
- **Price test:** show half of prospects $99 and half $149 (or Starter vs Done-for-you). See which gets more pilot requests.
- **Ask for commitment:** a signed one-page pilot agreement or letter of intent that includes the price after the pilot.

### Step 5: Paid-intent pilot (weeks 4 to 8)

- **2 to 3 businesses**, 30 days, free or discounted.
- **Measure:**
  - chats started
  - estimates shown
  - leads captured
  - booked jobs
  - estimate vs final invoice
  - owner time saved
- **At day 30,** ask them to pay. **That's the real validation.**

### Suggested go / no-go bar

The team should set these before starting, so the results can't be read to fit what we hope.

| Signal | Keep going | Rethink |
|---|---|---|
| Mystery shop: share taking over 1 hour to reply | 50% or more | Under 25% |
| Interviews: slow quoting or missed leads is a top-3 problem | 6 of 10 or more | 3 of 10 or fewer |
| Owners already paying for leads or FSM software | Most | Few |
| Pilot yeses | 3 or more from 10 to 15 interviews | 0 to 1 |
| Pays after the pilot | At least 1 | None |
| Estimates within the quoted range (booked jobs) | 80% or more | Under 60% |

**Triangulate:** every key number on a slide should have at least 2 sources (for example, Google Maps count + Census data, or interview answers + mystery-shop results).

---

## 6. For the MBA 571 presentation

This research maps cleanly to slides:

1. **Problem:** the HBR response-time data + our local mystery-shop results
2. **Market:** local business count (Maps + Census), niche scorecard
3. **Competition:** the six-group map + "no off-the-shelf photo + chat estimate" gap
4. **Pricing:** lead-cost anchor, owner value math, package test results
5. **Validation:** interview quotes, pilot signups, go/no-go scorecard

---

## Caveats

- **Competitor-written sources:** LeadTruffle (Angi costs), ServiceAgent (Hatch), QuoteIQ (comparison pages), and CrewKit are written by companies that compete in this space.
- **Small samples:** the LSA handyman figure comes from only 2 campaigns.
- **Hidden prices:** Housecall Pro CSR AI, LeadTruffle, and Avoca don't publish prices.
- **Changes fast:** AI features in Jobber and Housecall Pro are moving quickly. Recheck before launch.
- **Scorecard:** the niche scores are my draft judgment from desk research, meant to be replaced with interview data.

---

## Sources

- [ResponsiBid pricing](https://responsibid.com/pricing/)
- [PricingNow: ResponsiBid costs](https://pricingnow.com/question/responsibid-pricing/)
- [Software Advice: ResponsiBid reviews](https://www.softwareadvice.com/cpq/responsibid-profile/)
- [QuoteIQ pricing](https://myquoteiq.com/pricing/)
- [QuoteIQ InstaQuote docs](https://myquoteiq.com/docs/instaquote/)
- [Contractor ToolStack: QuoteIQ review](https://contractortoolstack.com/software/quoteiq/)
- [Jobber pricing](https://www.getjobber.com/pricing/)
- [Housecall Pro pricing](https://www.housecallpro.com/pricing/)
- [Housecall Pro CSR AI](https://www.housecallpro.com/features/ai-team/csr-ai/)
- [Clean Savannah: estimating software prices](https://www.cleansavannah.com/post/best-estimating-software-for-pressure-washing-businesses-2026)
- [CrewKit: pressure washing quoting software](https://crewkithq.com/best-estimating-quoting-software-pressure-washing/)
- [ClevrBot pricing](https://clevrbot.com/pricing/)
- [Astucia: Podium pricing](https://astucia.io/blog/podium-pricing-2026-what-smbs-actually-pay)
- [ServiceAgent: Hatch pricing](https://serviceagent.ai/blogs/hatch-pricing/)
- [Driive: Avoca pricing](https://getdriive.com/blog/avoca-ai-pricing)
- [LeadTruffle pricing](https://www.leadtruffle.co/pricing/)
- [Roofle plans](https://offers.roofle.com/plans)
- [OpenClaw Consult: handyman](https://openclawconsult.com/lab/openclaw-handyman-services)
- [SeldonFrame: GoHighLevel cost](https://www.seldonframe.com/guides/how-much-does-gohighlevel-cost)
- [CleanBizSoftware: BookingKoala pricing](https://www.cleanbizsoftware.com/bookingkoala-pricing/)
- [Service Business Academy: photo-to-quote software](https://servicebusinessacademy.org/best-photo-to-quote-software-contractors-2026/)
- [Taskip: AI agency pricing](https://taskip.net/ai-automation-agency-pricing/)
- [99 Calls: handyman LSA cost](https://99calls.com/LSA-Cost-Estimator/handyman)
- [LeadTruffle: Angi lead costs](https://www.leadtruffle.co/blog/angi-leads-cost-pricing-contractors-2026/)
- [PipelineOn: Thumbtack lead costs](https://pipelineon.com/blog/how-much-does-thumbtack-charge-per-lead/)
- [Housecall Pro: handyman pricing guide](https://www.housecallpro.com/resources/how-to-price-handyman-jobs/)
- [Thumbtack: drywall repair cost](https://www.thumbtack.com/p/drywall-repair-cost)
- [Jobber: pressure washing statistics](https://www.getjobber.com/academy/pressure-washing/pressure-washing-industry-statistics/)
- [HBR: The Short Life of Online Sales Leads](https://hbr.org/2011/03/the-short-life-of-online-sales-leads)
- [Harvard JCHS: LIRA](https://www.jchs.harvard.edu/research-areas/remodeling/lira)
