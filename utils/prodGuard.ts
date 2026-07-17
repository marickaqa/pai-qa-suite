// Production safety interlock.
//
// The suite creates and deletes real resources (agents, chats, jobs).
// Pointing it at production by accident — e.g. a stale .env or a copy of an
// old .env.example — must fail immediately, before any test runs.
//
// To intentionally run against production (e.g. the read-only prod smoke
// tier), set ALLOW_PROD=1.

const PROD_HOSTNAMES = [
  // SaaS platform
  'chat.paicloud.ai',
  // Egle chatbot
  'egle.chat',
  'www.egle.chat',
  'api.egle.chat',
  // Support bot widget
  'supportbot-widget.paicloud.ai',
]

// Every env var that can point the suite at a target environment.
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
 * Throws if any configured target URL points at a production domain,
 * unless ALLOW_PROD=1 is set. Call this at the very top of every global
 * setup, before any token fetch or login.
 */
export function assertNotProd(): void {
  if (process.env.ALLOW_PROD === '1') {
    console.warn('ALLOW_PROD=1 - production guard is DISABLED for this run.')
    return
  }

  const offenders: string[] = []
  for (const name of URL_ENV_VARS) {
    const value = process.env[name]
    if (!value) continue
    const host = hostnameOf(value)
    if (host && PROD_HOSTNAMES.includes(host)) {
      offenders.push(`${name}=${value}`)
    }
  }

  if (offenders.length > 0) {
    throw new Error(
      [
        'PRODUCTION GUARD: refusing to run - the following env vars point at production:',
        ...offenders.map(o => `   ${o}`),
        '',
        'This suite creates and deletes real resources. Point these at the dev',
        'environment (see .env.example), or set ALLOW_PROD=1 only if you are',
        'deliberately running the read-only prod smoke tier.',
      ].join('\n')
    )
  }
}
