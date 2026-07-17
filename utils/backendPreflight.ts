// Backend health preflight.
//
// The dev backend periodically goes through deploy windows where many
// endpoints return 500 while auth still works. Running the full suite
// during such a window produces dozens of false failures. This preflight
// hits two cheap canary endpoints after token setup; if they persistently
// return 5xx (or the server is unreachable), the run aborts with a clear
// message instead.
//
// Healthy = any HTTP status < 500 (a 4xx means the server is executing
// application logic, which is all we need to know).

import axios from 'axios'

const ATTEMPTS = 3
const WAIT_MS = 10_000

interface Canary {
  label: string
  url: string
  headers: Record<string, string>
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function probeOnce(canary: Canary): Promise<{ healthy: boolean; detail: string }> {
  try {
    const res = await axios.get(canary.url, {
      headers: canary.headers,
      timeout: 15_000,
      validateStatus: () => true, // never throw on HTTP status
    })
    if (res.status < 500) return { healthy: true, detail: `HTTP ${res.status}` }
    return { healthy: false, detail: `HTTP ${res.status}` }
  } catch (e: any) {
    return { healthy: false, detail: e.code || e.message || 'network error' }
  }
}

export async function backendPreflight(baseUrl: string, chatToken: string, saasToken: string): Promise<void> {
  const canaries: Canary[] = [
    {
      label: 'chatbot API (GET /chat)',
      url: `${baseUrl}/chat?limit=1&page=1`,
      headers: { Authorization: `Bearer ${chatToken}` },
    },
    {
      label: 'SaaS API (GET /prompt-templates)',
      url: `${baseUrl}/prompt-templates`,
      headers: { Authorization: `Bearer ${saasToken}` },
    },
  ]

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const results = await Promise.all(canaries.map(probeOnce))
    const failing = results
      .map((r, i) => ({ ...r, label: canaries[i].label }))
      .filter(r => !r.healthy)

    if (failing.length === 0) {
      console.log('Backend preflight OK')
      return
    }

    console.warn(
      `Backend preflight attempt ${attempt}/${ATTEMPTS} failed: ` +
      failing.map(f => `${f.label} -> ${f.detail}`).join(', ')
    )
    if (attempt < ATTEMPTS) await sleep(WAIT_MS)
  }

  throw new Error(
    [
      'BACKEND PREFLIGHT FAILED: dev backend is returning server errors.',
      'This usually means a deploy to the dev environment is in progress.',
      'Aborting instead of generating a wall of false test failures.',
      'Wait a few minutes (or check with the backend team) and re-run.',
    ].join('\n')
  )
}
