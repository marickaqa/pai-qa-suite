// Production safety interlock.
//
// The suite creates and deletes real resources (agents, chats, jobs).
// Pointing it at production by accident — e.g. a stale .env or a copy of an
// old .env.example — must fail immediately, before any test runs.
//
// DESIGN: this is an ALLOWLIST, not a denylist. We refuse to run unless every
// configured target URL points at a known dev/test host. The previous version
// listed prod hosts and blocked those — which fails *open*: any prod host not
// on the list (a new domain, a forgotten one, a value missing its scheme)
// passed silently. For a guard that gates destructive tests, that is the wrong
// failure direction. An allowlist fails *safe*: anything unrecognised is
// blocked and reported, so a new/forgotten domain stops the run loudly instead
// of silently running against prod.
//
// Trade-off: every new dev/test domain must be added to ALLOWED_DEV_HOSTNAMES
// below, or the suite will refuse to run against it. That is a one-line change
// with a clear error message — the intended cost of failing safe.
//
// To intentionally run against production (e.g. the read-only prod smoke
// tier), set ALLOW_PROD=1. That tier uses its own SMOKE_* env vars, which is
// why they are deliberately NOT in URL_ENV_VARS below.

// Hosts it is SAFE to create/delete resources against. Everything else is
// refused unless ALLOW_PROD=1. Add new dev/test domains here as they appear.
const ALLOWED_DEV_HOSTNAMES = [
  // SaaS platform (PAI Cloud) — dev
  'chat-dev.paicloud.ai',
  // Egle chatbot frontend — dev  (migrated 2026-07 from pc-fe-dev.noctocode.dev)
  'dev.egle.chat',
  // Egle chatbot backend — dev   (migrated 2026-07 from pc-be-dev.noctocode.dev)
  'chat-api-dev.paicloud.ai',
  // Custom chatbot box (CHATBOT_URL)
  'pc-chatbot-0.duckdns.org',
  // Subtitles — dev
  'subtitles-dev.paicloud.ai',
  'subtitles-api-dev.paicloud.ai',
  // Support bot widget — dev
  'supportbot-widget-dev.paicloud.ai',
  // Widget dummy company site (Vercel)
  'perception-chatbot-dummy-company-env-testing-noctocodeteam.vercel.app',
  // Telaris (Vercel)
  'telaris.vercel.app',
  // Local development
  'localhost',
  '127.0.0.1',
]

// Every env var that can point the suite at a target environment.
// This list must stay exhaustive: any URL-bearing var NOT listed here is never
// checked by the guard. SMOKE_* vars are intentionally excluded — the prod
// smoke tier runs under ALLOW_PROD=1 and manages its own targets.
const URL_ENV_VARS = [
  'CHAT_URL',
  'CHATBOT_URL',
  'API_BASE_URL',
  'SAAS_URL',
  'SUBTITLES_URL',
  'SUBTITLES_API_URL',
]

function hostnameOf(value: string): string | null {
  try {
    return new URL(value).hostname.toLowerCase()
  } catch {
    return null
  }
}

/**
 * Throws unless every configured target URL points at a known dev/test host,
 * unless ALLOW_PROD=1 is set. Call this at the very top of every global setup,
 * before any token fetch or login.
 *
 * A set-but-unparseable value (e.g. missing its https:// scheme) is treated as
 * an offender, not skipped — a malformed prod URL must not slip through.
 * Unset vars are ignored here; requiring a var to be present is the config's
 * job (see required() in playwright.config.ts), not the guard's.
 */
export function assertNotProd(): void {
  if (process.env.ALLOW_PROD === '1') {
    console.warn('ALLOW_PROD=1 - production guard is DISABLED for this run.')
    return
  }

  const offenders: string[] = []
  for (const name of URL_ENV_VARS) {
    const value = process.env[name]
    if (!value) continue // unset = not a target; not the guard's concern
    const host = hostnameOf(value)
    if (host === null) {
      offenders.push(`${name}=${value} (could not parse a hostname — is the scheme missing?)`)
      continue
    }
    if (!ALLOWED_DEV_HOSTNAMES.includes(host)) {
      offenders.push(`${name}=${value} (host "${host}" is not an allowed dev/test host)`)
    }
  }

  if (offenders.length > 0) {
    throw new Error(
      [
        'PRODUCTION GUARD: refusing to run - the following target URLs are not known dev/test hosts:',
        ...offenders.map(o => `   ${o}`),
        '',
        'This suite creates and deletes real resources. Point these at the dev',
        'environment (see .env.example). If a new dev/test domain is legitimate,',
        'add its hostname to ALLOWED_DEV_HOSTNAMES in utils/prodGuard.ts. Only set',
        'ALLOW_PROD=1 if you are deliberately running the read-only prod smoke tier.',
      ].join('\n')
    )
  }
}
