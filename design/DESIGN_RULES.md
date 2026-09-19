# Design rules

The goal: every client's widget and demo page looks clean, trustworthy, and like *their* business, without anyone designing from scratch. We get there by building a small set of parts once and only swapping a few brand inputs per client.

## 0. What each screen is for (decide this before styling anything)

| Screen | Job | Who's looking, and their state of mind | It should feel like | It should never feel like |
|---|---|---|---|---|
| **Chat widget** | Get a homeowner from "I have a hole in my wall" to a price range and a callback, on a phone, in about a minute | A homeowner, often on their phone, a little annoyed about the damage, unsure what it costs, wary of being upsold | Texting a local contractor who answers fast | A tech demo, a sales funnel, a form wearing a chat costume |
| **Demo page** | Make an owner picture this on *their* site in 10 seconds, and let a homeowner try it | A busy owner-operator seeing it on a sales call, or a homeowner arriving from a link | The owner's own business, calm and local | A startup landing page (big gradient hero, feature-card grid, "AI powered") |
| **/dev test page** | Let the team run chats and see what the engine and guard did | Us, while testing | A plain tool: dense, readable, honest about test mode | A customer-facing screen |

The widget is a **task tool**, not a pitch. The demo page may persuade, but quietly: the persuasion is the working chat, not the decoration around it.

**How the design system is set, in one place** (so the fifth screen matches the first):

- **Fonts:** the client's font if it's in `allowed_families`, otherwise Inter. One family, two weights (400, 700). Hierarchy comes from size: skip at least one step in `type_scale_px` between a heading and the text under it (16 body → 22 heading, not 18), so the difference is obvious.
- **Color:** neutrals from `tokens.json` plus one brand color. `lib/theme.js` computes brand, brand-contrast, brand-text, and brand-soft and fixes contrast automatically.
- **Corners:** `rounded` = 6 / 10 / 16, `square` = 2 / 4 / 6. Cards and the panel use `lg` at most. Pills (`pill`) are only for chips and the launcher.
- **Spacing:** 4px steps. Tight inside a group (4 to 8), generous between groups (24 to 32).
- **Surfaces:** a thing is either raised (shadow, no border) or sitting flat (border, no shadow). Never both. The chat panel is raised. Cards inside it are flat.
- **All components** read `--qb-*` CSS variables from `lib/theme.js`. Nothing else.

## 1. What changes per client (and nothing else)

| Input | Where | Notes |
|---|---|---|
| Logo | `brand.json > logo_url` | SVG or PNG, transparent background |
| One brand color | `brand.json > primary_color` | The system makes the lighter and contrast shades |
| Font (optional) | `brand.json > font` | Must be in `tokens.json > allowed_families` |
| Corner style | `brand.json > corners` | `rounded` or `square` |
| Words | `brand.json` + `pricing-rules.json` | Name, tagline, voice, services |

If a client wants something outside this list, that's a paid custom job, not a template change.

## 2. Color

- Use one brand color. Everything else is neutral (white, light gray, dark gray text).
- Buttons and the chat launcher use `brand`. Text on them uses `brand-contrast`.
- **Contrast check is automatic:** text must hit 4.5:1 against its background. If the client's color fails on white, darken it for text and buttons (keep the original for the logo area only).
- Status colors (success, warning, danger) are only for status. Never decorative.

## 3. Type and spacing

- Sizes only from `type_scale_px`. Body text is 16px. Never smaller than 14px for anything a customer must read.
- Spacing only from `space_px` (4px steps). No random values like 13px.
- Max 2 font weights on a screen (regular + bold).

## 4. The parts (build once, reuse forever)

**Chat widget**

