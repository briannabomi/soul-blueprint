# Soul Blueprint v2 — Execution Prompt

**Date:** May 1, 2026
**File:** `soul-blueprint.html` (single-file, self-contained)
**Reference — DEPTH benchmark:** "Your Soul Blueprint _ Brianna Bomi.pdf" (the original report)
**Reference — AESTHETIC benchmark:** "Your Soul Blueprint _ Brianna Bomi_1may.pdf" (the current 1may HTML output)

---

## Guiding Principle

Keep the galaxy aesthetic, fonts, colors, background, and visual schematics from the current 1may HTML. Restore the **depth of content and insight** from the original report. The aesthetic is right; the substance got trimmed. Put it back.

---

## Change List

### 1. Step 6 — Email Capture Screen (`#s-email`)

**Current state:** Step 6 has a heading "One more thing before your blueprint." with a `<p>` subtitle underneath that reads: "Your results show up on the next page. We'll also send you an AI prompt that turns your blueprint into weekly action steps."

**Changes:**
- **Remove** the subtitle `<p>` text underneath the heading ("Your results show up on the next page…"). Delete that entire `<p>` element from `step-header`.
- **Keep** the text inside the gold-bordered square box as-is ("Your report is not saved anywhere. I will never see it. Once you leave the page, it's gone. Save or print your report on the next page.").
- **Add** a new `<p>` paragraph **after** the square box (before the email form field) that reads: "We'll email you an AI prompt to turn your blueprint into weekly action steps."

### 2. Galaxy Aesthetic — Global Experience

The starfield canvas, deep navy background (`--bg:#0a0e1a`), gold accent (`--accent:#c9956b`), DM Serif Display / Cormorant Garamond / Inter font stack, and gradient energy backgrounds per section — these are all correct and should remain throughout the **entire** experience (intake screens AND report). No changes here, just confirming: do not alter the galaxy aesthetic.

### 3. "Five Different Maps. One Territory. Your Soul." — Font Size Increase

**Location:** The `display-quote` on the Synthesis slide and the header slide.

**Change:** Increase the font size of "Five different maps. One territory. Your soul." wherever it appears. Currently it's `clamp(1.6rem, 3.5vw, 2.4rem)` — bump it to `clamp(2rem, 4.5vw, 3rem)`. This is the thesis statement of the whole experience; it should hit harder visually.

### 4. Report Layout — Convert from Slide Carousel to Single-Page Accordion

**This is the biggest structural change.**

**Current state:** The report renders as a multi-slide carousel with a fixed bottom nav (dots, arrows). Each section is a separate "slide" — only one visible at a time.

**New state:** The report should be a **single scrollable page**. All sections are stacked vertically. The slide nav (dots, arrows, counter) is removed entirely.

**Structure of the new scrollable report:**

1. **Header** (title card with name, date, location, "Five different maps…") — always visible at top, not collapsible.

2. **"Save / Print Your Blueprint" button** — placed at the **top** of the report (right after the header) AND at the **bottom** (in the CTA section). Both trigger `window.print()`.

3. **Your Blueprint Summary** — always visible, not collapsible. This is the coord-grid with Sun Sign, North Node, Life Path, Destiny, HD Type, HD Profile, Gene Key, Incarnation Cross. **Interactive:** when the user hovers over any coord-card (e.g., "Life Path Number" or "North Node"), the cursor changes to pointer. When they **click** a coord-card, the page smooth-scrolls to the corresponding expanded section below (e.g., clicking "North Node" scrolls to the North Node accordion section).

4. **Accordion sections** — each of the following is a collapsible accordion panel:
   - Your Numerology Blueprint (Life Path + Destiny)
   - Your North Node
   - Your Gene Keys
   - Your Human Design
   - Your Ikigai

   **Accordion behavior:**
   - Each has a **heading bar** that is always visible. The heading should be styled like the current `<h2>` section headers (DM Serif Display, white, with the section glyph icon). Include a `+` icon on the right side that rotates to `×` when expanded.
   - The heading text should be **bold, white, clearly readable** — styled at the same size as the Synthesis section headings. It should be unmistakable that these are clickable/tappable to expand.
   - **Increase the accordion heading text size by 10%** compared to the current `<h2>` sizes.
   - Clicking the heading toggles the section open/closed with a smooth animation.
   - All accordion sections start **collapsed** by default.
   - Multiple sections can be open simultaneously.

