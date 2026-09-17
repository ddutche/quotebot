# Quotebot: Working Doc (v0.3)

> **Reference snapshot (Sep 17, 2026).** Written during planning in Claude (Cowork). Some details here were later refined. If this file disagrees with `docs/PROJECT_BRIEF.md` or `docs/DECISIONS.md`, those win.

**Source:** MBA 571 Geniuses group text (18 screenshots, most messages from Sep 14, 2026)
**Group:** Donny, Ethan, Kristen, Linda, plus one member shown with a photo avatar (name partly hidden in the screenshots)
**Status:** Idea stage. Starter kit built (pricing engine + tests, no live product). No customers talked to yet (other than Donny's roommate).
**See also:** Build Framework v0.1, Deployment Plan v0.2, Market Research v0.1, and the Quotebot Starter Kit (Claude Code repo)

---

## 0. Decision log

**Deployment decisions (Sep 15, Donny)**

- **In:** lead alerts by email (Resend free tier) with every lead saved in Supabase first
- **In:** spending limits on every paid account
- **In:** API keys only on the server, never in the widget
- **In:** photos shrunk in the browser before upload (also strips GPS location data)
- **Later:** Stripe (pilots are free) and a shared password manager (interim key rules in the Deployment Plan)
- **Open:** domain name (needed for email alerts), abuse protection, error/uptime alerts

### What changed in v0.2 (Sep 15)

- **Build roles set (Donny):** Claude builds everything (Opus orchestrates, Sonnet and Haiku agents execute). A Chinese model (Kimi) runs the live chatbot. The newest GPT model checks the chatbot's work until it's stable.
- **Goal for the build:** one clean, repeatable design framework that Claude can build from reliably and cheaply.
- **Target rule confirmed:** start with trades that have small price swings and damage that's easy to describe. Mechanics are out for now; drywall is the example.
- **Validation plan:** a static website that shows the value, with a free version that leads to a paid one (like Supabase).
- **Selling:** setup fee + monthly retainer, open to SaaS or other models.
- **Contacts:** Donny has LinkedIn Sales Navigator.
- **New research:** power washing already has several instant-quote tools at about $30 to $230 a month. Kimi K2.6 costs about $20 a month per client at Ethan's volume. Details in the Build Framework.

---

## 1. The idea in one paragraph

An AI chatbot that sits on a service company's website and gives customers an instant price estimate. The customer describes the job (and ideally uploads a photo), the bot asks follow-up questions, and it returns a price range using the company's own pricing rules. We sell it to small service businesses for a one-time setup fee plus a monthly subscription.

**Two things this has to serve:**

1. The MBA 571 final presentation (the "bare minimum" bar)
2. A possible real business after that

These have different finish lines. Keep them separate (see Section 8).

---

## 2. Who's doing what

| Person | What they said they'd do / bring | Status |
|---|---|---|
| **Donny** | Owns the build in Claude Code (Opus orchestrator, Sonnet/Haiku agents). Writes the GTM strategy. Has Sales Navigator for contacts (see risk #1). | Starter kit + framework done (v0.1) |
| **Ethan** | Original idea owner. Technical design (4-layer bot, AI model picks, cost math). Has built a similar agentic product before. | Asked for his "website reproduction guidelines" (the MD rules file). No answer seen yet. |
| **Kristen** | Niche research: market size, number of possible buyers, type of customer. Compare power washing vs interior/drywall vs others. | Thumbs-up given. Not confirmed in words. |
| **Linda** | Was working on a class item (Donny offered help at 4:48 PM). No quote bot role assigned yet. | Needs a role |
| **5th member** | Said they really liked the idea. No role assigned yet. | Needs a role |

---

## 3. What we've agreed on (soft agreements)

These came up in the chat with no pushback. None are locked in yet.

- **Start with services that have predictable pricing.** Donny: "predictable is bottomline." Ethan agreed.
- **The bot gives an estimate or a range, not a firm quote.** It shows a note saying the final price can change. Donny's point: customers don't care much if it's a bit off, but they care a lot if it's too low.
- **Photos matter.** Customer sends a problem + a picture and gets an estimate. Donny: "the photo part of it is what it comes down to for me."
- **The AI is kept on a leash.** It can be flexible in how it talks. It can never make up prices, skip business rules, ignore safety rules, or assume info the customer didn't give.
- **Money comes from two places:** a setup fee plus a monthly subscription that covers AI costs with room to spare.
- **Learn from real businesses first.** Offer 1 or 2 businesses a discount (or just a sit-down) to learn what info they need to price a job. Write their pricing rules down and have them sign off before the bot uses them.
- **Testing is the biggest chunk of work.** Donny's test list: the rules/limits, accuracy, and which AI model to use.
- **Who does what in the stack (Sep 15):** Claude builds, Kimi runs the chatbot, the newest GPT checks the chatbot during testing.
- **One repeatable design framework** that produces clean, accurate, efficient builds every time.
- **Validate before selling:** static site + free version that leads to paid.

---

## 4. Target market (niches)

| Niche | Who raised it | Where it landed |
|---|---|---|
| **Power washing** | Ethan, Donny agreed | Top pick. Both like it. |
| **Interior** (drywall, cabinets, garage doors) | Donny, from his roommate | Top pick. Pricing doesn't swing much. |
| **Mechanic shops** | Ethan | Out for now (Donny, Sep 15). Donny's worry: customers can't describe car problems well (they say brakes, it's really shocks). Ethan agreed it would need to be estimate-only. Donny leans away. |
| **Fencing** | Donny's roommate (a fencing company manager) | Example of what NOT to start with. Price can jump if there's rock under the ground. |
| **Landscaping** | Donny | Used as an example only. |

**Competition found (Sep 15):** power washing already has ResponsiBid, QuoteIQ, SatQuote, and ClevrBot, and it's seasonal in New York. Drywall has fewer tools built for it. See Build Framework section 9.

**Open question:** Ethan thinks "service companies in general" is niche enough. Donny agreed it may not need to be narrowed further. Kristen's research should settle this.

---

## 5. How we get customers (go-to-market)

Two ideas came up. Donny said Ethan's was "kinda what I was getting at," but they are different plays:

**Play A: Free pricing tool (Donny)**
- A free website where a business owner enters a few details and learns what they should charge.
- Free traffic from our target market. Once they see the value, we sell them the paid quote bot.
- Works like Spotify free vs premium. Donny's Sep 15 version: a static website that shows the value, with a free version that leads to paid (like Supabase).
- Needs: web traffic, SEO, patience. Slow to start.

**Play B: Cold call with a free demo (Ethan)**
- Build each prospect a free preview of their own website with the quote bot built in, using their logo and colors, and fake numbers.
- Cold call them and tell them it's ready to look at.
- Use Claude or Codex plus an MD rules file to rebrand a template site quickly for each company.
- Ethan says this worked for a past agentic product of his, though "it's not super efficient."
- Needs: a contact list, a fast demo-building process, people willing to make calls.

**Contact list idea:** Donny has Sales Navigator (and ZoomInfo through his job) and said he "can pull contacts potentially." See risk #1 before doing this.

---

## 6. Pricing and costs

**What was floated:**

| Item | Number | From |
|---|---|---|
| Setup fee (first message) | $1,500 to $10,000, based on company size | Ethan |
| Setup fee (later message) | $2,500 to $15,000, based on company size | Ethan |
| Monthly subscription | $250+ | Ethan |
| AI cost per company | About $60/month at most | Ethan (a quick chatbot check he ran, "Chad") |

**The $60 math (Ethan's assumptions):**
- 20 chats per day × 30 days = about 600 chats a month
- About 18 million input tokens + 600,000 output tokens a month
- Ethan flagged this as a rough quick check, not something to rely on

**Donny's view on AI costs:** price high enough that token costs fit inside the margin, instead of billing customers for token use separately.

**Market price check (Sep 15):** similar tools cost about $30 to $230 a month (ResponsiBid is $179 to $229). A higher price needs a clear reason.

**Cost re-check (Sep 15):** at Ethan's volume, Kimi K2.6 costs about $20 a month per client ($11 through OpenRouter). Even a premium model is about $63. At a more realistic 3 chats a day, it's $2 to $9. AI cost is not the problem.

**Needs checking:**
- The two setup fee ranges don't match. Pick one.
- Test price points in owner interviews.

---

## 7. How the product works

### The bot has 4 layers (Ethan)

1. **Data schema:** the list of info needed to price a job
2. **Conversation layer:** how the bot asks the customer for that info
3. **Validation layer:** checks for missing info, contradictions, unusual conditions, safety concerns, and other exceptions
4. **Pricing engine:** the business rules that do the actual math

The owner defines layer 1. The AI handles layers 2 and 3 (talking and checking). Layer 4 should be plain rules, not AI guessing.

### Mechanic version (if we ever go there)
Pull parts prices from supplier sites (APIs or scraping), then add the shop's travel fee, labor rate, and time estimates.

### AI model plan (updated Sep 15)

| Job | Model | Notes |
|---|---|---|
| Plan, split work, review (orchestrator) | Claude Opus | Owns the engine, prompt, and design system |
| Build widget and demo page, write rules files, review design | Claude Sonnet agents | |
| Extract brand info, write test cases, fill templates | Claude Haiku agents | Keeps per-client setup cheap |
| Power the live chatbot | Kimi (K2.6 accepts images, per OpenRouter) | Keep swappable; see risk #5 |
| Check the chatbot during testing | Newest GPT model | Pass/fail checklist; after launch, only flagged chats + a 10% sample |

Still open from Ethan's earlier ideas: also using Codex / "5.6 Sol extra high" to review Claude's code, and "Fable or astra" for brainstorming.

**Must-have for the chatbot model:** image recognition and low token cost. Donny: a Chinese model with both "would be perfect."

**Build tool:** Donny builds with Claude Code (most experience there). Ethan's tip: tell Opus it's the orchestrator and have Sonnet and Haiku agents do the work, which stretches usage limits.

Donny agreed: "Solid alright."

---

## 8. My read as an operator: what I'd change

Read through a project management, startup, and service-industry lens. Here's what stands out.

### What's good
- **You picked a real pain.** Service businesses lose leads when quoting is slow. Instant estimates are a clear selling point.
- **"Predictable pricing first" is the right call.** Start where the bot can be right most of the time.
- **Keeping pricing in rules, not AI, is the most important design choice you've made.** Protect it.
- **The sit-down with 1 or 2 businesses is your best idea.** Do it before building anything real.

### Risks to deal with now

**Risk #1: Using work tools for this business.** If your Sales Navigator seat comes through IBM, the same applies. Pulling contacts from SalesNav or ZoomInfo through your IBM job for a side business very likely breaks the license terms and company policy. It could put your co-op at risk. Don't do it. Use free or paid lists you own (Google Maps, Yelp, local business directories, Apollo's free tier, or just walking into shops).

**Risk #2: Two go-to-market plays at once.** Play A (free tool, self-serve software) and Play B (cold call, done-for-you service) need different skills, budgets, and timelines. A team of 5 students can't do both well. **My pick: Play B first.** Selling done-for-you setups teaches you what data real businesses have and what they'll pay. Turn it into self-serve software later, once you've done it 5 to 10 times.

**Risk #3: Setup fees may be too high for the buyer.** A small power washing company (often 1 to 5 people) is unlikely to pay $2,500 to $15,000 for a chatbot from a student team with no track record. Test this early. A lower setup fee ($500 to $1,500), or a free setup for the first 2 or 3 pilot customers in exchange for a testimonial and data, is more likely to get a yes.

**Risk #4: Underquoting.** You already spotted this. Also add: every estimate says "not a final quote," the owner can review or approve odd jobs before a price goes out, and the bot hands off to a human when unsure. One bad quote shared online hurts the customer's business and your name with it.

**Risk #5: Cheap Chinese models and customer data.** Kimi may be cheap, but some US business owners will care where their customers' photos and info are sent. Check the terms and have an answer ready. Build so you can swap models easily. **Update:** one analysis says Moonshot's own API stores data in Singapore and may use it to improve models (check their current terms). The same open model can run through a US host instead.

**Risk #6: The cost math is probably high on volume.** 20 bot chats a day is a lot for a small service company. Real numbers are likely lower, which is good for margin. Use real lead counts from the pilot businesses. **Update:** re-checked; AI cost is small at any realistic volume (see section 6).

**Risk #7: Other companies already sell quote tools.** Before picking a niche, look at who already sells instant quote or estimate tools to power washing and home service businesses, what they charge, and what reviews complain about. That's where your angle is. **Update:** found ResponsiBid, QuoteIQ, SatQuote, and ClevrBot in power washing. See Build Framework section 9.

**Risk #8: Too many model choices, too early.** **Update:** now narrowed to Claude for building, Kimi for the bot, and GPT for checking. Good.

### Class vs business: set two finish lines
- **Class (must do):** one niche, one working demo bot with made-up but realistic pricing rules, market sizing, pricing model, GTM plan, and 2 to 3 interview quotes from real business owners.
- **Business (stretch):** 1 to 2 paying or pilot customers, signed pricing rules, the bot live on their site, and tracked results (leads, quotes sent, jobs booked).

---

## 9. Open questions to answer next

1. Which niche first: power washing or interior? (Kristen's research)
2. Play A or Play B for getting customers?
3. What setup fee and monthly price? Which of Ethan's two ranges?
4. ~~What are the "conditional circumstances"?~~ Draft list in Build Framework section 5. Each owner confirms their own.
5. ~~Which model powers the bot?~~ Kimi. Still to decide: Moonshot direct or a US host? Test photo quality ourselves.
6. Where are Ethan's website reproduction guidelines / MD rules file?
7. What are Linda's and the 5th member's roles?
8. When is the MBA 571 final presentation due? Work backward from that date.
9. Is the group actually planning to run this as a real business after class? If yes, who owns what (equity, time commitment)?
10. Is Donny's Sales Navigator seat personal or through IBM?
11. What exactly does the free version include? (Suggestion: FAQ answers + lead capture, no pricing)
12. Drywall/interior or power washing, given the competition found?

---

## 10. Next steps (suggested)

| # | Task | Owner | By |
|---|---|---|---|
| 1 | Share this doc with the group and confirm roles | Donny | This week |
| 2 | Niche research: power washing vs interior (size, # of businesses in target area, competitors, typical job price) | Kristen | TBD |
| 3 | Send the website reproduction guidelines / MD rules file | Ethan | TBD |
| 4 | Interview Donny's roommate (fencing manager) about how they quote and what data they use | Donny | This week |
| 5 | Book 2 to 3 more owner interviews in the chosen niche | Linda / 5th member | TBD |
| 6 | Review the fake drywall rules and 11 test cases in the starter kit | Ethan + Donny | TBD |
| 7 | Set up the repo from the starter kit; have `ui-builder` build widget v0 | Donny | TBD |
| 8 | Connect the chatbot to Kimi and the GPT checker; add photo test cases | Ethan | TBD |
| 9 | Pick a contact source that doesn't use work tools | Donny | Before any outreach |
| 10 | Confirm the presentation date and set the timeline | Whole group | This week |
| 11 | Put up the static validation site with a pilot sign-up form | TBD | TBD |

---

## Appendix: gaps in the source

- One screenshot is missing between IMG_7050 and IMG_7052 (likely IMG_7051). It includes Ethan saying both models support photo recognition and Donny's message about leaning Claude for the website shell.
- Messages before IMG_7034 (the start of the idea) and between IMG_7036 and IMG_7037 (Kristen's Google Doc question and the replies to it) are cut off.
- The fifth member's name is partly hidden behind the chat header.