1. **Launcher:** round brand-color button, bottom right, label "Get a price". 44px+ tap target.
2. **Panel:** header (logo + business name + "Usually replies instantly"), message list, input bar.
3. **Message bubble:** bot = light gray, customer = brand color.
4. **Quick replies:** tappable chips for enum questions (Wall / Ceiling). Faster than typing on a phone.
5. **Photo button:** in the input bar. Shows a thumbnail after upload. Tip line: "Add something for scale, like a dollar bill."
6. **Estimate card:** the payoff screen. Shows:
   - The range in large type ("$425 to $600")
   - What's included (line item labels, no per-line prices unless the owner wants them)
   - The disclaimer in plain text, not fine print
   - Main button: "Book a visit". Second button: "Call {{phone}}"
7. **Lead form:** name, phone, best time. Three fields, nothing else. Consent checkbox for texts.
8. **Handoff card:** for `needs_review`. Calm message, what happens next, when to expect a call.
9. **Error state:** "Something went wrong. Call us at {{phone}}." Never a blank screen.

**Demo / landing page** (for sales demos and clients without a good site)

1. Hero: logo, business name, one line ("Get a drywall repair estimate in 60 seconds"), the chat open by default
2. How it works: 3 steps with simple icons
3. Trust: only real facts from `trust_facts`. If empty, leave the section out.
4. Footer: phone, service area, hours

## 5. Mobile first

- Design at 360px wide first. Most homeowners will use a phone.
- On phones the chat panel goes full screen.
- Nothing scrolls sideways.

## 6. Things we never do (they make it look cheap or fake)

- No gradients, glow effects, glass effects, or floating blobs
- No emojis in headings or buttons
- No robot icons or "AI powered" badges. Customers want a price, not a tech demo.
- No stock photos of people smiling at laptops
- No made-up reviews, ratings, or "trusted by 500+ homeowners" claims
- No more than one accent color
- No walls of text in the chat

**Patterns that make a page look machine-made.** These show up so often in generated UI that they read as "nobody designed this." Each needs a specific reason to stay; "it's what these usually look like" is not a reason.

- A thick colored stripe down one side of a rounded card
- A border *and* a big soft shadow on the same element
- Cards rounded into blobs (over 16px), or pill shapes on anything that isn't a chip or button
- A small uppercase, letter-spaced label sitting above every heading
- An icon in a rounded square stacked above a heading, repeated in a grid of identical cards
- Numbered labels (01, 02, 03) on things that aren't actual steps. "How it works" *is* 3 real steps, so numbers are fine there.
- The big-number hero with three small stats beside it
- Frosted glass, grid-line textures, stripes, or halos behind sections
- Gray text on a brand-colored background (use `brand-contrast`)
- Pulsing dots, fake typing cursors, marquees, bouncy or springy animation, images that zoom on hover
- Animating size or position with width, height, or margin (use opacity and transform)
- Copy words: streamline, empower, supercharge, seamless, world-class, cutting-edge, revolutionize
- Saying the same thing in a heading, a subheading, and helper text
- Long headlines at display size (a few words at `3xl`, not a sentence)
- Lines of text wider than about 75 characters
- Placeholder or broken images. If there's no logo, show the business name in text.

## 7. Done checklist (every client, before it goes live)

- [ ] Brand color passes contrast (or was darkened automatically)
- [ ] Works at 360px, 768px, and 1280px wide
- [ ] Keyboard only: can open chat, type, send, and close
- [ ] Screen reader labels on launcher, photo button, and send button
- [ ] Widget script loads fast (target: under 100 KB)
- [ ] Estimate card shows range + disclaimer + booking button
- [ ] Error state tested (turn off the API and check)
- [ ] Every trust fact is real and was confirmed by the owner
- [ ] Demo clients show a visible "Demo business, sample prices" label
- [ ] None of the machine-made patterns in section 6, or each one has a written reason
- [ ] Colors, sizes, spacing, and radius all come from `--qb-*` variables (search the diff for `#`, `px`, `rgb`)
- [ ] Tested on the client's real site (Wix, Squarespace, WordPress, etc.)