5. **The Synthesis** — always **fully expanded**, not collapsible. No accordion toggle. This is the climax of the report; it should always be visible and readable. Include the "What all five systems are saying together" subtitle, the "Five different maps. One territory. Your soul." display quote (at the increased font size from change #3), the full synthesis narrative, purpose statement, career alignment, and the disclaimer.

6. **CTA section** ("Your Blueprint Is the Beginning") — always visible at the bottom, with the second "Save / Print Your Blueprint" button.

**Implementation notes:**
- Remove the entire `initSlideNav()` function and the `.slide-nav`, `.slide-dots`, `.dot`, `.slide-counter` CSS.
- Remove the `report-slide` display toggling logic. All sections render as `display:block` (or flex).
- Add new CSS for `.accordion-section`, `.accordion-header`, `.accordion-content`, and the expand/collapse animation.
- The `.accordion-header` should have `cursor: pointer` and a visible `+` / `×` indicator.
- Use `max-height` transition or similar for smooth open/close animation.
- Keep the `energy-*` gradient backgrounds on each section — they add subtle visual distinction.
- Keep the `section-watermark` large background characters.

### 5. Blueprint Summary — Clickable Coord Cards

As described in #4, the coord-cards in the Blueprint Summary should be interactive:
- `cursor: pointer` on hover
- A subtle hover effect (e.g., border glow or slight lift)
- `onclick` → smooth scroll (`scrollIntoView({ behavior: 'smooth' })`) to the corresponding accordion section
- Each accordion section needs an `id` attribute for scroll targeting (e.g., `id="section-numerology"`, `id="section-northnode"`, etc.)

### 6. Ikigai Radial Chart — Increase Margins

**Current state:** The Ikigai radial/spider chart SVG has axis labels (What You Love, What You're Good At, What the World Needs, What You Can Be Paid For) that get cut off at the edges, especially on mobile.

**Change:** Increase the SVG viewBox from `0 0 400 400` to `0 0 440 440` (or similar) and shift the center point accordingly, giving more room for the labels. Alternatively, increase `labelR` from 175 to 185 and ensure the SVG viewBox accommodates the full label text without clipping. Test that no text is cut off on a 375px-wide viewport.

### 7. Synthesis Section — Subheading Text Size

**"What all five systems are saying together"** — increase this subtitle text by 10% (from `0.82rem` to `~0.9rem`).

### 8. Gene Keys Section — Restore Full Depth

**This is a critical content restoration.**

**Current 1may state (trimmed):** The Gene Key section has a brief description of Life's Work and Purpose keys with the shadow→gift→siddhi spectrum, a one-line "From X to Y. Not fixing. Uncompressing." quote, and a short insight about the shadow being the compressed gift. The Purpose key is hidden behind a "Tap for Purpose Key" reveal.

**Original report (the depth benchmark):** The Gene Key section has substantially more explanatory content:

- **Life's Work Gene Key:** "Remembering what matters. You're here to pay exquisite attention to the lessons life offers and share those revelations with others." — followed by the spectrum — then: "The journey from forgetting to mindfulness is not about fixing yourself. The shadow shows up when your gift gets compressed, it's the distorted version of the same energy. Every time you feel forgetting, it's a signal that mindfulness is trying to come through. **The work isn't to eliminate the shadow. It's to notice it and let the gift move through you.**"
- **Purpose Gene Key:** "Creating collaborative power structures. You carry the gift of bringing the right people together at the right time for collective impact." — then spectrum — then: "Your Purpose Key is what you naturally embody when you stop performing. When you're living in teamwork, people feel it before you say a word. **This isn't a skill you develop — it's something you stop suppressing.**"

**What to restore:** The Gene Key descriptions in `GENE_KEYS` data object need to include the full paragraph-length insight for each key — the "journey from shadow to gift" explanation, the reframe about the shadow being compressed gift energy, and the bold closing insight. The `renderReport()` function should output this full text rather than the abbreviated version.

Specifically in the Gene Keys accordion content:
- After the shadow→gift→siddhi spectrum for Life's Work, include the full explanatory paragraph (not just the one-liner)
- After the Purpose key spectrum, include the full explanatory paragraph including "This isn't a skill you develop — it's something you stop suppressing" type insight
- Remove the "Not fixing. Uncompressing." display-quote — replace it with the actual substantive explanation

### 9. North Node Section — Restore Full Depth

**Same issue as Gene Keys — substance was trimmed.**

**Original report depth:** The North Node section included:
- The growth edge and path forward
- A full explanation of the South Node release with context
- "Your South Node is what feels comfortable because it's familiar, not because it serves you. Your North Node is where you're being asked to grow, even when it feels uncomfortable."
- Career directions

**Current 1may state:** Same content but hidden behind a "Tap for more" reveal block.

**Change:** In the new accordion layout, when the North Node accordion is expanded, ALL of this content should be immediately visible — no nested reveal blocks within the accordion. The accordion IS the reveal mechanism. Once someone opens "Your North Node," they should see the full depth without additional taps.

**Apply this same principle to ALL accordion sections:** No nested reveal blocks inside accordions. The accordion expansion shows the full content. One click, full depth.

### 10. All Five Sections — Remove Nested Reveal Blocks

Extending #9 to every section: the current report uses `.reveal-block` elements that require tapping "Tap for more" or "Tap for Purpose Key" within each slide. In the new accordion layout, these nested reveals are unnecessary UX friction. 

**Change:** When an accordion section is expanded, display ALL content for that section — no secondary taps needed. Remove all `.reveal-block`, `.reveal-summary`, `.reveal-detail`, `.reveal-hint` elements from the report content. The content they currently hide should be rendered directly.

### 11. Accordion Heading Styling

To be very clear on the visual treatment of accordion headers:

- **Font:** DM Serif Display (matches current h2)
- **Color:** White (`var(--white)`)
- **Weight:** Bold
- **Size:** Same as The Synthesis heading size (currently `clamp(2rem, 4.5vw, 2.8rem)`) — increased by 10% → `clamp(2.2rem, 5vw, 3.1rem)`
- **Include** the section glyph SVG icon to the left of the heading text
- **Include** a `+` / `×` toggle indicator on the right side
- **Background:** Subtle, like `var(--card)` with the energy gradient
- **Padding:** Generous — `1.5rem 2rem`
- **Border-bottom:** `1px solid rgba(201,149,107,0.15)` to separate sections
- **It should be immediately clear** that these headings are interactive and expandable

### 12. Print Styles

Update the `@media print` CSS to work with the new accordion layout:
- All accordion sections should be **forced open** in print (override `max-height`, `overflow`, `opacity`)
- Hide the `+`/`×` toggle indicators
- Hide the Save/Print buttons
- Keep the starfield and backgrounds hidden (already handled)
- Ensure all content flows naturally on printed pages with `break-inside: avoid` on major sections

### 13. "Five Systems. One Territory. Your Soul." — Subheading Below

The current line "Five ancient systems. One territory. Your soul." appears in the header slide as a display quote.

**Change:** Also ensure this line appears as a subheading right below the Blueprint Summary heading (before the coord-grid), keeping the current "Your blueprint at a glance" text. The subheading "Five different maps. One territory. Your soul." should be visually prominent — not muted.

---

## Summary of What NOT to Change

- Galaxy/starfield background canvas animation
- Color scheme (navy, gold, warm whites)
- Font stack (DM Serif Display, Cormorant Garamond, Inter)
- The intake flow (screens 1-6: welcome, birth data, processing, ikigai questions, email capture)
- The Ikigai grid cards layout
- The Human Design type card
- The Gene Key spectrum visual (shadow → gift → siddhi bar)
- The coord-grid card design
- The CTA box design and Sovereign Arc bridge copy
- The synthesis narrative weaving logic
- The AI synthesis API call to Netlify function
- The numerology/astrology/HD calculation engines
- The email capture + Kit subscription logic
- The GeoNames/Nominatim location autocomplete

---

## Execution Order (Suggested)

1. Restructure the report from slides → single scrollable page with accordions
2. Build accordion CSS + JS (open/close, animation, +/× indicator)
3. Make coord-cards clickable with smooth scroll to sections
4. Remove all nested reveal blocks — flatten content into accordion bodies
5. Restore Gene Key depth content (full paragraphs, not abbreviated)
6. Restore North Node depth content
7. Increase "Five different maps" font size
8. Increase accordion heading sizes by 10%
9. Increase Synthesis subtitle size by 10%
10. Fix Ikigai chart margins/viewBox for label clipping
11. Update Step 6 email screen copy
12. Add Save/Print button at top and bottom of report
13. Update print styles for accordion layout
14. Test on mobile (375px) and desktop (1440px)
