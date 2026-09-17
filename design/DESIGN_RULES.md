# Design rules

The goal: every client's widget and demo page looks clean, trustworthy, and like *their* business, without anyone designing from scratch. We get there by building a small set of parts once and only swapping a few brand inputs per client.

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

## 7. Done checklist (every client, before it goes live)

- [ ] Brand color passes contrast (or was darkened automatically)
- [ ] Works at 360px, 768px, and 1280px wide
- [ ] Keyboard only: can open chat, type, send, and close
- [ ] Screen reader labels on launcher, photo button, and send button
- [ ] Widget script loads fast (target: under 100 KB)
- [ ] Estimate card shows range + disclaimer + booking button
- [ ] Error state tested (turn off the API and check)
- [ ] Every trust fact is real and was confirmed by the owner
- [ ] Tested on the client's real site (Wix, Squarespace, WordPress, etc.)
