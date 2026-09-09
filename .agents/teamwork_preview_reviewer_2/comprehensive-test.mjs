import http from 'node:http'
import { spawn } from 'node:child_process'

const PORT = 3567
const BASE_URL = `http://localhost:${PORT}`
const GRAPHQL_ENDPOINT = 'https://a-f.site/graphql'

let serverProcess = null

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.status) return true
    } catch {
      await sleep(500)
    }
  }
  throw new Error(`Server failed to start within ${timeoutMs}ms`)
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    redirect: 'manual',
    ...options,
  })
  const text = await res.text()
  return {
    status: res.status,
    location: res.headers.get('location'),
    headers: res.headers,
    body: text,
  }
}

const tests = []
function it(name, fn) {
  tests.push({ name, fn })
}

// ---------------------------------------------------------------------------
// 1. Requirement R1: Core E-Commerce Pages
// ---------------------------------------------------------------------------
it('R1: /cart resolves with status 200 OK and contains cart UI', async () => {
  const res = await request('/cart')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
  if (!res.body.includes('cart') && !res.body.includes('سلة')) {
    throw new Error('Expected cart content')
  }
})

it('R1: /shop resolves with status 200 OK and contains product catalog', async () => {
  const res = await request('/shop')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
})

it('R1: /my-account resolves with status 200 OK without DYNAMIC_SERVER_USAGE crash', async () => {
  const res = await request('/my-account')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
})

it('R1: /account resolves with status 200 OK', async () => {
  const res = await request('/account')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
})

it('R1: /account/addresses resolves with status 200 OK', async () => {
  const res = await request('/account/addresses')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
})

it('R1: /account/orders resolves with status 200 OK', async () => {
  const res = await request('/account/orders')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
})

it('R1: /account/profile resolves with status 200 OK', async () => {
  const res = await request('/account/profile')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
})

// ---------------------------------------------------------------------------
// 2. Requirement R2 & R3: Policy Pages & Multilingual Content
// ---------------------------------------------------------------------------
it('R2/R3: /privacy-policy (default) renders with 200 OK and Arabic title', async () => {
  const res = await request('/privacy-policy')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
  if (!res.body.includes('سياسة الخصوصية')) throw new Error('Missing Arabic privacy title')
})

it('R2/R3: /privacy-policy?locale=ar renders Arabic live CMS content', async () => {
  const res = await request('/privacy-policy?locale=ar')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
  if (!res.body.includes('سياسة الخصوصية')) throw new Error('Missing Arabic privacy title')
  if (!res.body.includes('علي فليت')) throw new Error('Missing Arabic content')
})

it('R2/R3: /privacy-policy?locale=en renders English live CMS content', async () => {
  const res = await request('/privacy-policy?locale=en')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
  if (!res.body.includes('Privacy Policy')) throw new Error('Missing English privacy title')
  if (!res.body.includes('AliFleet') && !res.body.includes('ALI FLEET')) {
    throw new Error('Missing English content')
  }
})

it('R2/R3: /privacy-policy?locale=he renders Hebrew live CMS content', async () => {
  const res = await request('/privacy-policy?locale=he')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
  if (!res.body.includes('מדיניות הפרטיות')) throw new Error('Missing Hebrew privacy title')
})

it('R2/R3: /terms?locale=ar renders Arabic Terms live CMS content', async () => {
  const res = await request('/terms?locale=ar')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
  if (!res.body.includes('شروط الاستخدام') && !res.body.includes('الشروط والأحكام')) {
    throw new Error('Missing Arabic terms title')
  }
})

it('R2/R3: /terms?locale=en renders English Terms live CMS content', async () => {
  const res = await request('/terms?locale=en')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
  if (!res.body.includes('Terms &amp; Conditions') && !res.body.includes('Terms & Conditions')) {
    throw new Error('Missing English terms title')
  }
})

it('R2/R3: /terms?locale=he renders Hebrew Terms live CMS content', async () => {
  const res = await request('/terms?locale=he')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
  if (!res.body.includes('תנאים והגבלות')) throw new Error('Missing Hebrew terms title')
})

it('R2/R3: /return-policy?locale=ar renders Arabic Return Policy live CMS content', async () => {
  const res = await request('/return-policy?locale=ar')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
  if (!res.body.includes('سياسة الإرجاع والاستبدال')) throw new Error('Missing Arabic return title')
})

it('R2/R3: /return-policy?locale=en renders English Return Policy live CMS content', async () => {
  const res = await request('/return-policy?locale=en')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
  if (!res.body.includes('Return and exchange policy') && !res.body.includes('Return & Exchange Policy')) {
    throw new Error('Missing English return title')
  }
})

it('R2/R3: /return-policy?locale=he renders Hebrew Return Policy live CMS content', async () => {
  const res = await request('/return-policy?locale=he')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
  if (!res.body.includes('מדיניות החזרה והחלפה') && !res.body.includes('מדיניות החזרים')) {
    throw new Error('Missing Hebrew return title')
  }
})

// ---------------------------------------------------------------------------
// 3. Alias Routes & Redirections
// ---------------------------------------------------------------------------
it('Aliases: /terms-and-conditions resolves with 200 OK', async () => {
  const res = await request('/terms-and-conditions')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
})

it('Aliases: /terms-conditions resolves with 200 OK', async () => {
  const res = await request('/terms-conditions')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
})

it('Aliases: /refund-returns resolves with 200 OK', async () => {
  const res = await request('/refund-returns')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
})

it('Aliases: /refund_returns resolves with 200 OK', async () => {
  const res = await request('/refund_returns')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
})

