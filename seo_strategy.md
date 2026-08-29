# SEO Strategy — Fade Factory ATL

## Site type
Local barbershop — single-page React/Vite SPA. One public URL (`/`). Authenticated routes (`/login`, `/admin`, `/barber`) are out of scope for SEO.

## In scope
- Home page (`/`) — the only public-facing, indexable page

## Out of scope
- `/login`, `/admin`, `/barber` — authenticated staff routes

## Target audience
Walk-in and appointment customers searching for barbershops in Atlanta, GA (West Midtown). Also customers looking for specific services: fades, tapers, line-ups, beard shaping.

## Primary keywords
- "barber shop Atlanta"
- "fade barber Atlanta"
- "West Midtown Atlanta barber"
- "haircut Atlanta"

## Crawler assumptions
- Site is a React SPA served by Vite. Initial HTML shell contains no crawlable content except the `<title>` tag.
- Social bots (Facebook, Twitter, LinkedIn) and AI crawlers (GPTBot, ClaudeBot, PerplexityBot) do not render JavaScript and therefore see an empty page.
- Googlebot may eventually render the page but cannot be relied upon for freshness; SPA rendering is a two-wave process with delays.

## Dismissed categories
- (None yet)
