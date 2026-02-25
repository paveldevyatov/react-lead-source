<div align="center">

# react-lead-source

**Know where every lead comes from. Automatically.**

Drop-in React component that captures UTM parameters, ad click IDs, referrer, and device context into `localStorage` — so you always know which marketing channel brought each visitor.

[![npm version](https://img.shields.io/npm/v/react-lead-source)](https://www.npmjs.com/package/react-lead-source)
[![bundle size](https://img.shields.io/bundlephobia/minzip/react-lead-source)](https://bundlephobia.com/package/react-lead-source)
[![license](https://img.shields.io/npm/l/react-lead-source)](./LICENSE)

</div>

---

## The problem

You're running ads on Google, Meta, TikTok, LinkedIn. A visitor clicks an ad, lands on your site, browses around, and fills out a form. **But which ad brought them?** By the time they convert, the UTM parameters are long gone from the URL.

## The solution

`<LeadSource />` captures the marketing source the moment a visitor lands — UTM params, click IDs (`gclid`, `fbclid`, etc.), referrer, device info — and stores it in `localStorage`. When the visitor eventually converts, you attach this data to the form submission. Done.

```
Visitor clicks ad → Lands on your site → <LeadSource /> saves the source
         ↓
  ...browses 5 pages, comes back 3 days later...
         ↓
  Fills out a form → getLeadSource() → send to your CRM / backend
```

---

## Highlights

- **Zero dependencies** — only React as a peer dep
- **< 1 KB** gzipped
- **First-touch attribution** by default — captures once, never overwrites
- **Last-touch** supported — pass `overwrite` to always capture the latest source
- **SSR-safe** — works with Next.js App Router, Remix, Astro, etc.
- **Configurable** — pick exactly what to capture
- **Reactive hook** — `useLeadSource()` for real-time access
- **TypeScript** — fully typed out of the box

---

## Install

```bash
npm install react-lead-source
```

```bash
yarn add react-lead-source
```

```bash
pnpm add react-lead-source
```

---

## Quick start

Add `<LeadSource />` to your root layout — it renders nothing and captures data on the first visit:

```tsx
import { LeadSource } from "react-lead-source";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <LeadSource />
        {children}
      </body>
    </html>
  );
}
```

**That's it.** The visitor's marketing source is now saved in `localStorage`.

---

## Usage examples

### Send lead source with a form submission

```tsx
import { getLeadSource } from "react-lead-source";

async function handleSubmit(formData: FormData) {
  const leadSource = getLeadSource();

  await fetch("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      ...leadSource,
    }),
  });
}
```

Your backend receives:

```json
{
  "name": "John",
  "email": "john@example.com",
  "phone": "+1234567890",
  "utm_source": "google",
  "utm_medium": "cpc",
  "utm_campaign": "spring_sale",
  "gclid": "EAIaIQobChMI...",
  "referrer": "https://www.google.com/",
  "page": "/pricing",
  "landed_at": "2025-03-15T10:30:00.000Z"
}
```

### Inject hidden fields into any form

```tsx
import { useLeadSource } from "react-lead-source";

function ContactForm() {
  const source = useLeadSource();

  return (
    <form action="/api/contact" method="POST">
      <input name="email" type="email" placeholder="Email" />
      <textarea name="message" placeholder="Message" />

      {/* Hidden fields — sent along with the form */}
      {source?.utm_source && <input type="hidden" name="utm_source" value={source.utm_source} />}
      {source?.utm_medium && <input type="hidden" name="utm_medium" value={source.utm_medium} />}
      {source?.utm_campaign && <input type="hidden" name="utm_campaign" value={source.utm_campaign} />}
      {source?.gclid && <input type="hidden" name="gclid" value={source.gclid} />}
      {source?.fbclid && <input type="hidden" name="fbclid" value={source.fbclid} />}

      <button type="submit">Send</button>
    </form>
  );
}
```

### Next.js App Router — Server Action

```tsx
// app/layout.tsx
import { LeadSource } from "react-lead-source";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <LeadSource />
        {children}
      </body>
    </html>
  );
}
```

```tsx
// app/contact/page.tsx
"use client";

import { getLeadSource } from "react-lead-source";
import { submitLead } from "./actions";

export default function ContactPage() {
  async function handleSubmit(formData: FormData) {
    const source = getLeadSource();
    formData.set("lead_source", JSON.stringify(source));
    await submitLead(formData);
  }

  return (
    <form action={handleSubmit}>
      <input name="email" type="email" required />
      <button type="submit">Subscribe</button>
    </form>
  );
}
```

### Last-touch attribution

By default, the source is captured once and never overwritten. If you want **last-touch** (always update to the latest source):

```tsx
<LeadSource overwrite />
```

### Custom storage key

If you need multiple instances or want to avoid key collisions:

```tsx
<LeadSource storageKey="my-app-lead-source" />
```

```tsx
// Read and clear with the same key
const source = useLeadSource("my-app-lead-source");
clearLeadSource("my-app-lead-source");
```

### Clear data after submission

```tsx
import { getLeadSource, clearLeadSource } from "react-lead-source";

async function handleSubmit(formData: FormData) {
  const source = getLeadSource();

  await fetch("/api/leads", {
    method: "POST",
    body: JSON.stringify({ ...Object.fromEntries(formData), ...source }),
  });

  // Clean up after successful submission
  clearLeadSource();
}
```

---

## Configuration

By default everything is captured. Pass props to disable what you don't need:

```tsx
<LeadSource
  utm={true}         // utm_source, utm_medium, utm_campaign, utm_term, utm_content
  adClickIds={true}  // gclid, gbraid, wbraid, fbclid, msclkid, ttclid, li_fat_id, twclid
  referrer={true}    // document.referrer
  device={true}      // language, timezone, screen size, user agent
  page={true}        // landing page path
  timestamp={true}   // landed_at ISO string
  overwrite={false}  // set true for last-touch attribution
/>
```

Only need UTMs and referrer? Disable the rest:

```tsx
<LeadSource adClickIds={false} device={false} />
```

---

## What it captures

| Category | Fields | Source |
|---|---|---|
| **UTM** | `utm_source` `utm_medium` `utm_campaign` `utm_term` `utm_content` | URL params |
| **Ad click IDs** | `gclid` `gbraid` `wbraid` (Google) · `fbclid` (Meta) · `msclkid` (Bing) · `ttclid` (TikTok) · `li_fat_id` (LinkedIn) · `twclid` (X/Twitter) | URL params |
| **Referrer** | `referrer` | `document.referrer` |
| **Device** | `language` `timezone` `screen_width` `screen_height` `user_agent` | `navigator` / `screen` / `Intl` |
| **Meta** | `page` `landed_at` | `location.pathname` / `Date` |

---

## API

| Export | Type | Description |
|---|---|---|
| `<LeadSource />` | Component | Drop into layout. Captures data on mount. Renders nothing. |
| `useLeadSource(storageKey?)` | Hook | Returns `LeadSourceData \| null` reactively. |
| `getLeadSource(storageKey?)` | Function | Returns `LeadSourceData \| null`. Works outside components. |
| `clearLeadSource(storageKey?)` | Function | Removes saved data from `localStorage`. |

### Props — `<LeadSource />`

| Prop | Type | Default | Description |
|---|---|---|---|
| `utm` | `boolean` | `true` | Capture UTM parameters |
| `adClickIds` | `boolean` | `true` | Capture ad click IDs (gclid, fbclid, etc.) |
| `referrer` | `boolean` | `true` | Capture `document.referrer` |
| `device` | `boolean` | `true` | Capture device info (language, timezone, screen, user agent) |
| `page` | `boolean` | `true` | Capture landing page path |
| `timestamp` | `boolean` | `true` | Capture ISO timestamp |
| `overwrite` | `boolean` | `false` | Overwrite existing data (last-touch attribution) |
| `storageKey` | `string` | `"lead-source"` | Custom localStorage key |

### Types

```ts
import type { LeadSourceData, LeadSourceProps } from "react-lead-source";
```

---

## License

MIT — [Pavel Devyatov](mailto:p.devyatov@gmail.com)