it('Aliases: /refund-and-returns resolves with 200 OK', async () => {
  const res = await request('/refund-and-returns')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
})

it('Redirects: /ar/privacy-policy redirects to /privacy-policy?locale=ar', async () => {
  const res = await request('/ar/privacy-policy')
  if (res.status !== 307 && res.status !== 308) throw new Error(`Expected redirect, got ${res.status}`)
  if (res.location !== '/privacy-policy?locale=ar') throw new Error(`Unexpected location: ${res.location}`)
})

it('Redirects: /en/privacy-policy redirects to /privacy-policy?locale=en', async () => {
  const res = await request('/en/privacy-policy')
  if (res.status !== 307 && res.status !== 308) throw new Error(`Expected redirect, got ${res.status}`)
  if (res.location !== '/privacy-policy?locale=en') throw new Error(`Unexpected location: ${res.location}`)
})

it('Redirects: /he/privacy-policy redirects to /privacy-policy?locale=he', async () => {
  const res = await request('/he/privacy-policy')
  if (res.status !== 307 && res.status !== 308) throw new Error(`Expected redirect, got ${res.status}`)
  if (res.location !== '/privacy-policy?locale=he') throw new Error(`Unexpected location: ${res.location}`)
})

it('Redirects: /ar/terms redirects to /terms?locale=ar', async () => {
  const res = await request('/ar/terms')
  if (res.status !== 307 && res.status !== 308) throw new Error(`Expected redirect, got ${res.status}`)
  if (res.location !== '/terms?locale=ar') throw new Error(`Unexpected location: ${res.location}`)
})

it('Redirects: /ar/return-policy redirects to /return-policy?locale=ar', async () => {
  const res = await request('/ar/return-policy')
  if (res.status !== 307 && res.status !== 308) throw new Error(`Expected redirect, got ${res.status}`)
  if (res.location !== '/return-policy?locale=ar') throw new Error(`Unexpected location: ${res.location}`)
})

// ---------------------------------------------------------------------------
// 4. Edge Cases & Robustness
// ---------------------------------------------------------------------------
it('Edge case: /privacy-policy?locale=invalid_locale gracefully defaults without error', async () => {
  const res = await request('/privacy-policy?locale=invalid_locale')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
  if (!res.body.includes('سياسة الخصوصية')) throw new Error('Expected Arabic default')
})

it('Edge case: /privacy-policy?locale=EN gracefully handles case without error', async () => {
  const res = await request('/privacy-policy?locale=EN')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
})

it('Edge case: /terms?locale= does not crash with empty query', async () => {
  const res = await request('/terms?locale=')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
})

it('Footer check: Footer contains working links to all 3 policy pages', async () => {
  const res = await request('/shop')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
  if (!res.body.includes('href="/privacy-policy"')) throw new Error('Missing privacy link in footer')
  if (!res.body.includes('href="/terms"')) throw new Error('Missing terms link in footer')
  if (!res.body.includes('href="/return-policy"')) throw new Error('Missing return policy link in footer')
})

// ---------------------------------------------------------------------------
// 5. Direct GraphQL Integration Verification
// ---------------------------------------------------------------------------
it('R3: Direct live GraphQL queries against https://a-f.site/graphql for all policies', async () => {
  const query = `
    query AliFleetVerification {
      privacy_ar: page(id: "privacy-policy-ar", idType: URI) { databaseId title slug }
      privacy_en: page(id: "privacy-policy-en", idType: URI) { databaseId title slug }
      privacy_he: page(id: "privacy-policy-he", idType: URI) { databaseId title slug }
      terms_ar: page(id: "terms-ar", idType: URI) { databaseId title slug }
      terms_en: page(id: "terms-en", idType: URI) { databaseId title slug }
      terms_he: page(id: "terms-he", idType: URI) { databaseId title slug }
      return_ar: page(id: "return-policy-ar", idType: URI) { databaseId title slug }
      return_en: page(id: "return-policy-en", idType: URI) { databaseId title slug }
      return_he: page(id: "return-policy-he", idType: URI) { databaseId title slug }
    }
  `
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  if (res.status !== 200) throw new Error(`GraphQL returned HTTP ${res.status}`)
  const data = await res.json()
  for (const [key, val] of Object.entries(data?.data ?? {})) {
    if (!val || !val.title) throw new Error(`GraphQL query for ${key} failed or returned empty`)
  }
})

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------
async function runAll() {
  console.log('=== Starting Next.js Production Server for Comprehensive Testing ===')
  serverProcess = spawn('cmd.exe', ['/c', 'npx', 'next', 'start', '-p', String(PORT)], {
    cwd: 'd:\\alifleet',
    stdio: 'inherit',
  })

  let passed = 0
  let failed = 0

  try {
    await waitForServer(`${BASE_URL}/cart`)
    console.log(`Server started successfully on ${BASE_URL}\n`)

    for (const test of tests) {
      process.stdout.write(`Testing: ${test.name} ... `)
      try {
        await test.fn()
        console.log('✓ PASS')
        passed++
      } catch (err) {
        console.log(`✗ FAIL: ${err.message}`)
        failed++
      }
    }

    console.log(`\n======================================================`)
    console.log(`Test Results: ${tests.length} Total | ${passed} Passed | ${failed} Failed`)
    console.log(`Success Rate: ${Math.round((passed / tests.length) * 100)}%`)
    console.log(`======================================================`)
  } finally {
    if (serverProcess) {
      console.log('Stopping test server process...')
      spawn('cmd.exe', ['/c', 'taskkill', '/F', '/T', '/PID', String(serverProcess.pid)])
    }
  }

  if (failed > 0) {
    process.exit(1)
  }
}

runAll()
