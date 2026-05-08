# حياتي — Hayati · Brand Identity System
> Version 1.0 · Last updated 2026-05-08  
> Reference document for all frontend designers and contributors.

---

## Table of Contents
1. [Brand Concept](#1-brand-concept)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing & Layout](#4-spacing--layout)
5. [Elevation & Shadows](#5-elevation--shadows)
6. [Motion & Animation](#6-motion--animation)
7. [RTL Design Principles](#7-rtl-design-principles)
8. [Dark Mode](#8-dark-mode)
9. [Component Patterns](#9-component-patterns)
10. [Implementation](#10-implementation)

---

## 1. Brand Concept

### Name & Meaning
**حياتي** (Hayati) — Arabic for "my life." More than a word; it is one of the most intimate endearments in the Arabic language, used to say *you are my entire existence*. The app carries that weight: a personal companion for how a person chooses to live their life.

### Visual Metaphor — "The Hour Between Day and Night"
The identity is anchored to a single, precise moment: the 20 minutes before Maghrib prayer in the Arabian desert. The Sahara turns rose-gold, the sky moves from amber to deep violet, and the first stars appear. This transition — between warmth and depth, between the known and the vast — defines every color, every typographic choice, every spacing decision.

### Brand Personality

| Trait | Expression |
|---|---|
| **Intimate** | Personal scale, warm tones, endearing copy voice |
| **Culturally proud** | Arabic-first layout, calligraphic moments, RTL-native |
| **Quietly luxurious** | Restrained palette, premium typography, generous whitespace |
| **Alive** | Purposeful motion, responsive micro-interactions |

### Aesthetic Direction — Minimal Arabic Luxury
- Clean, spacious layouts with a warm neutral base
- Cultural motifs (geometry, arabesque) used as texture, never decoration for its own sake
- Every visual element earns its place
- The "wow" factor comes from typography and motion — not from visual noise

---

## 2. Color System

### Concept: Sahara at Golden Hour
The palette captures the precise transition from day to night in the desert. All neutrals are warm-toned — no cool grays anywhere in the system.

---

### Brand Colors (The Four Pillars)

| Token | Name | Hex | Meaning |
|---|---|---|---|
| `--hayati-gold` | Hayati Gold | `#C9913D` | Primary brand color — the warm, antique gold of brass incense burners in late afternoon light. Used for the logo, CTAs, and all key highlights. |
| `--hayati-night` | Midnight Oud | `#17102B` | Primary dark anchor — the deep violet-black of oud wood smoke. Rich and warm, never flat or cold. |
| `--hayati-sage` | Palm Sage | `#5A8A68` | Life / growth / vitality accent — the color of desert plants after rain. |
| `--hayati-terra` | Desert Terra | `#C06858` | Warmth / emotion / humanity accent — dusty terracotta, the color of ancient mudbrick walls. |

---

### Gold Scale

| Token | Hex | Usage |
|---|---|---|
| `--gold-50` | `#FEF9EE` | Brand tint backgrounds, subtle highlights |
| `--gold-100` | `#FAEFD0` | Hover state fills, muted brand areas |
| `--gold-200` | `#F4D89A` | Decorative borders, section dividers |
| `--gold-300` | `#EAB96A` | Icon fills, illustration accents |
| `--gold-400` | `#DC9F48` | Dark mode primary brand color |
| `--gold-500` | `#C9913D` | **Primary brand** — light mode CTAs, logo |
| `--gold-600` | `#A87230` | CTA hover state |
| `--gold-700` | `#7F5222` | CTA active/pressed state |
| `--gold-800` | `#573618` | Dark decorative elements |
| `--gold-900` | `#30190A` | Rarely used — extreme dark accent |

---

### Night Scale

| Token | Hex | Usage |
|---|---|---|
| `--night-50` | `#F0EEF8` | Very subtle tint backgrounds |
| `--night-100` | `#D3CEEC` | Subtle overlays in light mode |
| `--night-200` | `#A69DD4` | Disabled text on dark surfaces |
| `--night-300` | `#7870B4` | Secondary text on dark surfaces |
| `--night-400` | `#524891` | Tertiary text on dark surfaces |
| `--night-500` | `#352D6E` | Dark elevated surface |
| `--night-600` | `#221C52` | Dark overlay surface |
| `--night-700` | `#17102B` | **Primary dark** — dark mode page background |
| `--night-800` | `#100C20` | Deeper dark background |
| `--night-900` | `#08060F` | Darkest surface, OLED-friendly |

---

### Sand Scale (Warm Neutrals)

| Token | Hex | Name | Usage |
|---|---|---|---|
| `--sand-50` | `#FAFAF7` | Ivory | Page background (light mode) |
| `--sand-100` | `#F3EAD8` | Parchment | Subtle background, code blocks |
| `--sand-200` | `#E5D5BC` | Cream | Default border color |
| `--sand-300` | `#D4C0A2` | Linen | Input borders, dividers |
| `--sand-400` | `#C8B89E` | Sand | Placeholder text, strong borders |
| `--sand-500` | `#A09280` | Dune | Tertiary text |
| `--sand-600` | `#786860` | Stone | Secondary text |
| `--sand-700` | `#564840` | Umber | Secondary text (stronger) |
| `--sand-800` | `#4A3D36` | Earth | Body text (light mode) |
| `--sand-900` | `#2A1F1A` | Dark Earth | Headings (light mode) |

---

### Sage Scale (Life / Vitality)

| Token | Hex | Usage |
|---|---|---|
| `--sage-50` | `#EDF5F0` | Success background tint |
| `--sage-200` | `#9ECBB2` | Success border |
| `--sage-400` | `#4A9A70` | Success icon |
| `--sage-500` | `#5A8A68` | **Primary sage** — success state, growth indicators |
| `--sage-700` | `#28563A` | Success text on light backgrounds |

---

### Terra Scale (Warmth / Error)

| Token | Hex | Usage |
|---|---|---|
| `--terra-50` | `#FDF2EE` | Error background tint |
| `--terra-200` | `#F0B9A8` | Error border |
| `--terra-400` | `#D07060` | Warning / destructive icon |
| `--terra-500` | `#C06858` | **Primary terra** — error states, destructive actions |
| `--terra-700` | `#78362E` | Error text on light backgrounds |

---

### Semantic Tokens

These are the tokens designers should use in components — never use raw scale values directly in components.

#### Light Mode

| Semantic Token | Resolves To | Purpose |
|---|---|---|
| `--color-bg` | `--sand-50` | Page background |
| `--color-bg-subtle` | `--sand-100` | Subtle section background |
| `--color-surface` | `#FFFFFF` | Card, modal, drawer surfaces |
| `--color-surface-raised` | `--sand-100` | Elevated card surface |
| `--color-surface-overlay` | `--sand-200` | Overlaid surface (dropdowns) |
| `--color-border` | `--sand-200` | Default borders |
| `--color-border-strong` | `--sand-400` | Emphasized borders |
| `--color-border-focus` | `--gold-400` | Focus ring |
| `--color-text-primary` | `--night-800` | Main body text |
| `--color-text-secondary` | `--sand-700` | Supporting text |
| `--color-text-tertiary` | `--sand-600` | Placeholder, metadata |
| `--color-text-disabled` | `--sand-400` | Disabled state text |
| `--color-text-inverse` | `--sand-50` | Text on dark backgrounds |
| `--color-brand` | `--gold-500` | Primary interactive color |
| `--color-brand-hover` | `--gold-600` | Hover state |
| `--color-brand-active` | `--gold-700` | Pressed state |
| `--color-brand-subtle` | `--gold-50` | Tinted brand background |
| `--color-success` | `--sage-500` | Success states |
| `--color-warning` | `--gold-400` | Warning states |
| `--color-error` | `--terra-500` | Error / destructive states |

#### Dark Mode — overrides only

| Semantic Token | Dark Value |
|---|---|
| `--color-bg` | `--night-900` |
| `--color-surface` | `--night-800` |
| `--color-surface-raised` | `--night-700` |
| `--color-surface-overlay` | `--night-600` |
| `--color-border` | `rgba(255,255,255,0.08)` |
| `--color-border-strong` | `rgba(255,255,255,0.16)` |
| `--color-text-primary` | `--sand-100` |
| `--color-text-secondary` | `--sand-400` |
| `--color-brand` | `--gold-400` |
| `--color-brand-hover` | `--gold-300` |
| `--color-brand-subtle` | `rgba(201,145,61,0.12)` |

---

## 3. Typography

### Philosophy
Arabic script is visually denser than Latin. At the same `px` size, Arabic glyphs carry more optical weight. As a rule:
- **Arabic display text needs ~15% more vertical space** than equivalent Latin sizes
- **Line-height for Arabic body text should never go below 1.7** — less causes tashkeel marks to overlap
- **Text containers must be built to flex** — Arabic copy expands 25–40% wider than the same English sentence

---

### Font Stack

| Role | Primary (Licensed) | Free Fallback | When to Use |
|---|---|---|---|
| **Display** | 29LT Bukra | Cairo (Variable) | Hero headings, logo wordmark, campaign banners |
| **Heading** | IBM Plex Arabic | Cairo | Section headers, card titles, navigation labels |
| **Body** | Tajawal | Noto Naskh Arabic | Paragraphs, form labels, UI body copy |
| **Calligraphic** | Scheherazade New | Noto Naskh Arabic | Pull quotes, onboarding "hero moments," cultural accents |
| **Latin / Numbers** | IBM Plex Sans | Inter | All English text, financial figures, code |

**Google Fonts import (free implementation):**
```html
<link
  href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;900&family=IBM+Plex+Arabic:wght@300;400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Scheherazade+New:wght@400;700&family=Tajawal:wght@300;400;500;700;900&display=swap"
  rel="stylesheet"
/>
```

---

### Type Scale

| Token | Size | px | Line Height | Use |
|---|---|---|---|---|
| `--text-2xs` | `0.6875rem` | 11px | 1.4 | Legal copy, timestamps |
| `--text-xs` | `0.75rem` | 12px | 1.5 | Metadata, badge labels |
| `--text-sm` | `0.875rem` | 14px | 1.6 | Secondary labels, captions |
| `--text-base` | `1rem` | 16px | 1.7 | Body copy, form inputs |
| `--text-lg` | `1.125rem` | 18px | 1.7 | Emphasized body, lead text |
| `--text-xl` | `1.25rem` | 20px | 1.7 | Card titles, nav items |
| `--text-2xl` | `1.5rem` | 24px | 1.55 | Section headings |
| `--text-3xl` | `2rem` | 32px | 1.4 | Page headings |
| `--text-4xl` | `2.75rem` | 44px | 1.35 | Hero headings |
| `--text-5xl` | `3.5rem` | 56px | 1.2 | Display / feature moments |
| `--text-6xl` | `4.5rem` | 72px | 1.1 | Full-screen campaign |

---

### Font Weight Usage

| Weight | Token | Arabic Use | When |
|---|---|---|---|
| 300 | `--font-light` | Display, decorative subheadings | Use sparingly — thin weights lose legibility in Arabic |
| 400 | `--font-regular` | All body text | Default |
| 500 | `--font-medium` | UI labels, navigation | Interactive elements |
| 600 | `--font-semibold` | Card titles, form labels | Emphasized UI |
| 700 | `--font-bold` | Section headings, CTAs | Strong hierarchy |
| 900 | `--font-black` | Display headlines, logo | Hero only |

---

### Arabic Line Height Rules

```
Tight   1.35 — Display headlines only (h1, hero)
Snug    1.55 — Section headings (h2, h3)
Normal  1.70 — UI body, card descriptions
Relaxed 1.90 — Long-form reading, journal entries
Loose   2.20 — Tashkeel-heavy text, classical quotes
```

> ⚠️ Never use `line-height: 1.2` or lower for Arabic text — tashkeel marks will collide with the line above.

---

### Typographic Hierarchy — Example

```
حياتي                          → font-display, text-5xl, font-black, gold-500
عِش كل لحظة بوعي               → font-accent, text-2xl, font-regular, sand-600
أهدافك اليومية                  → font-heading, text-3xl, font-bold, text-primary
تتبع تقدمك بسهولة               → font-body, text-lg, font-regular, text-secondary
ابدأ الآن                       → font-heading, text-base, font-semibold, text-on-brand
```

---

## 4. Spacing & Layout

### Spacing Scale

Based on a 4px base unit. All spacing decisions should use these tokens.

| Token | Value | px | Common Use |
|---|---|---|---|
| `--space-1` | `0.25rem` | 4px | Icon gap, inline tight spacing |
| `--space-2` | `0.5rem` | 8px | Badge padding, tight component gap |
| `--space-3` | `0.75rem` | 12px | Button padding (vertical), list gap |
| `--space-4` | `1rem` | 16px | Default component padding |
| `--space-5` | `1.25rem` | 20px | Card padding (compact) |
| `--space-6` | `1.5rem` | 24px | Card padding (default) |
| `--space-8` | `2rem` | 32px | Section inner gap |
| `--space-10` | `2.5rem` | 40px | Card padding (spacious) |
| `--space-12` | `3rem` | 48px | Section padding (mobile) |
| `--space-16` | `4rem` | 64px | Section padding (desktop) |
| `--space-20` | `5rem` | 80px | Large section gap |
| `--space-24` | `6rem` | 96px | Hero padding |
| `--space-32` | `8rem` | 128px | Page hero top padding |

---

### Border Radius

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | `0.375rem` / 6px | Badges, tags, small inputs |
| `--radius-md` | `0.75rem` / 12px | Cards, standard inputs, buttons |
| `--radius-lg` | `1.25rem` / 20px | Modals, bottom sheets, feature cards |
| `--radius-xl` | `2rem` / 32px | Hero cards, featured content blocks |
| `--radius-full` | `9999px` | Pills, avatars, icon buttons |

> **Principle:** Larger, more important components get larger radii. Inline elements (badges, chips) use `radius-sm`. Never mix `radius-sm` and `radius-xl` in the same component.

---

### Grid

- **Mobile:** 4-column grid, 16px gutters, 16px margin
- **Tablet:** 8-column grid, 24px gutters, 24px margin
- **Desktop:** 12-column grid, 24px gutters, auto margin (max-width: 1280px)
- **Wide:** 12-column grid, 32px gutters, auto margin (max-width: 1440px)

---

## 5. Elevation & Shadows

All shadows use `--hayati-night` (`#17102B`) as the base color to maintain warmth.

| Token | Value | Use |
|---|---|---|
| `--shadow-xs` | `0 1px 2px 0 rgb(23 16 43 / 0.06)` | Subtle lift, inputs |
| `--shadow-sm` | `0 2px 6px -1px rgb(23 16 43 / 0.10), 0 1px 2px -1px rgb(23 16 43 / 0.06)` | Cards, buttons |
| `--shadow-md` | `0 6px 16px -4px rgb(23 16 43 / 0.12), 0 2px 4px -2px rgb(23 16 43 / 0.06)` | Elevated cards, dropdowns |
| `--shadow-lg` | `0 16px 40px -8px rgb(23 16 43 / 0.16), 0 4px 8px -4px rgb(23 16 43 / 0.06)` | Modals, side panels |
| `--shadow-xl` | `0 32px 64px -12px rgb(23 16 43 / 0.22)` | Full-screen overlays |
| `--shadow-gold` | `0 4px 20px -2px rgb(201 145 61 / 0.35)` | CTA buttons, brand highlights |

---

## 6. Motion & Animation

### Easing Functions

| Token | Curve | Use |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.0, 0.0, 0.2, 1)` | Most entrances — element slides/fades in |
| `--ease-in` | `cubic-bezier(0.4, 0.0, 1, 1)` | Exits — element leaves the screen |
| `--ease-in-out` | `cubic-bezier(0.4, 0.0, 0.2, 1)` | State changes within screen |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful bounces — notifications, success states |
| `--ease-gentle` | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | Subtle hover effects, focus rings |

### Duration Scale

| Token | Value | Use |
|---|---|---|
| `--duration-instant` | `60ms` | Immediate feedback — checkbox, toggle |
| `--duration-fast` | `120ms` | Hover effects, color transitions |
| `--duration-normal` | `200ms` | Most UI transitions |
| `--duration-slow` | `350ms` | Cards expanding, page elements |
| `--duration-enter` | `400ms` | Page transitions, modal open |
| `--duration-exit` | `250ms` | Modal close, toast dismiss (exits feel faster) |

### Motion Principles

1. **Entrances use `ease-out`** — elements decelerate as they arrive, feeling intentional
2. **Exits use `ease-in`** — elements accelerate as they leave, feeling crisp
3. **Never animate `width`, `height`, or `top/left`** — always use `transform` and `opacity` for GPU-accelerated performance
4. **Arabic users read right-to-left** — slide animations should enter from the right, not the left
5. **Reduce motion** — always respect `prefers-reduced-motion` and provide instant fallbacks

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Framer Motion Pattern

```tsx
// Standard page enter
const pageVariants = {
  hidden:  { opacity: 0, x: 20 },    // enters from right (RTL-appropriate)
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.0, 0.0, 0.2, 1] } },
  exit:    { opacity: 0, x: -20, transition: { duration: 0.25, ease: [0.4, 0.0, 1, 1] } },
};

// Card hover lift
const cardVariants = {
  rest:  { y: 0,  boxShadow: "var(--shadow-sm)" },
  hover: { y: -4, boxShadow: "var(--shadow-lg)", transition: { duration: 0.2 } },
};
```

---

## 7. RTL Design Principles

Hayati is **Arabic-first**. RTL is not an afterthought; it is the primary layout direction.

### The Visual Path
- Arabic users scan **top-right → bottom-left**
- Primary content (brand mark, primary navigation, headings) anchors to the **right**
- Secondary / supporting content flows left
- Progress and timelines move **right → left** (start at right, end at left)

### Directional Element Rules

| Element | LTR Behavior | RTL / Hayati Behavior |
|---|---|---|
| Navigation | Left-aligned logo | Right-aligned logo |
| Back button arrow | Points left `←` | Points right `→` |
| Forward / next arrow | Points right `→` | Points left `←` |
| Progress bar fill | Fills left to right | Fills right to left |
| Carousel | Slides left | Slides right |
| Checkmark / radio | Left of label | Right of label |
| Tooltip arrow | Points from left | Points from right |
| Text alignment | `text-left` | `text-right` |
| Padding | `padding-left` for indent | `padding-right` for indent |

### CSS Implementation

Always use **logical properties** — they automatically flip for RTL:

```css
/* ✅ Do this */
margin-inline-start: var(--space-4);
padding-inline-end: var(--space-6);
border-inline-start: 2px solid var(--color-brand);
inset-inline-start: 0;

/* ❌ Never this (breaks RTL) */
margin-left: 1rem;
padding-right: 1.5rem;
border-left: 2px solid var(--color-brand);
left: 0;
```

### Setting Direction

```html
<!-- Root element -->
<html lang="ar" dir="rtl">

<!-- Mixed content: a block of English inside Arabic layout -->
<p dir="ltr" lang="en" class="font-latin">
  +20 100 000 0000
</p>
```

### Text Expansion Budget
Arabic text takes 25–40% more horizontal space than English. Always design containers with this in mind:

```tsx
// In Tailwind: never hardcode widths for text containers
// ✅
<div className="w-full max-w-prose">

// ❌
<div className="w-48">
```

---

## 8. Dark Mode

### Strategy
Dark mode is not simply color inversion. The Hayati dark mode uses the `--night` scale as surfaces (warm purple-blacks) against which `--gold` glows more intensely — replicating the visual sensation of stars appearing at dusk.

### Implementation
Dark mode is toggled via `data-theme="dark"` on the `<html>` element (not via `prefers-color-scheme` alone — users should be able to override the OS setting from within the app).

```tsx
// Toggle
document.documentElement.setAttribute('data-theme', 'dark');
document.documentElement.removeAttribute('data-theme'); // back to light
```

### Dark Mode Rules

1. **Surfaces lift via opacity, not lightness** — a modal on top of a page uses `--night-700` over `--night-800`, not a lighter shade of another hue
2. **Brand gold gets lighter in dark mode** — `--gold-400` replaces `--gold-500` as the primary brand color (lighter reads better against dark)
3. **Text hierarchy uses `--sand` scale** — `--sand-100` for primary, `--sand-400` for secondary, `--sand-600` for tertiary
4. **Avoid pure white** — `--sand-100` (`#F3EAD8`) is the lightest recommended text color; pure white feels harsh against the warm dark surfaces
5. **Shadows become glows** — in dark mode, `--shadow-gold` becomes the primary elevation signal instead of drop shadows

---

## 9. Component Patterns

### Primary Button

```tsx
// Brand CTA — Hayati Gold
<button className="
  bg-gold-500 hover:bg-gold-600 active:bg-gold-700
  text-white font-heading font-semibold text-base
  px-6 py-3 rounded-md
  shadow-gold hover:shadow-lg
  transition-all duration-200 ease-gentle
  focus-visible:outline-none focus-visible:ring-2
  focus-visible:ring-gold-400 focus-visible:ring-offset-2
">
  ابدأ الآن
</button>
```

### Card

```tsx
<div className="
  bg-surface rounded-lg p-6
  border border-sand-200 dark:border-white/8
  shadow-sm hover:shadow-md
  transition-shadow duration-200
">
```

### Calligraphic Quote Block

For the "Scheherazade New" calligraphic moments — pull quotes, onboarding wisdom:

```tsx
<blockquote className="
  font-accent text-3xl leading-[2.2]
  text-sand-800 dark:text-sand-200
  text-center py-8 px-4
  relative
  before:content-['❝'] before:text-gold-300 before:text-5xl before:block before:text-center
">
  حياتك قصة تكتبها أنت
</blockquote>
```

### Halal Badge

```tsx
<span className="
  inline-flex items-center gap-1
  bg-sage-50 dark:bg-sage-500/15
  text-sage-700 dark:text-sage-300
  font-medium text-xs
  px-2 py-1 rounded-sm
  border border-sage-200 dark:border-sage-500/30
">
  ✓ حلال
</span>
```

---

## 10. Implementation

### CSS Custom Properties File
All tokens are defined in `tokens.css` (co-located with this document). Import it before any component styles:

```css
@import "./tokens.css";
```

### Tailwind Config
The full Tailwind extension is in `tailwind.config.ts`. All color scales, font families, font sizes, shadows, and border radii are registered and available as utility classes:

```tsx
// Examples of generated utilities
className="text-gold-500"           // --gold-500
className="bg-night-800"            // --night-800
className="font-display"            // 29LT Bukra → Cairo
className="shadow-gold"             // brand glow shadow
className="text-4xl"                // 2.75rem, leading: 1.35
className="rounded-lg"              // 1.25rem radius
```

### Font Loading Strategy
Fonts are declared `display=swap` to prevent FOIT (flash of invisible text). The calligraphic font (`Scheherazade New`) is **not** preloaded — it is used only in specific accent contexts and should be loaded lazily.

```html
<!-- In <head> — preload only what's needed above the fold -->
<link rel="preload" href="/fonts/Cairo-Variable.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/Tajawal-Regular.woff2" as="font" type="font/woff2" crossorigin>
```

### Z-Index System

| Token | Value | Layer |
|---|---|---|
| `--z-below` | `-1` | Background decorations |
| `--z-base` | `0` | Default content |
| `--z-raised` | `10` | Sticky cards, floating elements |
| `--z-dropdown` | `100` | Dropdowns, select menus |
| `--z-sticky` | `200` | Sticky headers, bottom nav |
| `--z-overlay` | `300` | Backdrop overlays |
| `--z-modal` | `400` | Modals, dialogs |
| `--z-toast` | `500` | Toast notifications |
| `--z-tooltip` | `600` | Tooltips (always on top) |

---

## Quick Reference Card

```
Brand Colors
  Gold ........ #C9913D   Night ....... #17102B
  Sage ........ #5A8A68   Terra ....... #C06858

Neutral Anchors
  Ivory ....... #FAFAF7   Parchment ... #F3EAD8
  Sand ........ #C8B89E   Stone ....... #786860
  Earth ....... #4A3D36   Dark Earth .. #2A1F1A

Typography
  Display ..... 29LT Bukra → Cairo (Black)
  Heading ..... IBM Plex Arabic → Cairo (Bold)
  Body ........ Tajawal → Noto Naskh Arabic
  Calligraphic  Scheherazade New
  Latin ....... IBM Plex Sans → Inter

Arabic Line Heights
  Tight 1.35 · Snug 1.55 · Normal 1.70 · Relaxed 1.90 · Loose 2.20

Motion
  Enter 400ms ease-out · Exit 250ms ease-in · Hover 200ms ease-gentle
```

---

*حياتي — Design with intention. Every element earns its place.*
