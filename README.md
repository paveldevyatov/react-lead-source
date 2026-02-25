<div align="center">

# react-lead-source

**Know where every lead comes from.**

Drop-in React component that saves UTM parameters, ad click IDs, and referrer into `localStorage`.

[![npm version](https://img.shields.io/npm/v/react-lead-source)](https://www.npmjs.com/package/react-lead-source)
[![bundle size](https://img.shields.io/bundlephobia/minzip/react-lead-source)](https://bundlephobia.com/package/react-lead-source)
[![license](https://img.shields.io/npm/l/react-lead-source)](./LICENSE)

</div>

## Why

A visitor clicks your ad, lands on your site, browses around, and fills out a form. **But which ad brought them?** The UTM parameters are long gone from the URL by then.

`<LeadSource />` captures the source on first visit and keeps it in `localStorage` until you need it.

```
Ad click → Your site → <LeadSource /> saves the source → ... → Form submit → getLeadSource()
```

## Install

```bash
npm install react-lead-source
# or
yarn add react-lead-source
# or
pnpm add react-lead-source
```

## Quick start

Add to your root layout — renders nothing, captures data once:

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

## Send to backend

Attach lead source to any request:

```tsx
import { getLeadSource } from "react-lead-source";

await fetch("/api/leads", {
  method: "POST",
  body: JSON.stringify({
    ...formData,
    ...getLeadSource(),
  }),
});
```

Your backend receives:

```json
{
  "utm_source": "google",
  "utm_medium": "cpc",
  "utm_campaign": "spring_sale",
  "gclid": "EAIaIQobChMI...",
  "referrer": "https://www.google.com/",
  "page": "/pricing",
  "landed_at": "2025-03-15T10:30:00.000Z"
}
```

## Reactive hook

```tsx
import { useLeadSource } from "react-lead-source";

function MyComponent() {
  const source = useLeadSource();
  // source.utm_source, source.gclid, etc.
}
```

## Options

All enabled by default. Disable what you don't need:

```tsx
<LeadSource adClickIds={false} device={false} />
```

Last-touch attribution (overwrite on every visit):

```tsx
<LeadSource overwrite />
```

## What it captures

| Category | Fields | Source |
|---|---|---|
| **UTM** | `utm_source` `utm_medium` `utm_campaign` `utm_term` `utm_content` | URL params |
| **Ad click IDs** | `gclid` `gbraid` `wbraid` (Google) `fbclid` (Meta) `msclkid` (Bing) `ttclid` (TikTok) `li_fat_id` (LinkedIn) `twclid` (X) | URL params |
| **Referrer** | `referrer` | `document.referrer` |
| **Device** | `language` `timezone` `screen_width` `screen_height` `user_agent` | Browser APIs |
| **Page** | `page` `landed_at` | URL path + timestamp |

## API

| Export | Type | Description |
|---|---|---|
| `<LeadSource />` | Component | Captures data on mount. Renders nothing. |
| `useLeadSource()` | Hook | Returns `LeadSourceData \| null` reactively. |
| `getLeadSource()` | Function | Returns `LeadSourceData \| null`. Works anywhere. |
| `clearLeadSource()` | Function | Removes saved data from `localStorage`. |

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `utm` | `boolean` | `true` | Capture UTM parameters |
| `adClickIds` | `boolean` | `true` | Capture ad click IDs |
| `referrer` | `boolean` | `true` | Capture `document.referrer` |
| `device` | `boolean` | `true` | Capture device info |
| `page` | `boolean` | `true` | Capture landing page path |
| `timestamp` | `boolean` | `true` | Capture ISO timestamp |
| `overwrite` | `boolean` | `false` | Last-touch attribution |
| `storageKey` | `string` | `"lead-source"` | Custom localStorage key |

All functions also accept an optional `storageKey` parameter.

## Highlights

- **~1.2 KB** gzipped
- **Zero dependencies** — only React >=18 as peer dep
- **First-touch** by default, **last-touch** with `overwrite`
- **SSR-safe** — Next.js, Remix, Astro
- **TypeScript** out of the box

## License

MIT
