import http from 'node:http'
import { spawn } from 'node:child_process'

const PORT = 3570
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

it('R1: /cart/ with trailing slash resolves 200 OK without redirect loop', async () => {
  const res = await request('/cart/')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
})

it('R1: /shop resolves with status 200 OK and contains catalog UI', async () => {
  const res = await request('/shop')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
})

it('R1: /my-account resolves with status 200 OK', async () => {
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
it('R2/R3: /privacy-policy renders with 200 OK and valid HTML', async () => {
  const res = await request('/privacy-policy')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
  if (!res.body.includes('Privacy Policy') && !res.body.includes('سياسة الخصوصية')) {
    throw new Error('Missing privacy title')
  }
})

it('R2/R3: /privacy-policy?locale=ar renders Arabic CMS content with RTL', async () => {
  const res = await request('/privacy-policy?locale=ar')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
  if (!res.body.includes('سياسة الخصوصية')) throw new Error('Missing Arabic privacy title')
  if (!res.body.includes('علي فليت')) throw new Error('Missing Arabic brand text')
  if (!res.body.includes('dir="rtl"')) throw new Error('Missing RTL direction')
})

it('R2/R3: /privacy-policy?locale=en renders English CMS content with LTR', async () => {
  const res = await request('/privacy-policy?locale=en')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
  if (!res.body.includes('Privacy Policy')) throw new Error('Missing English privacy title')
  if (!res.body.includes('AliFleet') && !res.body.includes('ALI FLEET')) {
    throw new Error('Missing English brand text')
  }
  if (!res.body.includes('dir="ltr"')) throw new Error('Missing LTR direction')
})

it('R2/R3: /privacy-policy?locale=he renders Hebrew CMS content with RTL', async () => {
  const res = await request('/privacy-policy?locale=he')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
  if (!res.body.includes('מדיניות הפרטיות')) throw new Error('Missing Hebrew privacy title')
  if (!res.body.includes('dir="rtl"')) throw new Error('Missing RTL direction')
})

it('R2/R3: /terms?locale=ar renders Arabic Terms CMS content', async () => {
  const res = await request('/terms?locale=ar')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
  if (!res.body.includes('شروط الاستخدام') && !res.body.includes('الشروط والأحكام')) {
    throw new Error('Missing Arabic terms title')
  }
})

it('R2/R3: /terms?locale=en renders English Terms CMS content', async () => {
  const res = await request('/terms?locale=en')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
  if (!res.body.includes('Terms &amp; Conditions') && !res.body.includes('Terms & Conditions')) {
    throw new Error('Missing English terms title')
  }
})

it('R2/R3: /terms?locale=he renders Hebrew Terms CMS content', async () => {
  const res = await request('/terms?locale=he')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
  if (!res.body.includes('תנאים והגבלות') && !res.body.includes('תנאי השימוש')) {
    throw new Error('Missing Hebrew terms title')
  }
})

it('R2/R3: /return-policy?locale=ar renders Arabic Return Policy CMS content', async () => {
  const res = await request('/return-policy?locale=ar')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
  if (!res.body.includes('سياسة الإرجاع والاستبدال')) throw new Error('Missing Arabic return title')
})

it('R2/R3: /return-policy?locale=en renders English Return Policy CMS content', async () => {
  const res = await request('/return-policy?locale=en')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
  if (!res.body.includes('Return and exchange policy') && !res.body.includes('Return & Exchange Policy')) {
    throw new Error('Missing English return title')
  }
})

it('R2/R3: /return-policy?locale=he renders Hebrew Return Policy CMS content', async () => {
  const res = await request('/return-policy?locale=he')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
  if (!res.body.includes('מדיניות החזרה והחלפה') && !res.body.includes('מדיניות החזרים')) {
    throw new Error('Missing Hebrew return title')
  }
})

// ---------------------------------------------------------------------------
// 3. Case Insensitive & Edge Cases
// ---------------------------------------------------------------------------
it('Edge case: /privacy-policy?locale=AR correctly normalizes uppercase to Arabic', async () => {
  const res = await request('/privacy-policy?locale=AR')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
  if (!res.body.includes('سياسة الخصوصية')) throw new Error('Expected Arabic content for uppercase AR')
  if (!res.body.includes('dir="rtl"')) throw new Error('Expected RTL for AR')
})

it('Edge case: /terms?locale=HE correctly normalizes uppercase to Hebrew', async () => {
  const res = await request('/terms?locale=HE')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
  if (!res.body.includes('תנאים והגבלות')) throw new Error('Expected Hebrew content for uppercase HE')
})

it('Edge case: /return-policy?locale=EN correctly normalizes uppercase to English', async () => {
  const res = await request('/return-policy?locale=EN')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
  if (!res.body.includes('Return and exchange policy') && !res.body.includes('Return & Exchange Policy')) {
    throw new Error('Expected English content for uppercase EN')
  }
})

it('Edge case: /privacy-policy?locale=invalid defaults safely without crash', async () => {
  const res = await request('/privacy-policy?locale=invalid')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
})

it('Edge case: /terms?locale= with empty value does not crash', async () => {
  const res = await request('/terms?locale=')
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
})

// ---------------------------------------------------------------------------
// 4. Aliases & Redirects
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

it('Redirects: /ar/terms-conditions redirects to /terms?locale=ar', async () => {
  const res = await request('/ar/terms-conditions')
  if (res.status !== 307 && res.status !== 308) throw new Error(`Expected redirect, got ${res.status}`)
  if (res.location !== '/terms?locale=ar') throw new Error(`Unexpected location: ${res.location}`)
})

it('Redirects: /ar/refund-and-returns redirects to /return-policy?locale=ar', async () => {
  const res = await request('/ar/refund-and-returns')
  if (res.status !== 307 && res.status !== 308) throw new Error(`Expected redirect, got ${res.status}`)
  if (res.location !== '/return-policy?locale=ar') throw new Error(`Unexpected location: ${res.location}`)
})

it('Redirects: /en/refund-and-returns redirects to /return-policy?locale=en', async () => {
  const res = await request('/en/refund-and-returns')
  if (res.status !== 307 && res.status !== 308) throw new Error(`Expected redirect, got ${res.status}`)
  if (res.location !== '/return-policy?locale=en') throw new Error(`Unexpected location: ${res.location}`)
})

it('Redirects: /he/refund_returns redirects to /return-policy?locale=he', async () => {
  const res = await request('/he/refund_returns')
  if (res.status !== 307 && res.status !== 308) throw new Error(`Expected redirect, got ${res.status}`)
  if (res.location !== '/return-policy?locale=he') throw new Error(`Unexpected location: ${res.location}`)
})

// ---------------------------------------------------------------------------
// 5. GraphQL Direct Verification
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
  console.log('=== Starting Next.js Production Server for Round 3 Adversarial Testing ===')
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
    console.log(`Round 3 Test Results: ${tests.length} Total | ${passed} Passed | ${failed} Failed`)
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
