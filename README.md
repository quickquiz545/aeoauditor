# AEO/GEO Content Auditor

A production-ready Next.js App Router web app for auditing webpages against AEO and GEO optimization criteria. The app fetches a URL, extracts page signals, sends the structured content to OpenAI, and returns scored recommendations for SEO teams.

## Features

- URL input with loading and error states.
- Server-side `/api/analyze` route.
- HTML extraction for title, meta description, headings, paragraphs, links, schema scripts, and word count.
- OpenAI structured JSON output.
- AEO, GEO, content quality, technical SEO, and trust signal scoring.
- Score cards, progress bars, severity-based issue cards, priority fixes, FAQs, content additions, schema suggestions, and manager summary.
- Mobile responsive Tailwind CSS dashboard UI.
- Vercel-ready configuration.

## Scoring

- AEO Readiness: 30 points
- GEO Readiness: 30 points
- Content Depth & Helpfulness: 20 points
- Technical SEO Signals: 10 points
- Trust & Citation Strength: 10 points
- Total: 100 points

## Requirements

- Node.js 20 or newer
- OpenAI API key

## Setup

```bash
npm install
cp .env.example .env.local
```

Add your API key:

```bash
OPENAI_API_KEY=sk-your-openai-api-key
```

Optionally set a model:

```bash
OPENAI_MODEL=gpt-4o-mini
```

## Development

```bash
npm run dev
```

Open `http://localhost:3000`.

## Production

```bash
npm run build
npm run start
```

## API

`POST /api/analyze`

Request:

```json
{
  "url": "https://example.com/page"
}
```

Response:

```json
{
  "overallScore": 82,
  "aeoScore": 24,
  "geoScore": 23,
  "contentQualityScore": 17,
  "technicalSeoScore": 9,
  "trustScore": 9,
  "summary": "Short manager-facing summary.",
  "shortcomings": [],
  "priorityFixes": [],
  "suggestedFAQs": [],
  "suggestedContentBlocks": [],
  "suggestedSchema": []
}
```

## Environment Variables

| Name | Required | Description |
| --- | --- | --- |
| `OPENAI_API_KEY` | Yes | OpenAI API key used by the server-side analysis route. |
| `OPENAI_MODEL` | No | Override the default OpenAI model. Defaults to `gpt-4o-mini`. |

## Deployment on Vercel

1. Import the repository into Vercel.
2. Add `OPENAI_API_KEY` in Project Settings, Environment Variables.
3. Deploy.

The API route runs server-side, so the OpenAI API key is never exposed to the browser.
